/**
 * 节奏比对 + 读前预告 回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/pace.test.js
 *
 * 这一层是「自评模式」唯一的客观信号，所以边界要钉死：
 *   · 时长基准必须覆盖所有课文句子和单词；
 *   · 读太快的判定要稳（人不可能比示范还快，所以这是可靠信号）；
 *   · 读前预告绝不能误报 —— need 不是过去式、has 不是复数、wear 不读 /iː/。
 */
const paceLib = require('../utils/pace.js');
const tipsLib = require('../utils/tips.js');
const audioMap = require('../data/audio-map.js');
const audioLength = require('../data/audio-length.js');
const lessons = require('../data/lessons.js');

let failed = 0;
function assert(label, cond, extra) {
  const ok = !!cond;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '   → ' + extra));
  if (!ok) failed += 1;
}

/* ---------------- 1. 时长基准覆盖率 ---------------- */

console.log('— 1. 时长基准 -');
const mapKeys = Object.keys(audioMap);
const missing = mapKeys.filter(function (k) {
  return !audioLength[k];
});
assert('音频索引 ' + mapKeys.length + ' 条全部有对应时长', missing.length === 0, missing.slice(0, 5).join(', '));

const badVal = mapKeys.filter(function (k) {
  const v = audioLength[k];
  return !(typeof v === 'number' && v > 200 && v < 30000);
});
assert('所有时长都在合理区间（0.2s ~ 30s）', badVal.length === 0, badVal.slice(0, 5).join(', '));

const noBase = [];
lessons.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      if (!paceLib.expectedMs(s.en)) noBase.push(s.id + ' ' + s.en);
    });
  });
  l.words.forEach(function (w) {
    if (!paceLib.expectedMs(w.en)) noBase.push(l.id + ' 单词 ' + w.en);
  });
});
assert('所有课文句子和单词都能查到基准时长', noBase.length === 0, noBase.slice(0, 5).join(' | '));

/* ---------------- 2. 节奏判定 ---------------- */

console.log('\n— 2. 节奏判定 -');
const TEXT = 'We moved here to Shenzhen yesterday.';
const base = paceLib.expectedMs(TEXT);
assert('基准时长取到了', base > 0, String(base));

assert('原速（1.0×）判为正常', paceLib.comparePace(TEXT, base).level === 'ok');
assert('稍慢（1.3×）仍算正常', paceLib.comparePace(TEXT, Math.round(base * 1.3)).level === 'ok');
assert(
  '明显偏快（0.5×）判为太快',
  paceLib.comparePace(TEXT, Math.round(base * 0.5)).level === 'fast',
  JSON.stringify(paceLib.comparePace(TEXT, Math.round(base * 0.5)))
);
assert(
  '明显偏慢（2.5×）判为偏慢',
  paceLib.comparePace(TEXT, Math.round(base * 2.5)).level === 'slow',
  JSON.stringify(paceLib.comparePace(TEXT, Math.round(base * 2.5)))
);
assert('太快时给了纠正建议', !!paceLib.comparePace(TEXT, Math.round(base * 0.5)).tip);
assert('正常时不给多余建议', paceLib.comparePace(TEXT, base).tip === '');
assert('ratioText 直接可显示', paceLib.comparePace(TEXT, Math.round(base * 2)).ratioText === '2.00×');
assert('paceBadge 有输出', paceLib.paceBadge(paceLib.comparePace(TEXT, base)).indexOf('节奏') === 0);

console.log('\n— 3. 边界兜底 -');
assert('没基准时长时返回 null', paceLib.comparePace('这不是课文里的一句话', 3000) === null);
assert('没录音时长时返回 null', paceLib.comparePace(TEXT, 0) === null);
assert('录音过短（<0.4s）返回 null', paceLib.comparePace(TEXT, 200) === null);
assert('时长是乱码时返回 null', paceLib.comparePace(TEXT, NaN) === null);
assert('expectedMs 对空值安全', paceLib.expectedMs('') === 0 && paceLib.expectedMs(null) === 0);

/* ---------------- 4. 读前预告不能误报 ---------------- */

console.log('\n— 4. 读前预告（重点：不能瞎说） -');
function items(en) {
  return paceLib.watchOut(en);
}
function words(en) {
  return items(en).map(function (x) {
    return x.word.toLowerCase();
  });
}
function ruleIds(en) {
  return items(en).map(function (x) {
    return x.ruleId;
  });
}

assert(
  'need 不该被当成过去式',
  words("I don't need to wear a coat or a sweater.").indexOf('need') < 0,
  JSON.stringify(words("I don't need to wear a coat or a sweater."))
);
assert(
  'has 不该被当成复数名词',
  words('It has three months.').indexOf('has') < 0 &&
    ruleIds('It has three months.').indexOf('s-end') >= 0,
  JSON.stringify(items('It has three months.'))
);
assert(
  'this / his / always 不该被 -s 规则认领',
  items('This is his book and he always reads it.')
    .filter(function (x) {
      return x.ruleId === 's-end';
    })
    .every(function (x) {
      return ['this', 'his', 'always', 'is'].indexOf(x.word.toLowerCase()) < 0;
    }),
  JSON.stringify(items('This is his book and he always reads it.'))
);
assert('who 不该套用 wh 规则', words('Who is that woman?').indexOf('who') < 0, JSON.stringify(words('Who is that woman?')));
assert('wear 不该套用 ee/ea 规则', words('I wear a coat.').indexOf('wear') < 0, JSON.stringify(words('I wear a coat.')));
assert(
  'th 和 -s 要各占一个词（months 不能被 th 吃掉）',
  ruleIds('It has three months.').join(',') === 'th,s-end',
  JSON.stringify(items('It has three months.'))
);
assert(
  'moved 应该被预告（-ed 尾音）',
  ruleIds('We moved here yesterday.').indexOf('ed-end') >= 0,
  JSON.stringify(items('We moved here yesterday.'))
);
assert('最多只给两条提示', paceLib.watchOut('Three thick things think that they are there.').length <= 2);
assert('空句子不会崩', paceLib.watchOut('').length === 0 && paceLib.watchOut(null).length === 0);
assert('严格规则清单非空且都有文案', tipsLib.preRuleList().length > 0 && tipsLib.preRuleList().every(function (r) { return !!r.tip; }));

/* ---------------- 5. 全库扫一遍，确认没有系统性误报 ---------------- */

console.log('\n— 5. 全库扫描 -');
const EXCEPT_S = ['this', 'his', 'yes', 'us', 'as', 'always', 'sometimes', 'does', 'goes', 'was', 'has', 'is'];
const suspicious = [];
let watchCount = 0;
lessons.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      const list = paceLib.watchOut(s.en);
      watchCount += list.length;
      list.forEach(function (item) {
        const low = item.word.toLowerCase();
        if (item.ruleId === 's-end' && EXCEPT_S.indexOf(low) >= 0) suspicious.push('复数误报: ' + low);
        if (item.ruleId === 'ed-end' && /eed$/.test(low)) suspicious.push('过去式误报: ' + low);
        if (item.ruleId === 'wh' && /^(who|whom|whose|whole)/.test(low)) suspicious.push('wh 误报: ' + low);
      });
    });
  });
});
assert('全库没有已知类型的误报', suspicious.length === 0, JSON.stringify(suspicious.slice(0, 5)));
console.log('     （全库共给出 ' + watchCount + ' 条读前提示）');

console.log('');
if (failed) {
  console.log('✗ 有 ' + failed + ' 项没通过');
  process.exit(1);
}
console.log('✓ 节奏比对与读前预告全部通过');
