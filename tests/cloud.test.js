/**
 * 云函数离线测试（不联网、不需要真实密钥）
 *   node tests/cloud.test.js
 *
 * 覆盖：SCF(函数URL) 与 微信云开发 两种入参形态、口令校验、空数据兜底，
 * 以及 TC3-HMAC-SHA256 签名与腾讯云官方 SDK 的一致性（SDK 只在本地装了才跑）。
 */
const path = require('path');
const cloud = require(path.join(__dirname, '..', 'cloud', 'asr-tencent', 'index.js'));

const OLD = {
  id: process.env.TENCENT_SECRET_ID,
  key: process.env.TENCENT_SECRET_KEY,
  token: process.env.ASR_TOKEN
};

let pass = 0;
let fail = 0;

function assert(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    console.log('  ✗ ' + name + (extra ? '  -> ' + extra : ''));
  }
}

function body(res) {
  if (res && typeof res.body === 'string') {
    try {
      return JSON.parse(res.body);
    } catch (e) {
      return {};
    }
  }
  return res || {};
}

async function run() {
  console.log('— 入参解析（不会真的调用腾讯云）—');
  process.env.TENCENT_SECRET_ID = 'AKIDFAKE';
  process.env.TENCENT_SECRET_KEY = 'FAKEKEY';
  process.env.ASR_TOKEN = 's3cret';

  // 1) SCF（函数URL）：body 是 JSON 字符串
  let r = await cloud.main(
    {
      httpMethod: 'POST',
      requestContext: {},
      headers: { 'x-asr-token': 'wrong' },
      body: JSON.stringify({ audio: 'A'.repeat(200) })
    },
    {}
  );
  assert('SCF 形态 + 错误口令被拦下', body(r).error === 'token 不正确', JSON.stringify(body(r)));

  // 2) SCF：body 是 base64 编码的 JSON
  r = await cloud.main(
    {
      httpMethod: 'POST',
      requestContext: {},
      headers: { 'x-asr-token': 's3cret' },
      isBase64Encoded: true,
      body: Buffer.from(JSON.stringify({ audio: 'A'.repeat(50) }), 'utf8').toString('base64')
    },
    {}
  );
  assert('SCF 形态 + base64 body 能解析出"音频太小"', body(r).error === '没有收到音频数据', JSON.stringify(body(r)));

  // 3) 微信云开发：event 直接就是 { audio }，且返回纯对象
  delete process.env.ASR_TOKEN;
  r = await cloud.main({ audio: 'short' }, {});
  assert('云开发形态 + 空数据兜底', r && r.error === '没有收到音频数据', JSON.stringify(r));
  assert('云开发形态不包 statusCode', r && typeof r.statusCode === 'undefined', JSON.stringify(r));

  // 4) 非法 body
  r = await cloud.main({ body: 'not-json-at-all' }, {});
  assert('非法 body 不会抛异常', body(r).error === '没有收到音频数据', JSON.stringify(body(r)));

  // 5) 缺密钥
  delete process.env.TENCENT_SECRET_ID;
  delete process.env.TENCENT_SECRET_KEY;
  r = await cloud.main({ audio: 'A'.repeat(200) }, {});
  assert('缺密钥时给出明确提示', /未配置/.test(body(r).error || ''), JSON.stringify(body(r)));

  console.log('\n— 签名算法（与腾讯云官方 SDK 对拍）—');
  let sdk = null;
  for (const p of [
    'tencentcloud-sdk-nodejs-common/tencentcloud/common/sign.js',
    '../../node_modules/tencentcloud-sdk-nodejs-common/tencentcloud/common/sign.js'
  ]) {
    try {
      sdk = require(p).default;
      break;
    } catch (e) {}
  }
  if (!sdk) {
    console.log('  · 本地没装官方 SDK，跳过对拍（可选：npm i tencentcloud-sdk-nodejs-asr）');
  } else {
    const payload = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: '16k_en',
      SourceType: 1,
      VoiceFormat: 'mp3',
      Data: 'QUJDREVGR0g=',
      DataLen: 12
    };
    const ts = 1551113065;
    const mine = cloud.buildAuthorization('AKID_TEST', 'KEY_TEST', JSON.stringify(payload), ts, 'SentenceRecognition');
    const theirs = sdk.sign3({
      method: 'POST',
      url: 'https://asr.tencentcloudapi.com/',
      payload: payload,
      timestamp: ts,
      service: 'asr',
      secretId: 'AKID_TEST',
      secretKey: 'KEY_TEST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
    assert('Authorization 与官方 SDK 完全一致', mine === theirs, '\n     mine=' + mine + '\n     sdk =' + theirs);
  }

  // 还原环境
  if (OLD.id) process.env.TENCENT_SECRET_ID = OLD.id;
  if (OLD.key) process.env.TENCENT_SECRET_KEY = OLD.key;
  if (OLD.token) process.env.ASR_TOKEN = OLD.token;

  console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项');
  process.exit(fail ? 1 : 0);
}

run();
