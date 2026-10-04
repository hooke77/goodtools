const tts = require('./utils/tts.js');
const asr = require('./utils/asr.js');
const config = require('./config.js');

App({
  globalData: {
    // 朗读示范音频是否就绪（随包音频，正常情况下一直是 true）
    ttsReady: false,
    // 能否自动识别（false = 自评模式）
    asrReady: false,
    // 实际生效的识别通道：'self' | 'cloud' | 'plugin'
    asrMode: 'self',
    version: '1.0.4'
  },

  onLaunch() {
    // 只有在 config.js 里选择了「云开发」通道时才初始化云能力，
    // 没开通云开发的项目不会被这里影响。
    if (config.ASR_MODE === 'cloud' && config.ASR_TRANSPORT === 'cloud' && wx.cloud) {
      try {
        wx.cloud.init({ traceUser: false });
      } catch (e) {
        console.warn('[app] wx.cloud.init 失败，请确认已开通云开发：', e);
      }
    }

    // 【关键】iPhone / iPad 打开侧边静音键时，音频默认完全不出声（录音不受影响），
    // 表现就是「听示范没声音、听我的也没声音」。这里全局关掉静音键跟随。
    // utils/audio.js 里也会对每个播放实例再设一次，双保险。
    if (wx.setInnerAudioOption) {
      try {
        wx.setInnerAudioOption({
          obeyMuteSwitch: false,
          mixWithOther: true,
          speakerOn: true
        });
      } catch (e) {
        console.warn('[app] setInnerAudioOption 失败：', e);
      }
    }

    this.globalData.ttsReady = tts.isAvailable();
    this.globalData.asrMode = asr.getMode();
    this.globalData.asrReady = this.globalData.asrMode !== 'self';

    console.log('[app] 朗读示范音源：随包音频；跟读识别通道：' + this.globalData.asrMode);
    if (!this.globalData.asrReady) {
      console.log(
        '[app] 当前为自评模式（个人主体小程序无法使用「微信同声传译」插件，这是官方主体类型限制）。' +
          '想要机器自动评分，可在 config.js 里把 ASR_MODE 改成 cloud 并部署 cloud/asr-tencent 云函数。'
      );
    }
  },

  /** 供页面查询语音能力（带兜底，避免插件未配置时抛错） */
  checkVoice() {
    return {
      ttsReady: this.globalData.ttsReady,
      asrReady: this.globalData.asrReady,
      asrMode: this.globalData.asrMode
    };
  }
});
