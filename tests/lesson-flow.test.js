/**
 * lesson-flow.test.js —— 跟读页的翻页行为
 *
 * 家长反馈：「点击下一句没有反应」＋「必须读完这句才能走吗？取消掉」
 * ＋「自动下一句开着，应该是示范读完就直接进下一句」。
 *
 * 这里把四条行为钉成测试：
 *   1) 手动翻页无任何前置条件（没读过、读砸了，照样能翻）
 *   2) 示范播完 → 自动下一句（开）＝ 直接进下一句；关了就不动
 *   3) 打分不达标 / 自评"还不熟"，自动下一句照样往下走（不再卡在这一句）
 *   4) 翻页时清理播放/录音即使抛异常，也必须切得动（曾经会静默吞掉整次翻页）
 */

const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  ✓ ' + msg);
  } else {
    fail++;
    console.log('  ✗ ' + msg);
  }
}

/* ---------------- mock 微信运行时 ---------------- */
const store = {};
let PageObj = null;
const toasts = [];

// 可控的定时器：收集起来手动触发，测自动翻页不用真等
let timerSeq = 0;
const timers = new Map();
const realSetTimeout = global.setTimeout;
const realClearTimeout = global.clearTimeout;

global.setTimeout = function (fn, ms) {
  const id = ++timerSeq;
  timers.set(id, { fn: fn, ms: ms, alive: true });
  return id;
};
global.clearTimeout = function (id) {
  const t = timers.get(id);
  if (t) t.alive = false;
};
/** 执行所有还没被清掉的定时器 */
function flushTimers() {
  const list = [];
  timers.forEach(function (t) {
    if (t.alive) list.push(t);
  });
  list.forEach(function (t) {
    t.alive = false;
    t.fn();
  });
}
function pendingCount() {
  let n = 0;
  timers.forEach(function (t) {
    if (t.alive) n++;
  });
  return n;
}

global.wx = {
  setStorageSync: function (k, v) {
    store[k] = v;
  },
  getStorageSync: function (k) {
    return k in store ? store[k] : '';
  },
  showToast: function (o) {
    toasts.push(o.title);
  },
  showModal: function () {},
  pageScrollTo: function () {},
  setNavigationBarTitle: function () {},
  getRecorderManager: function () {
    return { start() {}, stop() {}, onStop() {}, onError() {} };
  },
  getSetting: function () {},
  authorize: function () {},
  openSetting: function () {},
  createInnerAudioContext: function () {
    return {
      play() {}, stop() {}, destroy() {},
      onPlay() {}, onCanplay() {}, onEnded() {}, onError() {},
      onTimeUpdate() {}, onWaiting() {}, onStop() {}
    };
  },
  request: function () {}
};
global.Page = function (o) {
  PageObj = o;
};
global.getApp = function () {
  return { globalData: {} };
};

/* ---------------- 把页面跑起来 ---------------- */
function attach(vm) {
  vm.setData = function (patch) {
    Object.keys(patch).forEach(function (k) {
      const m = k.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
      if (m) {
        vm.data[m[1]] = vm.data[m[1]] || [];
        if (!vm.data[m[1]][m[2]]) vm.data[m[1]][m[2]] = {};
        vm.data[m[1]][m[2]][m[3]] = patch[k];
        return;
      }
      vm.data[k] = patch[k];
    });
  };
}

// tts.speak 换成假的，好在测试里手动触发 onEnded（模块对象共享，改属性即可）
const tts = require(path.join(ROOT, 'utils/tts.js'));
let lastSpeakOpts = null;
const realSpeak = tts.speak;
tts.speak = function (text, opts) {
  lastSpeakOpts = opts || {};
  return Promise.resolve();
};

// 跟读页按单元复制了六份（见 tools/sync-lesson.js），测其中一份即可 ——
// 脚本保证六份字节一致
require(path.join(ROOT, 'u1', 'pages', 'lesson', 'lesson.js'));
const vm = Object.assign({}, PageObj);
vm.data = JSON.parse(JSON.stringify(PageObj.data));
attach(vm);

vm.onLoad({ lesson: 'u1' });

console.log('跟读页翻页行为');
console.log('');

/* ---------------- 1) 手动翻页无条件 ---------------- */
console.log('[1] 手动翻页：不设任何前置条件');
const total = vm.data.sentences.length;
assert(total > 1, 'Unit 1 课文载入成功，共 ' + total + ' 句');
assert(vm.data.idx === 0, '起始是第 1 句');
assert(vm.data.result === null, '还没读过（result 为空）');

vm.next();
assert(vm.data.idx === 1, '没读过也能点「下一句」（0 → 1）');
vm.next();
vm.next();
assert(vm.data.idx === 3, '连续翻页正常（→ 3）');
vm.prev();
assert(vm.data.idx === 2, '「上一句」正常（→ 2）');

/* ---------------- 2) 示范读完自动下一句 ---------------- */
console.log('');
console.log('[2] 示范读完 → 自动进下一句');

if (!vm.data.autoNext) vm.toggleAutoNext();
assert(vm.data.autoNext === true, '自动下一句：开');

const before = vm.data.idx;
vm.playDemo();
assert(!!lastSpeakOpts, 'playDemo 已发起播放');
lastSpeakOpts.onEnded(); // 模拟音频播完
assert(pendingCount() === 1, '示范播完后排了一次自动翻页');
flushTimers();
assert(vm.data.idx === before + 1, '示范读完自动进下一句（' + before + ' → ' + vm.data.idx + '）');

vm.toggleAutoNext();
assert(vm.data.autoNext === false, '自动下一句：关');
const before2 = vm.data.idx;
vm.playDemo();
lastSpeakOpts.onEnded();
flushTimers();
assert(vm.data.idx === before2, '关掉后示范读完停在原句，不会自己跑走');

vm.toggleAutoNext(); // 重新打开

/* ---------------- 3) 读得不达标也要能往下走 ---------------- */
console.log('');
console.log('[3] 不达标 / 自评"还不熟" 都照样往下走');

const before3 = vm.data.idx;
vm.handleAutoResult('totally wrong words here'); // 明显读砸了
assert(
  vm.data.result && vm.data.result.score < 60,
  '这次评分确实不达标（' + (vm.data.result && vm.data.result.score) + ' 分）'
);
flushTimers();
assert(vm.data.idx === before3 + 1, '读砸了也自动进下一句（不再卡住）');

const before4 = vm.data.idx;
vm.onSelfJudge({ currentTarget: { dataset: { ok: '0' } } }); // 自评：还不熟
assert(vm.data.selfPicking === true, '进入自评选词');
vm.saveSelfPick(); // 记录并继续
flushTimers();
assert(vm.data.idx === before4 + 1, '自评"还不熟"也自动进下一句');

/* ---------------- 4) 清理动作抛异常也不能阻断翻页 ---------------- */
console.log('');
console.log('[4] 翻页时的清理动作抛异常，也必须切得动');

const before5 = vm.data.idx;
const realStop = tts.stop;
tts.stop = function () {
  throw new Error('模拟：停止播放时炸了');
};
let threw = false;
try {
  vm.next();
} catch (e) {
  threw = true;
}
assert(!threw, 'next() 自身不抛异常');
assert(
  vm.data.idx === before5 + 1,
  '即使清理抛错，句子照样切走了（' + before5 + ' → ' + vm.data.idx + '）'
);
tts.stop = realStop;

/* ---------------- 5) 本段最后一句 ---------------- */
console.log('');
console.log('[5] 边界：本段最后一句');
vm.goto(vm.data.sentences.length - 1);
const last = vm.data.idx;
vm.next();
assert(vm.data.idx === last, '末句再点「下一句」停住不越界');
assert(
  toasts.some(function (t) {
    return String(t).indexOf('这一段读完啦') >= 0;
  }),
  '末句给出「这一段读完啦」提示'
);

/* ---------------- 7) 上次录音会跟着句子加载出来 ---------------- */
// 录音持久化的底层规则已在 tests/record-store.test.js 覆盖，
// 这里只盯「页面接线」：翻到这一句时，以前录过的那次要能显示在按钮上。
console.log('');
console.log('[7] 上次录音跟着句子加载');

const rec = require(path.join(ROOT, 'utils/record-store.js'));
// 假装以前在第 1 句录过一次（索引里放一条；本 mock 没有真实文件系统，
// record-store 会安静降级，但"读出索引"这一步是能验的）
store[rec._KEY] = {
  'u1-p1-s1': { p: 'wxfile://usr/recordings/u1-p1-s1.mp3', d: 2400, s: 20480, t: Date.now() }
};

vm.goto(0);
assert(vm.data.idx === 0, '翻到 Unit 1 第 1 句');
assert(vm.data.prevRecord !== null, '以前录过的句子，prevRecord 被读出来了（按钮会显示）');
assert(vm.data.prevRecord && vm.data.prevRecord.d === 2400, '连时长一起带上（回听时要跑逐词高亮）');

vm.goto(1);
assert(vm.data.prevRecord === null, '换到没录过的句子，prevRecord 为空（按钮自动隐藏）');

/* ---------------- 收尾 ---------------- */
tts.speak = realSpeak;
global.setTimeout = realSetTimeout;
global.clearTimeout = realClearTimeout;

console.log('');
console.log('─'.repeat(46));
if (fail === 0) {
  console.log('全部通过：' + pass + ' 项检查');
  process.exit(0);
} else {
  console.log('失败 ' + fail + ' 项（通过 ' + pass + ' 项）');
  process.exit(1);
}
