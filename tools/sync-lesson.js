/**
 * sync-lesson.js —— 把跟读页同步到六个单元分包
 *
 * 为什么页面要复制六份：
 * 微信规定「单个分包 ≤ 2MB」，而且分包之间不能互相引用资源。
 * 课文补全成全文后示范音频有 3.7MB，塞不进任何一个包，所以按单元拆成
 * u1..u6 六个分包 —— 跟读页必须和它要用的音频在同一个包里，于是每个单元
 * 分包各放一份页面。附带好处：按需下载，打开 Unit 3 只下 Unit 3 的音频。
 *
 * 六份页面**内容完全相同**，所以只维护一份源码在 tools/lesson-src/
 * （tools 已被 project.config.json 的 packOptions.ignore 排除，不会进包）。
 * 改完页面跑一下：node tools/sync-lesson.js
 *
 * 注意：各分包里页面目录深度相同（uN/pages/lesson/lesson.js），
 * 所以 require('../../../utils/x.js') 这类相对路径不用改。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools', 'lesson-src');
const UNITS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
const FILES = ['lesson.js', 'lesson.json', 'lesson.wxml', 'lesson.wxss'];

let n = 0;
for (const f of FILES) {
  const src = path.join(SRC, f);
  if (!fs.existsSync(src)) {
    console.error('缺少源文件：' + src);
    process.exit(1);
  }
  for (const u of UNITS) {
    const dir = path.join(ROOT, u, 'pages', 'lesson');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, path.join(dir, f));
    n++;
  }
}

// 顺手校验：六份必须字节一致，漏同步会导致某个单元行为不一样，很难查
const base = fs.readFileSync(path.join(SRC, 'lesson.js'));
let diff = 0;
for (const u of UNITS) {
  const got = fs.readFileSync(path.join(ROOT, u, 'pages', 'lesson', 'lesson.js'));
  if (!got.equals(base)) {
    diff++;
    console.error('  ✗ ' + u + ' 的 lesson.js 与源码不一致');
  }
}

console.log('已同步 ' + UNITS.length + ' 个单元分包 × ' + FILES.length + ' 个文件（共 ' + n + ' 个）');
console.log(diff === 0 ? '✓ 六份页面与源码完全一致' : '✗ ' + diff + ' 个单元不一致');
process.exit(diff === 0 ? 0 : 1);
