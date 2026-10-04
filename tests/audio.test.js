/**
 * 音频覆盖回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/audio.test.js
 *
 * 校验三件事：
 *   1. lessons.js 里每一句课文、每一个单词，都能在 audio-map.js 里找到随包音频；
 *   2. dictation.js 里每一句听写重点句型也一样（与课文原句相同的会自动复用课文音频）；
 *   3. 索引里每一条都指向真实存在、大小合理、确实是 MP3 的文件
 *      —— 索引指向一个不存在的文件，端上表现就是「点了没声音还不报错」。
 */
const fs = require('fs');
const path = require('path');

const lessons = require('../data/lessons.js');
const dictation = require('../data/dictation.js');
const audioMap = require('../data/audio-map.js');
const dictAudioMap = require('../data/dictation-audio-map.js');
const dictLib = require('../utils/dictation.js');
const tts = require('../utils/tts.js');

const ROOT = path.join(__dirname, '..');

let total = 0;
let missing = [];
let bytes = 0;
const seen = {};

function check(kind, id, text) {
  total += 1;
  const p = tts.audioPath(text);
  if (!p) {
    missing.push(kind + ' ' + id + '  ' + text);
    return;
  }
  if (seen[p]) return;
  seen[p] = true;
  const fp = path.join(ROOT, p);
  if (!fs.existsSync(fp)) {
    missing.push('[文件缺失] ' + p + '  <- ' + text);
    return;
  }
  const size = fs.statSync(fp).size;
  bytes += size;
  if (size < 900) missing.push('[体积异常] ' + p + ' (' + size + 'B)  <- ' + text);
  const fd = fs.openSync(fp, 'r');
  const buf = Buffer.alloc(2);
  fs.readSync(fd, buf, 0, 2, 0);
  fs.closeSync(fd);
  const isMp3Frame = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  const isId3 = buf.toString('latin1', 0, 2) === 'ID';
  if (!isMp3Frame && !isId3) missing.push('[不是MP3] ' + p + '  <- ' + text);
}

lessons.lessons.forEach(function (l) {
  l.passages.forEach(function (p) {
    p.sentences.forEach(function (s) {
      check('句子', s.id, s.en);
    });
  });
  l.words.forEach(function (w, i) {
    check('单词', l.id + '-w' + (i + 1), w.en);
  });
});

dictation.units.forEach(function (u) {
  u.patterns.forEach(function (p, i) {
    check('听写句型', u.id + '-d' + (i + 1), p.en);
  });
});

// 听写专用清晰音频（分包 dictationAudio/audios/）覆盖校验：
// 每一道听写题都要有音频、文件存在、且确实取自分包（不能回退到跟读主包音频）。
let dictTotal = 0;
dictLib
  .buildQuestions({ unitId: 'all', type: 'pattern', count: 0, shuffle: false })
  .concat(dictLib.buildQuestions({ unitId: 'all', type: 'word', count: 0, shuffle: false }))
  .forEach(function (q) {
    dictTotal += 1;
    if (!q.audio) {
      missing.push('[听写缺音频] ' + q.type + ' ' + q.en);
      return;
    }
    if (!fs.existsSync(path.join(ROOT, q.audio))) {
      missing.push('[听写音频缺失] ' + q.audio + ' <- ' + q.en);
      return;
    }
    if (q.audio.indexOf('dictationAudio/audios/') < 0) {
      missing.push('[听写音频未在分包] ' + q.audio + ' <- ' + q.en);
    }
  });

// 反向检查：索引里的每一条都要能落到真实文件上
Object.keys(audioMap).forEach(function (k) {
  const p = audioMap[k];
  if (!fs.existsSync(path.join(ROOT, p))) {
    missing.push('[索引悬空] "' + k + '" -> ' + p);
  }
});

const keys = Object.keys(audioMap).length;
const dictKeys = Object.keys(dictAudioMap).length;
console.log('课文句子 + 单词 + 听写句型 ：', total);
console.log('音频索引条目（跟读）  ：', keys);
console.log('听写清晰音频索引条目  ：', dictKeys, '（覆盖听写题', dictTotal, '）');
console.log('音频文件数（跟读）    ：', Object.keys(seen).length);
console.log('音频总体积（跟读）    ：', (bytes / 1024).toFixed(1) + ' KB');

if (missing.length) {
  console.log('\n✗ 有问题 ' + missing.length + ' 条：');
  missing.slice(0, 30).forEach(function (m) {
    console.log('   ' + m);
  });
  process.exit(1);
} else {
  console.log('\n✓ 全部命中，可放心打包');
}
