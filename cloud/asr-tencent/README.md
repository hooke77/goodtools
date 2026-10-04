# 跟读语音识别云函数（腾讯云一句话识别）

## 这是干嘛的

微信官方的「微信同声传译」插件**不对个人主体小程序开放**（它的服务类目是 `IT科技 > 软件服务提供商`，
个人主体没有这个类目，小程序后台搜不到也添加不了）。所以个人主体的小程序没法用插件做语音识别。

这个云函数就是它的替代品：**收录音 → 调腾讯云识别 → 返回英文文本**，
端上继续用 `utils/score.js` 做词级比对、打分、记错题，功能完全一样。

识别引擎是腾讯云「一句话识别」，**每月 5000 次免费**，够一个孩子天天练。

---

## 先拿密钥（3 分钟）

1. 注册/登录 [腾讯云](https://cloud.tencent.com/)（个人实名认证即可）
2. 进 [语音识别控制台](https://console.cloud.tencent.com/asr) → 点「开通服务」（默认后付费，免费额度自动生效）
3. 进 [访问管理 → API 密钥管理](https://console.cloud.tencent.com/cam/capi) → 新建密钥
4. 记下 **SecretId** 和 **SecretKey**

> ⚠️ 密钥只填在云函数的环境变量里，**千万不要写进小程序代码**（小程序代码能被反编译）。

---

## 部署方式 A：腾讯云函数 SCF + 函数URL（推荐，免费额度大）

1. 打开 [云函数控制台](https://console.cloud.tencent.com/scf) → 新建函数
2. 选择：
   - 创建方式：**从头开始**
   - 函数名称：`asr`
   - 运行环境：**Node.js 16** 或更高
   - 地域：`广州`（和后面 `TENCENT_REGION` 保持一致即可）
3. 把本目录 `index.js` 的内容**整段粘进在线代码编辑器**（零依赖，不用装任何包）
4. 「函数配置」里加环境变量：

   | 变量名 | 值 |
   |---|---|
   | `TENCENT_SECRET_ID` | 你的 SecretId |
   | `TENCENT_SECRET_KEY` | 你的 SecretKey |
   | `TENCENT_REGION` | `ap-guangzhou`（按需改） |
   | `ASR_ENGINE` | `16k_en`（英文；改成 `16k_zh` 就是中文） |
   | `ASR_TOKEN` | 自己编一串随机字符，例如 `hx-2026-asr` |

5. 「触发器管理」→ 新建触发器 → **函数URL**，勾选「启用」，记下分配到的 URL
6. 回到小程序，改 `config.js`：

```js
ASR_MODE: 'cloud',
ASR_TRANSPORT: 'http',
ASR_ENDPOINT: 'https://xxxxxxx.ap-guangzhou.tencentcloudapi.com/',  // 上一步的 URL
ASR_TOKEN: 'hx-2026-asr',                                            // 与云函数一致
```

7. **把域名加进小程序后台的合法域名**：
   登录 [小程序后台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 → 服务器域名 →
   `request 合法域名` 里加上这个 URL 的域名。
   > 开发者工具里调试时，勾选「详情 → 本地设置 → 不校验合法域名」就能先用起来。
   > 但要发布体验版/正式版，必须用**已备案**的域名（函数URL的默认域名通常不能直接备案，
   > 这时建议走下面的方式 B，或者把自己的备案域名 CNAME 到这个函数URL）。

---

## 部署方式 B：微信云开发云函数（不用备案域名，但要开通云开发）

好处：`wx.cloud.callFunction` **不需要配合法域名**，省掉备案这件事。
代价：云开发现在是付费的（基础版约 19.9 元/月）。

1. 小程序后台 → 开发 → 云开发 → 开通环境，记下环境 ID
2. 微信开发者工具里点顶部「云开发」按钮，创建云函数 `asr`，
   把本目录 `index.js` 贴进去（`package.json` 无依赖，直接上传部署）
3. 云函数配置里加同样的环境变量（`TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` / `ASR_TOKEN` …）
4. 改 `config.js`：

```js
ASR_MODE: 'cloud',
ASR_TRANSPORT: 'cloud',
ASR_CLOUD_FUNCTION: 'asr',
ASR_TOKEN: 'hx-2026-asr',
```

5. 小程序代码里 `ASR_TRANSPORT: 'cloud'` 时，`app.js` 会自动调用 `wx.cloud.init()`，不用额外配置

> 云函数默认用 `TENCENT_REGION` 或 `ap-guangzhou`。云开发环境在哪不影响识别，都会走腾讯云 ASR。

---

## 接口约定

**请求**（POST，JSON）

```json
{
  "audio": "<mp3 文件的 base64>",
  "format": "mp3",
  "rate": 16000
}
```

**成功返回**

```json
{ "text": "we moved here to shenzhen yesterday" }
```

**失败返回**（HTTP 仍是 200，靠 error 字段区分）

```json
{ "error": "ASR_API_AuthFailure.SignatureFailure: ..." }
```

小程序端遇到任何失败都会**自动降级为「回放自评」**，孩子刚才读的那一遍不会白读：
`config.js` 里的 `ASR_FALLBACK_TO_SELF` 保持 `true` 即可。

---

## 怎么验证签名没写错

本目录的 TC3-HMAC-SHA256 签名是**手写的、零依赖**的，已和腾讯云官方 SDK 逐字节对拍通过：

```bash
cd 小学英语朗读小程序
npm i tencentcloud-sdk-nodejs-asr        # 只是为了让测试能对拍，不需要打包进小程序
node tests/cloud.test.js
```

看到 `Authorization 与官方 SDK 完全一致` 就说明签名没问题。
如果线上报 `AuthFailure.SignatureFailure`，绝大多数情况是**系统时间不准**或
`TENCENT_REGION` 与函数所在地域不一致，而不是算法问题。

---

## 费用与限额

| 项目 | 额度 |
|---|---|
| 一句话识别 | 每月 5000 次免费 |
| 单次时长 | 最长 60 秒（我们限制录音 12 秒） |
| 超出后 | 约 1.5 元/小时音频（孩子练一年也用不到几块钱） |

在语音识别控制台可以随时看用量，并**关掉后付费**，避免免费额度用完后产生账单。
