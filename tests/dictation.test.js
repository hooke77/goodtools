/**
 * 听写模块回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/dictation.test.js
 *
 * 盯住四类容易出错的地方：
 *   1. 数据：每个单元的句型/译文/语法点齐全、全库无重复、每道题都有随包音频；
 *   2. 题源复用：与课文原句相同的句型，错题要落在同一个句子 id 上，
 *      —— 否则"朗读也错、听写也错"会被记成两条，报告页看起来像两个人；
 *   3. 判分：听写和跟读是两套标准。跟读可以模糊（编辑距离 ≤2），
 *      **听写必须只认完全一致** —— havier 就是错的，不能被模糊匹配放过去；
 *   4. 存储：听写不该污染"跟读次数/平均分"，但错题一定要进错题本。
 */
const dictation = require('../utils/dictation.js');
const dictationData = require('../data/dictation.js');
const lessonsData = require('../data/lessons.js');
const storage = require('../utils/storage.js');
const tts = require('../utils/tts.js');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let failed = 0;
function assert(label, cond, extra) {
  const ok = !!cond;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '   → ' + (extra === undefined ? '' : extra)));
  if (!ok) failed += 1;
}

/* ---------------- 假的 Storage ---------------- */

const mem = {};
global.wx = {
  getStorageSync: function (k) {
    return mem[k];
  },
  setStorageSync: function (k, v) {
    mem[k] = JSON.parse(JSON.stringify(v));
  }
};

function clearMem() {
  Object.keys(mem).forEach(function (k) {
    delete mem[k];
  });
}

/* ==================== 1. 数据完整性 ==================== */

console.log('\n[1] 重点句型数据');

const units = dictationData.units;
assert('共 6 个单元', units.length === 6, units.length);

const expectedIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
assert(
  '单元 id 与课本一致',
  units.map(function (u) {
    return u.id;
  }).join(',') === expectedIds.join(','),
  units.map(function (u) {
    return u.id;
  }).join(',')
);

let patternTotal = 0;
const allEn = {};
units.forEach(function (u) {
  assert(u.unit + ' 有 5 句以上', u.patterns.length >= 5, u.patterns.length);
  assert(u.unit + ' 标注了语法重点', !!u.focus, u.focus);
  assert(u.unit + ' 有主题色', /^#[0-9a-f]{6}$/i.test(u.theme), u.theme);

  u.patterns.forEach(function (p, i) {
    patternTotal += 1;
    const tag = u.unit + ' 第' + (i + 1) + '句';
    assert(tag + ' 有英文', typeof p.en === 'string' && p.en.length > 3, p.en);
    assert(tag + ' 有中文', typeof p.cn === 'string' && p.cn.length > 1, p.cn);
    assert(tag + ' 有语法点', typeof p.point === 'string' && p.point.length > 1, p.point);
    assert(tag + ' 英文不含中文', !/[\u4e00-\u9fa5]/.test(p.en), p.en);
    // 习题句子必须是普通句子：首字母大写、以标点结尾、无多余空格
    assert(tag + ' 首字母大写', /^[A-Z]/.test(p.en), p.en);
    assert(tag + ' 句末有标点', /[.!?]$/.test(p.en), p.en);
    assert(tag + ' 无连续空格', !/\s{2,}/.test(p.en), p.en);
    assert(tag + ' 无首尾空格', p.en === p.en.trim(), JSON.stringify(p.en));
    // 同一个句子出现两次会让"这题到底是谁"变得含糊
    const key = p.en.toLowerCase();
    assert(tag + ' 全库不重复', !allEn[key], '重复：' + p.en);
    allEn[key] = (allEn[key] || 0) + 1;
  });
});

assert('句型总数 40+', patternTotal >= 40, patternTotal);

/* ==================== 2. 音频覆盖 ==================== */

console.log('\n[2] 每道题都要有示范音频');

const patternQs = dictation.questionsOf('all', 'pattern');
const wordQs = dictation.questionsOf('all', 'word');
assert('句型题数 = 数据条数', patternQs.length === patternTotal, patternQs.length + ' vs ' + patternTotal);
assert('单词题数 > 80', wordQs.length > 80, wordQs.length);

let noAudio = [];
patternQs.concat(wordQs).forEach(function (q) {
  if (!q.audio) noAudio.push(q.unit + ' ' + q.en);
  else if (!fs.existsSync(path.join(ROOT, q.audio))) noAudio.push('[文件缺失] ' + q.audio);
});
assert('所有题都有可用的随包音频', noAudio.length === 0, noAudio.slice(0, 5).join(' / '));

/* ==================== 3. 题源复用（和课文共用错题） ==================== */

console.log('\n[3] 与课文原句一致的句型要复用课文句子 id');

// 先把课文句子建索引，用来验证 srcId 是不是真的对得上
const lessonSentences = {};
lessonsData.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      lessonSentences[s.id] = s.en;
    });
  });
});

let reused = 0;
let mismatched = [];
let illegalId = [];
patternQs.forEach(function (q) {
  if (q.srcId) {
    reused += 1;
    if (!lessonSentences[q.srcId]) illegalId.push(q.srcId + ' 不存在');
    else if (lessonSentences[q.srcId] !== q.en) {
      mismatched.push(q.srcId + ' 文本不符：' + lessonSentences[q.srcId] + ' ≠ ' + q.en);
    }
  } else if (q.qid.indexOf('dict-') !== 0) {
    illegalId.push('非复用题 qid 应为 dict-* ：' + q.qid);
  }
});
assert('存在可复用的课文句（数据或音频变了要留意）', reused > 0, reused);
assert('srcId 全部指向真实存在的课文句', illegalId.length === 0, illegalId.slice(0, 3).join(' / '));
assert('srcId 对应的课文句文本完全一致', mismatched.length === 0, mismatched.slice(0, 3).join(' / '));
console.log('    （复用课文音频的句型：' + reused + ' / ' + patternTotal + ' 句）');

/* ==================== 4. 抽题 ==================== */

console.log('\n[4] 组卷');

const u4 = dictation.buildQuestions({ unitId: 'u4', type: 'pattern', shuffle: false });
assert('按单元过滤', u4.length === 7 && u4[0].lessonId === 'u4', u4.length);
assert('不打乱时顺序与数据一致', u4[0].en === dictationData.units[3].patterns[0].en, u4[0].en);

const limited = dictation.buildQuestions({ unitId: 'all', type: 'pattern', count: 5 });
assert('题量限制生效', limited.length === 5, limited.length);

const moreThanAvailable = dictation.buildQuestions({ unitId: 'u6', type: 'pattern', count: 99 });
assert('题量超过可出题数时给全部', moreThanAvailable.length === 6, moreThanAvailable.length);

const qidSet = {};
let dupQid = '';
patternQs.concat(wordQs).forEach(function (q) {
  if (qidSet[q.qid]) dupQid = q.qid;
  qidSet[q.qid] = true;
});
assert('所有题 qid 唯一（否则错题会互相串）', dupQid === '', dupQid);

const all = dictation.buildQuestions({ unitId: 'all', type: 'word', shuffle: false });
assert('单词题带音标', all.some(function (q) { return !!q.ph; }));

/* ==================== 5. 判分 ==================== */

console.log('\n[5] 判分：听写只认完全写对');

function stateOf(r, word) {
  for (let i = 0; i < r.marks.length; i++) {
    if (r.marks[i].word === word) return r.marks[i].state;
  }
  return '(缺失)';
}

/** 找某个状态下的某个词（同一句里可能有重复词，比如两个 a） */
function hasState(r, word, state) {
  return r.marks.some(function (m) {
    return m.word === word && m.state === state;
  });
}

let r = dictation.check('A horse is heavier than me.', 'A horse is heavier than me.');
assert('完全一致 → 全对 100 分', r.correct === true && r.score === 100, r.score + '/' + r.correct);

r = dictation.check('I feel lonely.', 'i feel lonely');
assert('忽略大小写与句末标点', r.correct === true, JSON.stringify(r.diffs));

r = dictation.check('I am the youngest in my family.', "I'm the youngest in my family.");
assert('缩写与全写等价（I am = I\'m）', r.correct === true, JSON.stringify(r.diffs));

// ⚠️ 核心：拼写错必须判错，不能被 score.js 的模糊匹配（编辑距离 ≤2）放过
r = dictation.check('A horse is heavier than me.', 'A horse is havier than me.');
assert('拼错一个字母 → 判错', r.correct === false, 'correct=' + r.correct);
assert('拼错的词标记为 wrong', stateOf(r, 'heavier') === 'wrong', stateOf(r, 'heavier'));
assert('差异里给出正确答案与本来的写法', r.diffs[0] && r.diffs[0].expected === 'heavier' && r.diffs[0].got === 'havier', JSON.stringify(r.diffs));
assert('词尾少的字母也算错（fridge → fridg）', dictation.check('There is nothing in the fridge.', 'There is nothing in the fridg.').correct === false);

r = dictation.check('A train is slower than a plane.', 'A train is slower than plane.');
// 注意：这句里有两个 a，所以不能用 stateOf(r,'a') —— 它只会找到第一个（句首那个 A，是对的）
assert('漏词 → 该词被标 miss', hasState(r, 'a', 'miss'), r.marks.map(function (m) { return m.word + ':' + m.state; }).join(' '));
assert('剩下的词不受影响', hasState(r, 'train', 'ok') && hasState(r, 'plane', 'ok'));
assert('漏词计入 missedWords', r.missedWords.length === 1 && r.missedWords[0] === 'a', JSON.stringify(r.missedWords));

r = dictation.check('I feel lonely.', 'I feel lonely very much.');
assert('多写 → extra', r.extraWords.length === 2, JSON.stringify(r.extraWords));
assert('多写即使目标词全对也不算全对', r.correct === false, 'correct=' + r.correct);

r = dictation.check('I feel lonely.', '');
assert('空输入 → blank 且全部 miss', r.blank === true && r.score === 0, JSON.stringify({ blank: r.blank, score: r.score }));
assert('空输入时标记数 = 目标词数', r.marks.length === 3, r.marks.length);

// 展示用的原文写法：不能把 "There is" 显示成 "there's"
r = dictation.check('There is nothing in the fridge.', 'There is nothing in the fridge.');
const dispWords = r.marks.map(function (m) { return m.display; });
assert('显示回填原文写法，不出现合并后的缩写', dispWords.join(' ') === 'There is nothing in the fridge', dispWords.join(' '));

r = dictation.check('I am the youngest in my family.', 'I am the youngest in my family.');
assert('I am 展示为 I am 而不是 i\'m', r.marks[0].display === 'I am', r.marks[0].display);

// 中间漏词 + 末尾多词：目标 7 个词，多写 1 个词
r = dictation.check('We should warm up before doing exercise.', 'We should warm before doing exercise today.');
assert(
  '目标词标记数 = 目标词数（7）',
  r.marks.filter(function (m) { return m.state !== 'extra'; }).length === 7,
  r.marks.filter(function (m) { return m.state !== 'extra'; }).length
);
assert('漏掉的 up 标为 miss', hasState(r, 'up', 'miss'), r.marks.map(function (m) { return m.word + ':' + m.state; }).join(' '));
assert('多写的 today 单独标为 extra', r.extraWords.length === 1 && r.extraWords[0] === 'today', JSON.stringify(r.extraWords));
assert('漏词和多写同时存在时判错', r.correct === false && r.missedWords.length === 1, JSON.stringify(r.missedWords));
assert('多写的词自己不占目标词的位置', r.marks[r.marks.length - 1].word === 'today', r.marks[r.marks.length - 1].word);

// 全库跑一遍，确保每道题"自己和自己比"都是满分（数据里没有脏字符）
let selfFail = [];
patternQs.concat(wordQs).forEach(function (q) {
  const rr = dictation.check(q.en, q.en);
  if (!rr.correct) selfFail.push(q.unit + ' ' + q.en + ' → ' + JSON.stringify(rr.diffs));
});
assert('每道题拿原句自比都是满分', selfFail.length === 0, selfFail.slice(0, 3).join(' / '));

/* ==================== 6. 存储 ==================== */

console.log('\n[6] 存储：错题进本子，但不污染跟读均分');

clearMem();

// 情形一：听写课文原句，写对了
storage.recordSentenceAttempt({
  lessonId: 'u1',
  passageId: 'u1-p1',
  passageName: '课文 · 给朋友的明信片',
  sentenceId: 'u1-p1-s1',
  en: 'We moved here to Shenzhen yesterday.',
  cn: '我们昨天搬到了深圳这里。',
  score: 100,
  errorWords: [],
  source: 'dictation'
});

let sum = storage.getLessonSummary('u1');
assert('听写不计入「跟读次数」', sum.attempts === 0, sum.attempts);
assert('听写不计入「平均分」', sum.avgScore === 0, sum.avgScore);

// 情形二：同一句听写又写错了（纸笔模式，说不出具体哪个词，靠 hardError）
storage.recordSentenceAttempt({
  lessonId: 'u1',
  passageId: 'u1-p1',
  passageName: '课文 · 给朋友的明信片',
  sentenceId: 'u1-p1-s1',
  en: 'We moved here to Shenzhen yesterday.',
  cn: '我们昨天搬到了深圳这里。',
  score: 0,
  errorWords: [],
  source: 'dictation',
  hardError: true
});

const top = storage.getTopErrorSentences('u1', 10);
const hit = top.filter(function (s) { return s.id === 'u1-p1-s1'; })[0];
assert('没有逐词信息时，hardError 也能计入错题', !!hit && hit.errorCount === 1, JSON.stringify(hit && hit.errorCount));
assert('错句仍然出现在高频错句榜里', !!hit && hit.en === 'We moved here to Shenzhen yesterday.', hit && hit.en);

// 情形三：跟读也错这一句 → 应合并到同一条记录，不是两条
storage.recordSentenceAttempt({
  lessonId: 'u1',
  passageId: 'u1-p1',
  passageName: '课文 · 给朋友的明信片',
  sentenceId: 'u1-p1-s1',
  en: 'We moved here to Shenzhen yesterday.',
  cn: '我们昨天搬到了深圳这里。',
  score: 70,
  errorWords: ['yesterday'],
  missedWords: [],
  extraWords: []
});

const merged = storage.getTopErrorSentences('u1', 10).filter(function (s) {
  return s.id === 'u1-p1-s1';
});
assert('朗读与听写共用同一条错句记录', merged.length === 1, merged.length);
assert('错误次数累加', merged[0].errorCount === 2, merged[0].errorCount);
sum = storage.getLessonSummary('u1');
assert('跟读仍正常计入次数', sum.attempts === 1, sum.attempts);
assert('跟读仍正常计入平均分', sum.avgScore === 70, sum.avgScore);
assert('段落名保持首次写入的课文名（不被听写覆盖）', merged[0].passageName === '课文 · 给朋友的明信片', merged[0].passageName);

// 单词
storage.recordWordAttempt('u4', { en: 'heavier', cn: '更重的', score: 0 });
storage.recordWordAttempt('u4', { en: 'heavier', cn: '更重的', score: 100 });
const errWords = storage.getTopErrorWords('u4', 10);
const w = errWords.filter(function (x) { return x.word === 'heavier'; })[0];
assert('听写写错的单词进错词榜', !!w && w.times === 1, JSON.stringify(w));

// 本次听写汇总
storage.recordDictationSession({ total: 10, right: 7 });
storage.recordDictationSession({ total: 5, right: 5 });
const ds = storage.getDictationSummary();
assert('听写次数累计', ds.sessions === 2, ds.sessions);
assert('听写题量累计', ds.total === 15, ds.total);
assert('听写正确率按题算', ds.rate === 80, ds.rate);

// 清空后要能回到零
storage.clearAll();
const ds2 = storage.getDictationSummary();
assert('清空全部记录后听写统计归零', ds2.sessions === 0 && ds2.total === 0 && ds2.rate === 0, JSON.stringify(ds2));

console.log('\n' + (failed === 0 ? '✓ 听写模块全部通过' : '✗ 失败 ' + failed + ' 项'));
process.exit(failed === 0 ? 0 : 1);
