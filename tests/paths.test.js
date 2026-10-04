/**
 * paths.test.js —— 静态路径体检
 *
 * 血的教训：把 pages/lesson 移进 ReadAloud 分包后，页面里的 require('../../data/lessons.js')
 * 没有跟着加深一层，解析到不存在的 ReadAloud/data/lessons.js → 整个页面 JS 报错 → 白屏。
 * 开发者工具里这种错误只在控制台冒一下，页面本身完全空白，很难一眼看出是路径问题。
 *
 * 这里按微信的模块解析规则（相对路径 = 相对于当前 js 文件所在目录）把三类路径全验一遍：
 *   1) 所有页面 js 里的 require 相对路径，必须能在磁盘上找到
 *   2) 分包页面不得 require 另一个分包里的文件（微信不允许分包互引）
 *   3) app.json 声明的页面，其 .js/.wxml 必须真实存在
 *   4) 主包页面不得直接引用分包内的音频等资源（主包取不到分包资源）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let pass = 0;
let fail = 0;
function ok(msg) {
  pass++;
  console.log('  ✓ ' + msg);
}
function bad(msg) {
  fail++;
  console.log('  ✗ ' + msg);
}
function assert(cond, msg) {
  cond ? ok(msg) : bad(msg);
}

/** 递归收集某目录下所有 .js（跳过 node_modules / .git / 忽略目录） */
function walk(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** 某个绝对路径属于哪个包：'' 表示主包，否则是分包 root 名 */
function pkgOf(abs) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  for (const sp of cfg.subpackages || []) {
    if (rel === sp.root || rel.startsWith(sp.root + '/')) return sp.root;
  }
  return '';
}

/** 抓出文件里所有 require('...') 的相对路径 */
function requirePaths(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1].startsWith('.')) out.push(m[1]);
  }
  return out;
}

console.log('路径体检 —— ' + ROOT);
console.log('');

/* ---------- 1) require 相对路径必须存在 ---------- */
console.log('[1] 页面 require 相对路径');
const pkgRoots = (function () {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  return (cfg.subpackages || []).map(function (s) {
    return s.root;
  });
})();

// 只看会被打进包里的页面代码（小程序页面 + utils + data）
const scanDirs = ['pages', 'utils', 'data'].concat(pkgRoots.map((r) => r + '/pages'));
let checked = 0;
let missing = 0;
for (const d of scanDirs) {
  for (const f of walk(path.join(ROOT, d))) {
    for (const p of requirePaths(f)) {
      checked++;
      const abs = path.resolve(path.dirname(f), p);
      const target = /\.js$/.test(abs) ? abs : abs + '.js';
      if (!fs.existsSync(target) && !fs.existsSync(abs)) {
        missing++;
        bad('require 落空：' + path.relative(ROOT, f) + ' → ' + p);
      }
    }
  }
}
if (missing === 0) {
  ok('全部 ' + checked + ' 条 require 相对路径都能解析到真实文件');
}

/* ---------- 2) 分包不得互引 ---------- */
console.log('');
console.log('[2] 分包互引检查');
let cross = 0;
for (const r of pkgRoots) {
  for (const f of walk(path.join(ROOT, r + '/pages'))) {
    const from = pkgOf(f);
    for (const p of requirePaths(f)) {
      const abs = path.resolve(path.dirname(f), p);
      const to = pkgOf(abs);
      // 允许引主包（''），禁止引别的分包
      if (to && to !== from) {
        cross++;
        bad('分包互引：' + path.relative(ROOT, f) + ' → ' + p + '（' + from + ' 引了 ' + to + '）');
      }
    }
  }
}
if (cross === 0) ok(pkgRoots.length + ' 个分包均未跨包引用');

/* ---------- 3) app.json 声明的页面文件必须存在 ---------- */
console.log('');
console.log('[3] app.json 页面声明');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const declared = (cfg.pages || []).slice();
for (const sp of cfg.subpackages || []) {
  for (const p of sp.pages) declared.push(sp.root + '/' + p);
}
let absent = 0;
for (const p of declared) {
  for (const ext of ['.js', '.wxml']) {
    if (!fs.existsSync(path.join(ROOT, p + ext))) {
      absent++;
      bad('页面缺失：' + p + ext);
    }
  }
}
if (absent === 0) ok(declared.length + ' 个已声明页面的 .js/.wxml 齐全');

/* ---------- 4) 主包页面不得引用分包资源 ---------- */
console.log('');
console.log('[4] 主包取不到分包资源');
let leak = 0;
const mainPkgFiles = walk(path.join(ROOT, 'pages')).concat(walk(path.join(ROOT, 'utils')));
for (const f of mainPkgFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach(function (line, i) {
    const t = line.trim();
    // 注释不算
    if (/^(\/\/|\*|\/\*)/.test(t)) return;
    // 守卫代码不算：这一行是在「拦掉」分包路径，不是在用
    if (/indexOf\(|startsWith\(|includes\(|test\(|match\(/.test(line)) return;
    for (const r of pkgRoots) {
      // 跳转页面是合法的（主包可以 navigateTo 分包页面），
      // 只有引用分包里的「非页面资源」才会取不到
      const re = new RegExp('[\'"`/]' + r + '/(?!pages/)', 'g');
      let m;
      while ((m = re.exec(line))) {
        leak++;
        bad(
          '主包引用了分包资源：' +
            path.relative(ROOT, f) +
            ':' +
            (i + 1) +
            ' → ' +
            m[0] +
            '…'
        );
      }
    }
  });
}
if (leak === 0) ok('主包页面/utils 未引用任何分包内的非页面资源');

/* ---------- 汇总 ---------- */
console.log('');
console.log('─'.repeat(46));
if (fail === 0) {
  console.log('全部通过：' + pass + ' 项检查');
  process.exit(0);
} else {
  console.log('失败 ' + fail + ' 项（通过 ' + pass + ' 项）');
  process.exit(1);
}
