const lessonData = require('../../data/lessons.js');
const storage = require('../../utils/storage.js');
const tts = require('../../utils/tts.js');
const dictationLib = require('../../utils/dictation.js');

// 音频自检用的示范句（第一课第一句，肯定有随包音频）
const SELF_TEST_TEXT = 'We moved here to Shenzhen yesterday.';

/** 听写入口那句话：没练过就说清是什么，练过了就报正确率 */
function dictBannerHint() {
  const units = dictationLib.unitList();
  let patterns = 0;
  let words = 0;
  units.forEach(function (u) {
    patterns += u.patternCount;
    words += u.wordCount;
  });
  const d = storage.getDictationSummary();
  if (!d.total) {
    return '重点句型 ' + patterns + ' 句、课本单词 ' + words + ' 个，听一遍写下来';
  }
  return '已听写 ' + d.total + ' 题，总正确率 ' + d.rate + '%';
}

Page({
  data: {
    voiceOK: true,
    voiceMode: 'self',
    stats: { attempts: 0, avgScore: 0, sentenceKinds: 0 },
    list: [],
    todayWord: '',
    dictHint: ''
  },

  onShow() {
    const app = getApp();
    this.setData({
      voiceOK: !!app.globalData.asrReady,
      voiceMode: app.globalData.asrMode || 'self',
      todayWord: this.pickTodayWord(),
      dictHint: dictBannerHint()
    });
    this.refresh();
  },

  refresh() {
    const stats = storage.getGlobalSummary();
    const list = lessonData.lessons.map(function (l) {
      let total = 0;
      l.passages.forEach(function (p) {
        total += p.sentences.length;
      });
      const sum = storage.getLessonSummary(l.id);
      const errs = storage.getTopErrorSentences(l.id, 99);
      return {
        id: l.id,
        unit: l.unit,
        en: l.en,
        cn: l.cn,
        theme: l.theme,
        total: total,
        practiced: sum.sentenceKinds,
        mastered: sum.mastered,
        avgScore: sum.avgScore,
        percent: total ? Math.round((sum.sentenceKinds / total) * 100) : 0,
        errCount: errs.length
      };
    });
    this.setData({ stats: stats, list: list });
  },

  /** 每天换一个"今日热词"，用报告里的高频错词，没有就用单元词表 */
  pickTodayWord() {
    const top = storage.getTopErrorWords(null, 1);
    if (top.length) return top[0].word;
    const l = lessonData.lessons[new Date().getDate() % lessonData.lessons.length];
    const w = l.words[new Date().getDate() % l.words.length];
    return w ? w.en : 'welcome';
  },

  openLesson(e) {
    const id = e.currentTarget.dataset.id;
    // 支持"继续上次练习"：记住上次练到哪一句
    let url = '/pages/lesson/lesson?lesson=' + id;
    try {
      const last = wx.getStorageSync('last_pos_' + id);
      if (last && typeof last.sentence === 'number') {
        url += '&passage=' + (last.passage || 0) + '&sentence=' + last.sentence;
      }
    } catch (err) {}
    wx.navigateTo({ url: url });
  },

  openWords() {
    wx.navigateTo({ url: '/pages/words/words' });
  },

  openDictation() {
    wx.navigateTo({ url: '/dictationAudio/pages/dictation/dictation' });
  },

  openReport() {
    wx.navigateTo({ url: '/pages/report/report' });
  },

  /**
   * 音频自检：播一句示范，成不成直接告诉你。
   * 家长不用去翻课文，点一下就知道是"小程序的问题"还是"手机静音了"。
   */
  audioSelfTest() {
    wx.showLoading({ title: '正在试播…', mask: false });
    let done = false;

    function report(err) {
      if (done) return;
      done = true;
      wx.hideLoading();
      if (!err) {
        wx.showToast({ title: '声音正常', icon: 'success' });
        return;
      }
      const code = err.errCode !== undefined ? err.errCode : '未知';
      wx.showModal({
        title: '没能出声（错误码 ' + code + '）',
        content:
          '请按顺序检查：\n' +
          '1. 手机音量键调大；iPhone 请关掉侧边静音开关；\n' +
          '2. 拔掉蓝牙耳机，确认没连着音箱；\n' +
          '3. 开发者工具：设置 → 通用设置 → 声音，勾上"播放声音"。',
        showCancel: false,
        confirmText: '知道了'
      });
    }

    tts
      .speak(SELF_TEST_TEXT, {
        onEnded: function (err) {
          report(err || null);
        }
      })
      .catch(function (err) {
        report(err || { errCode: 'TTS' });
      });
  },

  showVoiceHelp() {
    wx.showModal({
      title: '当前是「自评打分」模式',
      content:
        '朗读示范用的是随小程序打包的示范音频，点开就能听，不依赖任何插件。\n\n' +
        '跟读打分由孩子/家长对照示范音自己判断，但自评模式也给了两个客观参考：\n' +
        '① 读前预告这句要留意的易错词（比如 -s、-ed 尾音、th 咬舌尖）；\n' +
        '② 读完后比对录音时长与示范时长 —— 读太快几乎一定是有词被吞掉了。\n\n' +
        '想要机器逐词自动打分？个人主体小程序用不了「微信同声传译」插件（该插件的服务类目不对个人开放），' +
        '可以按 README 里的说明部署 cloud/asr-tencent 云函数，然后把 config.js 的 ASR_MODE 改成 cloud。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onShareAppMessage() {
    return {
      title: '小学英语朗读跟读 · 六上（沪教牛津版）',
      path: '/pages/index/index'
    };
  }
});
