/**
 * 逐词跟读高亮（卡拉OK）
 * ======================================
 *
 * 做什么：示范播放 / 录音回放时，把「正在读的那个词」实时染成别的颜色，
 *        让孩子的眼睛跟着色块走，一行一行扫过去。
 *
 * 怎么做：把一句话的每个词，按朗读时长的权重铺成一条时间轴：
 *
 *        [ We ]  [ moved ]   [ here ]   [ to ]   [ Shenzhen ]  [ yesterday. ]
 *        0---180 180---540   540---760  760---830 830---1250   1250---1900 ms
 *
 *        播放进度走到哪一段，就把那个词点亮。
 *
 * 词的时长权重怎么定：
 *   英文朗读的时长和「词有几个字母」大体成正比，但 a / the / to 这类短功能词
 *   读得飞快，纯按字母数会让它们占走过长的时间。所以权重 = 字母数 + 基数 2
 *   （基数保证最短的词也有份基本的时长），逗号后 +2.5、句末标点 +3 代表停顿。
 *   这是估算，不是精确的时间码 —— 但在"跟着示范走"这件事上足够贴合。
 *
 * ⚠️ 必须说清楚的能力边界（页面上也这么讲）：
 *   · 听示范时的高亮是准的 —— 它跟着真实音频的播放进度走。
 *   · 孩子自己读的时候高亮是"打的拍子" —— 自评模式没有语音识别，
 *     小程序不可能知道孩子此刻读到了哪个词，这里只能按示范节奏打个引导性的拍子。
 *     要精确到"跟着他的声音走"，必须有云端 ASR（config.ASR_MODE='cloud'），
 *     那是另一条已经搁置的路线。
 */

const lengths = require('../data/audio-length.js');
const textUtil = require('./text.js');

/** 一句读下来大约多久（找不到标准时长时的兜底） */
function estimateMs(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return Math.max(600, Math.round(words.length * 430));
}

/** 该句示范音频的标准时长（毫秒） */
function expectedMs(text) {
  const k = textUtil.normKey(text);
  return (k && lengths[k]) || estimateMs(text);
}

/** 把句子拆成词（保留原样式的标点，去掉空串） */
function splitWords(en) {
  return String(en || '')
    .split(/\s+/)
    .filter(function (w) {
      return !!w;
    });
}

/**
 * 给每个词铺一条时间轴
 * @param {Array<string>} words 词数组
 * @param {number} totalMs 全句总时长
 * @returns {Array<{start:number,end:number}>} 与 words 等长
 */
function plan(words, totalMs) {
  const total = Math.max(1, Number(totalMs) || 0);
  const weights = words.map(function (w) {
    let base = String(w).replace(/[^A-Za-z']/g, '').length + 2; // 基数：短词也占一份
    if (/[,;:]$/.test(w)) base += 2.5; // 逗号后的停顿
    if (/[.!?]["')]*$/.test(w)) base += 3; // 句末收尾 + 停顿
    return base;
  });
  const sum = weights.reduce(function (a, b) {
    return a + b;
  }, 0) || 1;

  let acc = 0;
  return weights.map(function (x) {
    const start = Math.round((acc / sum) * total);
    acc += x;
    return { start: start, end: Math.round((acc / sum) * total) };
  });
}

/**
 * 某个时刻正在读第几个词
 * @returns {number} 词下标；句子为空返回 -1
 */
function indexAt(planArr, ms) {
  if (!planArr || !planArr.length) return -1;
  const t = Number(ms) || 0;
  if (t < planArr[0].start) return 0; // 开头不要留空档，第一个词先亮起来
  for (let i = 0; i < planArr.length; i++) {
    if (t >= planArr[i].start && t < planArr[i].end) return i;
  }
  return planArr.length - 1;
}

/** 孩子自己读时，预留比示范稍慢一点的余量（他通常会慢一些） */
const SELF_SLOW = 1.15;

module.exports = {
  estimateMs: estimateMs,
  expectedMs: expectedMs,
  splitWords: splitWords,
  plan: plan,
  indexAt: indexAt,
  SELF_SLOW: SELF_SLOW
};
