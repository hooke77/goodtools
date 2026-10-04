/**
 * 错题与进度存储（本地 Storage）
 * 记录两类数据：
 *   1) 每课每句：练习次数、出错次数、平均分/最高分、句中错词频次
 *   2) 每课每词：出现次数、错误次数
 * 报告页据此算出「高频错误句子」和「高频错误词语」。
 *
 * 如需多设备同步，可把本模块的 get/set 换成云开发数据库读写，接口保持不变。
 */
const config = require('../config.js');

const KEY = config.STORAGE_KEY;

function emptyStore() {
  return { v: 2, updatedAt: 0, lessons: {}, dict: { sessions: 0, total: 0, right: 0, lastAt: 0 } };
}

function getStore() {
  try {
    const s = wx.getStorageSync(KEY);
    if (!s || typeof s !== 'object' || !s.lessons) return emptyStore();
    return s;
  } catch (e) {
    return emptyStore();
  }
}

function saveStore(store) {
  store.updatedAt = Date.now();
  try {
    wx.setStorageSync(KEY, store);
  } catch (e) {
    // 存储失败不阻塞学习流程
    console.warn('[storage] save failed', e);
  }
}

function ensureLesson(store, lessonId) {
  if (!store.lessons[lessonId]) {
    store.lessons[lessonId] = { attempts: 0, scoreSum: 0, sentences: {}, words: {} };
  }
  const l = store.lessons[lessonId];
  if (!l.sentences) l.sentences = {};
  if (!l.words) l.words = {};
  return l;
}

/**
 * 记录一次句子跟读
 * @param {object} p
 *  lessonId, passageId, passageName, sentenceId, en, cn, score,
 *  errorWords[]（要纠正的词）、missedWords[]（没读到的词）、extraWords[]（多读的词）
 *
 * 注意：判定"是否算错题"由本模块统一负责 ——
 * 只要有漏读 / 吐音（missedWords）或多读（extraWords），即使分数够高也计入错题，
 * 避免出现"86 分但漏了一个词却不算错"的情况。
 *
 * 听写会复用这个函数（见 pages/dictation），额外用到两个可选字段：
 *   source:    'read'（默认，跟读）| 'dictation'（听写）
 *              —— 听写不计入「跟读次数 / 平均分」，那两个指标的口径保持只讲跟读；
 *                 但错句错词照样入库，报告页一样能看到。
 *   hardError: true 表示"确定写错了，但没能定位到具体是哪个词"
 *              —— 纸笔听写靠孩子自己判对错，没有逐词信息，靠这个标记才能计入错题。
 */
function recordSentenceAttempt(p) {
  const store = getStore();
  const lesson = ensureLesson(store, p.lessonId);
  const passScore = p.passScore || config.PASS_SCORE;
  const missCount = (p.missedWords || []).length;
  const extraCount = (p.extraWords || []).length;
  const hasGap = missCount > 0 || extraCount > 0;
  const passed = p.score >= passScore && !hasGap;
  const isDictation = p.source === 'dictation';

  if (!isDictation) {
    lesson.attempts += 1;
    lesson.scoreSum += p.score;
  }

  const sid = p.sentenceId;
  if (!lesson.sentences[sid]) {
    lesson.sentences[sid] = {
      en: p.en,
      cn: p.cn,
      passageId: p.passageId,
      passageName: p.passageName,
      count: 0,
      errorCount: 0,
      avgScore: 0,
      scoreSum: 0,
      bestScore: 0,
      lastScore: 0,
      errorWords: {},
      lastAt: 0
    };
  }
  const s = lesson.sentences[sid];
  s.count += 1;
  s.scoreSum += p.score;
  s.avgScore = Math.round(s.scoreSum / s.count);
  s.bestScore = Math.max(s.bestScore, p.score);
  s.lastScore = p.score;
  s.lastAt = Date.now();
  s.en = p.en;
  s.cn = p.cn;

  const errs = p.errorWords || [];
  if (!passed && (errs.length || p.hardError)) {
    s.errorCount += 1;
    errs.forEach(function (w) {
      s.errorWords[w] = (s.errorWords[w] || 0) + 1;
    });
  }

  saveStore(store);
  return { passed: passed };
}

/** 记录一次单词跟读 */
function recordWordAttempt(lessonId, w) {
  const store = getStore();
  const lesson = ensureLesson(store, lessonId);
  const key = w.en;
  if (!lesson.words[key]) {
    lesson.words[key] = { en: w.en, cn: w.cn, count: 0, errorCount: 0, lastScore: 0, lastAt: 0 };
  }
  const item = lesson.words[key];
  item.count += 1;
  item.lastScore = w.score;
  item.lastAt = Date.now();
  if (w.score < config.PASS_SCORE) item.errorCount += 1;
  saveStore(store);
}

/* ---------------- 听写 ---------------- */

/**
 * 记录一次听写（明细由 recordSentenceAttempt / recordWordAttempt 各自入库，
 * 这里只累加"听写"这个动作本身的整体正确率）
 * @param {object} p { total, right }
 */
function recordDictationSession(p) {
  const store = getStore();
  if (!store.dict) store.dict = { sessions: 0, total: 0, right: 0, lastAt: 0 };
  store.dict.sessions += 1;
  store.dict.total += Number(p.total) || 0;
  store.dict.right += Number(p.right) || 0;
  store.dict.lastAt = Date.now();
  saveStore(store);
}

/** 听写累计概况（听写设置页顶部展示） */
function getDictationSummary() {
  const d = getStore().dict || { sessions: 0, total: 0, right: 0, lastAt: 0 };
  return {
    sessions: d.sessions || 0,
    total: d.total || 0,
    right: d.right || 0,
    rate: d.total ? Math.round((d.right / d.total) * 100) : 0,
    lastAt: d.lastAt || 0
  };
}

/* ---------------- 读取汇总 ---------------- */

/** 单课学习概况（用于首页与报告页头部） */
function getLessonSummary(lessonId) {
  const store = getStore();
  const l = store.lessons[lessonId];
  if (!l) {
    return { attempts: 0, avgScore: 0, sentenceKinds: 0, mastered: 0, needWork: 0 };
  }
  let mastered = 0;
  let needWork = 0;
  Object.keys(l.sentences).forEach(function (k) {
    const s = l.sentences[k];
    if (s.bestScore >= config.EXCELLENT_SCORE) mastered += 1;
    else if (s.avgScore && s.avgScore < config.PASS_SCORE) needWork += 1;
  });
  return {
    attempts: l.attempts,
    avgScore: l.attempts ? Math.round(l.scoreSum / l.attempts) : 0,
    sentenceKinds: Object.keys(l.sentences).length,
    mastered: mastered,
    needWork: needWork
  };
}

/** 该课练过的句子 id 集合（用于「继续练习」定位） */
function getPracticedSentenceIds(lessonId) {
  const store = getStore();
  const l = store.lessons[lessonId];
  if (!l) return [];
  return Object.keys(l.sentences);
}

/** 该课句子的平均分映射，用于句子列表打标 */
function getSentenceScores(lessonId) {
  const store = getStore();
  const l = store.lessons[lessonId];
  const map = {};
  if (!l) return map;
  Object.keys(l.sentences).forEach(function (k) {
    map[k] = {
      avgScore: l.sentences[k].avgScore,
      bestScore: l.sentences[k].bestScore,
      count: l.sentences[k].count,
      errorCount: l.sentences[k].errorCount
    };
  });
  return map;
}

/** 高频错误句子 Top N */
function getTopErrorSentences(lessonId, limit) {
  const store = getStore();
  const l = store.lessons[lessonId];
  const out = [];
  if (!l) return out;
  Object.keys(l.sentences).forEach(function (k) {
    const s = l.sentences[k];
    if (!s.errorCount) return;
    const words = Object.keys(s.errorWords || {}).map(function (w) {
      return { word: w, times: s.errorWords[w] };
    });
    words.sort(function (a, b) {
      return b.times - a.times;
    });
    out.push({
      id: k,
      en: s.en,
      cn: s.cn,
      passageName: s.passageName,
      count: s.count,
      errorCount: s.errorCount,
      errorRate: s.count ? Math.round((s.errorCount / s.count) * 100) : 0,
      avgScore: s.avgScore,
      bestScore: s.bestScore,
      lastAt: s.lastAt,
      topWords: words.slice(0, 3)
    });
  });
  out.sort(function (a, b) {
    if (b.errorCount !== a.errorCount) return b.errorCount - a.errorCount;
    return a.avgScore - b.avgScore;
  });
  return out.slice(0, limit || 10);
}

/** 高频错误词语 Top N（可指定单元，不传则全库汇总） */
function getTopErrorWords(lessonId, limit) {
  const store = getStore();
  const bucket = {};
  const lessonIds = lessonId ? [lessonId] : Object.keys(store.lessons);

  lessonIds.forEach(function (lid) {
    const l = store.lessons[lid];
    if (!l) return;

    // 来自句子跟读的错词
    Object.keys(l.sentences).forEach(function (sk) {
      const s = l.sentences[sk];
      Object.keys(s.errorWords || {}).forEach(function (w) {
        if (!bucket[w]) bucket[w] = { word: w, times: 0, cn: '', lessons: {} };
        bucket[w].times += s.errorWords[w];
        bucket[w].lessons[lid] = true;
      });
    });

    // 来自单词跟读的错词
    Object.keys(l.words || {}).forEach(function (w) {
      const it = l.words[w];
      if (!it.errorCount) return;
      if (!bucket[w]) bucket[w] = { word: w, times: 0, cn: it.cn || '', lessons: {} };
      bucket[w].times += it.errorCount;
      bucket[w].cn = bucket[w].cn || it.cn || '';
      bucket[w].lessons[lid] = true;
    });
  });

  const arr = Object.keys(bucket).map(function (k) {
    const it = bucket[k];
    it.lessonCount = Object.keys(it.lessons).length;
    return it;
  });
  arr.sort(function (a, b) {
    return b.times - a.times;
  });
  return arr.slice(0, limit || 12);
}

/** 全局学习汇总（首页顶部） */
function getGlobalSummary() {
  const store = getStore();
  let attempts = 0;
  let scoreSum = 0;
  let sentenceKinds = 0;
  Object.keys(store.lessons).forEach(function (lid) {
    const l = store.lessons[lid];
    attempts += l.attempts || 0;
    scoreSum += l.scoreSum || 0;
    sentenceKinds += Object.keys(l.sentences || {}).length;
  });
  return {
    attempts: attempts,
    avgScore: attempts ? Math.round(scoreSum / attempts) : 0,
    sentenceKinds: sentenceKinds,
    lessonCount: Object.keys(store.lessons).length
  };
}

function clearLesson(lessonId) {
  const store = getStore();
  delete store.lessons[lessonId];
  saveStore(store);
}

function clearAll() {
  saveStore(emptyStore());
}

module.exports = {
  getStore: getStore,
  recordSentenceAttempt: recordSentenceAttempt,
  recordWordAttempt: recordWordAttempt,
  recordDictationSession: recordDictationSession,
  getDictationSummary: getDictationSummary,
  getLessonSummary: getLessonSummary,
  getPracticedSentenceIds: getPracticedSentenceIds,
  getSentenceScores: getSentenceScores,
  getTopErrorSentences: getTopErrorSentences,
  getTopErrorWords: getTopErrorWords,
  getGlobalSummary: getGlobalSummary,
  clearLesson: clearLesson,
  clearAll: clearAll
};
