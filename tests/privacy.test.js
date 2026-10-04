/**
 * 录音权限 / 隐私协议回归测试（Node 直接跑，不依赖微信环境）
 *   node tests/privacy.test.js
 *
 * 盯住一个非常隐蔽的真机故障：
 *
 *   小程序后台没有在《用户隐私保护指引》里声明「麦克风」时，
 *   真机上 wx.authorize({scope:'scope.record'}) 会直接 fail：
 *     authorize:fail api scope is not declared in the privacy agreement
 *
 *   这种情况跟「用户自己拒绝过」长得几乎一样，但修法完全不同：
 *     - 后台没声明 → 授权弹窗根本不弹，「去设置」里也找不到录音开关，只能去 mp 后台补声明；
 *     - 用户拒绝过 → 去设置页打开即可。
 *
 *   如果一律提示「去设置」，家长会被带进死胡同，而且完全看不出问题在哪。
 */
const asr = require('../utils/asr.js');

let failed = 0;
function assert(label, cond, extra) {
  const ok = !!cond;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '   → ' + extra));
  if (!ok) failed += 1;
}

const PRIVACY_ERR = {
  errMsg: 'authorize:fail api scope is not declared in the privacy agreement'
};
const DENY_ERR = { errMsg: 'authorize:fail auth deny' };

/* ---------------- 假的 wx 环境 ---------------- */

let modals = [];
let openedSetting = 0;
let authorizeMode = 'success'; // 'success' | 'deny' | 'privacy'
let authorizedAlready = false;
let autoConfirm = true; // 假弹窗要不要自动替用户点按钮

global.wx = {
  getSetting: function (o) {
    o.success({ authSetting: authorizedAlready ? { 'scope.record': true } : {} });
  },
  authorize: function (o) {
    if (authorizeMode === 'success') return o.success();
    if (authorizeMode === 'privacy') return o.fail(PRIVACY_ERR);
    return o.fail(DENY_ERR);
  },
  showModal: function (o) {
    modals.push(o);
    // 只有「单按钮说明窗」会带 complete；带取消按钮的权限窗走 success(confirm/cancel)
    if (o.showCancel === false) {
      if (o.complete) o.complete();
      return;
    }
    if (o.success) o.success({ confirm: autoConfirm });
  },
  openSetting: function (o) {
    openedSetting += 1;
    if (o && o.complete) o.complete();
  }
};

function reset(mode, already, confirm) {
  modals = [];
  openedSetting = 0;
  authorizeMode = mode || 'success';
  authorizedAlready = !!already;
  autoConfirm = confirm !== false;
}

function lastModal() {
  return modals.length ? modals[modals.length - 1] : null;
}

/* ---------------- 1. 错误分类 ---------------- */

console.log('\n[1] isPrivacyIssue：把「后台没声明」和「用户拒绝」分开');
assert('privacy agreement 报错 → 判定为配置问题', asr.isPrivacyIssue(PRIVACY_ERR) === true);
assert(
  'Error 对象里的 privacy 字样也能识别',
  asr.isPrivacyIssue(new Error('api scope is not declared in the privacy agreement')) === true
);
assert('auth deny 报错 → 不是配置问题', asr.isPrivacyIssue(DENY_ERR) === false);
assert('空值 → 不是配置问题', asr.isPrivacyIssue(null) === false);
assert('undefined → 不是配置问题', asr.isPrivacyIssue(undefined) === false);

/* ---------------- 2. 提示语必须能被家长看懂并照做 ---------------- */

console.log('\n[2] explainRecordError：提示要指对路');
const pTip = asr.explainRecordError(PRIVACY_ERR);
assert('隐私问题 → 提到「后台」', /后台/.test(pTip), pTip);
assert('隐私问题 → 提到「麦克风」', /麦克风/.test(pTip), pTip);
assert('隐私问题 → 不误导家长去设置页', !/去设置|设置里/.test(pTip), pTip);

const dTip = asr.explainRecordError(DENY_ERR);
assert('用户拒绝 → 引导到设置页', /设置/.test(dTip), dTip);

assert('取消录音 → 单独一句话', /取消/.test(asr.explainRecordError({ errMsg: 'operateCancel' })));
assert(
  '未知错误 → 有兜底文案，不会露出 undefined',
  typeof asr.explainRecordError({}) === 'string' && !/undefined/.test(asr.explainRecordError({}))
);

/* ---------------- 3. ensureRecordAuth 的分支 ---------------- */

function run(label, mode, already, check, confirm) {
  return new Promise(function (resolve) {
    reset(mode, already, confirm);
    asr.ensureRecordAuth().then(function (ok) {
      check(ok);
      resolve();
    });
  });
}

const chain = Promise.resolve();

chain
  .then(function () {
    return run('已授权', 'success', true, function (ok) {
      console.log('\n[3] ensureRecordAuth 分支');
      assert('已授权 → 直接放行', ok === true);
      assert('已授权 → 不弹任何窗', modals.length === 0);
    });
  })
  .then(function () {
    return run('当场授权', 'success', false, function (ok) {
      assert('授权成功 → resolve(true)', ok === true);
      assert('授权成功 → 不弹任何窗', modals.length === 0);
    });
  })
  .then(function () {
    return run('后台没声明隐私', 'privacy', false, function (ok) {
      assert('隐私问题 → resolve(false)，不继续录音', ok === false);
      const m = lastModal();
      assert('隐私问题 → 弹出提示', !!m);
      assert('隐私问题 → 标题是「录音还不能用」', m && m.title === '录音还不能用', m && m.title);
      assert('隐私问题 → 不给「去设置」按钮', m && m.showCancel === false);
      assert(
        '隐私问题 → 文案里带后台操作路径',
        m && /mp\.weixin\.qq\.com/.test(m.content) && /用户隐私保护指引/.test(m.content),
        m && m.content
      );
      assert('隐私问题 → 绝不去打开设置页（那里没有录音开关）', openedSetting === 0);
    });
  })
  .then(function () {
    return run('用户拒绝过（点去设置）', 'deny', false, function (ok) {
      const m = lastModal();
      assert('用户拒绝 → 弹出权限提示', !!m);
      assert('用户拒绝 → 标题是「需要麦克风权限」', m && m.title === '需要麦克风权限', m && m.title);
      assert('用户拒绝 → 给「去设置」按钮', m && m.confirmText === '去设置');
      assert('用户拒绝 → 家长点确认后真的打开了设置页', openedSetting === 1, openedSetting);
      assert('用户拒绝 → resolve(false)', ok === false);
    });
  })
  .then(function () {
    return run(
      '用户拒绝过（点取消）',
      'deny',
      false,
      function (ok) {
        assert('用户点取消 → 不打开设置页', openedSetting === 0, openedSetting);
        assert('用户点取消 → resolve(false)', ok === false);
      },
      false
    );
  })
  .then(function () {
    console.log('\n[4] showPrivacyHelp：页面在录音失败时兜底复用同一套指引');
    reset('success', true);
    asr.showPrivacyHelp();
    const m = lastModal();
    assert('能弹出指引', !!m);
    assert('文案里带后台操作路径', m && /用户隐私保护指引/.test(m.content));
    assert('文案里提到「麦克风」', m && /麦克风/.test(m.content));
  })
  .then(function () {
    console.log('\n' + (failed === 0 ? '✓ 录音权限与隐私协议提示全部通过' : '✗ 失败 ' + failed + ' 项'));
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(function (e) {
    // 没有这个 catch 的话，中断会表现为「跑了半截就退出、退出码还是 0」，极难排查
    console.error('\n✗ 测试中断：', e && e.stack ? e.stack : e);
    process.exit(1);
  });
