/**
 * 我的录音 —— 把孩子的跟读声音留下来，下次进来还能回听
 *
 * 背景：RecorderManager 录完给的是**临时文件**（wxfile://tmp_xxx.mp3），
 * 小程序一退出，临时目录随时可能被系统回收，下次进来录音就没了。
 * 分数、错词、练到哪一句都写在 Storage 里不受影响，唯独「声音本身」留不住。
 *
 * 本模块的做法：把临时录音**复制**到小程序的永久目录（wx.env.USER_DATA_PATH），
 * 再把「哪一句 → 哪个文件」的对应关系写进 Storage。三个容易踩的点：
 *
 *  1. 必须用 copyFile 而不是 saveFile。saveFile 是把临时文件**搬走**，
 *     而这轮页面上的 reviewPath 还指着那个临时路径等着回放，
 *     搬走之后路径立刻失效 →「听我读的」播不出来。复制多占几十 KB，值得。
 *  2. 永久目录首次为空，得先 mkdir（recursive），否则 copyFile 直接失败。
 *  3. 永久目录微信不会替你回收，必须自己管清理，否则手机空间会被慢慢吃光：
 *     - 同一句反复录音 → 覆盖：删掉旧文件再写新的，避免堆积孤儿
 *     - 总条数超过 MAX_KEEP → 按时间删最旧的
 *     - clearAll() 给用户一键清空
 *
 * 另外：Storage 里记的是文件路径，用户清了微信缓存后文件会丢而记录还在。
 * 这类失效不主动扫盘（太贵），而是在**播放失败时**由页面调 drop(sid) 顺手删掉。
 */

const KEY = 'my_records'; // Storage 键
const DIR_NAME = 'recordings'; // 永久目录下的子目录
const MAX_KEEP = 300; // 最多留多少条（约 9MB，够用又不会失控）

function fs() {
  return typeof wx !== 'undefined' && wx.getFileSystemManager ? wx.getFileSystemManager() : null;
}

function rootDir() {
  const base = (typeof wx !== 'undefined' && wx.env && wx.env.USER_DATA_PATH) || '';
  return base + '/' + DIR_NAME;
}

/** 只读 Storage，永远返回一个对象（损坏 / 为空都当空表处理） */
function readAll() {
  try {
    const s = wx.getStorageSync(KEY);
    return s && typeof s === 'object' ? s : {};
  } catch (e) {
    return {};
  }
}

function writeAll(all) {
  try {
    wx.setStorageSync(KEY, all);
  } catch (e) {
    console.warn('[record-store] 写索引失败：', e);
  }
}

/** 确保目录存在；不可用（模拟器太老 / 没权限）时返回 false，调用方会安静跳过 */
function ensureDir() {
  const f = fs();
  if (!f) return false;
  try {
    try {
      f.accessSync(rootDir());
    } catch (e) {
      f.mkdirSync(rootDir(), true);
    }
    return true;
  } catch (e) {
    console.warn('[record-store] 录音目录不可用，本次不留存：', e);
    return false;
  }
}

function fileSize(f, filePath) {
  try {
    if (f.getFileInfoSync) return f.getFileInfoSync({ filePath: filePath }).size || 0;
  } catch (e) {}
  return 0;
}

/** 同步拿到一句的最近一次录音记录；没有返回 null（不校验文件是否还在，靠播放失败兜底） */
function get(sid) {
  if (!sid) return null;
  const r = readAll()[sid];
  return r || null;
}

function exists(sid) {
  return !!get(sid);
}

/**
 * 把一次录音转存为「这句的最新录音」
 * @param {string} sid        句子 id，如 'u1-p1-s1'
 * @param {string} tempPath   RecorderManager 给的临时文件路径
 * @param {number} durationMs 录音时长
 * @returns {object|null} 成功返回记录，失败返回 null（**不影响本次使用**，绝不抛异常）
 */
function save(sid, tempPath, durationMs) {
  if (!sid || !tempPath) return null;
  if (!ensureDir()) return null;

  const f = fs();
  if (!f) return null;

  // 文件名按句 id 起，天然唯一；顺手把非法字符换掉防止边界情况
  const dest = rootDir() + '/' + String(sid).replace(/[^\w-]/g, '_') + '.mp3';
  try {
    f.copyFileSync(tempPath, dest);
  } catch (e) {
    console.warn('[record-store] 录音转存失败：', e);
    return null;
  }

  const all = readAll();
  const old = all[sid];
  // 覆盖同一句的旧录音：先把旧文件删掉，否则永久目录里会留下一堆孤儿
  if (old && old.p && old.p !== dest) {
    try {
      f.unlinkSync(old.p);
    } catch (e) {}
  }

  all[sid] = { p: dest, d: durationMs || 0, s: fileSize(f, dest), t: Date.now() };
  writeAll(all);
  prune();
  return all[sid];
}

/** 条数超限就删最旧的（保证不会因为长期练习把手机空间吃光） */
function prune(maxKeep) {
  const limit = maxKeep || MAX_KEEP;
  const all = readAll();
  const keys = Object.keys(all);
  if (keys.length <= limit) return 0;

  keys.sort(function (a, b) {
    return (all[a].t || 0) - (all[b].t || 0);
  });

  const f = fs();
  let removed = 0;
  const overflow = keys.length - limit;
  for (let i = 0; i < overflow; i++) {
    const it = all[keys[i]];
    if (it && it.p && f) {
      try {
        f.unlinkSync(it.p);
      } catch (e) {}
    }
    delete all[keys[i]];
    removed++;
  }
  writeAll(all);
  return removed;
}

/** 删掉一句的录音（文件 + 索引）。录音失效时页面也调它 */
function drop(sid) {
  const all = readAll();
  const it = all[sid];
  if (!it) return false;
  const f = fs();
  if (it.p && f) {
    try {
      f.unlinkSync(it.p);
    } catch (e) {}
  }
  delete all[sid];
  writeAll(all);
  return true;
}

/** 清空全部录音（报告页「清理我的录音」用） */
function clearAll() {
  const all = readAll();
  const f = fs();
  let n = 0;
  Object.keys(all).forEach(function (k) {
    const it = all[k];
    if (it && it.p && f) {
      try {
        f.unlinkSync(it.p);
      } catch (e) {}
    }
    n++;
  });
  writeAll({});
  try {
    const dir = rootDir();
    if (f) {
      f.accessSync(dir);
      f.rmdirSync(dir, false);
    }
  } catch (e) {}
  return n;
}

function count() {
  return Object.keys(readAll()).length;
}

/** 估算占用（用于提示"我的录音已占 XX MB"） */
function totalBytes() {
  const all = readAll();
  let s = 0;
  Object.keys(all).forEach(function (k) {
    s += all[k].s || 0;
  });
  return s;
}

module.exports = {
  MAX_KEEP: MAX_KEEP,
  get: get,
  exists: exists,
  save: save,
  drop: drop,
  prune: prune,
  clearAll: clearAll,
  count: count,
  totalBytes: totalBytes,
  // 测试用
  _readAll: readAll,
  _rootDir: rootDir,
  _KEY: KEY
};
