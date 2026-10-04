/**
 * 跟读识别（ASR）适配层
 *
 * 支持三种通道（见 config.js 的 ASR_MODE）：
 *   'self'   —— 只录音，不识别；录完回放，由孩子 / 家长判断对错（个人主体零门槛，默认）
 *   'cloud'  —— 录音 → 上传到自己部署的云函数做语音识别 → 返回文本 → 端上评分
 *   'plugin' —— 「微信同声传译」插件（仅企业等非个人主体可用）
 *
 * 注：官方「微信同声传译」插件的服务类目是 IT科技 > 软件服务提供商，
 * 该插件的服务类目不在个人主体小程序的开放范围内，个人主体后台搜不到也加不了，
 * 在 app.json 里写 plugins 会直接「编译失败：没有权限」。
 */
const config = require('../config.js');
const audio = require('./audio.js');

let modeResolved = null;
let manager = null;
let pluginTried = false;

let partialCb = null;
let doneCb = null;
let failCb = null;
let recording = false;

/* ---------------- 通道判定 ---------------- */

function ensurePluginManager() {
  if (pluginTried) return !!manager;
  pluginTried = true;
  if (config.ASR_MODE !== 'plugin') return false;
  try {
    const plugin = requirePlugin('WechatSI');
    manager = plugin.getRecordRecognitionManager();
    if (!manager) return false;

    manager.onStart = function () {
      recording = true;
    };
    manager.onRecognize = function (res) {
      if (partialCb && res && res.result) partialCb(res.result);
    };
    manager.onStop = function (res) {
      recording = false;
      const cb = doneCb;
      doneCb = null;
      partialCb = null;
      failCb = null;
      if (cb) cb((res && res.result) || '');
    };
    manager.onError = function (err) {
      recording = false;
      const cb = failCb;
      doneCb = null;
      partialCb = null;
      failCb = null;
      if (cb) cb(err);
    };
    return true;
  } catch (e) {
    console.warn('[asr] WechatSI 插件不可用（个人主体无法添加该插件）：', e);
    manager = null;
    return false;
  }
}

/** 返回实际生效的通道：'plugin' | 'cloud' | 'self' */
function getMode() {
  if (modeResolved) return modeResolved;
  const cloudReady =
    config.ASR_TRANSPORT === 'cloud' ? !!config.ASR_CLOUD_FUNCTION : !!config.ASR_ENDPOINT;
  if (config.ASR_MODE === 'plugin' && ensurePluginManager()) {
    modeResolved = 'plugin';
  } else if (config.ASR_MODE === 'cloud' && cloudReady) {
    modeResolved = 'cloud';
  } else {
    modeResolved = 'self';
  }
  return modeResolved;
}

/** 能否自动识别（不能就是自评模式） */
function isAvailable() {
  return getMode() !== 'self';
}

/** 给页面显示用的一句话说明 */
function describeMode() {
  const m = getMode();
  if (m === 'cloud') return '云端语音识别已开启，读完自动打分';
  if (m === 'plugin') return '同传插件识别已开启，读完自动打分';
  return '自评模式：先听示范，再听自己的录音对着找差别。读快了读慢了会提醒你。';
}

/**
 * 录音相关的失败有两种，长得像但修法完全不同，必须分开处理：
 *
 *  A. 「authorize:fail api scope is not declared in the privacy agreement」
 *     —— 小程序后台**没配《用户隐私保护指引》里的「麦克风」**。
 *        这种是真机上连授权弹窗都不会弹，「去设置」里也找不到录音开关，
 *        属于账号后台配置问题，只能管理员去 mp 后台补声明（见 发布上线指南.md）。
 *        只提示「去设置」会把家长带到死胡同里。
 *  B. 其它 fail —— 用户自己拒绝过，引导去设置页打开即可。
 */
function isPrivacyIssue(err) {
  const msg = String((err && (err.errMsg || err.message)) || err || '');
  return /privacy/i.test(msg) || /not declared/i.test(msg);
}

const PRIVACY_HINT =
  '小程序后台还没声明「麦克风」权限，真机上录音不会弹出授权框，"去设置"里也找不到录音开关。\n\n' +
  '请用管理员微信登录 mp.weixin.qq.com →「设置」→「服务内容声明」→「用户隐私保护指引」，' +
  '勾选「麦克风」并提交审核；通过后重新打开小程序即可正常录音。';

/**
 * 把录音类错误翻译成家长能看懂的一句话（页面 toast / modal 用）
 * @param {*} err
 * @returns {string}
 */
function explainRecordError(err) {
  if (isPrivacyIssue(err)) return '录音还没开通：请先到小程序后台声明「麦克风」隐私权限';
  const msg = String((err && (err.errMsg || err.message)) || err || '');
  if (/cancel/i.test(msg)) return '录音取消了';
  if (/auth|deny|denied|permission|forbid/i.test(msg)) return '没有麦克风权限，请点右上角「…」→ 设置，打开「录音」';
  return '录音失败，请检查手机麦克风权限';
}

/** 弹出「后台没声明麦克风」的指引弹窗（授权失败和录音失败两条路共用） */
function showPrivacyHelp() {
  wx.showModal({
    title: '录音还不能用',
    content: PRIVACY_HINT,
    showCancel: false,
    confirmText: '知道了'
  });
}

/** 申请录音权限（未授权时引导去设置页；若是后台没声明隐私，则直接说清楚） */
function ensureRecordAuth() {
  return new Promise(function (resolve) {
    wx.getSetting({
      success: function (res) {
        if (res.authSetting['scope.record']) {
          resolve(true);
          return;
        }
        wx.authorize({
          scope: 'scope.record',
          success: function () {
            resolve(true);
          },
          fail: function (err) {
            if (isPrivacyIssue(err)) {
              console.warn('[asr] 录音被隐私协议拦截，需先在 mp 后台声明「麦克风」：', err);
              showPrivacyHelp();
              resolve(false);
              return;
            }
            wx.showModal({
              title: '需要麦克风权限',
              content: '跟读评分需要用到麦克风，请在设置里打开"录音"权限。',
              confirmText: '去设置',
              success: function (m) {
                if (m.confirm) {
                  wx.openSetting({ complete: function () { resolve(false); } });
                } else {
                  resolve(false);
                }
              }
            });
          }
        });
      },
      fail: function () {
        resolve(true);
      }
    });
  });
}

/* ---------------- 纯录音（自评 / 云端识别共用底座） ---------------- */

const plain = { inst: null, inited: false, stopCb: null, errCb: null, recording: false };

function getPlainRecorder() {
  if (plain.inited) return plain.inst;
  plain.inst = wx.getRecorderManager();
  plain.inst.onStop(function (res) {
    plain.recording = false;
    const cb = plain.stopCb;
    plain.stopCb = null;
    plain.errCb = null;
    if (!cb) return;
    // duration 是这次录音的毫秒数，自评模式的「节奏比对」要靠它（见 utils/pace.js）
    cb({
      path: (res && res.tempFilePath) || '',
      duration: (res && res.duration) || 0,
      size: (res && res.fileSize) || 0
    });
  });
  plain.inst.onError(function (err) {
    plain.recording = false;
    const cb = plain.errCb;
    plain.stopCb = null;
    plain.errCb = null;
    if (cb) cb(err);
  });
  plain.inited = true;
  return plain.inst;
}

/**
 * 只用原生录音，不做识别
 * @param {object} [opts] { duration }
 * @returns {Promise<{path:string, duration:number, size:number}>}
 */
function startPlain(opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    const r = getPlainRecorder();
    plain.stopCb = resolve;
    plain.errCb = reject;
    try {
      r.start({
        duration: opts.duration || config.RECORD_MAX_DURATION,
        format: 'mp3',
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000
      });
      plain.recording = true;
    } catch (e) {
      plain.stopCb = null;
      plain.errCb = null;
      reject(e);
    }
  });
}

function stopPlain() {
  if (!plain.inst) return;
  try {
    plain.inst.stop();
  } catch (e) {}
}

function isPlainRecording() {
  return plain.recording;
}

/* ---------------- 云端识别 ---------------- */

function readBase64(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * 上传到自建云函数做语音识别。
 * 用 base64 + JSON（而不是 multipart），云函数侧不用装解析库，一把梭。
 * 云函数返回 { text: '识别的英文' }。
 */
function uploadToCloud(filePath) {
  if (config.ASR_TRANSPORT === 'cloud') return uploadViaCloudFunction(filePath);
  return uploadViaHttp(filePath);
}

/** 通道 A：微信云开发 wx.cloud.callFunction（不用配合法域名，但要开通云开发） */
function uploadViaCloudFunction(filePath) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error('ASR_NO_CLOUD'));
  }
  return readBase64(filePath).then(function (b64) {
    return new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
        name: config.ASR_CLOUD_FUNCTION || 'asr',
        data: { audio: b64, format: 'mp3', rate: 16000, token: config.ASR_TOKEN || '' },
        success: function (res) {
          const r = res && res.result;
          if (r && typeof r.text === 'string') {
            resolve(r.text);
            return;
          }
          console.warn('[asr] cloud function 返回异常：', r);
          reject(new Error('ASR_NO_TEXT'));
        },
        fail: function (err) {
          console.warn('[asr] callFunction fail', err);
          reject(new Error('ASR_CALL_FAIL'));
        }
      });
    });
  });
}

/** 通道 B：POST 到自己部署的 HTTPS 接口（腾讯云 SCF 函数URL / 自有服务器） */
function uploadViaHttp(filePath) {
  if (!config.ASR_ENDPOINT) return Promise.reject(new Error('ASR_NO_ENDPOINT'));

  return readBase64(filePath).then(function (b64) {
    return new Promise(function (resolve, reject) {
      const header = { 'content-type': 'application/json' };
      if (config.ASR_TOKEN) header['x-asr-token'] = config.ASR_TOKEN;

      wx.request({
        url: config.ASR_ENDPOINT,
        method: 'POST',
        timeout: 20000,
        header: header,
        data: { audio: b64, format: 'mp3', rate: 16000 },
        success: function (res) {
          if (res.statusCode !== 200) {
            reject(new Error('ASR_HTTP_' + res.statusCode));
            return;
          }
          const data = typeof res.data === 'string' ? safeParse(res.data) : res.data;
          if (!data || typeof data.text !== 'string') {
            reject(new Error('ASR_NO_TEXT'));
            return;
          }
          resolve(data.text);
        },
        fail: function (err) {
          console.warn('[asr] request fail', err);
          reject(new Error('ASR_UPLOAD_FAIL'));
        }
      });
    });
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

/** 云端通道：录一段 → 上传识别 → 返回文本 */
function startCloud(opts) {
  opts = opts || {};
  return startPlain(opts).then(function (rec) {
    const filePath = rec && rec.path;
    if (!filePath) throw new Error('ASR_NO_AUDIO_FILE');
    return uploadToCloud(filePath).then(
      function (text) {
        return text;
      },
      function (err) {
        // 把录音路径挂到错误上，页面可以降级为"回放自评"
        err.audioPath = filePath;
        err.audioDuration = (rec && rec.duration) || 0;
        throw err;
      }
    );
  });
}

/* ---------------- 统一入口 ---------------- */

/**
 * 开始录音识别
 * @param {object} opts { onPartial, duration, lang }
 * @returns {Promise<string>}
 */
function start(opts) {
  opts = opts || {};
  const m = getMode();
  if (m === 'cloud') return startCloud(opts);
  if (m === 'self') return Promise.reject(new Error('ASR_SELF_MODE'));

  return new Promise(function (resolve, reject) {
    if (!manager) {
      reject(new Error('ASR_UNAVAILABLE'));
      return;
    }
    partialCb = opts.onPartial || null;
    doneCb = resolve;
    failCb = reject;
    try {
      manager.start({
        duration: opts.duration || config.RECORD_MAX_DURATION,
        lang: opts.lang || config.ASR_LANG
      });
    } catch (e) {
      doneCb = null;
      partialCb = null;
      failCb = null;
      reject(e);
    }
  });
}

function stop() {
  const m = getMode();
  if (m === 'plugin') {
    if (manager) {
      try {
        manager.stop();
      } catch (e) {}
    }
    return;
  }
  // self 与 cloud 都走微信原生录音，必须真的停，否则要等 12 秒自动结束
  stopPlain();
}

function isRecording() {
  if (getMode() === 'cloud') return plain.recording;
  return recording;
}

/**
 * 播放录音（自评回放用）
 * 走 utils/audio.js，和「听示范」共用同一个播放器：
 *  - 关掉静音键跟随（iPhone 静音键打开也能出声）
 *  - 播放失败会通过 onError 上报，页面不再"一点动静都没有"
 */
function playReview(filePath, onEnded, onError) {
  return audio.play(filePath, { onEnded: onEnded, onError: onError });
}

function stopReview() {
  audio.stop();
}

module.exports = {
  getMode: getMode,
  describeMode: describeMode,
  isAvailable: isAvailable,
  ensureRecordAuth: ensureRecordAuth,
  explainRecordError: explainRecordError,
  isPrivacyIssue: isPrivacyIssue,
  showPrivacyHelp: showPrivacyHelp,
  start: start,
  stop: stop,
  isRecording: isRecording,
  startPlain: startPlain,
  stopPlain: stopPlain,
  isPlainRecording: isPlainRecording,
  playReview: playReview,
  stopReview: stopReview
};
