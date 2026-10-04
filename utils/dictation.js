/**
 * 听写逻辑（与页面解耦，方便单测）
 * ============================================================
 * 两个关键点：
 *
 * 1) 抽题
 *    「重点句型」取自 data/dictation.js，「单词」直接复用 data/lessons.js 各单元的
 *    核心词表 —— 同一个词表不在两处维护。
 *
 * 2) 判对错
 *    听写和跟读是**两套标准**，不能共用 utils/score.js：
 *      跟读看的是"识别出来的读音"，模糊匹配（编辑距离 ≤2）是合理的，
 *      因为语音识别本来就会把 heavier/havier 听成差不多；
 *      听写看的是**写出来的拼写**，一个字母错了就是错了 ——
 *      所以这里只认「逐词完全一致」，另外单独做一遍 LCS 对齐，
 *      好告诉孩子是"少写了一个词"还是"这个词拼错了"。
 */
const dictationData = require('../data/dictation.js');
const lessonsData = require('../data/lessons.js');
const audioMap = require('../data/audio-map.js');
// 听写专用清晰音频索引（分包 dictationAudio/audios/）。存在就用它，否则回退共享音频。
// 用 try/catch 包住，避免索引还没生成时 dictation.js 整个加载失败。
let dictAudioMap = {};
try {
  dictAudioMap = require('../data/dictation-audio-map.js');
} catch (e) {
  dictAudioMap = {};
}
const textUtil = require('./text.js');

/** 课文里的句子 id 形如 u3-p1-s7；单词 id 形如 u3-w12 —— 用它区分音频归属 */
const SENTENCE_ID = /^u\d+-p\d+-s\d+$/;

const TYPE_PATTERN = 'pattern';
const TYPE_WORD = 'word';

/* ---------------- 音频 ---------------- */

/** 这句话/这个词对应的随包音频路径（没有就返回空串）
 *  优先用听写专用清晰音频（分包），回退到跟读共享音频。 */
function audioFor(en) {
  const k = textUtil.normKey(en);
  // 自己的清晰音频永远优先，命中就不去动别人的
  if (dictAudioMap[k]) return dictAudioMap[k];

  const shared = audioMap[k] || '';
  // 课文示范音频已经搬进了 ReadAloud 分包。听写页在 dictationAudio 分包里，
  // 分包之间是不能互相引用的，拿到的这个路径必定404 —— 表现为"点了没声音"还不报错。
  // 宁可直接返回空（页面会提示"这句还没有音频"），也不要留一颗静默的雷。
  if (shared.indexOf('ReadAloud/') === 0) return '';
  return shared;
}

/**
 * 如果这句重点句型就是课文里的原句，返回课文句子 id，否则返回空串。
 *
 * 为什么不用手写字段标？因为音频索引本身就是按"文本 → 音频文件"建的，
 * 音频文件名的前缀就是句子 id —— 只要音频指向 u1-p1-s3.mp3，
 * 就说明这句话确实等于课文第 3 句。从音频反推比手写标记更不容易漂移。
 *
 * 听写清晰音频放在分包 dictationAudio/audios/ 下，路径形如
 * /dictationAudio/audios/u1-p1-s3.mp3，所以这里的正则要同时兼容
 * 主包 audios/xxx.mp3 和分包 /dictationAudio/audios/xxx.mp3 两种写法。
 */
function resolveSourceId(en) {
  const m = /\/audios\/([^/]+)\.mp3$/.exec(audioFor(en));
  if (!m) return '';
  return SENTENCE_ID.test(m[1]) ? m[1] : '';
}

/* ---------------- 抽题 ---------------- */

function findLesson(lessonId) {
  const arr = lessonsData.lessons || [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === lessonId) return arr[i];
  }
  return null;
}

/** 课文句子 id → 它所在的段落信息（懒加载建索引，报告页要显示段落名） */
let sentenceIndex = null;
function findSentence(sid) {
  if (!sid) return null;
  if (!sentenceIndex) {
    sentenceIndex = {};
    (lessonsData.lessons || []).forEach(function (l) {
      l.passages.forEach(function (p) {
        p.sentences.forEach(function (s) {
          sentenceIndex[s.id] = {
            lessonId: l.id,
            passageId: p.id,
            passageName: p.nameCn || p.name || '',
            en: s.en,
            cn: s.cn
          };
        });
      });
    });
  }
  return sentenceIndex[sid] || null;
}

function makePatternQuestion(u, p, i) {
  const src = resolveSourceId(p.en);
  const origin = findSentence(src);
  return {
    // qid 决定错题存到哪个"句子"名下：
    // 和课文原句一致的复用课文 id，这样朗读错、听写也错会被合并统计
    qid: src || 'dict-' + u.id + '-p' + (i + 1),
    type: TYPE_PATTERN,
    lessonId: u.id,
    unit: u.unit,
    theme: u.theme,
    en: p.en,
    cn: p.cn || '',
    point: p.point || '',
    tip: p.tip || '',
    ph: '',
    audio: audioFor(p.en),
    srcId: src,
    // 来自课文原句的，报告页显示真实段落名；否则统一显示「听写」
    passageId: origin ? origin.passageId : 'dictation',
    passageName: origin ? origin.passageName : '听写'
  };
}

function makeWordQuestion(u, w, i) {
  return {
    qid: 'dict-' + u.id + '-w' + (i + 1),
    type: TYPE_WORD,
    lessonId: u.id,
    unit: u.unit,
    theme: u.theme,
    en: w.en,
    cn: w.cn || '',
    point: '课本核心词',
    tip: '',
    ph: w.ph || '',
    audio: audioFor(w.en),
    srcId: '',
    passageId: 'dictation',
    passageName: '听写'
  };
}

/** 某单元（或全部）某类型的全部题目，顺序固定 */
function questionsOf(unitId, type) {
  const wanted =
    unitId && unitId !== 'all'
      ? dictationData.units.filter(function (u) {
          return u.id === unitId;
        })
      : dictationData.units;

  const out = [];
  wanted.forEach(function (u) {
    if (type === TYPE_PATTERN || type === TYPE_WORD) {
      if (type === TYPE_PATTERN) {
        u.patterns.forEach(function (p, i) {
          out.push(makePatternQuestion(u, p, i));
        });
      } else {
        const lesson = findLesson(u.id);
        (lesson ? lesson.words : []).forEach(function (w, i) {
          out.push(makeWordQuestion(u, w, i));
        });
      }
    }
  });
  return out;
}

function shuffle(arr, rand) {
  const r = rand || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/**
 * 组卷
 * @param {object} opts
 *   unitId  'all' | 'u1'…'u6'
 *   type    'pattern' 重点句型 | 'word' 单词
 *   count   0 = 全部；否则取前 count 题
 *   shuffle 默认 true，false 则保持课本顺序（测试用）
 *   rand    可选，注入随机源（测试用）
 * @returns {Array} 题目数组
 */
function buildQuestions(opts) {
  opts = opts || {};
  let list = questionsOf(opts.unitId || 'all', opts.type || TYPE_PATTERN);
  if (opts.shuffle !== false) list = shuffle(list, opts.rand);
  const count = Number(opts.count) || 0;
  if (count > 0 && count < list.length) list = list.slice(0, count);
  return list;
}

/** 各单元可听写数量，用于设置页展示 */
function unitList() {
  return dictationData.units.map(function (u) {
    const lesson = findLesson(u.id);
    return {
      id: u.id,
      unit: u.unit,
      theme: u.theme,
      focus: u.focus,
      patternCount: u.patterns.length,
      wordCount: lesson ? lesson.words.length : 0
    };
  });
}

/* ---------------- 判分 ---------------- */

/** 最长公共子序列的锚点（只认完全相同的词） */
function lcsAnchors(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    const row = new Array(n + 1);
    for (let j = 0; j <= n; j++) row[j] = 0;
    dp.push(row);
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const pairs = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      pairs.push([i - 1, j - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  pairs.reverse();
  return pairs;
}

/**
 * 在锚点之间的"空隙"里，把漏写/多写配对成"拼错"，
 * 这样给孩子看的才是「heavier 你写成了 havier」，而不是
 * 「heavier 没写 + havier 多写」两条互不相干的信息。
 *
 * @param targetWords 归一化后的目标词（用于显示兜底）
 * @param typedWords  归一化后的所写词
 * @param pairs       LCS 锚点
 * @param displays    与 targetWords 一一对应的"原文写法"，可省略
 */
function buildMarks(targetWords, typedWords, pairs, displays) {
  const disp = displays || targetWords;
  const marks = [];
  let ti = 0;
  let si = 0;
  let pi = 0;

  function push(state, index, said) {
    marks.push({
      word: targetWords[index],
      display: disp[index] || targetWords[index],
      state: state,
      said: said
    });
  }

  while (ti < targetWords.length || si < typedWords.length) {
    if (pi < pairs.length && pairs[pi][0] === ti && pairs[pi][1] === si) {
      push('ok', ti, typedWords[si]);
      ti += 1;
      si += 1;
      pi += 1;
      continue;
    }

    const next = pi < pairs.length ? pairs[pi] : null;
    const tEnd = next ? next[0] : targetWords.length;
    const sEnd = next ? next[1] : typedWords.length;

    const gapT = targetWords.slice(ti, tEnd);
    const gapS = typedWords.slice(si, sEnd);
    const pairCount = Math.min(gapT.length, gapS.length);

    for (let x = 0; x < pairCount; x++) push('wrong', ti + x, gapS[x]);
    for (let x = pairCount; x < gapT.length; x++) push('miss', ti + x, '');
    // 多写的词没有对应的目标词，直接用孩子自己写的那个词展示
    for (let x = pairCount; x < gapS.length; x++) {
      marks.push({ word: gapS[x], display: gapS[x], state: 'extra', said: '' });
    }

    ti = tEnd;
    si = sEnd;
  }

  return marks;
}

/**
 * 判一句听写
 * @param {string} target 正确答案
 * @param {string} typed  孩子写/打出来的
 * @returns {{
 *   correct:boolean, score:number, blank:boolean, marks:Array,
 *   errorWords:string[], missedWords:string[], extraWords:string[],
 *   correctCount:number, total:number, normalized:string
 * }}
 */
function check(target, typed) {
  const scoreLib = require('./score.js');
  // 判分只认「完全写对」，所以这里用精确匹配，不借用 score.js 的模糊（编辑距离）规则 ——
  // 听写考的就是拼写，havier 和 heavier 在跟读里可以算差不多，在听写里必须算错。
  const pairsInfo = scoreLib.toWordsWithDisplay(target);
  const tw = pairsInfo.map(function (p) {
    return p.word;
  });
  const displays = pairsInfo.map(function (p) {
    return p.display;
  });
  const sw = scoreLib.toWords(typed);

  if (!tw.length) {
    return {
      correct: false, score: 0, blank: true, marks: [], diffs: [],
      errorWords: [], missedWords: [], extraWords: [],
      correctCount: 0, total: 0, normalized: ''
    };
  }

  if (!sw.length) {
    return {
      correct: false, score: 0, blank: true,
      marks: tw.map(function (w, i) {
        return { word: w, display: displays[i] || w, state: 'miss', said: '' };
      }),
      diffs: tw.map(function (w, i) {
        return { kind: 'miss', expected: displays[i] || w, got: '' };
      }),
      errorWords: tw.slice(), missedWords: tw.slice(), extraWords: [],
      correctCount: 0, total: tw.length, normalized: ''
    };
  }

  const pairs = lcsAnchors(tw, sw);
  const marks = buildMarks(tw, sw, pairs, displays);

  const errorWords = [];
  const missedWords = [];
  const extraWords = [];
  const diffs = [];
  marks.forEach(function (m) {
    if (m.state === 'wrong') {
      errorWords.push(m.word);
      diffs.push({ kind: 'wrong', expected: m.display, got: m.said });
    } else if (m.state === 'miss') {
      errorWords.push(m.word);
      missedWords.push(m.word);
      diffs.push({ kind: 'miss', expected: m.display, got: '' });
    } else if (m.state === 'extra') {
      extraWords.push(m.word);
      diffs.push({ kind: 'extra', expected: '', got: m.word });
    }
  });

  const correct = missedWords.length === 0 && extraWords.length === 0 && errorWords.length === 0;
  const denom = Math.max(tw.length, sw.length) || 1;
  let sc = Math.round((pairs.length / denom) * 100);
  // 多写/漏写/拼错都不可能是满分
  if (!correct && sc >= 100) sc = 99;

  // 补一个稳定的下标：渲染逐词标记时要当 wx:key 用，
  // 用 word 当 key 不行（一句话里可能有两个 the）
  marks.forEach(function (m, i) {
    m.k = i;
  });
  diffs.forEach(function (x, i) {
    x.k = i;
  });

  return {
    correct: correct,
    score: sc,
    blank: false,
    marks: marks,
    diffs: diffs,
    errorWords: errorWords,
    missedWords: missedWords,
    extraWords: extraWords,
    correctCount: correct ? tw.length : pairs.length,
    total: tw.length,
    normalized: sw.join(' ')
  };
}

module.exports = {
  TYPE_PATTERN: TYPE_PATTERN,
  TYPE_WORD: TYPE_WORD,
  audioFor: audioFor,
  resolveSourceId: resolveSourceId,
  unitList: unitList,
  questionsOf: questionsOf,
  buildQuestions: buildQuestions,
  check: check,
  shuffle: shuffle
};
