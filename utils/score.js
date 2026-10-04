/**
 * 跟读评分引擎
 * 思路：对"识别文本"和"目标句子"做词级序列比对（LCS + 模糊匹配），
 *      得到逐词对错、整句得分、以及需要重点纠正的单词。
 * 说明：微信同声传译插件只返回识别文本，本模块在端上做对齐与打分，不依赖后端。
 */
const config = require('../config.js');

/* ---------------- 文本归一化 ---------------- */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 缩写归并：把 "i am" 合成 "i'm"、"do not" 合成 "don't"、再 "cannot"→"can't"，
// 让课本写法（I'm / don't）和识别结果（I am / do not）能对齐，避免误判。
const MERGES = [
  ['i', 'am', "i'm"],
  ['i', 'will', "i'll"],
  ['i', 'have', "i've"],
  ['it', 'is', "it's"],
  ['that', 'is', "that's"],
  ['there', 'is', "there's"],
  ['he', 'is', "he's"],
  ['she', 'is', "she's"],
  ['let', 'us', "let's"],
  ['do', 'not', "don't"],
  ['does', 'not', "doesn't"],
  ['did', 'not', "didn't"],
  ['is', 'not', "isn't"],
  ['are', 'not', "aren't"],
  ['was', 'not', "wasn't"],
  ['were', 'not', "weren't"],
  ['can', 'not', "can't"],
  ['will', 'not', "won't"],
  ['we', 'are', "we're"],
  ['they', 'are', "they're"],
  ['you', 'are', "you're"]
];

function mergeContractions(words, spansOut) {
  const out = [];
  let i = 0;
  while (i < words.length) {
    let merged = null;
    if (i + 1 < words.length) {
      for (let k = 0; k < MERGES.length; k++) {
        if (MERGES[k][0] === words[i] && MERGES[k][1] === words[i + 1]) {
          merged = MERGES[k][2];
          break;
        }
      }
    }
    if (merged) {
      out.push(merged);
      if (spansOut) spansOut.push([i, i + 2]);
      i += 2;
    } else if (words[i] === 'cannot') {
      out.push("can't");
      if (spansOut) spansOut.push([i, i + 1]);
      i += 1;
    } else {
      out.push(words[i]);
      if (spansOut) spansOut.push([i, i + 1]);
      i += 1;
    }
  }
  return out;
}

function stripApos(w) {
  return String(w || '').replace(/'/g, '');
}

function toWords(text) {
  const t = normalize(text);
  if (!t) return [];
  return mergeContractions(t.split(' '));
}

/**
 * 同 toWords，但额外带回"这个词在原文里长什么样"。
 *
 * 为什么需要：mergeContractions 会把 "There is" 合成 "there's"、"I am" 合成 "i'm"，
 * 拿来判分是对的（孩子写 I am 不该判错），但直接显示给孩子看就变成
 * 「正确答案写着 I am the youngest，批改却在说 i'm」—— 看着像批错了。
 *
 * @returns {Array<{word:string, display:string}>} word 用于比对，display 用于展示
 */
function toWordsWithDisplay(text) {
  const t = normalize(text);
  if (!t) return [];
  const parts = t.split(' ');
  const spans = [];
  const words = mergeContractions(parts, spans);

  // 原文按空白切、做同样的清洗，应当与 parts 一一对应。
  // 这里刻意**不转小写** —— display 就是要给孩子看"正确答案原本怎么写的"，
  // 大小写写对了也值得看见（判分本身仍然忽略大小写）。
  const raw = String(text == null ? '' : text)
    .replace(/[\u2018\u2019`]/g, "'")
    .split(/\s+/)
    .map(function (w) {
      return w.replace(/[^A-Za-z0-9']/g, '');
    })
    .filter(Boolean);
  const aligned = raw.length === parts.length;

  return words.map(function (w, k) {
    const sp = spans[k] || [k, k + 1];
    const disp = aligned && raw[sp[0]] ? raw.slice(sp[0], sp[1]).join(' ') : w;
    return { word: w, display: disp || w };
  });
}

/* ---------------- 编辑距离 ---------------- */

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = cur;
    cur = tmp;
  }
  return prev[n];
}

/* ---------------- 单词是否读对 ---------------- */

// 词尾吞音：目标词只是比说出的词多了 1~2 个字母（-s / -es / -ed / -d / -e），
// 这是小学阶段最典型的问题（pads→pad, wanted→want, slide→slid），严格模式下判错。
function isSuffixSwallowed(target, said) {
  if (!said) return false;
  if (!target || target.indexOf(said) !== 0) return false;
  const extra = target.slice(said.length);
  return extra.length > 0 && extra.length <= 2;
}

function isWordMatch(target, said) {
  if (!said) return false;

  const t = stripApos(target);
  const s = stripApos(said);
  if (t === s) return true;

  // 所有格（people's、Beijing's）里的 's 不算词尾吞音，避免被判错
  const possessive = String(target).indexOf("'") >= 0;
  if (!possessive && isSuffixSwallowed(t, s)) return !config.STRICT_MODE;

  const d = levenshtein(t, s);
  if (d === 0) return true;

  // 短词（ramp / lamp、ship / sheep）差一个字母就是另一个词，必须读准
  const maxLen = Math.max(t.length, s.length);
  if (t.charAt(0) !== s.charAt(0)) return false;

  if (maxLen <= 8) return d <= 1;
  return d <= 2;
}

/* ---------------- 序列对齐 ---------------- */

function align(targetWords, saidWords) {
  const m = targetWords.length;
  const n = saidWords.length;
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const hit = isWordMatch(targetWords[i - 1], saidWords[j - 1]) ? 1 : 0;
      dp[i][j] = Math.max(dp[i - 1][j - 1] + hit, dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const pairs = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const hit = isWordMatch(targetWords[i - 1], saidWords[j - 1]);
    if (hit && dp[i][j] === dp[i - 1][j - 1] + 1) {
      pairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  pairs.reverse();
  return { pairs: pairs, matched: pairs.length };
}

/* ---------------- 主函数 ---------------- */

// 有漏读 / 吞音时的提示语，说得具体一点孩子才知道怎么改
function result_title_for_gap(missCount, swallowCount) {
  if (swallowCount && !missCount) {
    return '读得挺顺，但有 ' + swallowCount + ' 个词的小尾巴（-s / -ed）没读出来。';
  }
  if (missCount && swallowCount) {
    return '有 ' + missCount + ' 个词没读到，还有 ' + swallowCount + ' 个词尾巴没读全。';
  }
  return '有 ' + missCount + ' 个词没读到，再读一遍把这句读完整。';
}

/**
 * @param {string} target 目标句子（课本原文）
 * @param {string} said   识别到的文本
 * @returns {object} 评分结果
 */
function evaluate(target, said) {
  const targetWords = toWords(target);
  const saidWords = toWords(said);

  const empty = {
    score: 0,
    level: 'none',
    levelText: '没有听到声音',
    targetWords: targetWords,
    results: targetWords.map(function (w) {
      return { word: w, ok: false, near: false, said: '' };
    }),
    errorWords: targetWords.slice(),
    missedWords: targetWords.slice(),
    extraWords: [],
    matchedCount: 0,
    totalCount: targetWords.length,
    recognized: said || ''
  };

  if (!targetWords.length) return empty;
  if (!saidWords.length) return empty;

  const { pairs } = align(targetWords, saidWords);
  const saidOfTarget = {};
  pairs.forEach(function (p) {
    saidOfTarget[p[0]] = saidWords[p[1]];
  });

  const results = targetWords.map(function (w, idx) {
    const sw = saidOfTarget[idx];
    if (sw === undefined) {
      return { word: w, ok: false, near: false, swallowed: false, said: '' };
    }
    const possessive = w.indexOf("'") >= 0;
    const exact = stripApos(w) === stripApos(sw);
    const d = levenshtein(stripApos(w), stripApos(sw));
    const swallowed = !possessive && isSuffixSwallowed(stripApos(w), stripApos(sw));
    // 所有格（people's 读成 people）只要能对上就算读到了，不苛求那个小撇号
    const ok = exact || (possessive && !swallowed);
    const near = !ok && !swallowed && d <= 2;
    return {
      word: w,
      ok: ok,
      near: near,
      swallowed: swallowed,
      said: sw
    };
  });

  const matchedIdx = {};
  pairs.forEach(function (p) {
    matchedIdx[p[0]] = true;
  });
  const extraWords = [];
  const usedSaid = {};
  pairs.forEach(function (p) {
    usedSaid[p[1]] = true;
  });
  saidWords.forEach(function (w, idx) {
    if (!usedSaid[idx]) extraWords.push(w);
  });

  const missedWords = [];
  const errorWords = [];
  results.forEach(function (r, idx) {
    if (!matchedIdx[idx]) {
      missedWords.push(r.word);
      errorWords.push(r.word);
    } else if (!r.ok) {
      // 读到了但读得不标准（近似 / 吞音）
      errorWords.push(r.word);
      if (r.near) missedWords.push(r.word);
    }
  });

  const wordRate = pairs.length / targetWords.length;
  // 字面相似度用"归并缩写后"的词串比较，避免 I'm / I am 这类写法差异被扣分
  const tJoined = targetWords.join(' ');
  const sJoined = saidWords.join(' ');
  const maxLen = Math.max(tJoined.length, sJoined.length) || 1;
  const charSim = Math.max(0, 1 - levenshtein(tJoined, sJoined) / maxLen);

  let score = Math.round(wordRate * 78 + charSim * 22);

  // 漏读（完全没读到）每个扣 6 分；读到了但读得不标准，每个扣 2 分
  let missPenalty = 0;
  let nearPenalty = 0;
  results.forEach(function (r, idx) {
    if (!r.ok) {
      if (!matchedIdx[idx]) missPenalty += 6;
      else nearPenalty += 2;
    }
  });
  score -= Math.min(30, missPenalty + nearPenalty);

  // 多读了词（重复、加音）扣分
  const extraRate = extraWords.length / Math.max(saidWords.length, 1);
  if (extraRate > 0.35) score -= 5;
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let level = 'again';
  let levelText = '再试一次，你可以的！';
  if (score >= config.EXCELLENT_SCORE) {
    level = 'excellent';
    levelText = '太棒了，读得又准又流利！';
  } else if (score >= config.PASS_SCORE) {
    level = 'pass';
    levelText = '读得不错，继续保持！';
  } else if (score >= config.OK_SCORE) {
    level = 'ok';
    levelText = '还可以，跟着示范再读一遍会更好。';
  }

  // 有漏读 / 吞音时，不允许给"优秀""不错"的评价，避免孩子以为已经读对了
  const swallowCount = results.filter(function (r) {
    return r.swallowed;
  }).length;
  if ((missedWords.length || swallowCount) && level !== 'again') {
    level = 'ok';
    levelText = result_title_for_gap(missedWords.length, swallowCount);
  }

  return {
    score: score,
    level: level,
    levelText: levelText,
    targetWords: targetWords,
    results: results,
    errorWords: errorWords,
    missedWords: missedWords,
    extraWords: extraWords,
    matchedCount: pairs.length,
    totalCount: targetWords.length,
    recognized: said
  };
}

/** 把识别文本按目标词做"伪逐词"渲染用：把说出的词标出来 */
function buildDiffText(target, said) {
  const r = evaluate(target, said);
  return r;
}

module.exports = {
  normalize: normalize,
  toWords: toWords,
  toWordsWithDisplay: toWordsWithDisplay,
  levenshtein: levenshtein,
  evaluate: evaluate,
  buildDiffText: buildDiffText
};
