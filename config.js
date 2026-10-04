/**
 * 全局配置：集中放可调参数，方便家长 / 老师按孩子情况微调
 */
module.exports = {
  // 朗读示范（TTS）与跟读识别（ASR）的语言
  TTS_LANG: 'en_US',
  ASR_LANG: 'en_US',

  /* ================= 语音能力配置（个人主体小程序请看这里） =================
   *
   * 【为什么不用插件】
   * 「微信同声传译」插件的服务类目是「IT科技 > 软件服务提供商」，
   * 该类目只对 企业 / 个体户 / 媒体 / 政府 等非个人主体开放。
   * 个人主体小程序在后台根本搜不到、也添加不了这个插件（官方社区置顶回复已明确），
   * 所以在 app.json 里写 plugins 会导致「编译失败：没有权限」。
   *
   * 【本项目的解法】
   * ① 朗读示范：不依赖插件，改用随小程序打包的示范音频（audios/ 目录），
   *    个人主体、游客模式、断网都能用（见 utils/tts.js）。
   * ② 跟读识别：默认用 ASR_MODE = 'self'（自评 / 家长评），个人主体零门槛可用；
   *    想要机器自动识别，把 ASR_MODE 改成 'cloud'，并部署 cloud/ 里的云函数即可
   *    （腾讯云一句话识别每月 5000 次免费，个人实名即可开通）。
   * =======================================================================
   */

  // 朗读示范音源：
  //   'bundle' —— 用随包音频（默认，推荐，无网也能听）
  //   'plugin' —— 用「微信同声传译」插件的 TTS（仅非个人主体可用）
  TTS_SOURCE: 'bundle',

  // 跟读识别方式：
  //   'self'   —— 自评 / 家长评（默认，个人主体零门槛，不用任何插件和后端）
  //   'cloud'  —— 录音上传到自己部署的云函数做语音识别（个人主体可用）
  //   'plugin' —— 用「微信同声传译」插件（仅非个人主体可用）
  ASR_MODE: 'self',

  // ASR_MODE = 'cloud' 时的传输方式：
  //   'http'  —— POST 到 ASR_ENDPOINT（腾讯云 SCF 函数URL / 自己的服务器）
  //              注意：正式版需要在后台把域名加进「request 合法域名」（需备案域名）
  //   'cloud' —— 走微信云开发 wx.cloud.callFunction，不需要配合法域名（但要开通云开发）
  ASR_TRANSPORT: 'http',

  // ASR_TRANSPORT = 'http' 时：服务端地址，见 cloud/asr-tencent/README.md
  // 例：'https://your-scf-url.ap-guangzhou.tencentcloudapi.com/'
  ASR_ENDPOINT: '',

  // ASR_TRANSPORT = 'cloud' 时：云函数名（把 cloud/asr-tencent 上传为这个函数）
  ASR_CLOUD_FUNCTION: 'asr',

  // 可选的简单口令（防裸奔刷量），http 通道放在请求头 x-asr-token，cloud 通道放在 data.token
  ASR_TOKEN: '',

  // ASR_MODE 为 cloud / plugin 时，识别失败是否自动降级为自评模式（建议保持 true）
  ASR_FALLBACK_TO_SELF: true,

  // 单次录音最长时长（毫秒），超时自动停止并进入评分
  RECORD_MAX_DURATION: 12000,

  // 打分阈值
  EXCELLENT_SCORE: 90, // ≥90 太棒了
  PASS_SCORE: 80, // ≥80 通过，自动进入下一句
  OK_SCORE: 60, // ≥60 还可以，建议再来一遍

  // 跟读通过后是否自动切到下一句
  AUTO_NEXT: true,

  // 严格模式：词尾 -s / -ed 没读出来也算错（低年级可关掉）
  STRICT_MODE: true,

  // 存储 key 前缀
  STORAGE_KEY: 'read_stats_v2'
};
