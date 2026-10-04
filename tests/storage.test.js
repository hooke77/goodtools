/* 用假的 wx.Storage 跑一遍错题统计逻辑，验证报告页的数据是否正确 */
const store = {};
global.wx = {
  getStorageSync: function (k) {
    return store[k];
  },
  setStorageSync: function (k, v) {
    store[k] = JSON.parse(JSON.stringify(v));
  }
};

const base = 'C:/Users/admin/WorkBuddy/小学英语/小学英语朗读小程序/';
const storage = require(base + 'utils/storage.js');
const scoreLib = require(base + 'utils/score.js');
const tipsLib = require(base + 'utils/tips.js');
const lessonData = require(base + 'data/lessons.js');

// 模拟孩子的 5 次跟读（U1 第一段）
const sim = [
  { si: 0, said: 'We moved here to Shenzhen yesterday', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  { si: 0, said: 'We moved here to Shenzhen yesterday', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  { si: 0, said: 'We move here to Shenzhen yesterday', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  { si: 6, said: 'It make me so happy when I look at your photo', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  { si: 6, said: 'It make me so happy when I look at your photo', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  { si: 10, said: 'I am so excited', lid: 'u1', pid: 'u1-p1', pname: '给朋友的明信片' },
  // 换成 U2 练一句，验证跨单元汇总
  { si: 2, said: 'Artists try to express themselves and touch people heart', lid: 'u2', pid: 'u2-p1', pname: '艺术的力量' }
];

const byId = {};
lessonData.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      byId[l.id + '|' + p.id + '|' + s.id] = s;
    });
  });
});

sim.forEach(function (c) {
  const lesson = lessonData.lessons.filter(function (l) { return l.id === c.lid; })[0];
  const passage = lesson.passages.filter(function (p) { return p.id === c.pid; })[0];
  const s = passage.sentences[c.si];
  const r = scoreLib.evaluate(s.en, c.said);
  const t = tipsLib.tipsFor(r.errorWords);
  storage.recordSentenceAttempt({
    lessonId: c.lid,
    passageId: c.pid,
    passageName: c.pname,
    sentenceId: s.id,
    en: s.en,
    cn: s.cn,
    score: r.score,
    errorWords: r.errorWords,
    missedWords: r.missedWords,
    extraWords: r.extraWords
  });
  console.log('读：', s.en);
  console.log('  说：', c.said, '→', r.score, '分', r.level, '| 提示：', (t.tips[0] || '').slice(0, 26) + '…');
});

// 单词跟读两次，一好一坏
storage.recordWordAttempt('u1', { en: 'lonely', cn: '孤独的', score: 95 });
storage.recordWordAttempt('u1', { en: 'homeless', cn: '无家可归的', score: 52 });
storage.recordWordAttempt('u1', { en: 'homeless', cn: '无家可归的', score: 58 });

console.log('\n===== U1 学习概况 =====');
console.log(JSON.stringify(storage.getLessonSummary('u1'), null, 0));

console.log('\n===== U1 高频错误句子 =====');
storage.getTopErrorSentences('u1', 5).forEach(function (s) {
  console.log('· 错 ' + s.errorCount + ' 次 / 练 ' + s.count + ' 次（' + s.errorRate + '%），均分 ' + s.avgScore);
  console.log('  ' + s.en);
  console.log('  高频错词：' + s.topWords.map(function (w) { return w.word + '×' + w.times; }).join('、'));
});

console.log('\n===== 全库高频错误词语 =====');
storage.getTopErrorWords(null, 8).forEach(function (w) {
  console.log('· ' + w.word + '　' + (w.cn || '') + '　错 ' + w.times + ' 次　跨 ' + w.lessonCount + ' 个单元');
});

console.log('\n===== U1 高频错误词语（仅本单元） =====');
storage.getTopErrorWords('u1', 8).forEach(function (w) {
  console.log('· ' + w.word + '　错 ' + w.times + ' 次');
});

console.log('\n===== 全局汇总 =====');
console.log(JSON.stringify(storage.getGlobalSummary()));

console.log('\n===== 清空 U1 后 =====');
storage.clearLesson('u1');
console.log('U1 错句数：', storage.getTopErrorSentences('u1', 99).length);
console.log('全局汇总：', JSON.stringify(storage.getGlobalSummary()));
storage.clearAll();
console.log('全部清空后：', JSON.stringify(storage.getGlobalSummary()));
