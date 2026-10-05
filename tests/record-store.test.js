/*
 * 我的录音留存 —— 用假的文件系统 + Storage 跑一遍，验证：
 *   1) 录音能从临时目录转到永久目录并被索引记住
 *   2) 同一句反复录音会覆盖，不会在磁盘上留下一堆孤儿文件
 *   3) 超过上限会按时间删最旧的（防止长期练习把手机空间吃光）
 *   4) 清理能把文件和索引都删干净，不留残余
 *   5) 转存失败（目录不可用 / 拷贝失败）时安静降级，绝不抛异常影响本次跟读
 */
const storage = {};
const disk = {}; // 模拟 wx.env.USER_DATA_PATH 下的永久目录
const tmp = {}; // 模拟临时目录

let fsFail = false;

function size(v) {
  return v && v.data ? String(v.data).length : 0;
}

global.wx = {
  env: { USER_DATA_PATH: 'wxfile://usr' },
  getStorageSync: function (k) {
    return storage[k];
  },
  setStorageSync: function (k, v) {
    storage[k] = JSON.parse(JSON.stringify(v));
  },
  getFileSystemManager: function () {
    return {
      accessSync: function (p) {
        if (disk[p] !== true) throw new Error('no such dir');
      },
      mkdirSync: function (p) {
        if (fsFail) throw new Error('mkdir denied');
        disk[p] = true;
      },
      copyFileSync: function (src, dest) {
        if (fsFail) throw new Error('copy denied');
        if (tmp[src] === undefined) throw new Error('src not found: ' + src);
        disk[dest] = { data: tmp[src].data };
      },
      unlinkSync: function (p) {
        if (disk[p] === undefined) throw new Error('not found');
        delete disk[p];
      },
      rmdirSync: function (p) {
        if (disk[p] !== true) throw new Error('not a dir');
        delete disk[p];
      },
      getFileInfoSync: function (o) {
        return { size: size(disk[o.filePath]) };
      }
    };
  }
};

const base = 'C:/Users/admin/WorkBuddy/小学英语/小学英语朗读小程序/';
const rec = require(base + 'utils/record-store.js');

let fail = 0;
function ok(cond, msg) {
  if (cond) {
    console.log('  ✓ ' + msg);
  } else {
    fail++;
    console.log('  ✗ ' + msg);
  }
}

/* ---------- 1) 基本留存 ---------- */
console.log('[1] 录音转存与索引');
tmp['wxfile://tmp/a.mp3'] = { data: 'x'.repeat(1000) };
const r1 = rec.save('u1-p1-s1', 'wxfile://tmp/a.mp3', 3200);
ok(!!r1, '转存成功并返回记录');
ok(r1 && r1.p.indexOf('/recordings/u1-p1-s1.mp3') > 0, '落在永久目录的 recordings 子目录里');
ok(r1 && r1.d === 3200, '记住了时长（回听时要拿它跑逐词高亮）');
ok(r1 && r1.s === 1000, '记住了文件大小（报告页要显示占用）');
ok(tmp['wxfile://tmp/a.mp3'] !== undefined, '用的是 copyFile：临时文件还在，本轮回放不受影响');

const got = rec.get('u1-p1-s1');
ok(got && got.p === r1.p, '按句子 id 能取回记录');
ok(rec.get('u1-p1-s9') === null, '没录过的句子返回 null（页面据此隐藏按钮）');
ok(rec.count() === 1, '条数统计正确');

/* ---------- 2) 覆盖不堆孤儿 ---------- */
console.log('');
console.log('[2] 同一句反复录音');
const before = Object.keys(disk).length;
tmp['wxfile://tmp/b.mp3'] = { data: 'y'.repeat(2000) };
const r2 = rec.save('u1-p1-s1', 'wxfile://tmp/b.mp3', 2800);
// 文件名按句 id 起，第二次写的是同一个路径，数量不该增加
ok(Object.keys(disk).length === before, '覆盖写同一路径，磁盘上没有多出文件');
ok(r2 && r2.d === 2800, '记录更新为最新一次');
ok(rec.count() === 1, '同一句永远只有一条记录');
ok(rec.totalBytes() === 2000, '占用按最新一条算');

/* ---------- 3) 超限清理 ---------- */
console.log('');
console.log('[3] 超过上限删最旧的');
for (let i = 1; i <= 305; i++) {
  const sid = 'u1-p1-x' + i;
  tmp['wxfile://tmp/' + i + '.mp3'] = { data: 'z'.repeat(10) };
  rec.save(sid, 'wxfile://tmp/' + i + '.mp3', 1000 + i);
}
ok(rec.count() <= rec.MAX_KEEP, '条数被压到上限内（' + rec.count() + ' ≤ ' + rec.MAX_KEEP + '）');
// 最旧的应该已经被删：x1 排在最前面
ok(rec.get('u1-p1-x1') === null, '最旧的录音已被清理');
// 文件也必须一起删掉，不能只删索引留孤儿：
// disk 里除目录标记(true)之外，每个文件都必须能在索引中找到主人
const all = rec._readAll();
const owned = {};
Object.keys(all).forEach(function (k) {
  owned[all[k].p] = true;
});
const orphans = Object.keys(disk).filter(function (k) {
  return disk[k] !== true && !owned[k];
});
ok(orphans.length === 0, '磁盘上没有无主的孤儿文件（' + orphans.length + ' 个）');
ok(rec.get('u1-p1-x305') !== null, '最新录的那条还在');

/* ---------- 4) 单条删除 ---------- */
console.log('');
console.log('[4] 单条删除');
const target = rec.get('u1-p1-x305');
ok(rec.drop('u1-p1-x305') === true, '删除成功');
ok(rec.get('u1-p1-x305') === null, '索引已移除');
ok(disk[target.p] === undefined, '文件已移除');
ok(rec.drop('u1-p1-不存在') === false, '删不存在的句子返回 false，不报错');

/* ---------- 5) 全部清理 ---------- */
console.log('');
console.log('[5] 全部清理');
const n = rec.clearAll();
ok(n > 0, '清理了 ' + n + ' 条');
ok(rec.count() === 0, '索引已清空');
// disk 里应该只剩目录本身
ok(Object.keys(disk).length === 0, '目录也一并删掉，磁盘干净');

/* ---------- 6) 失败降级 ---------- */
console.log('');
console.log('[6] 文件系统不可用时安静降级');
// 这一节是故意让文件操作失败的，把告警咽下去，免得刷屏看着像真报错
const realWarn = console.warn;
console.warn = function () {};
fsFail = true;
let threw = false;
let r3 = null;
try {
  r3 = rec.save('u1-p1-s2', 'wxfile://tmp/missing.mp3', 1000);
} catch (e) {
  threw = true;
}
ok(!threw, '目录建不了也不抛异常（不能因此打断跟读）');
ok(r3 === null, '返回 null，调用方据此跳过');
ok(rec.count() === 0, '没有写进任何脏索引');

fsFail = false;
let threw2 = false;
try {
  rec.save('u1-p1-s3', 'wxfile://tmp/根本不存在的文件.mp3', 1000);
} catch (e) {
  threw2 = true;
}
ok(!threw2, '源文件不存在也不抛异常');
ok(rec.exists('u1-p1-s3') === false, '失败的录音不会被记为存在');
console.warn = realWarn;

console.log('');
if (fail) {
  console.log('✗ ' + fail + ' 项不通过');
  process.exit(1);
} else {
  console.log('✓ 全部通过');
}
