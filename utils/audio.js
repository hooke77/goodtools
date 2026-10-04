/**
 * 音频播放统一封装（「听示范」和「听我的」共用）
 *
 * 集中解决三个会让「点了没声音」的坑：
 *
 * 1) 代码包内的音频必须用「以 / 开头的绝对路径」。
 *    InnerAudioContext 拿到 'audios/u1-p1-s1.mp3' 这种相对路径会直接加载失败，
 *    而且失败只走 onError，页面上什么提示都没有 → 看起来就是"没声音"。
 *    （注意：录音得到的临时文件路径 'http://tmp/xxx.mp3'、'wxfile://xxx.mp3'
 *     本来就是合法的，不能补前缀。）
 *
 * 2) InnerAudioContext 默认 obeyMuteSwitch = true。
 *    iPhone / iPad 打开侧边静音键后完全不出声，而录音不受影响，
 *    现象正好就是"听示范没声音、听我的也没声音"。所以这里一律关掉。
 *
 * 3) 播放失败必须冒到页面上去，不能吞。
 *
 * 另外：全 App 共用一个播放器实例，天然保证"同一时刻只响一个声音"。
 */

let ctx = null;
let token = 0;

/** 已经是可用的完整路径（网络地址 / 微信文件协议 / 已带根斜杠） */
function isFullPath(p) {
  return /^(https?:|wxfile:|blob:|data:|file:|\/\/|\/)/i.test(p);
}

/**
 * 把音频路径规整成 InnerAudioContext 能认的绝对路径
 * 'audios/x.mp3' → '/audios/x.mp3'
 */
function resolveSrc(path) {
  const p = String(path == null ? '' : path).trim();
  if (!p) return '';
  if (isFullPath(p)) return p;
  return '/' + p;
}

function stop() {
  token++; // 让还在等待中的回调失效
  const c = ctx;
  ctx = null;
  if (!c) return;
  try {
    c.stop();
  } catch (e) {}
  try {
    c.destroy();
  } catch (e) {}
}

/**
 * 播放一段音频
 * @param {string} path   代码包内路径（可写相对路径）、录音临时路径或网络地址
 * @param {object} [opts] { rate, onEnded(errOrNull), onError(err) }
 *        rate: 播放速度，1 = 原速，0.7 = 慢速（跟读卡壳时用来听清）
 * @returns {string} 实际播放的路径
 */
function play(path, opts) {
  opts = opts || {};
  const src = resolveSrc(path);

  stop();

  if (!src) {
    const e = { errCode: -1, errMsg: 'EMPTY_AUDIO_SRC' };
    if (opts.onError) opts.onError(e);
    if (opts.onEnded) opts.onEnded(e);
    return '';
  }

  const my = ++token;
  const c = wx.createInnerAudioContext();
  ctx = c;

  // iPhone 静音键打开时也要能出声（关键）
  try {
    c.obeyMuteSwitch = false;
  } catch (e) {}
  try {
    c.volume = 1;
  } catch (e) {}
  const rate = Number(opts.rate);
  if (rate > 0 && rate !== 1) {
    try {
      c.playbackRate = Math.min(2, Math.max(0.5, rate));
    } catch (e) {}
  }

  let finished = false;
  let started = false;

  function finish(err) {
    if (finished || my !== token) return;
    finished = true;
    if (err) {
      console.warn('[audio] 播放失败', err, src);
      if (opts.onError) opts.onError(err);
    }
    if (opts.onEnded) opts.onEnded(err || null);
  }

  function tryPlay() {
    if (finished || my !== token) return;
    try {
      c.play();
    } catch (e) {
      console.warn('[audio] play() 抛错', e);
    }
  }

  c.onPlay(function () {
    started = true;
  });

  // 播放进度回调（给「逐词高亮」用）
  // 页面拿到的是 当前毫秒 / 总毫秒，自己去换算这句走到了第几个词。
  // 这里做两件保护：换了新音频或已经结束就不再回调（否则会把上一个音频的
  // 进度算到这一句上，出现"声音停了但色块还在走"）；duration 取不到的机型
  // （部分安卓返回 0 / Infinity）回传 0，由调用方按自己的预计时长兜底。
  if (opts.onProgress) {
    c.onTimeUpdate(function () {
      if (finished || my !== token) return;
      const cur = Number(c.currentTime);
      const dur = Number(c.duration);
      opts.onProgress(isFinite(cur) ? cur * 1000 : 0, isFinite(dur) ? dur * 1000 : 0);
    });
  }

  c.onCanplay(function () {
    if (!started) tryPlay();
  });
  c.onEnded(function () {
    finish(null);
  });
  c.onError(function (err) {
    finish(err || { errMsg: 'PLAY_ERROR' });
  });

  c.src = src;
  tryPlay();
  // 少数机型第一次 play 不生效，兜一次
  setTimeout(function () {
    if (!started) tryPlay();
  }, 300);
  // 极端情况下（文件损坏等）也要让页面恢复可点，不卡死
  setTimeout(function () {
    finish(null);
  }, 30000);

  return src;
}

module.exports = {
  play: play,
  stop: stop,
  resolveSrc: resolveSrc
};
