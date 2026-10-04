const lessonData = require('../../data/lessons.js');
const scoreLib = require('../../utils/score.js');
const tipsLib = require('../../utils/tips.js');
const paceLib = require('../../utils/pace.js');
const storage = require('../../utils/storage.js');
const tts = require('../../utils/tts.js');
const asr = require('../../utils/asr.js');
const config = require('../../config.js');

// 慢速示范的倍速（单词更短，慢一点更容易听出尾音）
const SLOW_RATE = 0.7;

Page({
  data: {
    tabs: [],
    lessonId: 'u1',
    words: [],
    current: null,
    state: 'idle', // idle | demo | recording | result
    partialText: '',
    result: null,
    tips: [],
    demoLine: '',
    voiceOK: true,
    selfJudge: false,
    reviewPath: '',
    reviewDuration: 0,
    pace: null,
    stat: { mastered: 0, total: 0 }
  },

  onLoad(options) {
    const lessonId = options.lesson || 'u1';
    this.allLessons = lessonData.lessons;
    this.setData({
      tabs: lessonData.lessons.map(function (l) {
        return { id: l.id, unit: l.unit };
      }),
      voiceOK: asr.isAvailable()
    });
    this.selectLesson(lessonId);
  },

  onHide() {
    tts.stop();
    asr.stop();
    asr.stopPlain();
    asr.stopReview();
  },

  onUnload() {
    this.onHide();
  },

  selectLesson(id) {
    let lesson = null;
    this.allLessons.forEach(function (l) {
      if (l.id === id) lesson = l;
    });
    if (!lesson) lesson = this.allLessons[0];
    this.lesson = lesson;
    this.practiced = storage.getStore().lessons[lesson.id] || { words: {} };
    this.setData({
      lessonId: lesson.id,
      current: null,
      result: null,
      tips: [],
      selfJudge: false,
      reviewPath: '',
      reviewDuration: 0,
      pace: null,
      state: 'idle'
    });
    this.renderWords();
  },

  onTabTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.lessonId) return;
    tts.stop();
    this.selectLesson(id);
  },

  renderWords() {
    const that = this;
    const learned = (this.practiced && this.practiced.words) || {};
    let mastered = 0;
    const words = this.lesson.words.map(function (w, i) {
      const it = learned[w.en];
      let cls = '';
      let tag = '未练';
      if (it) {
        if (it.lastScore >= config.EXCELLENT_SCORE) {
          cls = 'ok';
          tag = it.lastScore + '分';
          mastered += 1;
        } else if (it.lastScore >= config.PASS_SCORE) {
          cls = 'warn';
          tag = it.lastScore + '分';
        } else {
          cls = 'bad';
          tag = it.lastScore + '分';
        }
      }
      return {
        key: i,
        en: w.en,
        ph: w.ph,
        cn: w.cn,
        cls: cls,
        tag: tag
      };
    });
    this.setData({
      words: words,
      stat: { mastered: mastered, total: this.lesson.words.length }
    });
  },

  onWordTap(e) {
    const key = Number(e.currentTarget.dataset.k);
    const w = this.data.words[key];
    tts.stop();
    asr.stopReview();
    this.setData({
      current: w,
      index: key,
      result: null,
      tips: [],
      demoLine: '',
      partialText: '',
      selfJudge: false,
      reviewPath: '',
      reviewDuration: 0,
      pace: null,
      state: 'idle'
    });
  },

  playDemo() {
    const w = this.data.current;
    if (!w || this.data.state === 'recording') return;
    const that = this;
    this.setData({ state: 'demo' });
    tts
      .speak(w.en, {
        onEnded: function () {
          that.setData({ state: 'idle' });
        },
        onError: function (err) {
          that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that.setData({ state: 'idle' });
        wx.showToast({ title: '播放失败：' + (err && err.message), icon: 'none' });
      });
  },

  /** 慢速示范：0.7 倍速，单词短，慢下来更容易听出尾音 */
  playSlow() {
    const w = this.data.current;
    if (!w || this.data.state === 'recording') return;
    const that = this;
    this.setData({ state: 'demo' });
    tts
      .speak(w.en, {
        rate: SLOW_RATE,
        onEnded: function () {
          that.setData({ state: 'idle' });
        },
        onError: function (err) {
          that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that.setData({ state: 'idle' });
        wx.showToast({ title: '播放失败：' + (err && err.message), icon: 'none' });
      });
  },

  /** 播放失败时给出可读提示（之前是静默失败） */
  reportPlayError(err) {
    const code = err && err.errCode !== undefined ? err.errCode : '';
    console.warn('[words] 音频播放失败', err);
    wx.showToast({
      title: code !== '' ? '播放失败，错误码 ' + code : '播放失败，请检查手机音量 / 静音键',
      icon: 'none',
      duration: 2500
    });
  },

  /**
   * 录音失败上报。
   * 「后台没声明麦克风」这类是配置问题，提示步骤多，toast 一闪而过看不清，改用弹窗。
   */
  reportRecordError(err) {
    console.warn('[words] 录音失败', err);
    if (asr.isPrivacyIssue(err)) {
      asr.showPrivacyHelp();
      return;
    }
    wx.showToast({ title: asr.explainRecordError(err), icon: 'none', duration: 3000 });
  },

  onRecordTap() {
    if (this.data.state === 'recording') {
      asr.stop();
      return;
    }
    this.startRecord();
  },

  startRecord() {
    const that = this;
    const w = this.data.current;
    if (!w) return;
    tts.stop();
    asr.stopReview();

    asr.ensureRecordAuth().then(function (ok) {
      if (!ok) return;

      if (asr.getMode() === 'self') {
        that.setData({ state: 'recording', selfJudge: false });
        asr
          .startPlain({ duration: 5000 })
          .then(function (rec) {
            if (!that.data.current || that.data.current.en !== w.en) return;
            that.setData({
              state: 'idle',
              reviewPath: (rec && rec.path) || '',
              reviewDuration: (rec && rec.duration) || 0,
              pace: paceLib.comparePace(w.en, rec && rec.duration),
              selfJudge: true,
              result: null
            });
          })
          .catch(function (err) {
            if (!that.data.current || that.data.current.en !== w.en) return;
            that.setData({ state: 'idle' });
            that.reportRecordError(err);
          });
        return;
      }

      that.setData({ state: 'recording', partialText: '', result: null, selfJudge: false });
      asr
        .start({
          duration: 5000,
          onPartial: function (t) {
            if (!that.data.current || that.data.current.en !== w.en) return;
            that.setData({ partialText: t });
          }
        })
        .then(function (text) {
          if (!that.data.current || that.data.current.en !== w.en) return;
          that.handleResult(text);
        })
        .catch(function (err) {
          if (!that.data.current || that.data.current.en !== w.en) return;
          // 识别失败但手里还有录音 → 降级为回放自评
          if (config.ASR_FALLBACK_TO_SELF && err && err.audioPath) {
            that.setData({
              state: 'idle',
              reviewPath: err.audioPath,
              selfJudge: true
            });
            wx.showToast({ title: '网络识别没成功，改用回放对比', icon: 'none' });
            return;
          }
          that.setData({ state: 'idle' });
          wx.showToast({ title: '没有听清，靠近话筒再读一遍', icon: 'none' });
        });
    });
  },

  /** 自评：听自己的录音 */
  playReview() {
    const that = this;
    if (!this.data.reviewPath) return;
    asr.playReview(
      this.data.reviewPath,
      function () {
        that.setData({ state: 'idle' });
      },
      function (err) {
        that.setData({ state: 'idle' });
        that.reportPlayError(err);
      }
    );
  },

  /** 自评：连着听「示范 → 我的」 */
  compareAB() {
    const that = this;
    const w = this.data.current;
    if (!w || !this.data.reviewPath) return;
    this.setData({ state: 'demo' });
    tts
      .speak(w.en, {
        onEnded: function (err) {
          if (err) {
            that.setData({ state: 'idle' });
            return;
          }
          asr.playReview(
            that.data.reviewPath,
            function () {
              that.setData({ state: 'idle' });
            },
            function (e) {
              that.setData({ state: 'idle' });
              that.reportPlayError(e);
            }
          );
        },
        onError: function (err) {
          that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that.setData({ state: 'idle' });
        wx.showToast({ title: '播放失败：' + (err && err.message), icon: 'none' });
      });
  },

  onSelfJudge(e) {
    const ok = String(e.currentTarget.dataset.ok) === '1';
    this.setData({ selfJudge: false });
    this.saveSelfResult(ok ? 92 : 58);
  },

  handleResult(text) {
    const w = this.data.current;
    const r = scoreLib.evaluate(w.en, text);
    const t = tipsLib.tipsFor(r.errorWords.concat(r.missedWords));
    const tip = tipsLib.tipForWord(w.en);

    this.setData({
      state: 'result',
      result: {
        score: r.score,
        level: r.level,
        levelText: r.levelText,
        recognized: r.recognized,
        mode: 'auto'
      },
      tips: t.tips.length ? t.tips : [tip.tip],
      demoLine: tip.demo
    });

    storage.recordWordAttempt(this.lessonId, {
      en: w.en,
      cn: w.cn,
      score: r.score
    });
    this.practiced = storage.getStore().lessons[this.lessonId] || { words: {} };
    this.renderWords();
  },

  saveSelfResult(score) {
    const w = this.data.current;
    const tip = tipsLib.tipForWord(w.en);
    this.setData({
      state: 'result',
      result: {
        score: score,
        level: score >= 90 ? 'excellent' : 'ok',
        levelText: score >= 90 ? '读得很棒！' : '再跟着示范读三遍',
        recognized: '（自评模式）',
        mode: 'self'
      },
      tips: [tip.tip],
      demoLine: tip.demo
    });
    storage.recordWordAttempt(this.lessonId, { en: w.en, cn: w.cn, score: score });
    this.practiced = storage.getStore().lessons[this.lessonId] || { words: {} };
    this.renderWords();
  },

  nextWord() {
    const i = (this.data.index || 0) + 1;
    if (i >= this.data.words.length) {
      wx.showToast({ title: '这一课单词练完啦！', icon: 'none' });
      return;
    }
    this.setData({
      current: this.data.words[i],
      index: i,
      result: null,
      tips: [],
      demoLine: '',
      selfJudge: false,
      reviewPath: '',
      reviewDuration: 0,
      pace: null
    });
  },

  closeCurrent() {
    tts.stop();
    this.setData({
      current: null,
      result: null,
      tips: [],
      selfJudge: false,
      reviewPath: '',
      reviewDuration: 0,
      pace: null,
      state: 'idle'
    });
  },

  onShareAppMessage() {
    return { title: '单词跟读 · 六上英语', path: '/pages/index/index' };
  }
});
