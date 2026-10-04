/**
 * 听写专用清晰音频生成器（Node 编排，不依赖微信环境）
 * ============================================================
 * 两步：
 *   1) node tools/gen-dict-audio.js enum
 *      —— 枚举全部听写题目（41 重点句型 + 94 单词）并分配稳定 id，
 *         写入 dictationAudio/_items.json
 *   2) python tools/gen-dict-audio.py
 *      —— 调百度 TTS（spd=2 慢速 / 22kHz / 32kbps）下载并编码到 dictationAudio/audios/
 *   3) node tools/gen-dict-audio.js map
 *      —— 校验文件后生成 data/dictation-audio-map.js（normKey -> /dictationAudio/audios/<id>.mp3）
 *
 * 为什么要单独一套？
 *   跟读用的 audio-map.js 是 16kHz/24kbps，听写想要更慢更清晰（spd=2 + 更高采样率）。
 *   直接改全局会动到跟读；所以听写单独放分包 dictationAudio，跟读完全不动。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ITEMS = path.join(ROOT, 'dictationAudio', '_items.json');
const MAP = path.join(ROOT, 'data', 'dictation-audio-map.js');
const AUDIO_DIR = path.join(ROOT, 'dictationAudio', 'audios');

const dictData = require('../data/dictation.js'); // { units:[{id,patterns:[{en,...}]}] }
const dictLib = require('../utils/dictation.js'); // resolveSourceId
const lessonsData = require('../data/lessons.js'); // { lessons:[{id,words:[...]}] }
const textUtil = require('../utils/text.js');

function enumItems() {
  const items = [];
  dictData.units.forEach(function (u) {
    u.patterns.forEach(function (p, i) {
      // 和课文原句一致的，复用课文句子 id（文件名沿用 uN-pN-sN），
      // 这样 utils/dictation.js 仍能反推出"这句就是课文第 N 句"并合并错题统计。
      let id = dictLib.resolveSourceId(p.en);
      if (!id) id = u.id + '-d' + (i + 1);
      items.push({ id: id, text: p.en, type: 'pattern' });
    });
    const lesson = (lessonsData.lessons || []).find(function (l) {
      return l.id === u.id;
    });
    (lesson ? lesson.words : []).forEach(function (w, i) {
      items.push({ id: u.id + '-w' + (i + 1), text: w.en, type: 'word' });
    });
  });
  fs.mkdirSync(path.dirname(ITEMS), { recursive: true });
  fs.writeFileSync(ITEMS, JSON.stringify(items, null, 0));
  const pat = items.filter(function (x) { return x.type === 'pattern'; }).length;
  const wrd = items.filter(function (x) { return x.type === 'word'; }).length;
  console.log('枚举完成：' + items.length + ' 题（句型 ' + pat + ' + 单词 ' + wrd + '）-> ' + path.relative(ROOT, ITEMS));
}

function buildMap() {
  if (!fs.existsSync(ITEMS)) {
    console.error('找不到 _items.json，请先跑 enum');
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(ITEMS, 'utf8'));
  const map = {};
  let ok = 0;
  let skip = 0;
  items.forEach(function (it) {
    const file = path.join(AUDIO_DIR, it.id + '.mp3');
    if (!fs.existsSync(file)) {
      skip += 1;
      return;
    }
    const k = textUtil.normKey(it.text);
    map[k] = '/dictationAudio/audios/' + it.id + '.mp3';
    ok += 1;
  });
  const header =
    '// 听写专用清晰音频索引（自动生成，别手改）\n' +
    '// 路径指向分包 dictationAudio/audios/，仅听写页使用；跟读仍用 data/audio-map.js。\n' +
    '// 重新生成：node tools/gen-dict-audio.js enum && python tools/gen-dict-audio.py && node tools/gen-dict-audio.js map\n';
  fs.writeFileSync(MAP, header + 'module.exports = ' + JSON.stringify(map, null, 2) + ';\n');
  if (skip) {
    console.error('有 ' + skip + ' 个音频文件缺失，索引已跳过它们（请先跑 python 生成）');
  }
  console.log('生成索引：' + ok + ' 条成功，' + skip + ' 条跳过 -> ' + path.relative(ROOT, MAP));
  if (skip) process.exit(1);
}

const cmd = process.argv[2];
if (cmd === 'enum') enumItems();
else if (cmd === 'map') buildMap();
else {
  console.log('用法: node tools/gen-dict-audio.js <enum|map>');
  process.exit(1);
}
