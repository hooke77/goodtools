/**
 * 语音识别云函数 —— 腾讯云「一句话识别」
 *
 * 个人主体小程序用不了「微信同声传译」插件（该类目不对个人开放），
 * 这个函数就是它的替代品：把录音丢进来，返回识别出的英文文本，
 * 端上再用 utils/score.js 做词级比对、打分、记错题。
 *
 * 两种部署方式都能直接用这一份代码：
 *   A. 腾讯云函数 SCF + 函数URL   —— 免费额度大，推荐
 *   B. 微信云开发 云函数          —— 不用配合法域名，但要开通云开发
 *
 * 环境变量：
 *   TENCENT_SECRET_ID   必填
 *   TENCENT_SECRET_KEY  必填
 *   TENCENT_REGION      选填，默认 ap-guangzhou
 *   ASR_ENGINE          选填，默认 16k_en（英文）；中文可用 16k_zh
 *   ASR_TOKEN           选填，自定义口令。设了就要求请求带上同样的 token
 *
 * 请求：POST JSON  { "audio": "<base64 的 mp3>", "format": "mp3", "rate": 16000 }
 * 返回：{ "text": "识别出的文本" }  或  { "error": "..." }
 *
 * 安全提醒：SecretKey 只放在云函数的环境变量里，绝对不要写进小程序代码。
 */

const crypto = require('crypto');
const https = require('https');

const HOST = 'asr.tencentcloudapi.com';
const SERVICE = 'asr';
const VERSION = '2019-06-14';
const ACTION = 'SentenceRecognition';

/* ---------------- TC3-HMAC-SHA256 签名（无需装 SDK） ---------------- */

function sha256hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function hmac(key, s) {
  return crypto.createHmac('sha256', key).update(s, 'utf8').digest();
}

function buildAuthorization(secretId, secretKey, payload, timestamp, action) {
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const hashedPayload = sha256hex(payload);
  // 与腾讯云官方 SDK 的 sign3 保持一致：只签 content-type 和 host
  const canonicalHeaders = 'content-type:application/json; charset=utf-8\n' + 'host:' + HOST + '\n';
  const signedHeaders = 'content-type;host';
  const canonicalRequest = ['POST', '/', '', canonicalHeaders, signedHeaders, hashedPayload].join('\n');
  const scope = date + '/' + SERVICE + '/tc3_request';
  const stringToSign = ['TC3-HMAC-SHA256', String(timestamp), scope, sha256hex(canonicalRequest)].join('\n');

  const kDate = hmac('TC3' + secretKey, date);
  const kService = hmac(kDate, SERVICE);
  const kSigning = hmac(kService, 'tc3_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return (
    'TC3-HMAC-SHA256 Credential=' +
    secretId +
    '/' +
    scope +
    ', SignedHeaders=' +
    signedHeaders +
    ', Signature=' +
    signature
  );
}

/* ---------------- 调用腾讯云 ASR ---------------- */

function callAsr(opts) {
  return new Promise(function (resolve, reject) {
    const timestamp = Math.floor(Date.now() / 1000);
    const region = process.env.TENCENT_REGION || 'ap-guangzhou';

    const body = JSON.stringify({
      ProjectId: 0,
      SubServiceType: 2, // 2 = 一句话识别
      EngSerViceType: process.env.ASR_ENGINE || '16k_en',
      SourceType: 1, // 1 = 音频数据直接 base64 传入
      VoiceFormat: opts.format || 'mp3',
      Data: opts.audio,
      DataLen: opts.audio.length
    });

    const req = https.request(
      {
        host: HOST,
        port: 443,
        method: 'POST',
        path: '/',
        headers: {
          Authorization: buildAuthorization(opts.secretId, opts.secretKey, body, timestamp, ACTION),
          'Content-Type': 'application/json; charset=utf-8',
          Host: HOST,
          'X-TC-Action': ACTION,
          'X-TC-Timestamp': String(timestamp),
          'X-TC-Version': VERSION,
          'X-TC-Region': region
        },
        timeout: 15000
      },
      function (res) {
        let raw = '';
        res.on('data', function (c) {
          raw += c;
        });
        res.on('end', function () {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (e) {
            reject(new Error('BAD_UPSTREAM_RESPONSE'));
            return;
          }
          const r = json && json.Response;
          if (!r) {
            reject(new Error('EMPTY_RESPONSE'));
            return;
          }
          if (r.Error) {
            reject(new Error('ASR_API_' + (r.Error.Code || 'ERROR') + ': ' + (r.Error.Message || '')));
            return;
          }
          resolve(r.Result || '');
        });
      }
    );

    req.on('timeout', function () {
      req.destroy(new Error('ASR_TIMEOUT'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/* ---------------- 入参解析：兼容 SCF 与微信云开发 ---------------- */

function parseEvent(event) {
  if (!event) return null;
  // 微信云开发：body 已被解析成对象，直接就是 { audio, format }
  if (typeof event.audio === 'string') return event;

  // SCF + 函数URL / API 网关
  let body = event.body;
  if (body == null) return null;
  if (event.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf8');
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      return null;
    }
  }
  return body;
}

/** 是 HTTP 触发（函数URL / API 网关）还是云开发调用 */
function isHttpEvent(event) {
  return !!(event && (event.httpMethod || event.requestContext || event.rawPath));
}

/** 统一的返回：HTTP 触发要包一层，云开发直接返回对象 */
function responder(event) {
  if (!isHttpEvent(event)) {
    return function (payload) {
      return payload;
    };
  }
  return function (payload) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    };
  };
}

/* ---------------- 入口 ---------------- */

/* 供离线自测交叉验证用（不影响云函数运行） */
exports.buildAuthorization = buildAuthorization;

exports.main = async function (event, context) {
  const ok = responder(event);

  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) {
    return ok({ error: '服务端未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY' });
  }

  const p = parseEvent(event);
  if (!p || typeof p.audio !== 'string' || p.audio.length < 100) {
    return ok({ error: '没有收到音频数据' });
  }

  // 可选口令校验
  const need = process.env.ASR_TOKEN;
  if (need) {
    const got =
      (event && event.headers && (event.headers['x-asr-token'] || event.headers['X-ASR-Token'])) || p.token;
    if (got !== need) return ok({ error: 'token 不正确' });
  }

  // 一句话识别单次上限 60 秒；按 24kbps 估算，200KB 已远超我们 12 秒的录音
  if (p.audio.length > 4 * 1024 * 1024) {
    return ok({ error: '音频太大了' });
  }

  try {
    const text = await callAsr({
      secretId: secretId,
      secretKey: secretKey,
      audio: p.audio,
      format: p.format || 'mp3'
    });
    return ok({ text: text || '' });
  } catch (e) {
    console.error('[asr] 调用失败：', e);
    return ok({ error: String((e && e.message) || e) });
  }
};
