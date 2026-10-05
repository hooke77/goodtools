const lessonData = require('../../../data/lessons.js');
const scoreLib = require('../../../utils/score.js');
const tipsLib = require('../../../utils/tips.js');
const paceLib = require('../../../utils/pace.js');
const storage = require('../../../utils/storage.js');
const tts = require('../../../utils/tts.js');
const asr = require('../../../utils/asr.js');
const config = require('../../../config.js');
const karaoke = require('../../../utils/karaoke.js');
// 孩子上一次的跟读录音（永久留存，跨次可回听，见 utils/record-store.js）
const recordStore = require('../../../utils/record-store.js');

// 慢速示范的倍速（跟读卡壳时用来听清每个词的尾巴）
const SLOW_RATE = 0.7;

// 微信同声传译错误码 → 给孩子看得懂的话
const ASR_ERROR_TEXT = {
  '-30001': '说话时间太短啦，按住多读一会儿',
  '-30002': '没有听清，靠近话筒再读一遍',
  '-30003': '语音识别服务未开通，可先用"自评模式"',
  '-30004': '还没有授权麦克风，请允许使用麦克风',
  '-30005': '网络不太好，检查一下网络再试',
  '-30011': '识别超时，再读一次试试'
};

Page({
  data: {
    lesson: null,
    passages: [],
    passageIndex: 0,
    passage: null,
    sentences: [],
    idx: 0,
    sentence: null,
    sentenceNo: '',
    percent: 0,
    words: [],
    state: 'idle', // idle | demo | recording | result
    partialText: '',
    result: null,
    tips: [],
    demoLines: [],
    wrongWords: [],
    autoNext: true,
    voiceOK: true,
    voiceMode: 'self',
    voiceDesc: '',
    demoOK: true,
    showList: false,
    listRows: [],
    selfJudge: false,
    selfPicking: false,
    selfSelArr: [],
    reviewPath: '',
    reviewPlaying: false,
    reviewDuration: 0,
    // 这一句「上次」的录音（跨次留存）。null = 以前没录过，页面就不显示回听按钮
    prevRecord: null,
    prevPlaying: false,
    pace: null,
    watch: [],
    errorCount: 0,
    // 逐词高亮：此刻正读的那个词的下标，-1 = 没在走
    liveIdx: -1
  },

  onLoad(options) {
    const lessonId = options.lesson || 'u1';
    let lesson = null;
    lessonData.lessons.forEach(function (l) {
      if (l.id === lessonId) lesson = l;
    });
    if (!lesson) lesson = lessonData.lessons[0];
    this.lesson = lesson;
    this.lessonId = lesson.id;

    let pi = parseInt(options.passage, 10);
    if (isNaN(pi) || pi < 0) pi = 0;
    pi = Math.min(pi, lesson.passages.length - 1);

    let si = parseInt(options.sentence, 10);
    if (isNaN(si) || si < 0) si = 0;

    this.practiced = storage.getSentenceScores(lesson.id);

    this.setData({
      lesson: {
        id: lesson.id,
        unit: lesson.unit,
        en: lesson.en,
        cn: lesson.cn,
        theme: lesson.theme
      },
      passages: lesson.passages.map(function (p, i) {
        return { id: p.id, name: p.name, nameCn: p.nameCn, index: i, count: p.sentences.length };
      }),
      voiceOK: asr.isAvailable(),
      voiceMode: asr.getMode(),
      voiceDesc: asr.describeMode(),
      demoOK: tts.isAvailable(),
      autoNext: wx.getStorageSync('auto_next') !== false
    });

    this.switchPassage(pi, si);
    this.refreshErrorCount();

    wx.setNavigationBarTitle({ title: lesson.unit + ' 朗读' });
  },

  onHide() {
    this.cleanVoice();
  },

  onUnload() {
    this.cleanVoice();
    if (this.autoTimer) clearTimeout(this.autoTimer);
  },

  cleanVoice() {
    tts.stop();
    asr.stop();
    asr.stopPlain();
    asr.stopReview();
    if (this._stopBeat) this._stopBeat();
    // 正在回听上次录音时翻页，播放被打断、onEnded 不会来，按钮会卡在 loading，这里收回来
    if (this.data && this.data.prevPlaying) this.setData({ prevPlaying: false });
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  },

  /* ---------------- 内容切换 ---------------- */

  switchPassage(index, sentenceIdx) {
    const p = this.lesson.passages[index];
    if (!p) return;
    this.setData({
      passageIndex: index,
      passage: { id: p.id, name: p.name, nameCn: p.nameCn },
      sentences: p.sentences
    });
    this.goto(sentenceIdx || 0);
  },

  onPassageTap(e) {
    const i = Number(e.currentTarget.dataset.i);
    if (i === this.data.passageIndex) return;
    this.cleanVoice();
    this.switchPassage(i, 0);
  },

  goto(idx) {
    const list = this.data.sentences;
    if (!list.length) return;
    if (idx < 0) idx = 0;
    if (idx > list.length - 1) idx = list.length - 1;
    const s = list[idx];
    // 收尾动作（停播放 / 停录音 / 清定时器）绝不能把翻页带崩：
    // cleanVoice 里任何一步抛异常，下面的 setData 就不会执行，表现为「点了没反应」。
    try {
      this.cleanVoice();
    } catch (e) {
      console.warn('[lesson] 清理播放/录音时出错，已忽略，翻页继续：', e);
    }

    this.setData({
      idx: idx,
      sentence: s,
      sentenceNo: idx + 1 + ' / ' + list.length,
      percent: Math.round(((idx + 1) / list.length) * 100),
      words: this.toPlainWords(s.en),
      result: null,
      tips: [],
      demoLines: [],
      wrongWords: [],
      partialText: '',
      state: 'idle',
      selfJudge: false,
      selfPicking: false,
      selfSelArr: [],
      reviewPath: '',
      reviewPlaying: false,
      reviewDuration: 0,
      // 翻到这句时，把以前留存的录音捞出来给孩子回听（没有就是 null，按钮自动隐藏）
      prevRecord: recordStore.get(s.id),
      prevPlaying: false,
      pace: null,
      // 读之前先预告这句要留意的词（最多两条），比读错再纠正更有效
      watch: paceLib.watchOut(s.en),
      liveIdx: -1
    });

    wx.setStorageSync('last_pos_' + this.lessonId, {
      passage: this.data.passageIndex,
      sentence: idx
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  toPlainWords(en) {
    return String(en || '')
      .split(' ')
      .filter(function (w) {
        return !!w;
      })
      .map(function (w, i) {
        // live 是「正在读」的实时染色，和 cls（评分着色）互不干扰
        return { key: i, word: w, cls: '', live: '' };
      });
  },

  /**
   * 翻到下一句。
   * 这里**不设任何前置条件**：不管有没有读过、读得好不好，随时可以翻。
   * （以前自动翻页卡在"必须达标"上，孩子读不好就卡住走不动；
   *   手动翻页一直是无条件的，现在自动翻页也一并放开。）
   */
  next() {
    if (this.data.idx < this.data.sentences.length - 1) {
      this.goto(this.data.idx + 1);
    } else {
      wx.showToast({ title: '这一段读完啦，很棒！', icon: 'none' });
    }
  },

  prev() {
    if (this.data.idx > 0) this.goto(this.data.idx - 1);
  },

  /**
   * 「自动下一句：开」时安排一次自动翻页。
   * 统一从这里走，好处是：① 只认开关，不再看分数；② 重复调用不会排两趟；
   * ③ goto() 里的 cleanVoice 会顺手把未触发的定时器清掉，切了句就不会再跳一次。
   * @param {number} [delay] 留给孩子看结果的时间（毫秒）
   */
  _maybeAutoNext(delay) {
    if (!this.data.autoNext) return;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    const that = this;
    this.autoTimer = setTimeout(function () {
      that.autoTimer = null;
      that.next();
    }, delay || 900);
  },

  /* ---------------- 逐词高亮（卡拉OK） ---------------- */

  /**
   * 跟着示范音频走的高亮：把真实播放进度换算成"走到了第几个词"。
   * 这里刻意用「比例」而不是绝对毫秒 —— 慢速播放会把总时长整体拉长，
   * 比例不受影响，所以 0.7 倍速时色块会跟着一起慢下来，不会跑到声音前面。
   */
  _demoKaraoke(s) {
    const that = this;
    const words = karaoke.splitWords(s.en);
    const total = karaoke.expectedMs(s.en);
    const arr = karaoke.plan(words, total);
    return function (curMs, durMs) {
      // 个别安卓机型取不到 duration，这时宁可不亮，也别按错的节奏走
      if (!durMs || !isFinite(durMs)) return;
      that._lightAt(karaoke.indexAt(arr, total * Math.min(1, curMs / durMs)));
    };
  },

  /**
   * 点亮第 i 个词。
   * 两处克制：一是「下标没变就什么都不做」，二是用数组下标路径写，
   * 一次只传一两个词过桥。setData 每次都要跨 JS↔原生那道桥，整句十几个词
   * 每几百毫秒全量重传一遍，在中低端安卓上就是实打实的掉帧。
   */
  _lightAt(i) {
    if (i === this.data.liveIdx) return;
    const patch = {};
    const old = this.data.liveIdx;
    if (old >= 0) patch['words[' + old + '].live'] = 'done';
    if (i >= 0) patch['words[' + i + '].live'] = 'reading';
    patch.liveIdx = i;
    this.setData(patch);
  },

  /** 收回全部染色，返回可直接塞进 setData 的补丁 */
  _livePatch() {
    const patch = { liveIdx: -1 };
    (this.data.words || []).forEach(function (x, i) {
      if (x.live) patch['words[' + i + '].live'] = '';
    });
    return patch;
  },

  /**
   * 孩子自己读的时候，替他"打拍子"。
   *
   * ⚠️ 这不是识别：自评模式听不见他此刻读到了哪个词，只能像乐队指挥那样
   * 按示范的节奏把这几个词的先后打出来，让眼睛有东西可以跟着走。
   * 要做到真正"跟着他的声音"走，必须开云端识别（config.ASR_MODE='cloud'），
   * 那是目前没启用的另一条路线。
   */
  _startBeat(totalMs) {
    const s = this.data.sentence;
    if (!s) return;
    this._stopBeat();
    // 孩子读得通常比示范慢一点，留出余量，别让他话还没说完色块就走完了
    const total = Number(totalMs) || karaoke.expectedMs(s.en) * karaoke.SELF_SLOW;
    const arr = karaoke.plan(karaoke.splitWords(s.en), total);
    const t0 = Date.now();
    const that = this;
    that._lightAt(0);
    this.liveTimer = setInterval(function () {
      const ms = Date.now() - t0;
      // 拍子打完就停，别一路亮到下一句去
      if (ms >= total) {
        that._stopBeat();
        return;
      }
      that._lightAt(karaoke.indexAt(arr, ms));
    }, 60);
  },

  _stopBeat() {
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  },

  /* ---------------- 听示范 ---------------- */

  playDemo() {
    const s = this.data.sentence;
    if (!s || this.data.state === 'recording') return;
    const that = this;
    this.setData({ state: 'demo' });
    tts
      .speak(s.en, {
        // 色块跟着真实音频的播放进度走，和示范是一件事，不是两个各自跑的动画
        onProgress: this._demoKaraoke(s),
        onEnded: function () {
          that._finishDemo();
          // 「自动下一句：开」的真正含义：示范读完这一句，就直接进下一句。
          // 不用等孩子读、也不用等打分，可以当整篇的示范连播来听。
          that._maybeAutoNext(900);
        },
        onError: function (err) {
          that._finishDemo();
          that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that._finishDemo();
        const msg = String(err && err.message);
        if (msg === 'TTS_NO_AUDIO') {
          wx.showToast({ title: '这句还没有示范音频', icon: 'none' });
        } else {
          wx.showToast({ title: '播放失败：' + msg, icon: 'none' });
        }
      });
  },

  /** 示范播完（或压根没播出来）的统一收尾：把色块收回去 */
  _finishDemo() {
    this._stopBeat();
    const patch = this._livePatch();
    patch.state = 'idle';
    this.setData(patch);
  },

  /**
   * 播放出问题时给一句能看懂的提示。
   * 以前这里是把错误吞掉的，结果出了毛病页面上一点反馈都没有，只表现为"没声音"。
   */
  reportPlayError(err) {
    const code = err && err.errCode !== undefined ? err.errCode : '';
    console.warn('[lesson] 音频播放失败', err);
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
    console.warn('[lesson] 录音失败', err);
    if (asr.isPrivacyIssue(err)) {
      asr.showPrivacyHelp();
      return;
    }
    wx.showToast({ title: asr.explainRecordError(err), icon: 'none', duration: 3000 });
  },

  /** 慢速示范：0.7 倍速，把每个词的尾巴都听清楚 */
  playSlow() {
    const s = this.data.sentence;
    if (!s || this.data.state === 'recording') return;
    const that = this;
    this.setData({ state: 'demo' });
    tts
      .speak(s.en, {
        rate: SLOW_RATE,
        // 慢速示范同样跟着音频走；进度是按比例的，所以色块会自动同步变慢
        onProgress: this._demoKaraoke(s),
        onEnded: function () {
          that._finishDemo();
          // 慢速也是「示范」，同样遵守自动下一句；晚一点跳，听清尾巴再走
          that._maybeAutoNext(1200);
        },
        onError: function (err) {
          that._finishDemo();
          that.reportPlayError(err);
        }
      })
      .catch(function (err) {
        that._finishDemo();
        wx.showToast({ title: '播放失败：' + (err && err.message), icon: 'none' });
      });
  },

  /* ---------------- 跟读 ---------------- */

  onRecordTap() {
    if (this.data.state === 'recording') {
      this.stopRecord();
    } else {
      this.startRecord();
    }
  },

  startRecord() {
    const that = this;
    const s = this.data.sentence;
    if (!s) return;
    tts.stop();
    asr.stopReview();

    asr.ensureRecordAuth().then(function (ok) {
      if (!ok) return;

      if (asr.getMode() === 'self') {
        // 自评模式：只录音，录完回放，孩子/家长自己判断
        const sid = s.id;
        that.setData({ state: 'recording' });
        // 录的同时色块往前走，让孩子边读边跟着走，读完刚好走完
        that._startBeat();
        asr
          .startPlain()
          .then(function (rec) {
            // 中途切了句子就丢弃这次结果，避免把上一句的录音挂到新句子上
            if (!that.data.sentence || that.data.sentence.id !== sid) return;
            that.enterSelfReview(rec && rec.path, rec && rec.duration);
          })
          .catch(function (err) {
            if (!that.data.sentence || that.data.sentence.id !== sid) return;
            that.setData({ state: 'idle' });
            that.reportRecordError(err);
          });
        return;
      }

      // 自动识别模式（cloud / plugin）
      const sid2 = s.id;
      that.setData({ state: 'recording', partialText: '', result: null });
      that._startBeat();
      asr
        .start({
          duration: config.RECORD_MAX_DURATION,
          onPartial: function (t) {
            if (!that.data.sentence || that.data.sentence.id !== sid2) return;
            that.setData({ partialText: t });
          }
        })
        .then(function (text) {
          if (!that.data.sentence || that.data.sentence.id !== sid2) return;
          that.handleAutoResult(text);
        })
        .catch(function (err) {
          if (!that.data.sentence || that.data.sentence.id !== sid2) return;
          that.handleAsrError(err);
        });
    });
  },

  /** 进入自评面板（识别失败时也会落到这里，录音不浪费） */
  enterSelfReview(path, durationMs) {
    const s = this.data.sentence;

    // 把这遍声音留下，下次进来还能回听。
    // 放在这里而不是评分之后，是因为自评和"云端识别失败降级"两条路都经过它，
    // 只要孩子真读了音就不会漏。失败也无所谓（返回 null），绝不影响这一轮的使用。
    // 注意 UI 上的 prevRecord 不刷新 —— 它代表"录这一遍之前的那次"，语义才对得上。
    if (s && path) recordStore.save(s.id, path, durationMs);

    // 录完就把拍子收回来，接下来是回放自评或评分着色，两套颜色不能混在一起
    this._stopBeat();
    const patch = this._livePatch();
    Object.assign(patch, {
      state: 'idle',
      reviewPath: path || '',
      reviewDuration: durationMs || 0,
      // 节奏比对：录音时长 vs 示范时长（自评模式下唯一的客观信号）
      pace: s ? paceLib.comparePace(s.en, durationMs) : null,
      selfJudge: true,
      selfPicking: false,
      selfSelArr: [],
      selfSelMap: {}
    });
    this.setData(patch);
  },

  /**
   * 回听这一句「上次」的录音（跨次留存的那条，不是刚录的这遍）。
   * 点开后会同时跑逐词高亮 —— 听着自己的声音看自己在读哪个词，比干听更容易发现问题。
   */
  playPrevRecord() {
    const rec = this.data.prevRecord;
    if (!rec || !rec.p) {
      wx.showToast({ title: '这一句还没有存下的录音', icon: 'none' });
      return;
    }
    const that = this;
    const sid = this.data.sentence && this.data.sentence.id;

    this.setData({ prevPlaying: true });
    this._startBeat(rec.d || 0);

    asr.playReview(
      rec.p,
      function () {
        that._stopBeat();
        that.setData({ prevPlaying: false });
      },
      function () {
        that._stopBeat();
        that.setData({ prevPlaying: false, prevRecord: null });
        // 用户清过微信缓存后，Storage 里留下的路径会变成死链接
        // （看起来有录音，点下去却没声音）。播不出来就顺手把这条记录删掉，
        // 下次进这一句按钮自动消失，不会反复点到一个空按钮。
        if (sid) recordStore.drop(sid);
        wx.showToast({ title: '上次的录音失效了，再读一遍吧', icon: 'none' });
      }
    );
  },

  stopRecord() {
    asr.stop();
  },

  handleAsrError(err) {
    // 云端识别失败：如果还留着录音，就直接降级成"回放自评"，别让孩子白读一遍
    if (config.ASR_FALLBACK_TO_SELF && err && err.audioPath) {
      wx.showToast({ title: '网络识别没成功，改用回放对比', icon: 'none' });
      this.enterSelfReview(err.audioPath, err.audioDuration);
      return;
    }
    this.setData({ state: 'idle' });
    const code = err && (err.retcode || err.errCode);
    const msg =
      ASR_ERROR_TEXT[String(code)] ||
      (String(err && err.message).indexOf('ASR_') === 0
        ? '语音识别没成功，先跟着示范读一遍'
        : '没有听清，再读一遍试试');
    wx.showToast({ title: msg, icon: 'none' });
  },

  /** 自动评分：识别文本 vs 课文原文 */
  handleAutoResult(text) {
    const s = this.data.sentence;
    const r = scoreLib.evaluate(s.en, text);
    const t = tipsLib.tipsFor(r.errorWords);
    const wrongWords = this.uniq(r.errorWords);

    const words = r.results.map(function (x, i) {
      return {
        key: i,
        word: x.word,
        cls: x.ok ? 'ok' : x.near ? 'near' : 'bad',
        said: x.said,
        live: ''
      };
    });

    this._stopBeat();
    this.setData({
      state: 'result',
      liveIdx: -1,
      result: {
        score: r.score,
        level: r.level,
        levelText: r.levelText,
        recognized: r.recognized,
        matchedCount: r.matchedCount,
        totalCount: r.totalCount,
        mode: 'auto'
      },
      words: words,
      wrongWords: wrongWords,
      tips: t.tips,
      demoLines: t.demoLines,
      selfJudge: false
    });

    storage.recordSentenceAttempt({
      lessonId: this.lessonId,
      passageId: this.data.passage.id,
      passageName: this.data.passage.nameCn,
      sentenceId: s.id,
      en: s.en,
      cn: s.cn,
      score: r.score,
      errorWords: wrongWords,
      missedWords: r.missedWords,
      extraWords: r.extraWords
    });

    this.practiced = storage.getSentenceScores(this.lessonId);
    this.refreshErrorCount();

    // 自动下一句只看开关，不看分数。
    // 以前这里要求「得分达标且没漏词」才自动跳，结果孩子读不好就被卡在这一句走不动，
    // 反而失去了"多听几遍、先往下走"的机会。不达标该沉淀错题就沉淀（上面已经记了），
    // 但去留由孩子决定 —— 手动翻页一直是无条件的，自动翻页现在也一样。
    this._maybeAutoNext(1600);
  },

  /* ---------------- 自评模式 ---------------- */

  playReview() {
    if (!this.data.reviewPath) {
      wx.showToast({ title: '还没有录音', icon: 'none' });
      return;
    }
    const that = this;
    this.setData({ reviewPlaying: true });
    // 听自己的录音时，色块按他的录音时长走一遍：哪里读得赶、哪里卡住了看得见
    this._startBeat(this.data.reviewDuration);
    asr.playReview(
      this.data.reviewPath,
      function () {
        const p = that._livePatch();
        p.reviewPlaying = false;
        that.setData(p);
      },
      function (err) {
        const p = that._livePatch();
        p.reviewPlaying = false;
        that.setData(p);
        that.reportPlayError(err);
      }
    );
  },

  /**
   * A/B 对比：先放示范，紧接着放自己的录音。
   * 这是最有效的自评方式 —— 两段连着听，差在哪一下就听出来了。
   */
  compareAB() {
    const s = this.data.sentence;
    if (!s || !this.data.reviewPath) return;
    const that = this;
    this.setData({ state: 'demo', reviewPlaying: true });
    tts
      .speak(s.en, {
        // 示范这一段，色块跟着音频走
        onProgress: this._demoKaraoke(s),
        onEnded: function (err) {
          if (err) {
            // 示范这段就没放出来，直接收尾并提示，不要让孩子干等
            const p = that._livePatch();
            p.state = 'idle';
            p.reviewPlaying = false;
            that.setData(p);
            return;
          }
          // 换自己的录音上场：色块改按他的录音时长从头走一遍，对比才看得出来
          that._stopBeat();
          that._startBeat(that.data.reviewDuration);
          asr.playReview(
            that.data.reviewPath,
            function () {
              const p = that._livePatch();
              p.state = 'idle';
              p.reviewPlaying = false;
              that.setData(p);
            },
            function (e) {
              const p = that._livePatch();
              p.state = 'idle';
              p.reviewPlaying = false;
              that.setData(p);
              that.reportPlayError(e);
            }
          );
        },
        onError: function (err) {
          that.reportPlayError(err);
        }
      })
      .catch(function () {
        that.setData({ state: 'idle', reviewPlaying: false });
        wx.showToast({ title: '示范音频播放失败', icon: 'none' });
      });
  },

  onSelfJudge(e) {
    const ok = String(e.currentTarget.dataset.ok) === '1';
    const s = this.data.sentence;
    if (ok) {
      // 自评通过：不记录任何错词，避免污染错题统计
      this.saveSelfResult(s, 92, [], true);
    } else {
      this.setData({ selfPicking: true });
    }
  },

  onSelfPick(e) {
    if (!this.data.selfPicking) return;
    const w = e.currentTarget.dataset.w;
    const sel = Object.assign({}, this.data.selfSelMap || {});
    if (sel[w]) delete sel[w];
    else sel[w] = true;
    const words = this.data.words.map(function (x) {
      return { key: x.key, word: x.word, cls: sel[x.word] ? 'bad' : '' };
    });
    this.setData({
      selfSelMap: sel,
      selfSelArr: Object.keys(sel),
      words: words
    });
  },

  saveSelfPick() {
    const s = this.data.sentence;
    const errs = this.data.selfSelArr || [];
    const score = errs.length ? Math.max(45, 85 - errs.length * 10) : 60;
    this.saveSelfResult(s, score, errs, false);
  },

  saveSelfResult(s, score, errs, passed) {
    const t = tipsLib.tipsFor(errs);
    let level = 'again';
    let levelText = '再跟着示范读一遍，会更好';
    if (passed) {
      level = 'excellent';
      levelText = '自评通过，读得很棒！';
    } else if (errs.length) {
      level = 'ok';
      levelText = '把这几句难词单独读三遍，再连起来读';
    }

    this.setData({
      state: 'result',
      selfJudge: false,
      selfPicking: false,
      result: {
        score: score,
        level: level,
        levelText: levelText,
        recognized: '（自评模式，没有语音识别）',
        matchedCount: 0,
        totalCount: 0,
        mode: 'self'
      },
      wrongWords: errs,
      tips: t.tips,
      demoLines: t.demoLines
    });

    // 自评模式下同样沉淀错句错词，只是"错词"来自孩子的勾选
    storage.recordSentenceAttempt({
      lessonId: this.lessonId,
      passageId: this.data.passage.id,
      passageName: this.data.passage.nameCn,
      sentenceId: s.id,
      en: s.en,
      cn: s.cn,
      score: score,
      errorWords: errs,
      missedWords: passed ? [] : errs,
      extraWords: []
    });

    this.practiced = storage.getSentenceScores(this.lessonId);
    this.refreshErrorCount();

    // 同样只看开关：自评"还不熟"也照样往下走，错句已经进错题本了，
    // 不必把孩子按在这一句上重读。
    this._maybeAutoNext(1500);
  },

  /* ---------------- 句子列表 ---------------- */

  toggleList() {
    if (!this.data.showList) this.buildListRows();
    this.setData({ showList: !this.data.showList });
  },

  buildListRows() {
    const that = this;
    const rows = this.data.sentences.map(function (s, i) {
      const p = that.practiced[s.id];
      let tag = '';
      let cls = '';
      if (p) {
        if (p.bestScore >= config.EXCELLENT_SCORE) {
          tag = '✔';
          cls = 'ok';
        } else if (p.avgScore && p.avgScore < config.PASS_SCORE) {
          tag = '!';
          cls = 'bad';
        } else {
          tag = '·';
          cls = 'warn';
        }
      }
      return {
        id: s.id,
        i: i,
        en: s.en,
        tag: tag,
        cls: cls,
        active: i === that.data.idx
      };
    });
    this.setData({ listRows: rows });
  },

  goSentence(e) {
    const i = Number(e.currentTarget.dataset.i);
    this.setData({ showList: false });
    this.goto(i);
  },

  closeList() {
    this.setData({ showList: false });
  },

  refreshErrorCount() {
    const errs = storage.getTopErrorSentences(this.lessonId, 99);
    this.setData({ errorCount: errs.length });
  },

  goFirstError() {
    const errs = storage.getTopErrorSentences(this.lessonId, 99);
    if (!errs.length) return;
    const target = errs[0];
    this.setData({ showList: false });
    // 定位到该错句所在段落
    let pi = this.data.passageIndex;
    for (let i = 0; i < this.lesson.passages.length; i++) {
      const p = this.lesson.passages[i];
      const hit = p.sentences.filter(function (s) {
        return s.id === target.id;
      });
      if (hit.length) {
        pi = i;
        break;
      }
    }
    const that = this;
    if (pi !== this.data.passageIndex) {
      this.setData({
        passageIndex: pi,
        passage: (function (p) {
          return { id: p.id, name: p.name, nameCn: p.nameCn };
        })(this.lesson.passages[pi]),
        sentences: this.lesson.passages[pi].sentences
      });
    }
    const list = this.data.sentences;
    let idx = 0;
    list.forEach(function (s, i) {
      if (s.id === target.id) idx = i;
    });
    that.goto(idx);
  },

  toggleAutoNext() {
    const v = !this.data.autoNext;
    wx.setStorageSync('auto_next', v);
    this.setData({ autoNext: v });
    wx.showToast({ title: v ? '已开启自动下一句' : '已关闭自动下一句', icon: 'none' });
  },

  uniq(arr) {
    const seen = {};
    const out = [];
    (arr || []).forEach(function (w) {
      if (!w || seen[w]) return;
      seen[w] = true;
      out.push(w);
    });
    return out;
  },

  onShareAppMessage() {
    return {
      title: this.data.lesson ? this.data.lesson.unit + ' 朗读练习' : '小学英语朗读',
      path: '/pages/index/index'
    };
  }
});
