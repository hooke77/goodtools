/**
 * 朗读示范（TTS）适配层
 *
 * 默认音源 = 随小程序打包的示范音频（data/audio-map.js + audios/ 目录）。
 * 这样做的原因：微信官方的「微信同声传译」插件只对非个人主体开放，
 * 个人主体小程序添加不了（会报"没有权限"），所以示范朗读不能依赖插件。
 *
 * 三种音源，按 config.TTS_SOURCE 选择：
 *   'bundle' —— 随包音频（默认）。零依赖、离线可用、音质稳定。
 *   'plugin' —— 微信同声传译插件的 textToSpeech（仅企业等非个人主体）。
 *   'none'   —— 关闭示范朗读（页面会隐藏"听示范"按钮）。
 */
const config = require('../config.js');
const audioMap = require('../data/audio-map.js');
const audio = require('./audio.js');
const textUtil = require('./text.js');

let plugin = null;
let pluginTried = false;
let pluginOK = false;

const pluginCache = {}; // text -> tempFilePath

/* ---------------- 工具 ---------------- */

/** 文本归一化：统一放在 utils/text.js，保证和时长表用的是同一套规则 */
const normKey = textUtil.normKey;

/** 该句子/单词有没有随包音频 */
function hasAudio(text) {
  const k = normKey(text);
  return !!(k && audioMap[k]);
}

function audioPath(text) {
  const k = normKey(text);
  return (k && audioMap[k]) || '';
}

/* ---------------- 插件（仅非个人主体可用，默认关闭） ---------------- */

function ensurePlugin() {
  if (pluginTried) return pluginOK;
  pluginTried = true;
  if (config.TTS_SOURCE !== 'plugin') {
    pluginOK = false;
    return pluginOK;
  }
  try {
    plugin = requirePlugin('WechatSI');
    pluginOK = !!(plugin && plugin.textToSpeech);
  } catch (e) {
    console.warn('[tts] WechatSI 插件不可用（个人主体无法添加该插件）：', e);
    pluginOK = false;
  }
  return pluginOK;
}

/* ---------------- 播放 ---------------- */

/**
 * 播放一段音频（随包文件、录音临时文件或网络 URL）
 * 具体播放细节（绝对路径、静音键、错误上报）都交给 utils/audio.js
 * @param {string} filePath
 * @param {Function} [onEnded]
 * @param {Function} [onError]
 * @param {number}   [rate] 播放速度，0.7 = 慢速示范
 * @param {object}   [extra] { onProgress(curMs, durMs) } 播放进度回调，用于逐词高亮
 */
function playFile(filePath, onEnded, onError, rate, extra) {
  const opts = { onEnded: onEnded, onError: onError, rate: rate };
  if (extra && extra.onProgress) opts.onProgress = extra.onProgress;
  return audio.play(filePath, opts);
}

/**
 * 朗读示范（播放当前句子的示范音频）
 * @param {string} text 英文句子或单词
 * @param {object} [opts] { onEnded, onError, useCache, rate }
 * @returns {Promise<string>} 实际播放的音频路径
 */
function speak(text, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    const content = String(text || '').trim();
    if (!content) {
      reject(new Error('TTS_EMPTY_TEXT'));
      return;
    }

    // 逐词高亮要靠实时播放进度驱动，把它一路透传给底层播放器
    const extra = { onProgress: opts.onProgress };

    // 1) 随包音频优先
    const bundled = audioPath(content);
    if (bundled) {
      const played = playFile(bundled, opts.onEnded, opts.onError, opts.rate, extra);
      resolve(played);
      return;
    }

    // 2) 兜底：插件 TTS（仅非个人主体）
    if (ensurePlugin()) {
      const cached = opts.useCache === false ? null : pluginCache[content];
      if (cached) {
        const played = playFile(cached, opts.onEnded, opts.onError, opts.rate, extra);
        resolve(played);
        return;
      }
      plugin.textToSpeech({
        lang: config.TTS_LANG,
        tts: true,
        content: content,
        success: function (res) {
          if (res && res.filename) {
            pluginCache[content] = res.filename;
            const played = playFile(res.filename, opts.onEnded, opts.onError, opts.rate, extra);
            resolve(played);
          } else {
            reject(new Error('TTS_EMPTY_RESULT'));
          }
        },
        fail: function (err) {
          reject(err);
        }
      });
      return;
    }

    reject(new Error('TTS_NO_AUDIO'));
  });
}

function isAvailable() {
  if (config.TTS_SOURCE === 'none') return false;
  if (config.TTS_SOURCE === 'bundle') return true;
  return ensurePlugin();
}

function stop() {
  audio.stop();
}

module.exports = {
  isAvailable: isAvailable,
  hasAudio: hasAudio,
  audioPath: audioPath,
  speak: speak,
  stop: stop,
  playFile: playFile,
  normKey: normKey
};
