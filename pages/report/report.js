const lessonData = require('../../data/lessons.js');
const storage = require('../../utils/storage.js');
const config = require('../../config.js');
// 孩子的跟读录音（永久留存，可回听）
const recordStore = require('../../utils/record-store.js');

Page({
  data: {
    tabs: [],
    activeId: 'all',
    voiceMode: '',
    summary: { attempts: 0, avgScore: 0, sentenceKinds: 0, mastered: 0, needWork: 0 },
    errSentences: [],
    errWords: [],
    empty: true,
    updatedText: '',
    // 留存了多少句录音、占多大地方（家长据此决定要不要清）
    recCount: 0,
    recSizeText: ''
  },

  onLoad(options) {
    const tabs = [{ id: 'all', unit: '全部' }].concat(
      lessonData.lessons.map(function (l) {
        return { id: l.id, unit: l.unit };
      })
    );
    this.setData({
      tabs: tabs,
      activeId: options.lesson || 'all'
    });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  onTabTap(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeId: id });
    this.refresh();
  },

  refresh() {
    const id = this.data.activeId;
    const isAll = id === 'all';

    // 概况
    let summary;
    if (isAll) {
      const g = storage.getGlobalSummary();
      summary = {
        attempts: g.attempts,
        avgScore: g.avgScore,
        sentenceKinds: g.sentenceKinds,
        mastered: 0,
        needWork: 0
      };
      lessonData.lessons.forEach(function (l) {
        const s = storage.getLessonSummary(l.id);
        summary.mastered += s.mastered;
        summary.needWork += s.needWork;
      });
    } else {
      const s = storage.getLessonSummary(id);
      summary = {
        attempts: s.attempts,
        avgScore: s.avgScore,
        sentenceKinds: s.sentenceKinds,
        mastered: s.mastered,
        needWork: s.needWork
      };
    }

    // 高频错误句子
    let errSentences = [];
    if (isAll) {
      lessonData.lessons.forEach(function (l) {
        storage.getTopErrorSentences(l.id, 99).forEach(function (item) {
          item.lessonId = l.id;
          item.lessonUnit = l.unit;
          errSentences.push(item);
        });
      });
      errSentences.sort(function (a, b) {
        return b.errorCount - a.errorCount;
      });
      errSentences = errSentences.slice(0, 10);
    } else {
      const unit = this.unitOf(id);
      errSentences = storage.getTopErrorSentences(id, 10).map(function (item) {
        item.lessonId = id;
        item.lessonUnit = unit;
        return item;
      });
    }

    // 高频错误词语
    const wordArr = isAll
      ? storage.getTopErrorWords(null, 12)
      : storage.getTopErrorWords(id, 12);
    let maxTimes = 1;
    wordArr.forEach(function (w) {
      if (w.times > maxTimes) maxTimes = w.times;
    });
    const errWords = wordArr.map(function (w) {
      return {
        word: w.word,
        cn: w.cn || '',
        times: w.times,
        percent: Math.max(6, Math.round((w.times / maxTimes) * 100)),
        crossUnit: w.lessonCount > 1
      };
    });

    // 最近更新时间
    const store = storage.getStore();
    let updatedText = '';
    if (store.updatedAt) {
      const d = new Date(store.updatedAt);
      updatedText =
        d.getMonth() + 1 + '月' + d.getDate() + '日 ' + this.pad(d.getHours()) + ':' + this.pad(d.getMinutes());
    }

    this.setData({
      summary: summary,
      errSentences: errSentences,
      errWords: errWords,
      empty: !errSentences.length && !errWords.length,
      updatedText: updatedText,
      recCount: recordStore.count(),
      recSizeText: (recordStore.totalBytes() / 1048576).toFixed(1)
    });
  },

  pad(n) {
    return n < 10 ? '0' + n : '' + n;
  },

  unitOf(id) {
    let unit = '';
    lessonData.lessons.forEach(function (l) {
      if (l.id === id) unit = l.unit;
    });
    return unit;
  },

  /** 点错句 → 直接跳到那一句重练 */
  goPractice(e) {
    const sid = e.currentTarget.dataset.sid;
    const lessonId = e.currentTarget.dataset.lid;
    const lesson = this.lessonById(lessonId);
    if (!lesson) return;
    let pi = 0;
    let si = 0;
    lesson.passages.forEach(function (p, i) {
      p.sentences.forEach(function (s, j) {
        if (s.id === sid) {
          pi = i;
          si = j;
        }
      });
    });
    wx.navigateTo({
      // 跟读页在所属单元的分包里（u1..u6），按 lessonId 选包
      url:
        '/' + lessonId + '/pages/lesson/lesson?lesson=' + lessonId + '&passage=' + pi + '&sentence=' + si
    });
  },

  lessonById(id) {
    let found = null;
    lessonData.lessons.forEach(function (l) {
      if (l.id === id) found = l;
    });
    return found;
  },

  /** 一键生成"待攻克清单"：把所有错句复制到剪贴板，方便打印或发给老师 */
  copyList() {
    const lines = [];
    lines.push('【英语朗读待攻克清单】' + (this.data.activeId === 'all' ? '全部单元' : this.unitOf(this.data.activeId)));
    this.data.errSentences.forEach(function (s, i) {
      lines.push(i + 1 + '. ' + s.en + '（错 ' + s.errorCount + ' 次）');
      if (s.topWords && s.topWords.length) {
        lines.push('   难词：' + s.topWords.map(function (w) { return w.word; }).join('、'));
      }
    });
    if (this.data.errWords.length) {
      lines.push('高频错词：' + this.data.errWords.map(function (w) { return w.word + '(' + w.times + ')'; }).join('、'));
    }
    wx.setClipboardData({
      data: lines.join('\n'),
      success: function () {
        wx.showToast({ title: '已复制，可粘贴到备忘录', icon: 'none' });
      }
    });
  },

  clearCurrent() {
    const id = this.data.activeId;
    const that = this;
    const isAll = id === 'all';
    wx.showModal({
      title: '确认清空？',
      content: isAll
        ? '将清空全部单元的学习记录和错题数据，且无法恢复。'
        : '将清空 ' + this.unitOf(id) + ' 的学习记录和错题数据。',
      confirmColor: '#ef4b6b',
      success: function (res) {
        if (!res.confirm) return;
        if (isAll) storage.clearAll();
        else storage.clearLesson(id);
        wx.showToast({ title: '已清空', icon: 'none' });
        that.refresh();
      }
    });
  },

  /**
   * 清理留存的跟读录音（只删声音文件，不动学习记录和错题）。
   * 录音存在小程序的永久目录，微信不会替你回收，长期练习会慢慢占空间，
   * 所以给家长一个明确的出口。
   */
  clearMyRecords() {
    const that = this;
    if (!this.data.recCount) {
      wx.showToast({ title: '还没有存下的录音', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '清理我的录音？',
      content:
        '将删除已留存的 ' +
        this.data.recCount +
        ' 句跟读录音（约 ' +
        this.data.recSizeText +
        ' MB），学习记录和错题数据不受影响。',
      confirmColor: '#ef4b6b',
      success: function (res) {
        if (!res.confirm) return;
        const n = recordStore.clearAll();
        wx.showToast({ title: '已清理 ' + n + ' 条录音', icon: 'none' });
        that.refresh();
      }
    });
  },

  /** 错题看完了，直接去听写再巩固一遍 */
  openDictation() {
    wx.navigateTo({ url: '/dictationAudio/pages/dictation/dictation' });
  },

  onShareAppMessage() {
    return { title: '英语朗读错误报告', path: '/pages/index/index' };
  }
});
