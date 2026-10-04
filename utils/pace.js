/**
 * 跟读节奏比对 + 读前易错词预告
 *
 * 这是「自评模式」下唯一能不依赖任何云服务拿到的客观信号：
 *
 *   录音时长  vs  示范音频时长
 *
 * 为什么要做这个：自评模式没有语音识别，孩子读对读错全靠自己听。
 * 但「读得太快」这件事骗不了人 —— 人不可能说话比示范还快，
 * 如果整句录音明显短于示范，几乎一定是把词连读、吞尾音了。
 * 这是一个诚实的、可解释的信号，正好补上自评模式最缺的那一环。
 *
 * ⚠️ 边界要说清楚（页面上也要这么讲）：
 *   · 「太快」判定可靠 —— 快去不了。
 *   · 「太慢」不可靠 —— 录音从按下按钮就开始计时，孩子开始前发愣、
 *     中间清嗓子都会算进去，所以只能温和提示，不能当真结论。
 *   · 它衡量的是「节奏」，不是「发音准不准」。发音还得靠耳朵听示范。
 */

const lengths = require('../data/audio-length.js');
const textUtil = require('./text.js');
const tipsLib = require('./tips.js');

/* ---------------- 基准时长 ---------------- */

/** 该句 / 该词示范音频的标准时长（毫秒），没有返回 0 */
function expectedMs(text) {
  const k = textUtil.normKey(text);
  return (k && lengths[k]) || 0;
}

/* ---------------- 节奏判定 ---------------- */

// 比示范快到这个比例以下 → 判定"太快"
const FAST_RATIO = 0.72;
// 比示范慢到这个比例以上 → 温和提示"偏慢"
const SLOW_RATIO = 1.75;
// 示范本身就短（比如单个词）时，比例噪音大，阈值放宽
const SHORT_MS = 900;
// 读前最多预告几个词
const MAX_WATCH = 2;

/**
 * 比对孩子跟读的节奏
 * @param {string} text 课文原句 / 单词
 * @param {number} recordedMs 孩子这次录音的时长（毫秒）
 * @returns {null|{ratio:number, ratioText:string, level:'fast'|'slow'|'ok', label:string, tip:string}}
 *          没有基准时长或录音太短时返回 null（页面直接不显示这一块）
 */
function comparePace(text, recordedMs) {
  const expect = expectedMs(text);
  const ms = Number(recordedMs);
  if (!expect || !ms || !isFinite(ms) || ms < 400) return null;

  const ratio = ms / expect;
  const short = expect < SHORT_MS;
  const fastLine = short ? 0.5 : FAST_RATIO;
  const slowLine = short ? 2.4 : SLOW_RATIO;

  let level = 'ok';
  let label = '节奏和示范差不多';
  let tip = '';

  if (ratio <= fastLine) {
    level = 'fast';
    label = '读得偏快';
    tip = '这句你比示范快了不少，很可能有几个词被"连"掉了。再听一遍示范，把每个词的尾巴读出来。';
  } else if (ratio >= slowLine) {
    level = 'slow';
    label = '读得偏慢';
    tip = '比示范慢一些。如果是中间有词卡住，点「🐢 慢速示范」跟着读两遍；如果只是开始前停了一会儿，那就不用管。';
  }

  return {
    ratio: ratio,
    ratioText: ratio.toFixed(2) + '×',
    level: level,
    label: label,
    tip: tip
  };
}

/** 给页面显示用的短标签，比如 "节奏 1.4×" */
function paceBadge(pace) {
  if (!pace || !pace.ratio) return '';
  return '节奏 ' + pace.ratio.toFixed(2) + '×';
}

/* ---------------- 读前易错词预告 ---------------- */

/**
 * 读这句话之前，先告诉孩子要留意哪几个词。
 * 最多给 2 条 —— 提示太多等于没提示，孩子记不住。
 *
 * 算法：按发音规则的优先级走（th > igh > tion > oi > -ed > wh > -s），
 * 每类规则去句子里"认领"一个还没被用过的词，这样一句里能覆盖到不同的知识点。
 * 反例：如果只取"每个词命中的第一条规则"，"It has three months." 里的 months
 * 会因为单词里含 th 被 th 规则吃掉，反而漏掉了它最该提醒的复数尾音。
 *
 * 用的是 tipsLib.preRuleList()（严格版规则），不是面向"读错后再解释"的宽规则：
 * 读前预告是主动断言，宁可少说，不能说错（详见 tips.js 里的说明）。
 * @param {string} en 课文原句
 * @returns {Array<{word:string, ruleId:string, tip:string, demo:string}>}
 */
function watchOut(en) {
  const raw = String(en || '').split(/\s+/).filter(Boolean);
  const taken = {};
  const out = [];

  tipsLib.preRuleList().forEach(function (rule) {
    if (out.length >= MAX_WATCH) return;
    for (let i = 0; i < raw.length; i++) {
      if (taken[i]) continue;
      const plain = raw[i].replace(/[^A-Za-z']/g, '');
      const key = plain.toLowerCase();
      if (!key || !rule.test(key)) continue;

      taken[i] = true;
      out.push({
        word: plain,
        ruleId: rule.id,
        tip: rule.tip,
        demo: rule.demo
      });
      break;
    }
  });

  return out;
}

module.exports = {
  expectedMs: expectedMs,
  comparePace: comparePace,
  paceBadge: paceBadge,
  watchOut: watchOut,
  FAST_RATIO: FAST_RATIO,
  SLOW_RATIO: SLOW_RATIO
};
