/**
 * 播放层回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/player.test.js
 *
 * 这里专门盯住三个曾经导致「点了没声音」的坑：
 *   1. 代码包内的音频必须交给播放器「以 / 开头的绝对路径」，
 *      传 'audios/x.mp3' 这种相对路径会静默加载失败；
 *   2. InnerAudioContext 必须关掉静音键跟随（obeyMuteSwitch = false），
 *      否则 iPhone 打开侧边静音键后「听示范」「听我的」全都没声；
 *   3. 播放失败必须能通过 onError 冒到页面，不能吞掉。
 */
const audio = require('../utils/audio.js');
const audioMap = require('../data/audio-map.js');
const tts = require('../utils/tts.js');
const asr = require('../utils/asr.js');

let failed = 0;
function assert(label, cond, extra) {
  const ok = !!cond;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '   → ' + extra));
  if (!ok) failed += 1;
}

/* ---------------- 假的 wx 环境：记录播放器被怎么配置、怎么调用 ---------------- */

const created = [];

function makeFakeCtx() {
  const c = {
    _h: {},
    src: '',
    obeyMuteSwitch: null,
    volume: null,
    onPlay: function (f) {
      c._h.play = f;
    },
    onCanplay: function (f) {
      c._h.canplay = f;
    },
    onEnded: function (f) {
      c._h.ended = f;
    },
    onError: function (f) {
      c._h.error = f;
    },
    play: function () {
      if (c._h.play) c._h.play();
    },
    stop: function () {},
    destroy: function () {}
  };
  created.push(c);
  return c;
}

global.wx = {
  createInnerAudioContext: makeFakeCtx,
  setInnerAudioOption: function () {}
};

const last = function () {
  return created[created.length - 1];
};

/* ---------------- 1. 路径归一化 ---------------- */

console.log('— 1. 路径归一化 —');
assert(
  '相对路径补上 /（这是"听示范"没声音的根因）',
  audio.resolveSrc('audios/u1-p1-s1.mp3') === '/audios/u1-p1-s1.mp3',
  audio.resolveSrc('audios/u1-p1-s1.mp3')
);
assert('已带 / 不重复补', audio.resolveSrc('/audios/a.mp3') === '/audios/a.mp3');
assert(
  '录音的 http 临时路径不能动',
  audio.resolveSrc('http://tmp/abc.mp3') === 'http://tmp/abc.mp3',
  audio.resolveSrc('http://tmp/abc.mp3')
);
assert(
  'wxfile:// 协议不能动',
  audio.resolveSrc('wxfile://tmp_abc.mp3') === 'wxfile://tmp_abc.mp3',
  audio.resolveSrc('wxfile://tmp_abc.mp3')
);
assert('网络地址不能动', audio.resolveSrc('https://a.com/b.mp3') === 'https://a.com/b.mp3');
assert('空值返回空', audio.resolveSrc('') === '' && audio.resolveSrc(null) === '');
assert('首尾空格会被去掉', audio.resolveSrc('  audios/a.mp3  ') === '/audios/a.mp3');

/* ---------------- 2. 索引里的每一条都要能变成绝对路径 ---------------- */

console.log('\n— 2. 随包音频索引 —');
const keys = Object.keys(audioMap);
const badPath = keys.filter(function (k) {
  return audio.resolveSrc(audioMap[k]).charAt(0) !== '/';
});
assert('全部 ' + keys.length + ' 条索引都是绝对路径', badPath.length === 0, badPath.slice(0, 5).join(', '));

/* ---------------- 3-6. 真实调用链 ---------------- */

(async function () {
  console.log('\n— 3. 听示范（tts.speak）—');
  const key = keys[0];
  await tts.speak(key);
  const c1 = last();
  assert('播放器拿到的是绝对路径', c1.src === '/' + audioMap[key], c1.src);
  assert('已关掉静音键跟随', c1.obeyMuteSwitch === false, String(c1.obeyMuteSwitch));
  assert('音量设为 1', c1.volume === 1, String(c1.volume));

  console.log('\n— 4. 听我的（asr.playReview）—');
  asr.playReview('http://tmp/rec.mp3');
  const c2 = last();
  assert('录音路径原样交给播放器（不加前缀）', c2.src === 'http://tmp/rec.mp3', c2.src);
  assert('已关掉静音键跟随', c2.obeyMuteSwitch === false, String(c2.obeyMuteSwitch));

  console.log('\n— 5. 空路径不能静默 -—');
  let err5 = null;
  let ended5 = 0;
  audio.play('', {
    onError: function (e) {
      err5 = e;
    },
    onEnded: function () {
      ended5 += 1;
    }
  });
  assert('空路径会上报错误', err5 && err5.errCode === -1, JSON.stringify(err5));
  assert('空路径也会收尾，页面不会卡住', ended5 === 1, String(ended5));

  console.log('\n— 6. 播放出错要能冒到页面 -—');
  let err6 = null;
  let ended6 = 'not-called';
  audio.play('/audios/does-not-exist.mp3', {
    onError: function (e) {
      err6 = e;
    },
    onEnded: function (e) {
      ended6 = e;
    }
  });
  last()._h.error({ errCode: 10004, errMsg: 'format error' });
  assert('onError 收到原始错误码', err6 && err6.errCode === 10004, JSON.stringify(err6));
  assert('onEnded 也拿到错误（页面据此复位）', ended6 && ended6.errCode === 10004, JSON.stringify(ended6));

  console.log('\n— 7. 同一时刻只响一个声音 -—');
  const before = created.length;
  audio.play('/audios/' + 'x'.repeat(3) + '.mp3');
  assert('每次播放都会新建播放器（旧的已销毁）', created.length === before + 1, String(created.length - before));

  console.log('');
  if (failed) {
    console.log('✗ 有 ' + failed + ' 项没通过');
    process.exit(1);
  }
  console.log('✓ 播放层全部通过');
  process.exit(0);
})();
