/**
 * 逐词跟读高亮（卡拉OK）回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/karaoke.test.js
 *
 * 这个功能最怕两种毛病：
 *   1. 某个词永远亮不起来（孩子盯着一个到死都不亮的词）；
 *   2. 色块不按顺序走、甚至往回跳。
 * 所以这里对全库每一句都逐毫秒走一遍，把覆盖面和单调性钉死。
 */
const karaoke = require('../utils/karaoke.js');
const lessons = require('../data/lessons.js');

let failed = 0;
function assert(label, cond, extra) {
  const ok = !!cond;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '   → ' + extra));
  if (!ok) failed += 1;
}

/* ---------------- 1. 分词 ---------------- */

console.log('— 1. 分词 -');
assert('普通句按空格切开', karaoke.splitWords('We moved here to Shenzhen yesterday.').length === 6);
assert('连续空格不产生空词', karaoke.splitWords('I  feel   lonely.').length === 3);
assert('空值不会崩', karaoke.splitWords('').length === 0 && karaoke.splitWords(null).length === 0);

/* ---------------- 2. 时间轴 ---------------- */

console.log('\n— 2. 时间轴 -');
const TEXT = 'We moved here to Shenzhen yesterday.';
const words = karaoke.splitWords(TEXT);
const plan = karaoke.plan(words, 3000);

assert('每个词都有区间', plan.length === words.length, plan.length + ' vs ' + words.length);
assert('从 0 开始', plan[0].start === 0, JSON.stringify(plan[0]));
assert('到总时长结束', plan[plan.length - 1].end === 3000, JSON.stringify(plan[plan.length - 1]));

let mono = true;
for (let i = 1; i < plan.length; i++) {
  if (plan[i].start !== plan[i - 1].end || plan[i].end < plan[i].start) mono = false;
}
assert('区间首尾相接、单调递增', mono, JSON.stringify(plan));

const longIdx = words.indexOf('Shenzhen');
const shortIdx = words.indexOf('We');
assert(
  '长词占的时长 > 短词',
  plan[longIdx].end - plan[longIdx].start > plan[shortIdx].end - plan[shortIdx].start,
  'Shenzhen=' + (plan[longIdx].end - plan[longIdx].start) + 'ms, We=' + (plan[shortIdx].end - plan[shortIdx].start) + 'ms'
);
assert('空句 / 时长为 0 不崩', karaoke.plan([], 0).length === 0);

/* ---------------- 3. 定位 ---------------- */

console.log('\n— 3. 定位 -');
assert('起点落在第一个词', karaoke.indexAt(plan, 0) === 0);
assert('负时间也是第一个词（不越界）', karaoke.indexAt(plan, -100) === 0);
assert('终点落在最后一个词', karaoke.indexAt(plan, 3000) === words.length - 1);
assert('超出时长也停在最后一个词', karaoke.indexAt(plan, 99999) === words.length - 1);
assert('空计划返回 -1', karaoke.indexAt([], 500) === -1);
assert(
  '取区间中点能定位到该词',
  karaoke.indexAt(plan, Math.round((plan[longIdx].start + plan[longIdx].end) / 2)) === longIdx
);

/* ---------------- 4. 全库扫描 ---------------- */

console.log('\n— 4. 全库扫描：每个词都要亮得起来 -');
const noTime = [];
const unreachable = [];
const backwards = [];
let wordCount = 0;

lessons.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      const ms = karaoke.expectedMs(s.en);
      if (!ms) {
        noTime.push(s.id);
        return;
      }
      const ws = karaoke.splitWords(s.en);
      const pl = karaoke.plan(ws, ms);
      const seen = {};
      let last = -1;
      // 按毫秒把整句走一遍，看每个词是不是都轮到了、且只往前不后退
      const step = Math.max(1, Math.round(ms / 400));
      for (let t = 0; t <= ms; t += step) {
        const i = karaoke.indexAt(pl, t);
        if (i < last) backwards.push(s.id + ' 在 ' + t + 'ms 回退');
        last = i;
        seen[i] = true;
      }
      ws.forEach(function (_, i) {
        wordCount += 1;
        if (!seen[i]) unreachable.push(s.id + ' 第' + (i + 1) + '个词「' + ws[i] + '」亮不到');
      });
    });
  });
});

assert('全库句子都能取到朗读时长', noTime.length === 0, noTime.slice(0, 5).join(', '));
assert('每个词都会被点亮（共 ' + wordCount + ' 个词）', unreachable.length === 0, unreachable.slice(0, 5).join(' | '));
assert('色块只往前走，不回头', backwards.length === 0, backwards.slice(0, 3).join(' | '));

/* ---------------- 5. 边界兜底 ---------------- */

console.log('\n— 5. 边界兜底 -');
assert('expectedMs 对空值也给得出数', karaoke.expectedMs('') > 0 && karaoke.expectedMs(null) > 0);
assert('estimateMs 有下限兜底', karaoke.estimateMs('') === 600);
assert('自评时的余量系数合理', karaoke.SELF_SLOW > 1 && karaoke.SELF_SLOW < 1.5);

console.log('');
if (failed) {
  console.log('✗ 有 ' + failed + ' 项没通过');
  process.exit(1);
}
console.log('✓ 逐词跟读高亮全部通过');
