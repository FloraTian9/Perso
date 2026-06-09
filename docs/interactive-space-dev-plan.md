# Perso 抖音互动空间版开发计划

> 目标：按当前 `douyin-minigame/` 的产品体验，重构一版可上传到抖音虚拟创作平台「互动空间」的 H5 静态代码包。  
> 约束：互动空间包不运行 Next.js server，也不运行抖音小游戏 `tt` runtime；上传物应是以 `index.html` 为入口的静态 Web 包。

---

## 1. 目标与非目标

### 目标

- 新建独立子项目：`douyin-interactive-space/`
- 不重写视觉布局；优先复用 `douyin-minigame/js/main.js` 的 Canvas 绘制、坐标、状态机与交互逻辑。
- 用 H5 runtime adapter 模拟小游戏 `tt` API，让小游戏版代码在互动空间 H5 容器中运行。
- 输出可 ZIP 上传的静态 H5 包：
  - 根目录必须包含 `index.html`
  - JS/CSS/assets 均为相对路径
  - 不依赖 npm install、Node runtime、Next runtime
- 视觉与流程以 `douyin-minigame/` 为准，而不是当前 Next 网页版：
  - 像素人格选择
  - 参与 / 趣玩模式
  - 圆桌说话区
  - 参与模式用户输入
  - 趣玩模式递纸条
  - 趣玩模式气氛按钮
  - 逐字播放、暂停/继续、结束回放
  - TTS 语音播放
- 后端继续复用 `https://perso.lat` 的 API：
  - `/api/chat`
  - `/api/tts`
- 不走 `/api/sessions/init`，避免互动空间静态包依赖 Supabase session。

### 非目标

- 不直接原样上传 `douyin-minigame/`：
  - `game.js`
  - `game.json`
  - `project.config.json`
  - `tt.createCanvas`
- 不重新手写一套看起来“差不多”的 H5 UI。
- 不直接上传 Next 项目或 `.next/` 产物。
- 不在互动空间包里放任何 API key。
- 第一版不做用户账号、云存档、支付、侧边栏复访。
- 第一版不强依赖抖音小游戏分享能力；互动空间若有独立分享 API，后续再接。

---

## 2. 总体策略：小游戏源码优先，H5 Adapter 适配

为了避免布局、样式和小游戏版不一致，互动空间版采用“小游戏源码优先”的改造方式：

```text
小游戏原代码 main.js
        ↓
轻量改造成可注入 runtime
        ↓
互动空间版提供 browser-tt-adapter.js
        ↓
index.html 加载 adapter + main.js
```

### ZIP 可行性结论

这个方案适合打包成互动空间 ZIP，前提是最终上传包满足静态 Web 结构：

```text
index.html
assets/...
*.js
*.css
```

小游戏源码可以复用，但不能把小游戏工程原样塞进 ZIP。原因：

- 浏览器/互动空间不会识别 `game.js` 作为入口。
- 浏览器不会直接支持小游戏的 `require("./js/main")`。
- 浏览器不会直接支持 `module.exports = {...}`。
- 浏览器没有原生 `tt` 对象。

因此最终 ZIP 里需要的是“构建后的 H5 版本”：

```text
index.html
assets/index-xxxx.js        # 已经把 config/main/adapter 打包好
assets/index-xxxx.css
assets/bg/...
assets/sprites/...
assets/images/...
```

或者不用 hash，也可以：

```text
index.html
js/browser-tt-adapter.js
js/config.js                # H5 版 window.config
js/main.js                  # H5 版 window.PersoMinigame
assets/...
```

推荐第一版用构建工具打包，而不是手工维护 script 顺序：

```text
Vite / Rollup
```

它负责把：

```text
CommonJS 风格 config
小游戏 main.js
H5 adapter
```

变成浏览器可直接执行的静态 JS。

最终上传互动空间的是 `dist/` 的内容，不是 `douyin-interactive-space/` 源码目录。

### 复用内容

直接复用或复制：

- `douyin-minigame/js/main.js`
  - 页面状态机
  - Canvas 绘制
  - 选择页布局
  - 圆桌页布局
  - 递纸条逻辑
  - 气氛按钮逻辑
  - 参与模式输入逻辑
  - 时间轴逻辑
  - TTS 文字同步逻辑
- `douyin-minigame/js/config.js`
- `douyin-minigame/assets/`

### 需要适配的 API

小游戏里 `this.tt = tt`。互动空间 H5 里没有 `tt`，所以提供一个浏览器版 `tt`：

```js
window.tt = createBrowserTtAdapter({
  canvas: document.querySelector("#game"),
  apiBaseUrl: "https://perso.lat"
});
```

adapter 需要实现：

```js
tt.createCanvas()
tt.getSystemInfoSync()
tt.getMenuButtonBoundingClientRect()
tt.createImage()
tt.loadFont()
tt.request()
tt.downloadFile()
tt.createInnerAudioContext()
tt.showKeyboard()
tt.hideKeyboard()
tt.onKeyboardInput()
tt.onKeyboardConfirm()
tt.onKeyboardComplete()
tt.onKeyboardBlur()
tt.onTouchStart()
tt.onTouchMove()
tt.onTouchEnd()
tt.onWheel()
tt.getStorageSync()
tt.setStorageSync()
```

暂不实现或做空实现：

```js
tt.getGameRecorderManager()
tt.shareAppMessage()
tt.saveVideoToPhotosAlbum()
tt.navigateToScene()
```

这些能力与互动空间 H5 容器不一定兼容，第一版只保证核心互动可跑通。

### 为什么不直接上传小游戏包

当前小游戏包入口是：

```text
game.js -> require("./js/main")
game.json
project.config.json
```

互动空间上传项是：

```text
上传 ZIP 包
粘贴 HTML 代码
```

所以不能原样上传小游戏包；但可以让 `index.html` 加载小游戏的 `main.js`，并由 adapter 补齐它需要的 `tt` 能力。

---

## 3. 目录结构

计划新增：

```text
douyin-interactive-space/
├── index.html
├── package.json                 # 仅本地开发/打包使用，不上传运行时依赖
├── vite.config.js               # 可选：用于本地开发和构建
├── src/
│   ├── main.js                  # 从 douyin-minigame/js/main.js 复制或构建注入
│   ├── config.js                # 从 douyin-minigame/js/config.js 复制并按 H5 调整
│   ├── browser-tt-adapter.js    # H5 runtime adapter，模拟 tt API
│   ├── boot.js                  # 创建 adapter 后启动 PersoMinigame
│   └── utils/
│       ├── text.js
│       ├── geometry.js
│       └── parser.js
├── public/
│   └── assets/                  # 从 douyin-minigame/assets 复制/精简
└── dist/                        # 构建输出；打 ZIP 用这个目录内容
```

上传 ZIP 应压缩 `dist/` 内部内容，而不是把 `dist` 文件夹本身作为外层。

正确 ZIP 根目录：

```text
index.html
assets/
main.js 或 assets/*.js
assets/*.css
```

---

## 4. 运行环境差异

### 小游戏版能力

当前 `douyin-minigame/` 依赖：

- `tt.createCanvas`
- `tt.request`
- `tt.downloadFile`
- `tt.createInnerAudioContext`
- `tt.showKeyboard`
- `tt.getGameRecorderManager`
- `tt.shareAppMessage`
- `tt.saveVideoToPhotosAlbum`

### 互动空间 H5 Adapter 替代方案

互动空间版改为：

- Canvas：
  - `document.querySelector("#game")`
  - `canvas.getContext("2d")`
- 网络：
  - `fetch`
  - `ReadableStream` 解析 SSE / JSON Lines
- 音频：
  - `HTMLAudioElement`
  - 必要时用 `AudioContext` 解锁播放
- 输入：
  - DOM overlay input / textarea
  - 或 Canvas 内输入框 + 隐藏 textarea 捕获中文输入
- 录屏分享：
  - 第一版不做真录屏
  - 可保留分享卡 PNG 下载
  - 若平台支持 Web Share / 自有分享 API，再接第二版

---

## 5. 页面与流程

### 4.1 选择人格页

对齐小游戏版：

- 顶部保留 Perso 标题视觉。
- 人格网格：
  - 16 个 MBTI 像素人格
  - 默认选中 `INTJ / ENFP / ISTJ / ESTP`
  - 选择上限 4 个，下限 2 个
  - 小人下方标签遮住头像约 45% 高度，沿用小游戏当前视觉
- 模式：
  - `参与`
  - `趣玩`
- 话题：
  - 预设话题
  - 自由输入
- 开始按钮：
  - 校验 2-4 人格
  - 校验话题非空
  - 敏感话题前端拦截

互动空间版输入实现：

- 使用隐藏 `<textarea>` 处理中文输入法，避免纯 Canvas 输入中文不稳定。
- Canvas 内绘制输入框视觉。
- 输入时同步更新 Canvas。
- Enter 确认，Esc 取消。
- 移动端点击输入框时聚焦隐藏 textarea，弹出系统键盘。

### 4.2 Loading 页

对齐小游戏版：

- 显示选中人格区。
- loading 宽度与人格区一致。
- loading 和人格间距收紧。
- 文案不写解释性使用说明，只显示等待状态。
- 开场生成成功前保持 loading。

接口：

- 参与模式：
  - `POST /api/chat`
  - `mode: "participant"`
  - `opening: true`
- 趣玩模式：
  - `POST /api/chat`
  - `mode: "fun"`
  - `phase: "opening"`
  - 默认生成 3 条开场

### 4.3 圆桌对话页

通用状态：

```js
{
  page: "roundtable",
  mode: "participant" | "fun",
  topic,
  selectedPersonas,
  tableMessages,
  liveMessageIndex,
  liveVisibleChars,
  liveHoldMs,
  activeMessageIndex,
  visibleChars,
  playbackPaused,
  status: "generating" | "waiting" | "done",
  isAtLiveEdge,
  progressDragRatio
}
```

页面布局：

- 顶部保留安全区：
  - H5 用 CSS `env(safe-area-inset-top)`
  - Canvas 内额外留出 24-44px
- 中间主说话人格：
  - 人格 sprite
  - 标签
  - 说话气泡
- 下方听众人格：
  - 当前说话人格不显示在听众行
  - 趣玩模式听众头像可点击递纸条
- 底部控制区：
  - 时间轴
  - 暂停/继续
  - 结束/回放

播放规则：

- 默认处于 live edge。
- 时间轴像直播：
  - 始终对准当前已生成/已播放内容
  - 可向回拖动
  - 不能拖到未来未生成内容
- 当前发言未完成时不切下一条。
- TTS 可用时按音频 currentTime 推动文字。
- TTS 不可用时按加权打字机推进：
  - 中文普通字权重 1
  - 标点权重更高
  - 空格/英文/数字权重更低

### 4.4 参与模式

目标体验：

- AI 人格先开场。
- 用户可随时输入。
- 用户开始输入时：
  - 当前人格继续说完当前这句话
  - 当前句之后的 AI 缓存内容清除
  - 下一个人格不继续说，等待用户提交
- 用户提交后：
  - 用户内容作为说话区当前消息流式展示
  - 用户内容播完后才显示下一个人格思考/回应
  - 后续人格基于用户内容生成

接口：

```json
{
  "topic": "...",
  "mode": "participant",
  "phase": "continuation",
  "personas": ["INTJ", "ENFP"],
  "messages": [...historyBeforeUser],
  "userMessage": "..."
}
```

注意：

- 不走 `/api/sessions/init`
- 不需要 session id
- 前端直接维护本轮 messages

### 4.5 趣玩模式

目标体验：

- 用户是幕后导演。
- 用户选谁，谁就可以说话。
- 递纸条：
  - 可对当前说话人格递
  - 可对听众人格递
  - 打开纸条时清除当前句之后的未来内容
  - 当前人格只说完当前这句话
  - 下一条必须由纸条目标人格说
  - 不允许纸条效果延后到第二条
- 气氛按钮：
  - 更毒舌
  - 说人话
  - 更真诚
  - 更强势
  - 初始不默认选中
  - 点击后清除未来缓存
  - 下一条必须立刻体现气氛
  - 不允许延后到后续人格

接口：

普通续写：

```json
{
  "topic": "...",
  "mode": "fun",
  "phase": "continuation",
  "atmosphere": "sharp" | "plain" | "sincere" | "assertive",
  "personas": [...],
  "messages": [...]
}
```

递纸条：

```json
{
  "topic": "...",
  "mode": "fun",
  "phase": "note",
  "atmosphere": "...",
  "personas": [...],
  "messages": [...],
  "privateNote": {
    "targetPersona": "ENTP",
    "content": "让 TA 说话"
  }
}
```

前端兜底：

- 递纸条返回第一条强制设置为目标人格。
- 如果接口失败，生成 mock note message，不中断演示。
- 气氛续写失败时显示轻提示，不崩页面。

---

## 6. 后端 API 调整

互动空间静态包从抖音域名发起浏览器 `fetch`，不同于小游戏 `tt.request`。因此必须处理 CORS。

### 5.1 `/api/chat` CORS

需要在 `src/app/api/chat/route.ts` 支持：

- `OPTIONS`
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

建议第一版：

```text
Access-Control-Allow-Origin: *
```

上线收紧时再换成互动空间实际 origin。

`POST` 响应也要带 CORS header，包括：

- 成功 SSE 响应
- 错误 JSON 响应

### 5.2 `/api/tts` CORS

需要在 `src/app/api/tts/route.ts` 支持：

- `GET`
- `OPTIONS`
- 音频响应带 CORS header
- 错误 JSON 带 CORS header

否则 H5 Audio 可能无法跨域播放或读取状态。

### 5.3 不使用 session API

互动空间版不调用：

- `/api/sessions/init`
- `/api/sessions/[sessionId]`
- `/api/sessions/[sessionId]/end`

原因：

- 当前部署这条链路依赖 Supabase。
- 互动空间第一版只需要单轮本地状态。
- 避免把 H5 包和网页 session 逻辑耦合。

---

## 7. 资源迁移

从 `douyin-minigame/assets/` 复制：

```text
assets/bg/table-bg.png
assets/images/title.png
assets/images/button.png
assets/images/button-1.png
assets/images/warning-icon.png
assets/images/back.png
assets/images/settings.svg
assets/images/share.png
assets/images/page.svg
assets/images/sound.svg
assets/images/no-sound.svg
assets/images/loading/
assets/sprites/
```

字体：

- 当前小游戏使用 `assets/fonts/VonwaonBitmap-16px.ttf`
- H5 用 `@font-face` 加载
- 字体加载前先用 fallback，加载完成后重绘

资源路径规则：

- 全部使用相对路径：

```text
./assets/...
```

- 不使用 `/assets/...`，避免互动空间部署在子路径时资源 404。

---

## 8. 音频策略

### TTS

Adapter 里把小游戏 TTS 下载/播放转换为：

- `fetch /api/tts?persona=...&text=...`
- 返回音频 Blob
- `URL.createObjectURL(blob)`
- `new Audio(blobUrl)`

缓存：

```js
ttsAudioCache[key] = blobUrl
ttsFailedKeys[key] = true
ttsPrefetchingKeys[key] = true
```

播放同步：

- 音频成功：
  - 用 `audio.currentTime / audio.duration` 推动 `visibleChars`
- 音频失败：
  - 切回打字机
  - 不阻塞对话

移动端自动播放限制：

- 第一次用户点击开始时调用 `audioUnlock()`
- 若被拦截，显示“点击后播放语音”的轻提示

### BGM

第一版建议默认关闭，沿用当前小游戏录制前策略：

```js
DEFAULT_BGM_ENABLED: false
```

原因：

- 互动空间审核/播放环境未知
- 防止噪声影响演示

---

## 9. 分享与导出

互动空间第一版保留：

- 分享卡预览：
  - Canvas 绘制 360x480 或 9:16 卡片
  - 可下载 PNG

暂缓：

- 游戏录屏生成视频
- 抖音系统分享模板
- 保存视频到相册

原因：

- 这些能力在小游戏里依赖 `tt.getGameRecorderManager`
- H5 容器里不一定提供等价 API

若后续确认互动空间提供分享/录屏 API，再做第二阶段。

---

## 10. 打包策略

本地开发：

```bash
cd douyin-interactive-space
npm install
npm run dev
```

构建：

```bash
npm run build
```

产物：

```text
douyin-interactive-space/dist/
├── index.html
├── assets/...
└── ...
```

打包：

```bash
cd douyin-interactive-space/dist
zip -r ../../perso-interactive-space.zip . -x "*.DS_Store"
```

上传：

- 互动空间创建作品
- 竖屏体验
- 上传 `perso-interactive-space.zip`
- 不上传源代码目录
- 不上传 `node_modules`
- 不上传 `.env.local`

---

## 11. 验收清单

### ZIP 验收

- [ ] ZIP 根目录有 `index.html`
- [ ] ZIP 内没有外层 `dist/` 文件夹
- [ ] ZIP 内没有 `node_modules`
- [ ] ZIP 内没有 `.env.local`
- [ ] 所有资源路径为相对路径
- [ ] 本地直接打开 `dist/index.html` 或静态服务器预览可加载资源

### 选择页

- [ ] 顶部安全区不遮挡
- [ ] 16 人格显示完整
- [ ] 选择 2-4 人格规则正确
- [ ] 参与/趣玩切换正确
- [ ] 自由输入可输入中文
- [ ] 滚动正常
- [ ] 开始按钮校验正确

### 参与模式

- [ ] 开场生成成功
- [ ] 当前人格说话文字流式显示
- [ ] 用户输入时当前人格说完当前句
- [ ] 用户提交后用户内容先进入说话区
- [ ] 用户内容播完后下一个人格回应
- [ ] 不出现用户内容重复
- [ ] 不出现用户输入时下一个人格抢话

### 趣玩模式

- [ ] 开场 3 条
- [ ] 递纸条打开后清除未来内容
- [ ] 递纸条提交后下一条就是目标人格
- [ ] 气氛按钮初始无默认选中
- [ ] 气氛点击后下一条立刻体现
- [ ] 气氛/纸条不延后到第二条
- [ ] 等待区小纸条入口位置正确

### 播放与时间轴

- [ ] 播放/暂停可切换
- [ ] 结束后只显示播放/暂停
- [ ] 时间轴默认在最右侧
- [ ] 可往回拉
- [ ] 不可拉到未来内容
- [ ] 当前内容与时间轴对齐

### 音频

- [ ] TTS 可播放
- [ ] 文字速度跟随音频
- [ ] TTS 失败时不阻塞文字
- [ ] BGM 默认关闭

### 后端/CORS

- [ ] `/api/chat` OPTIONS 正常
- [ ] `/api/chat` POST 跨域可用
- [ ] `/api/tts` OPTIONS 正常
- [ ] `/api/tts` GET 跨域可播放
- [ ] 不调用 `/api/sessions/init`

---

## 12. 开发步骤

### Step 1：搭建子项目与 Adapter 壳

- 创建 `douyin-interactive-space/`
- 配置 Vite 或纯静态构建
- 放入 `index.html`
- 添加 `<canvas id="game"></canvas>`
- 实现 `browser-tt-adapter.js`
- 在 `boot.js` 中先挂载 `window.tt`，再启动小游戏 main

### Step 2：迁移资源

- 复制并精简 `douyin-minigame/assets/`
- 确认所有图片路径
- 确认字体加载
- 清理未使用资源，控制 ZIP 大小

### Step 3：复用小游戏 main.js

- 将 `douyin-minigame/js/main.js` 复制到互动空间版
- 最小改动启动方式：
  - 小游戏版结尾 `new PersoMinigame()`
  - H5 版改为允许 `window.PersoMinigame = PersoMinigame`
  - `boot.js` 负责实例化
- 保持绘制函数不改：
  - `drawSelectionContent`
  - `drawRoundtablePage`
  - `drawSpeakerCard`
  - `drawSpeechBubble`
  - `drawParticipantInput`
  - `drawAtmosphereControls`
  - `drawNoteOverlay`

### Step 4：验证选择页

- 复刻人格网格
- 复刻模式按钮
- 复刻话题输入
- 实现滚动与点击命中
- 实现隐藏 textarea 输入

### Step 5：接入 `/api/chat`

- 写 `api.chat(payload)`
- 支持 SSE token / raw 文本解析
- 复用 `parseRoundtableMessages`
- 加 mock fallback

### Step 6：验证圆桌播放状态机

- 迁移消息队列
- 迁移逐字播放
- 迁移 TTS 同步
- 迁移时间轴 seek
- 迁移暂停/继续/结束

### Step 7：验证参与模式

- 开场
- 用户输入
- 输入时冻结未来 AI
- 用户发言流式展示
- 用户后续人格回应

### Step 8：验证趣玩模式

- 开场 3 条
- 气氛按钮
- 递纸条 overlay
- 目标人格强制下一条
- 让 TA 说话快捷入口

### Step 9：接入 TTS Adapter

- `/api/tts` fetch blob
- audio cache
- audio unlock
- 播放同步
- 失败回退

### Step 10：后端加 CORS

- `/api/chat` OPTIONS + CORS headers
- `/api/tts` OPTIONS + CORS headers
- 本地用不同 origin 测试

### Step 11：打包与验收

- `npm run build`
- 检查 `dist/`
- 打 ZIP
- 本地静态服务器预览
- 上传互动空间测试
- 记录问题并回填 changelog

---

## 13. 风险与兜底

### 风险 1：互动空间限制外部 API 请求

表现：

- `fetch https://perso.lat/api/chat` 失败
- CORS 正常但平台拦截

兜底：

- 第一版内置 mock generation，用于展示 UI 流程
- 若平台支持配置 request 域名，则配置 `perso.lat`
- 若平台不支持外部请求，考虑把后端迁到平台支持的云函数/服务

### 风险 2：互动空间 WebView 不支持流式 fetch

表现：

- `response.body.getReader` 不存在

兜底：

- 后端增加非流式模式：

```json
{ "stream": false }
```

- 前端按完整 JSON Lines 渲染

### 风险 3：TTS 跨域或自动播放受限

兜底：

- 用户点击开始时 unlock audio
- TTS 失败不阻塞
- 无声模式照常展示文字

### 风险 4：ZIP 体积过大

兜底：

- 精简未使用 sprite
- 压缩 PNG
- 首版只保留必要音频/图片

### 风险 5：复制 main.js 后小游戏版和互动空间版漂移

表现：

- 小游戏版修了布局，互动空间版忘记同步。

兜底：

- 第一阶段先接受复制，保证速度。
- 第二阶段抽出共享文件：

```text
packages/perso-canvas-core/
```

小游戏版和互动空间版都从同一份 Canvas core 引入。

---

## 14. 完成定义

互动空间版完成的标准：

1. 能上传 ZIP 并打开首屏。
2. 首屏视觉接近小游戏选择页。
3. 参与模式能完整跑通一轮：
   - 选择人格
   - 输入话题
   - 开场
   - 用户发言
   - 人格回应
4. 趣玩模式能完整跑通一轮：
   - 开场
   - 气氛按钮下一条生效
   - 递纸条下一条生效
5. 没有依赖 Next session。
6. API key 不出现在前端包。
7. ZIP 包结构符合互动空间上传要求。
