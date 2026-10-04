/**
 * 听写练习
 * ============================================================
 * 场景：家长给孩子报听写，或孩子自己用。
 *
 * 两种模式（在设置页选）：
 *   纸笔听写 —— 听到就写在纸上，写完整句再点「对答案」自己核对。
 *               这是学校里真实的听写场景，小学生打字慢，默认用这个。
 *   打字听写 —— 直接在输入框里打出来，自动逐词判对错。
 *               拼写错误能精确到哪个字母，还能沉淀成错词。
 *
 * 两者共用同一套题源（data/dictation.js 的重点句型 + 课文核心词），
 * 错题也都写进同一个错题本 —— 报告页和朗读练习共用一份统计。
 */
const dictationLib = require('../../../utils/dictation.js');
const storage = require('../../../utils/storage.js');
const tts = require('../../../utils/tts.js');

const SLOW_RATE = 0.8;
const MODE_PAPER = 'paper';
const MODE_TYPE = 'type';
const TYPE_PATTERN = 'pattern';
const TYPE_WORD = 'word';

const COUNT_OPTIONS = [
  { value: 0, label: '全部' },
  { value: 8, label: '8 题' },
  { value: 15, label: '15 题' }
];

Page({
  data: {
    phase: 'setup',

    /* 设置 */
    units: [],
    unitId: 'all',
    type: TYPE_PATTERN,
    count: 8,
    mode: MODE_PAPER,
    countOptions: COUNT_OPTIONS,
    available: 0,
    planned: 0,
    dictStats: { sessions: 0, total: 0, right: 0, rate: 0 },

    /* 答题 */
    questions: [],
    idx: 0,
    q: null,
    revealed: false,
    typed: '',
    checked: null,
    playing: false,
    progress: 0,

    /* 交卷 */
    summary: null,
    wrongList: []
  },

  onLoad() {
    this.results = [];
    this.wrongQuestions = [];
    const units = dictationLib.unitList();
    this.setData({ units: units }, this.refreshSetup);
  },

  onUnload() {
    tts.stop();
  },

  /* ==================== 设置页 ==================== */

  refreshSetup() {
    const d = this.data;
    const available = dictationLib.questionsOf(d.unitId, d.type).length;
    const planned = d.count > 0 ? Math.min(d.count, available) : available;
    this.setData({
      available: available,
      planned: planned,
      dictStats: storage.getDictationSummary()
    });
  },

  pickUnit(e) {
    this.setData({ unitId: e.currentTarget.dataset.id }, this.refreshSetup);
  },

  pickType(e) {
    this.setData({ type: e.currentTarget.dataset.type }, this.refreshSetup);
  },

  pickCount(e) {
    this.setData({ count: Number(e.currentTarget.dataset.v) || 0 }, this.refreshSetup);
  },

  pickMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  switchMode() {
    this.setData({ mode: this.data.mode === MODE_PAPER ? MODE_TYPE : MODE_PAPER });
  },

  /* ==================== 出题 ==================== */

  start() {
    const questions = dictationLib.buildQuestions({
      unitId: this.data.unitId,
      type: this.data.type,
      count: this.data.count
    });
    if (!questions.length) {
      wx.showToast({ title: '这个范围里没有题目', icon: 'none' });
      return;
    }
    this.results = [];
    this.setData(
      {
        phase: 'quiz',
        questions: questions,
        idx: 0,
        q: questions[0],
        revealed: false,
        typed: '',
        checked: null,
        progress: Math.round((1 / questions.length) * 100)
      },
      this.playCurrent
    );
  },

  /* ==================== 播放 ==================== */

  playCurrent() {
    this.doPlay(1);
  },

  replay() {
    this.doPlay(1);
  },

  playSlow() {
    this.doPlay(SLOW_RATE);
  },

  doPlay(rate) {
    const q = this.data.q;
    if (!q) return;
    if (!q.audio) {
      wx.showToast({ title: '这条还没有示范音频', icon: 'none' });
      return;
    }
    const that = this;
    this.setData({ playing: true });
    // 直接播题目自带的 q.audio（已指向分包里的听写清晰音频），
    // 不要再走 tts.speak(en) 去查共享索引 —— 那样会拿到跟读的音频。
    tts
      .playFile(q.audio, {
        rate: rate,
        onEnded: function (err) {
          // 中途已经切到下一题了就别再改状态
          if (that.data.q && that.data.q.qid === q.qid) that.setData({ playing: false });
          if (err) that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that.setData({ playing: false });
        that.reportPlayError(err);
      });
  },

  reportPlayError(err) {
    const code = err && err.errCode !== undefined ? err.errCode : '';
    console.warn('[dictation] 音频播放失败', err);
    wx.showToast({
      title: code !== '' ? '播放失败，错误码 ' + code : '播放失败，请检查手机音量 / 静音键',
      icon: 'none',
      duration: 2500
    });
  },

  /* ==================== 纸笔模式 ==================== */

  reveal() {
    tts.stop();
    this.setData({ revealed: true });
  },

  /** 孩子自己判对错：data-ok = "1" | "0" */
  judge(e) {
    const ok = e.currentTarget.dataset.ok === '1';
    this.submit(ok, '');
  },

  /* ==================== 打字模式 ==================== */

  onTyped(e) {
    this.setData({ typed: e.detail.value });
  },

  doCheck() {
    const q = this.data.q;
    if (!q) return;
    tts.stop();
    const typed = String(this.data.typed || '').trim();
    if (!typed) {
      wx.showToast({ title: '还没写呢', icon: 'none' });
      return;
    }
    const r = dictationLib.check(q.en, typed);
    this.setData({ checked: r, revealed: true });
  },

  /** 打字模式下判完点「下一题」 */
  nextFromCheck() {
    const r = this.data.checked;
    this.submit(!!(r && r.correct), this.data.typed, r);
  },

  /* ==================== 记分与推进 ==================== */

  /**
   * 记一次作答。
   * 错题直接写进全局错题本：句型走 recordSentenceAttempt（和朗读共用统计），
   * 单词走 recordWordAttempt。听写不计入「跟读次数 / 平均分」。
   */
  submit(ok, typed, diff) {
    const q = this.data.q;
    if (!q) return;

    const d = diff || {};
    if (q.type === TYPE_WORD) {
      storage.recordWordAttempt(q.lessonId, { en: q.en, cn: q.cn, score: ok ? 100 : 0 });
    } else {
      storage.recordSentenceAttempt({
        lessonId: q.lessonId,
        passageId: q.passageId,
        passageName: q.passageName,
        sentenceId: q.qid,
        en: q.en,
        cn: q.cn,
        score: ok ? 100 : 0,
        errorWords: d.errorWords || [],
        missedWords: d.missedWords || [],
        extraWords: d.extraWords || [],
        source: 'dictation',
        // 纸笔模式没有逐词信息，靠这个标记保证"写错了"一定被记进错题
        hardError: !ok && !(d.errorWords || []).length
      });
    }

    this.results.push({ q: q, ok: ok, typed: typed || '', diffs: d.diffs || [] });
    if (!ok) this.wrongQuestions.push(q);
    this.advance();
  },

  skip() {
    const q = this.data.q;
    if (!q) return;
    this.results.push({ q: q, ok: false, typed: '', skipped: true, diffs: [] });
    this.wrongQuestions.push(q);
    this.advance();
  },

  advance() {
    tts.stop();
    const next = this.data.idx + 1;
    if (next >= this.data.questions.length) {
      this.finish();
      return;
    }
    const qs = this.data.questions;
    this.setData(
      {
        idx: next,
        q: qs[next],
        revealed: false,
        typed: '',
        checked: null,
        progress: Math.round(((next + 1) / qs.length) * 100)
      },
      this.playCurrent
    );
  },

  finish() {
    const total = this.results.length;
    const right = this.results.filter(function (r) {
      return r.ok;
    }).length;
    storage.recordDictationSession({ total: total, right: right });

    const wrongList = this.results
      .filter(function (r) {
        return !r.ok;
      })
      .map(function (r) {
        return {
          en: r.q.en,
          cn: r.q.cn,
          unit: r.q.unit,
          type: r.q.type,
          point: r.q.point || '',
          typed: r.typed || '',
          skipped: !!r.skipped,
          diffs: r.diffs || []
        };
      });

    this.setData({
      phase: 'done',
      summary: {
        total: total,
        right: right,
        wrong: total - right,
        rate: total ? Math.round((right / total) * 100) : 0
      },
      wrongList: wrongList,
      dictStats: storage.getDictationSummary()
    });
  },

  /* ==================== 交卷后 ==================== */

  /** 只把写错的这些再听写一遍 */
  retryWrong() {
    if (!this.wrongQuestions.length) {
      wx.showToast({ title: '全对啦，没有要重练的', icon: 'none' });
      return;
    }
    const list = this.wrongQuestions.slice();
    this.results = [];
    this.wrongQuestions = [];
    this.setData(
      {
        phase: 'quiz',
        questions: list,
        idx: 0,
        q: list[0],
        revealed: false,
        typed: '',
        checked: null,
        progress: Math.round((1 / list.length) * 100)
      },
      this.playCurrent
    );
  },

  backToSetup() {
    tts.stop();
    this.results = [];
    this.wrongQuestions = [];
    this.setData(
      {
        phase: 'setup',
        questions: [],
        idx: 0,
        q: null,
        revealed: false,
        typed: '',
        checked: null,
        summary: null,
        wrongList: []
      },
      this.refreshSetup
    );
  },

  quit() {
    const that = this;
    const done = this.results.length;
    if (!done) {
      this.backToSetup();
      return;
    }
    wx.showModal({
      title: '结束这次听写？',
      content: '已经写了 ' + done + ' 题，中途结束也会把结果记下来。',
      confirmText: '结束',
      success: function (m) {
        if (m.confirm) that.finish();
      }
    });
  },

  openReport() {
    wx.navigateTo({ url: '/pages/report/report' });
  }
});
