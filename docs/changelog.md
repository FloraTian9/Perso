# Changelog

> 版本记录。v1 因爬取覆盖不足已作废，不保留历史条目。从 v2 开始重新计数。

---

## Unreleased

- 修复 `douyin-interactive-space/` H5 手机端 TTS 可能静默的问题：在用户触摸/点击时对实际播放 TTS 的 WebAudio context 执行静音 buffer 解锁，并在播放前确保 context 尝试恢复运行。
- 调整 `douyin-interactive-space/` H5 分享视频录制格式：MediaRecorder 优先尝试 `video/mp4`/H.264，只有环境不支持时才退回 WebM，并在 WebM 情况下提示手机可能无法保存到本地。
- 修复 `douyin-interactive-space/` H5 分享视频重复触发的问题：为 Web Share 增加分享中锁和按钮状态，分享面板打开期间不再重复调用 `navigator.share()`，并将 `share() is already in progress` 转成友好提示。
- 调整 `douyin-interactive-space/` H5 演示兜底：浏览器音频链路 `Load failed` 时静默切回文字播放，不再把 TTS 失败文案显示在页面上；开局请求失败并启用 mock 时也不再残留 `Load failed` 前台错误。
- 调整 `douyin-interactive-space/` H5 入口脚本版本参数，避免本地或互动空间预览缓存旧版 `main.js` 导致已修复的 TTS pending 问题仍然复现。
- 增强 `douyin-interactive-space/` H5 TTS 容错：为语音 pending 状态加入 900ms 超时降级，语音请求、下载或解码过慢时自动切回文字流式输出，避免互动空间测试版因音频链路挂起而卡在「思考中」。
- 修复 `douyin-interactive-space/` H5 开局卡在第一个人格「思考中」的问题：WebAudio 语音链路现在会真正发起播放请求，并用 WebAudio 的启动时间/时长判断当前发言是否结束，避免 `ttsPendingKey` 永久挂起导致播放循环不推进。
- 修复 `douyin-interactive-space/` H5 分享视频无反馈的问题：浏览器 adapter 保留宿主可能注入的原生分享/保存能力；H5 MediaRecorder 录制完成后不再异步触发隐藏下载并假装成功，而是保留视频结果，要求用户再次点击「保存/分享」以满足 WebView 分享/下载的用户手势限制，并在不支持时显示明确提示。
- 调整 `douyin-interactive-space/` H5 adapter：`createInnerAudioContext()` 在支持 AudioContext 的 WebView 中改为 WebAudio 实现，彻底避免语音或背景音分支回落到 HTMLAudio 后继续触发 `audio error 4`。
- 调整 `douyin-interactive-space/` H5 TTS 播放策略：互动空间 H5 不再使用 HTMLAudio 播放远程音频，改为 `fetch -> ArrayBuffer -> AudioContext.decodeAudioData -> BufferSource` 的 WebAudio 链路，绕过 WebView `audio error 4` 的媒体源判定；文字流式进度同步改为基于 WebAudio 启动时间计算。
- 修复 Vercel 部署失败：收窄 `/api/tts-mp3/[persona]/speech.mp3` 路由 handler 的 `params` 类型，符合 Next.js 15 route handler 对第二参数的 build 校验。
- 新增 H5 专用 TTS 静态文件形态接口 `/api/tts-mp3/[persona]/speech.mp3`，保留同样的 TTS 合成、CORS、`HEAD/Range` 支持；互动空间 H5 语音 URL 改为 `.mp3` 结尾，规避部分 WebView 对动态 query API 音频源报 `audio error 4` 的兼容问题。
- 调整 `douyin-interactive-space/` 选择人格页顶部布局：H5 互动空间环境下内容起始位置从安全区预留改为更紧凑的 24px，减少顶部空白。
- 增强 `douyin-interactive-space/` H5 音频播放兼容性：在用户触摸时主动解锁 WebView 音频播放权限，H5 Audio 设置 `crossOrigin=anonymous`，并把 media error code/message 透传到页面提示，便于定位测试版语音失败原因。
- 增强 `/api/tts` 音频接口兼容性：新增 `HEAD` 与 `Range` 请求支持，返回 `Accept-Ranges / Content-Length / Content-Range` 等音频播放常用响应头，并允许跨域暴露这些头，提升抖音互动空间 WebView 直接播放 TTS 音频的成功率。
- 调整 `douyin-interactive-space/` H5 语音链路：浏览器 adapter 标记为 H5 环境，TTS 播放跳过 `downloadFile/fetch -> blob`，改为直接播放 `/api/tts` HTTPS 音频 URL，并捕获 `audio.play()` 异步失败，避免测试版因 `load failed` 直接误判整条语音失败。
- 调整 `douyin-interactive-space/` 选择人格页布局：模式区位置改为基于最后一行人格 badge 的真实底部计算，并加大到「选择模式」的间距，避免模式按钮贴住最后一行人格标签。
- 调整 `douyin-interactive-space/` 分享视频保存体验：点击预览页「分享视频」后前台只显示「保存视频中」弹窗，不再播放回放内容；H5 导出改为后台临时 Canvas 录制，保存成功后自动回到选择人格页面。
- 调整 `douyin-interactive-space/` 分享视频预览页：底部「返回选择」和「分享视频」按钮改为同一行自适应显示；视频保存/下载/分享成功后自动回到选择人格页面，并清理视频预览计时器。
- 修复 `douyin-interactive-space/` 分享入口弹窗误显示录屏能力错误的问题：卡片/视频选择弹窗现在只展示入口说明，不再透传 `shareVideoError`；录屏或导出失败仅在视频预览页底部提示。
- 重构 `douyin-interactive-space/` 分享视频流程：点击「分享视频」先进入静态视频预览页，不自动播放；预览中央提供播放/暂停按钮，底部主按钮才触发视频生成，H5 环境通过 `MediaRecorder` 录制 Canvas 并下载 WebM，原生环境继续优先接入分享/保存能力。
- 调整 `douyin-interactive-space/` 圆桌页头部：设置按钮贴到页面右上角，不再预留额外平台菜单空白；话题标题固定以屏幕中心居中，并按右侧设置按钮自动限制最大宽度。
- 修复 `douyin-interactive-space/` 分享卡片按钮在 H5 互动空间无响应的问题：当环境没有 `tt.shareAppMessage` 或未配置模板时，改为生成当前卡片 PNG，优先调用系统 Web Share，失败或不支持时触发下载，并在卡片预览中显示生成反馈。
- 修复 `douyin-interactive-space/` 参与输入出现双输入框的问题：H5 textarea 改为真正隐形的输入捕获器，只保留 Canvas 绘制的项目风格输入框。
- 新增 `douyin-interactive-space/` 互动空间 H5 静态包：复用抖音小游戏 `main.js` 与 assets，提供浏览器版 `tt` adapter、`index.html` 和 H5 config，并生成根目录含 `index.html` 的 `perso-interactive-space.zip` 用于上传测试；同时为 `/api/chat`、`/api/tts` 增加 CORS/OPTIONS 支持，允许互动空间静态前端跨域调用后端。
- 调整 `douyin-interactive-space/` 接口失败兜底：`fetch`/CORS 失败时若启用 mock generation，会自动进入 mock 圆桌，避免本地或互动空间预览直接停在 `failed to fetch`。
- 新增并调整 `docs/interactive-space-dev-plan.md`：互动空间版不重写 H5 UI，改为复用 `douyin-minigame/js/main.js` 并通过 H5 `tt` adapter 适配静态包，明确 ZIP 包需要构建为 `index.html + JS/CSS/assets`，降低布局和样式漂移风险。
- 修复 `douyin-minigame/` 趣玩模式气氛按钮效果不明显的问题：点击真诚/强势/毒舌时将下一位说话人格传给后端生成，并强化真诚/强势 prompt 的可感知语气要求，避免前端仅改 persona 字段导致内容与头像不一致。
- 同步抖音小游戏分享体验到 H5：圆桌结束后分享入口改为「卡片 / 视频」选择，卡片沿用现有保存流程，视频新增 Canvas 回放预览与 WebM 生成/分享下载能力。
- 同步抖音小游戏语音体验到 H5：圆桌页新增有声/静音按钮，按当前 MBTI 人格调用 `/api/tts` 播放语音，并在暂停、回看、结束和关闭语音时同步控制音频。
- 修复 `douyin-minigame/` 参与模式人格无故说「你来了」的问题：移除参与模式话题规则和 ENTJ 人格设定中对未发言用户的正向点名暗示，用户未输入前只允许人格之间自然接话。
- 调整 `douyin-minigame/` 参与模式开场：不再只生成 1-2 条后强制等待用户，改为所选 4 个人格按顺序各说 1 条后再等待用户加入。
- 调整 `douyin-minigame/` 参与模式为可选参与：人格会持续自动续聊，用户点击输入框时再打断并插入自己的发言，不再强制用户每轮输入。
- 修复 `douyin-minigame/` 参与模式人格无故招呼用户的问题：用户未发言前，prompt 禁止出现「你来了」「你怎么看」「等你加入」等欢迎或催促参与的话。
- 修复 `douyin-minigame/` 输入框中文输入不稳定的问题：抖音环境优先调用 `tt.showKeyboard`，Canvas 键盘仅作本地兜底，并兼容更多键盘回调字段。
- 修复 `douyin-minigame/` 真机键盘输入回写不稳定的问题：兼容 `value/text/data/detail.value/target.value` 多种回调字段，避免自由输入、纸条和参与输入在键盘完成/失焦时被空值覆盖
- 修复 `douyin-minigame/` 趣玩模式续写、递纸条、气氛切换的气泡闪回问题：下一条消息返回时若当前消息已播完并进入思考态，直接推进到新消息，避免重新渲染回旧人格气泡。
- 修复 `douyin-minigame/` 递纸条目标人格思考态错误的问题：纸条请求期间的思考气泡固定显示目标人格，避免先闪出自然轮到的其他人格。
- 修复 `douyin-minigame/` 气氛按钮在当前人格 TTS 未结束时误推进到下一人格的问题：推进、思考气泡和纸条/气氛响应现在同时检查文字与当前语音是否真正结束。
- 修复 `douyin-minigame/` 气氛按钮改变原本下一位人格的问题：点击气氛时会锁定缓存中的下一位人格，重新生成后的第一条回复仍由原本下一位人格发出。
- 修复 `douyin-minigame/` 参与模式下一人格回复返回后的气泡闪回问题：如果用户消息已播完并进入下一个人格思考态，回复到达后直接推进到第一条新回复，避免重新渲染回用户气泡。
- 修复 `douyin-minigame/` 参与模式用户发言后思考人格与实际回复人格不一致的问题：用户提交时锁定应答人格，思考气泡、mock 和接口第一条回复保持同一人格。
- 修复 `douyin-minigame/` 参与模式发送后说话区顺序错误的问题：用户提交内容后先在说话区流式显示，期间不显示底部思考状态，用户内容播完后再切到下一个人格的思考气泡并等待回应。
- 调整 `douyin-minigame/` 分享视频回放时间轴：每条发言按朗读权重估算时长并提前预取 TTS，文字流式改用标点权重推进，避免人格话没说完就跳到下一条
- 修复 `douyin-minigame/` 趣玩模式递纸条与气氛按钮延迟生效的问题：纸条在当前发言结束后立即抢占下一条、强制下一条归属目标人格；气氛切换会作废未来缓存并强制下一条续写立刻体现新气氛，避免被 12 条上限吞掉
- 修复 `douyin-minigame/` 参与模式用户发言在说话区重复出现的问题：用户消息插入后改为一次性完整显示，不再走人格逐字播放循环
- `douyin-minigame/` 分享视频生成结果页新增「返回选择」按钮，可直接回到选择人格页面
- 修复 `douyin-minigame/` 真机触摸按钮无响应的问题：统一封装触摸处理，放宽点击抖动阈值，兼容 `touchend` 无 `changedTouches`、event 直接带坐标、canvas 原生触摸事件与测试容器 canvas 偏移坐标。
- 调整 `douyin-minigame/` 分享视频页话题标题：按抖音右上角胶囊按钮中心线垂直对齐。
- 调整 `douyin-minigame/` 卡片分享 4 人格布局配置：将四个头像块的坐标拆成 `compactSlotPositions`，便于单独手调每个人格位置。
- 修复 `douyin-minigame/` 分享视频生成结果页按钮不可见的问题：兼容 `safeArea.bottom` 返回 0 的环境，避免「保存视频 / 分享视频」按钮被画到屏幕外。
- 临时禁用 `douyin-minigame/` 背景音播放，避免录制提交视频时混入 BGM 噪音
- 调整 `douyin-minigame/` 分享预览布局：卡片预览 4 人格贴纸整体右移并将卡片到底部按钮的空白压到 20px；视频生成结果页底部提供「保存视频 / 分享视频」操作区。
- 修复 `douyin-minigame/` 卡片分享预览 4 人格布局重叠：为 Canvas 版卡片单独收紧 4 人贴纸尺寸、拉开两排行距，并将观点摘要固定到底部安全区域。
- 提高人格 TTS 默认语速；`douyin-minigame/` 气氛按钮初始不再默认高亮「说人话」，卡片分享预览第三人格下移避免重叠，并让分享视频录制页按时间逐字显示发言、补回听众人格行并尝试播放当前人格 TTS
- 替换 `douyin-minigame/` 话题 BGM 资源：将 5 条 8 秒单声道占位音频重生成 24 秒、44.1kHz、双声道柔和循环，上调 BGM 播放音量，并更新音频 URL 版本号避免部署后继续命中旧缓存。
- 调整 `douyin-minigame/` 分享视频录制画面：录制时复用实时圆桌顶部话题与说话卡片样式，移除额外标题、录制状态文案、听众人格行、页码与进度条，并继续在录制完成后调用抖音视频分享。
- 调整 `douyin-minigame/` 卡片分享预览：按 H5 `ShareCard` 复刻 360×480 黑底灰卡、紫色标题、旋转头像 badge、日期与观点摘要布局，替换此前聊天摘录式预览。
- 调整 `douyin-minigame/` 参与模式插话逻辑：用户开始打字时冻结并清除当前句之后的 AI 发言，当前人格说完后等待用户发送，发送后再生成下一位人格回应
- 修复 `douyin-minigame/` 分享弹窗 `messageY is not defined` 崩溃；确认背景音依赖部署后的 `public/audio` 网络地址，未部署时线上音频会 404 并导致 PC SDK `NotSupportedError`
- 修复 `douyin-minigame/` 结束后回放无声的问题：done 状态的回放循环重新接入 TTS，播放/暂停也会恢复或暂停当前语音。
- 修复 `douyin-minigame/` 背景音路径问题：BGM 改为部署在 `public/audio/` 并由小游戏通过 `API_BASE_URL + /audio/*.mp3` 网络地址播放，避免 `InnerAudioContext` 不支持包内相对音频路径导致静默。
- 修复 `douyin-minigame/` 结束态播放按钮状态：点击结束后进入回放暂停态并显示「播放」，点击播放后从已结束内容回放并显示「暂停」
- 优化 `douyin-minigame/` 分享调用：新增分享模板 ID 配置项，未配置时显示项目内提示，已配置时传入 `channel/templateId` 并用 fail 回调兜底，避免系统分享错误直接弹出
- 修复 `douyin-minigame/` 圆桌按下结束后底部仍显示/响应「结束」按钮的问题：已结束回放态只保留播放/暂停控制
- 修复 `douyin-minigame/` 参与模式发送后画面跳动的问题：用户发言不再强行打断当前人格发言，而是排到当前句之后播放；当前已结束时仍立即显示用户气泡。
- 修复 `douyin-minigame/` 背景音无感/静默难排查的问题：BGM 资源改为 mp3，提升默认音量，并在音频 canplay 后重试播放，失败时显示背景音错误提示。
- 修复 `douyin-minigame/` 参与模式体验：关闭强制 mock 生成以恢复真实开局差异，播放期间底部按钮恢复「暂停/继续」，参与模式人格间隔缩短并预取下一句 TTS，同时缩小顶部设置图标视觉尺寸。
- 新增 `douyin-minigame/` 话题氛围 BGM 原型：根据话题关键词匹配情感、人生、叙事、轻快、理性五类本地循环音乐，loading/圆桌自动低音量播放，设置弹窗支持独立开关。
- 将趣玩/参与模式的话题控制从“每条强制贴题”调整为“话题牵引”：允许人格短暂发散，但不能连续跑偏，并由更收束的人格自然带回主线
- 强化参与模式话题锚定，并为趣玩/参与模式新开局加入隐藏切入角度，降低同一话题重复开局时内容高度相似的问题
- 调整 `douyin-minigame/` 参与模式：圆桌底部常驻用户输入框，用户可随时发送发言并插入「你」的气泡，后续人格会接着回应；同时将 loading 内容整体下移以改善视觉居中。
- 新增 `douyin-minigame/` 代码驱动像素动画：说话人格按稳定 seed 分成点头、左右晃、轻抖、短促抖动等不同风格，思考等待时分配上下浮动/左右晃动/慢踱步，听众头像轻微浮动
- 调整 `douyin-minigame/` 分享入口：移除圆桌右上角分享按钮，卡片分享改为先展示 Canvas 卡片预览，视频录制不可用时在分享弹窗内显示明确提示。
- 强化趣玩模式话题锚定：开场、续写和递纸条生成都会显式要求每条发言保持与当前话题可见相关，避免文学/作品类话题被泛化成无关人生讨论
- 修复 `douyin-minigame/` 圆桌顶部话题标题过长会进入抖音系统胶囊区域的问题：按设置按钮与胶囊按钮之间的安全宽度居中绘制并单行省略
- 整体上调豆包/火山 TTS 默认语速：未显式配置环境变量时所有人格语速按 `1.06` 系数加快，并自动命中新语速缓存 key
- 调整 `douyin-minigame/` 圆桌说话区：人格图片出现时同步绘制最小对话气泡，避免气泡在文字/TTS 推进后延迟出现
- 调整 `douyin-minigame/` 选择页顶部布局：logo 区域及后续人格/模式/话题内容同步上移 18px
- 新增 `douyin-minigame/` 圆桌等待态气泡：人格等待语音或下一句生成时，主说话区显示同款对话气泡，并用「思考中. / .. / ...」循环动画提示
- 调整 `douyin-minigame/` 设置与趣玩体验：移除右上角独立声音图标，设置弹窗仅在对话结束后显示分享按钮，mock 续聊会自动补后续发言，并上移主说话区递纸条入口
- 将趣玩模式开场从 2 条扩展为 3 条人格发言，第三条直接接住第二条判断，减少第三个人格等待后台 continuation 的停顿
- 新增 `douyin-minigame/` 顶部设置入口：左上角改为像素风设置按钮，点击弹出声音/静音切换、退出、分享三个操作
- 微调 `douyin-minigame/` 递纸条入口视觉：主说话区移除按钮黑色背景和灰色边框，等待区纸条图标向右偏移
- 新增长句自动拆分策略：H5 与 `douyin-minigame/` 解析生成结果时将超过约 90 字的发言按标点拆成同人格连续多条，并同步收紧 prompt 避免单条 content 过长
- 调整 `douyin-minigame/` 顶部 header 对齐：返回按钮、标题与抖音右上角系统胶囊按钮按同一水平中心线垂直居中
- 优化 `douyin-minigame/` TTS 与文字显示同步：语音 key、URL 与进度计算统一使用实际朗读文本，起播时间改为按 `onPlay/currentTime` 确认，并加入标点权重避免纯线性字数映射
- 调整 `douyin-minigame/` 趣玩模式递纸条入口位置：主说话者入口改为头像右侧「递纸条」按钮，听众入口挪到名称牌右下角
- 新增 `douyin-minigame/` 递纸条自定义输入框：用户可在纸条面板手动输入一句话并点击「递过去」提交，快捷纸条选项继续保留
- 新增趣玩模式「让 TA 说话」快捷纸条：H5 递纸条面板与 `douyin-minigame/` 预设纸条列表均支持直接让目标人格接下一句
- 调整趣玩模式纸条入口视觉：H5 与 `douyin-minigame/` 均移除纸条图标外层边框、背景色和文字，仅保留 `page` 图标
- 修复 `douyin-minigame/` mock 测试路径无声难排查的问题：mock 开场也走首句 TTS 预加载流程，并在圆桌页恢复显示语音下载/播放失败提示
- 修复 `douyin-minigame/` 圆桌说话气泡右侧 padding 不稳定的问题：统一气泡文字测量与绘制字体，并把文字裁剪限制在 padding 内部安全区
- 修复 `douyin-minigame/` TTS 静默卡住的问题：同一句语音只有在真实播放/下载中才阻塞文字回退，并在起播前重新设置音频源与 seek 到开头，提升抖音 `InnerAudioContext` 复用播放可靠性
- 修复 `douyin-minigame/` 选择页自由输入点击后无法可靠打字的问题：补齐键盘 complete/blur 回写、showKeyboard 失败提示，并为编辑态增加绿色描边反馈
- 完善 `douyin-minigame/` 分享视频回放画面：保留上方话题标题，发言直接显示完整内容，下方展示听众人格行，并兼容用户发言用统一气泡样式入镜
- 修复 `douyin-minigame/` TTS 有声音但气泡不出现的问题：播放开始前记录本地起播时间，音频未返回 duration/currentTime 时用本地时间推进文字，并在 TTS 播放态下至少渲染首字气泡
- 抖音小游戏圆桌结束后的分享按钮新增「卡片 / 视频」选择弹窗；卡片走普通分享，视频走方案 B 的专用 Canvas 回放录屏，逐条展示已播放对话并录制后调用视频分享
- 优化趣玩模式递纸条入口与生成逻辑：H5 与 `douyin-minigame/` 在可点击人格上显示 `page` 纸条图标；打开纸条会冻结并清除未播放后续内容，提交后等当前发言说完再按纸条内容重新生成后续
- 调整 `douyin-minigame/` 语音加载展示：运行中 TTS 下载改为静默，不再在圆桌顶部显示「语音生成中」；首句语音预加载不再超时提前进入圆桌，下载完成或失败后再结束 loading
- 修复 `douyin-minigame/` TTS 播放时文字进度落后语音的问题：真实语音驱动时字数直接同步到音频进度对应位置，不再受 180ms 打字机单字限速影响
- 根据试听反馈将 INFP 豆包 TTS 语速小幅提升到 `1.15`，保留当前声线但减少拖慢感
- 优化 `douyin-minigame/` 圆桌播放等待：播放当前发言时静默预取下一句 TTS，队列只剩一条未来发言时后台补续写；用户操作只有在作废已预加载未来发言时才显示「思考中」
- 根据试听反馈将 INFP 豆包声线从 `zh_female_xiaohe_uranus_bigtts` 调整为 `zh_female_meilinvyou_uranus_bigtts`，避开台湾腔与低龄感
- 修复趣玩模式气氛按钮只改变选中态的问题：H5 与 `douyin-minigame/` 点击气氛后会丢弃未播放的未来发言，并按当前已展示内容用新气氛重新续聊
- 调整 `douyin-minigame/` 圆桌页语音开关：用 `sound/no-sound` 图标替换「有声/静音」文字按钮，并定位到抖音系统胶囊按钮下方
- 为豆包 TTS 增加按人格配置 `speech_rate` 的能力，并将 ISTJ 语速提升到 `1.2`，同时把语速纳入 `/api/tts` 服务端缓存 key
- 调整 `douyin-minigame/` loading 与首句语音体验：loading 内容整体下移并隐藏「有声」按钮；真实语音开启时先预下载首句 TTS 再进入圆桌；起播前减少空音频 stop 以降低爆破音，并关闭 Canvas 平滑/取整主说话 sprite 坐标提升像素清晰度
- 修复声线试听页换音色后仍播放旧声音的问题：`/api/tts` 响应改为 `no-store`，并为 `/voice-test` 音频 URL 增加试听版本参数，避免浏览器沿用旧缓存音频
- 根据试听反馈继续调整豆包 TTS 声线：ENTP 移除孙悟空角色音，INFJ 换更明确的克制男声，INFP 去掉低龄感，ISFJ 换成语速更顺的温和女声
- 修复 `douyin-minigame/` 圆桌发言气泡右侧 padding 被像素字体文字侵占的问题：将气泡文字测量宽度改为显式扣除左/右 padding，并增加可调右侧留白常量
- 修复 `/voice-test` 试听按钮点击无反馈的问题：每个人格卡片增加独立原生 audio 控件，试听按钮改为触发对应控件播放，避免浏览器异步播放策略导致无声
- 将原旁观模式升级为「趣玩模式」基础实现：H5 支持 `mode=fun`、旧 `spectator` 兼容、趣玩气氛按钮、点击人格递纸条、纸条目标人格优先发言；抖音小游戏同步改为趣玩文案，新增气氛按钮与预设纸条轻量交互
- 调整 `douyin-minigame/` 侧边栏引导：移除选择页常驻「侧边栏」按钮，改为用户体验完一轮圆桌后弹窗提示添加到抖音侧边栏，并用本地 storage 避免重复打扰
- 根据试听反馈调整豆包 TTS 人格声线：INTP/ENTJ/ESTJ 改为女声，INFJ/ENFJ/ESFJ/ISFP 改为男声，并重配 INTJ、INFP、ENFP、ISTJ、ISFJ、ISTP、ESTP 的气质匹配音色
- 新增 `/voice-test` 人格声线试听页：16 型各有符合人格气质的一句测试文案，点击试听按钮即调用对应豆包音色朗读，支持连续试听与停止播放
- 统一 `douyin-minigame/` Canvas 文案字体：除自定义话题输入框文字外，header、按钮、提示、话题卡片、气泡与底栏等页面文字均改用 VonwaonBitmap
- 按 MBTI 人格气质为豆包 TTS 重新分配 16 个已实测可用的 `seed-tts-2.0` 声线，并移除本地全局音色覆盖，让抖音小游戏中不同人格恢复不同音色
- 将 `douyin-minigame/` 选择人格页头像名称切换为 VonwaonBitmap 像素字体，并把字体文件加入小游戏 assets
- 调整 `douyin-minigame/` 选择人格页头像名称框：新增可调下移量，并改用 Canvas middle baseline 让文字在黑色名称框内垂直居中
- 修复 `douyin-minigame/` 圆桌页底部「暂停/继续 / 结束」按钮素材：从绿色按钮改为黑底灰边框按钮，并使用白色文字
- 修复 `douyin-minigame/` 圆桌页「有声/静音」按钮与抖音右上角系统胶囊按钮重叠的问题：header 右侧控件改为读取胶囊边界并向左避让
- 修复豆包 TTS 在抖音小游戏中部分人格返回 503 的问题：剔除与当前火山 `seed-tts-2.0` 资源不匹配的 speaker，并将人格差异音色改为只使用已实测可用的 voice id
- 去掉 `douyin-minigame/` loading 页头像底部的重复人格名称标签，仅保留下方 badge 名称
- 新增 `docs/fun-mode-dev-plan.md`：梳理「旁观模式」升级为「趣玩模式」的产品定义、数据结构、Prompt 逻辑、H5/抖音小游戏开发步骤、风险点与验收标准
- 新增 `docs/exhibition/perso-product-board-80x200cm.svg` 与 `.png`：按产品展板信息结构重做 80cm x 200cm 展板，明确展示 Perso 的产品定义、产品逻辑、示例对话、核心优势、使用流程与扫码体验入口
- 将豆包/火山引擎 TTS provider 改为仅支持新版 API Key：使用 `VOLCENGINE_TTS_API_KEY` + `seed-tts-2.0` 的 V3 单向流式 HTTP 接口，移除旧版 AppID/AccessToken 兜底
- 新增 `docs/exhibition/perso-poster-80x200cm.svg` 与 `.png`：重新设计 80cm x 200cm Perso 宣传展板，改为海报式大标题、圆桌人格群像、强色块与扫码区，不沿用手机 UI 展示思路
- 新增 `/api/tts` 豆包/火山引擎 TTS provider：支持 `TTS_PROVIDER=volcengine`，按 MBTI 映射火山 `voice_type`，通过新版 API Key HTTP TTS 接口返回 mp3 音频；小游戏侧继续复用原 `/api/tts` 地址无需改动
- 新增 `docs/exhibition/perso-board-80x200cm.svg`：80cm x 200cm 竖版展板初稿，围绕现场吸引、玩法说明和扫码体验转化设计
- 调整 CosyVoice 人格声音设计为更口语的 `casual-v2`：移除“吐字清晰/会议/播报/主持”等容易触发播音腔的描述，改为朋友聊天、群聊语音、边想边说等口语化 prompt，并将 TTS 缓存与临时 voice_id key 纳入 style version
- 将 `/api/tts` 默认 TTS 模型切到 `cosyvoice-v3.5-flash`：保留 Qwen-TTS 兼容路径，模型名以 `cosyvoice-` 开头时改走 CosyVoice `SpeechSynthesizer`；未配置 CosyVoice voice id 时支持按 MBTI 人格自动声音设计生成临时 voice_id，TTS 函数最大执行时间提升到 60 秒，并将缓存 key 纳入模型名避免命中旧音频
- 调整 `douyin-minigame/` loading 页布局：loading 动画宽度改为跟上方人格网格同宽，并从靠近底部改为紧跟人格区下方显示，减少中间空白
- 修复 `douyin-minigame/` 圆桌页 TTS 与逐字显示不同步的问题：人格发言在真实语音可用时改由音频播放进度驱动字符显示；暂停按钮改为暂停当前音频与文字进度，继续时恢复同一段语音和同一位置
- 修正 `douyin-minigame/` 圆桌页进度条为真正直播回看模型：拆分 live 播放头与当前查看位置，进度条右侧只代表当前已播到的字，拖动只能回看已播放内容，不能跳到后台已生成但还没说出的未来人格发言
- 修复 `douyin-minigame/` 圆桌页发言气泡文字溢出：收窄气泡文字测量宽度并给文字绘制增加圆角气泡裁剪，避免中文/引号混排时画出背景框
- 修复 `douyin-minigame/` 圆桌页暂停后继续无反应的问题：触摸开始时优先识别底部按钮避免被进度条拖动热区吞掉，暂停时停止播放循环，继续时重新启动播放循环
- 新增 `douyin-minigame/` 圆桌页「有声/静音」开关，音频播放走 `tt.createInnerAudioContext()` 并关闭系统静音开关跟随
- 将 `douyin-minigame/` 人格声线默认设为开启，并新增 `DEFAULT_VOICE_ENABLED` 配置，便于后续切换默认声音状态
- 新增真实 TTS 服务端代理 `/api/tts`：按 MBTI 人格映射 Qwen-TTS voice，服务端调用 DashScope 生成音频并代理返回给小游戏；`douyin-minigame/` 圆桌页改为每条发言开始时播放对应人格的整句 TTS，缺少 `API_BASE_URL` 时显示语音配置提示
- 将 `douyin-minigame/` 圆桌页进度条升级为 timeline seek：按每条发言的字数打字时长 + 结尾停顿时长计算时间轴，拖动时可定位到具体发言与已显示字符
- 微调 `douyin-minigame/` 圆桌页逐字播放速度：打字间隔从 150ms 放慢到 180ms，让人格发言节奏更接近 H5 页面
- 修复 `douyin-minigame/` 圆桌页进度条无法拖动的问题：为进度条注册触摸区域，圆桌页 touch move 支持拖动 seek；默认仍保持直播 live edge，用户拖动后按位置回看对应消息
- 调整 `douyin-minigame/` 圆桌对话流程：底部进度条改为直播式默认停在最右侧；mock 对话从一轮扩展到 12 条；真实 API opening 后后台请求 continuation 并追加播放队列，避免只聊一轮就结束
- 修正 `douyin-minigame/` 选择人格页警告感叹号比例：icon 改为固定高度、宽度按素材原始比例自动计算，避免被拉伸成方块
- 继续压缩 `douyin-minigame/` 选择人格页头像网格下方留白：模式区改为按最后一行头像真实视觉底部定位，仅在错误提示出现时额外留出提示空间
- 收紧 `douyin-minigame/` 选择人格页头像网格行距：减少 4 行人格之间的空白，并同步调整点击区域与下方提示位置
- 修复 `douyin-minigame/` 选择人格页滚动条可见但页面无法拖动的问题：触摸事件兼容 `clientX/clientY`、`x/y`、`pageX/pageY` 坐标，并为开发者工具补充滚轮滚动兜底
- 调整 `douyin-minigame/` 小人头像标签样式：人格黑色标签改为覆盖头像底部 45% 高度，贴近 H5 视觉中标签压住角色的效果
- 修正 `douyin-minigame/` 选择人格页移动端布局：顶部内容避开手机安全区/抖音胶囊区域，并在 Canvas 内增加滚动指示条，提示下方话题输入等内容可继续滑动查看
- 调整 `douyin-minigame/` 圆桌页布局：顶部 header 避开手机安全区/抖音胶囊区域，听众头像行改为紧跟主说话者气泡下方 10px，不再固定挤在底部控制栏上方
- 开发 `douyin-minigame/` 圆桌对话页：选择页开始后进入 H5 风格 loading，再切到圆桌舞台；Canvas 复刻顶部返回/标题/分享、主说话者 badge+精灵+气泡、听众头像行、底部直播进度与暂停/结束按钮，并支持 mock 消息逐字播放
- 为 `douyin-minigame/` 接入抖音小游戏侧边栏复访能力：选择页增加可见「侧边栏」入口，调用 `tt.navigateToScene({ scene: "sidebar" })`，并通过 `tt.onShow` 识别侧边栏回访状态
- 调整 `douyin-minigame/` 为线上测试版可上传形态：清空本地 API 地址、启用 mock 生成，移除本地 HTTPS 代理脚本，避免体验版依赖 `localhost`
- 重构 `douyin-minigame/` 选择人格页：按 H5 首页复刻背景遮罩、标题区、16 人格头像网格、未选中暗遮罩、警告提示、参与/旁观切换、预设话题、自定义输入与底部开始栏；补齐小游戏端 16 型头像与首页 UI 素材
- 新增 `douyin-minigame/` 抖音小游戏子项目骨架：包含独立小游戏配置、Canvas MVP、话题输入、调用现有 `/api/chat` 的旁观开场接口、默认四人格素材与接入说明；网站版 `src/` 未改动
- 调整圆桌页未结束状态的底部控制栏：移除「已发言 N 次」，改为直播式进度条 + 暂停/继续 + 结束；默认停在右侧 live edge，可在已播放窗口内左右拖动，但不能跳读后台已生成但尚未展示的对话；`npm run typecheck` 通过
- 修正圆桌页刚进入说话页面时直播进度条先停在 0 轴的问题：未回看状态始终显示在最右侧 live edge；`npm run typecheck` 通过
- 将首页默认模式改为参与模式，并把模式按钮顺序调整为「参与 / 旁观」；`/api/sessions/init` 兜底模式同步改为参与模式；`npm run typecheck` 通过
- 修复主动结束后的回放污染：参与/旁观模式点击结束时只保留已展示消息作为回放、分享和保存历史，丢弃后台已生成但尚未播放的队列内容；`npm run typecheck` 通过
- 调整圆桌人格说话区域为可用舞台内垂直居中，不再依赖固定大顶部留白调位置；`npm run typecheck` 通过
- 修正圆桌说话区位置与气泡高度：说话者区域整体下移，改为从固定顶部留白后开始布局，并禁止说话者区域压缩，确保气泡最高可显示 5 行后再内部滚动；`npm run typecheck` 通过
- 修复参与模式输入框增高挤压圆桌内容：底部输入区改为绝对定位覆盖层，输入多行时只让结束按钮随输入框上移；圆桌主体下移并锁定气泡不被父容器压缩，确保气泡最高 5 行；`npm run typecheck` 通过
- 调整参与模式输入框展开高度：textarea 恢复随内容增长并最高显示 4 行，隐藏态预留一行输入框高度以保持基础状态下结束按钮位置稳定；`npm run typecheck` 通过
- 修复手机端聚焦输入框导致页面放大/横向跑偏：首页话题输入与参与模式输入字号提升到 16px，并补充 viewport 设置，避免 iOS 自动缩放；`npm run typecheck` 通过
- 修复参与模式输入框长文本溢出：输入框样式回到选择页同款渐变胶囊，textarea 固定一行高度并内部滚动，避免撑破 44px 容器；`npm run typecheck` 通过
- 微调移动适配后的 UI：loading 动画改为紧接人格区下方显示，圆桌气泡最大高度提升到 5 行，参与模式输入框高度收至 44px；`npm run typecheck` 通过
- 调整参与模式底部输入区：结束按钮固定在输入框上方右侧，输入框改为带 `send-icon.png` 的胶囊样式，输入框隐藏时保留占位避免结束按钮跳动；`npm run typecheck` 通过
- 优化圆桌人格切换稳定性：预加载当前会话人格/user 的 badge 与 sprite 素材，并移除说话者切换时的 opacity 淡入动画，减少弱网下头像闪现感；`npm run typecheck` 通过
- 调整首页默认选中主题为「你们喜欢毛姆的《刀锋》吗？」；`npm run typecheck` 通过
- 优化移动浏览器一屏布局：圆桌页/首页/分享弹层锁定 `100dvh` 并禁止 body 滚动，圆桌 header 缩短，发言气泡改为默认 2 行、最多 4 行且内部滚动，loading 页改为人格区与进度区分段布局避免 4 人重叠；`npm run typecheck` 通过
- 调整默认选择人格：选择人格页面和 session 初始化兜底默认选中 `INTJ / ENFP / ISTJ / ESTP`；`npm run typecheck` 通过
- 修复参与模式开场阶段无结束按钮，以及首页人格选择警告图标首次加载晚于文字的问题：结束按钮在参与模式生成中即显示，警告图标/文字常驻并同步显隐；`npm run typecheck` 通过
- 调整用户发言气泡字体：用户作为主说话者时内容改用默认字体，MBTI 人格发言仍保留像素字体；`npm run typecheck` 通过
- 修复分享卡片观点摘要误抓口头禅：底部文案会跳过「等一下」等弱信息开场句，优先选择包含核心观点的信息句，避免显示不完整摘要；`npm run typecheck` 通过
- 修复旁观模式续写抢占当前发言：后台 continuation 的首条草稿只有在当前逐字播放队列完全空闲时才接管主气泡，避免第二个人格未说完就闪现第三个人格；`npm run typecheck` 通过
- 桌面端适配为居中手机画布：仅在 `md` 以上给首页和圆桌页外层增加 `max-width: 430px`、居中、边框与阴影，手机端默认布局不变；`npm run typecheck` 通过
- 调整分享卡片多人布局与文案：4 人模式底部文案固定两行，3 人模式头像区下移做垂直居中，底部内容改为观点概括而非直接摘原句；`npm run typecheck` 通过
- 修复 4 人分享卡片文字溢出：按 2/3/4 人分别设置总结间距与摘录长度，4 人模式压缩图文间距，3 人模式同步核查为适中间距；`npm run typecheck` 通过
- 调整 2 人分享卡片布局：头像区域占据标题与总结之间的剩余空间并垂直居中，总结文字贴近卡片底部；`npm run typecheck` 通过
- 修复对话结束后的回放初始位置：自然结束或手动结束后，底部进度条默认回到 0 轴，点击播放从头开始回放；`npm run typecheck` 通过
- 修复圆桌逐字播放抢跑：消息间停顿期间禁止新入队消息重启 reveal loop，避免上一人格发言刚结束/尚未视觉完成时下一人格提前闪现；`npm run typecheck` 通过
- 修复本轮 UI 问题：loading 三人格并排时改用紧凑头像/badge 尺寸避免溢出；右上角分享按钮仅在对话结束后显示；圆桌返回首页时携带 topic 以恢复预设话题选中态；用户发言主位展示期间暂停 AI 草稿/逐字队列，避免结束后闪现非流式气泡；`npm run typecheck` 通过
- 调整 loading 人格布局：选择 3 个人格时改为三人单行并排显示，4 人仍为 2×2；`npm run typecheck` 通过
- 统一参与模式整页背景并修正底部 footer：去掉输入区单独铺图造成的折痕，结束按钮固定在底部区域居中显示且在 AI 说话时也始终可见；`RoundTable` 说话者切换改为即时切换避免回放时旧人格闪现；`npm run typecheck` 通过
- 调整参与模式底部布局：用户输入区改为固定高度常驻占位，等待输入/AI 生成状态切换时中间说话者与听众区域不再上下跳动；结束按钮改为水平居中；`npm run typecheck` 通过
- 修复 loading 进度条未到尽头就切圆桌：去掉收到首条草稿/消息时提前隐藏 loading 的逻辑，改由 LoadingScreen 自己在进度条填满后触发切换；`npm run typecheck` 通过
- 修复回放中的用户发言展示：回放时间轴遇到 `user` 消息时切换到用户头像和 badge，并沿用逐字流式展示内容；`npm run typecheck` 通过
- 参与模式用户发言后新增主说话位展示：用户发送后将 `user` 头像和 badge 放到说话者位置停留 1.5 秒，同时后台请求模型，之后再切换到下一位 AI 人格；移除底部重复的「你」气泡；`npm run typecheck` 通过
- 调整参与模式底部输入区：输入框改为首页同款灰黑渐变圆角样式，移除可见发送按钮保留回车发送，结束按钮改为旁观模式同款像素按钮；`npm run typecheck` 通过
- 调整参与模式等待输入状态：轮到用户输入时保留上一条人格发言气泡，用户发送后等待 AI 回复期间也不闪空；`npm run typecheck` 通过
- 收紧参与模式错误处理：`/api/chat` 与 table 页统一把 Qwen 403/free-tier exhausted 转成简短中文提示，不再把原始 JSON 整段显示到页面；`npm run typecheck` 通过
- 修复参与模式开场失败时黑屏：table 页错误状态不再被 loading 遮罩隐藏，并过滤模型输出中的非法 persona，避免参与模式输出「你/user」等非 16 型角色时渲染崩溃；本地验证 Qwen 当前返回 `AllocationQuota.FreeTierOnly` 403，页面会展示错误而非黑屏；`npm run typecheck` 通过
- 首页人格选择区新增「旁观 / 参与」模式切换，放在头像网格与黄色警告提示下方；开始圆桌时按当前选择提交 `mode`；`npm run typecheck` 通过
- 新增 Qwen TTFT 服务端埋点：`/api/chat` 为每次请求生成 trace id，并记录 route received、Qwen fetch start、headers、first chunk、first token、stream done/cancel/error 等耗时，便于定位首屏 loading 等待瓶颈
- 优化 Qwen 首 token 等待：请求体显式设置 `enable_thinking: false`，并在 TTFT 埋点中补充 reasoning chunk/字符数统计，验证是否因隐藏思考流导致首屏延迟
- 补强 TTFT 异常定位：记录 Qwen fetch/response/route error 详情，并阻止旁观 opening 失败后继续空历史 continuation，避免污染首屏性能测试

- 更新旁观模式风格示例：基于《鲁豫对话李银河》播客文本重写「人为什么会感到孤独」示例对话，控制单条发言不超过 120 字，强化具体场景、接话与人格张力
- 继续收紧旁观模式语言规则：将「轻轻带过去」「提前删掉」「对方没有恶意」列为不自然表达反例，示例对话改为更口语、可见动作更多的表达

- 优化对话语言规则：在旁观 opening、旁观完整 prompt 与参与 prompt 中加入心理活动表达约束，禁止「很空」「被接住」「真正的自己」等空泛短语，要求清楚自然的完整表达；`npm run typecheck` 通过

- 重做分享卡片页面：按 Figma 10517-2294 像素级还原，关闭按钮换 close-button.png，标题随旁观/参与模式切换文案，卡片底部显示「聊了"<话题简称>"，<人格>说"<观点>"」总结，2×2 头像配旋转 badge；`npm run typecheck` 通过

- 优化旁观模式首屏生成：新增 spectator `phase`（opening/continuation），进入圆桌先请求 2 条开场发言，第一条自然引入主题；opening 播放后后台续写剩余对话并追加到同一播放队列；`npm run typecheck` 通过

- 修正圆桌页说话者 badge 与角色图视觉中心对齐：按人格素材透明边距为顶部 badge 增加水平校正，ENTP 等右偏角色不再显得 badge 偏左；`npm run typecheck` 通过

- 修复第一条人格打字过程被 loading 遮罩盖住的问题：收到首条草稿或首个完整消息后立即隐藏 loading，不再等待 loading 进度条收尾动画；`npm run typecheck` 通过

- 修复第一条人格草稿因模型大 chunk 一次性显示的问题：新增草稿目标缓冲与独立打字机显示层，模型接收速度和 UI 展示速度解耦；`npm run typecheck` 通过

- 调整首页开始按钮提交态：点击后不再显示 `...`，按钮文字始终保持「开始」；`npm run typecheck` 通过

- 修正回放进度条拖动：进度条从按消息 index seek 改为按时间轴比例 seek，可准确拖到 0 轴，避免时间轴和播放逻辑不匹配；`npm run typecheck` 通过

- 重做对话回放逻辑：由“固定间隔切换消息 + 独立打字计时器”改为单一时间轴播放，每条发言按字数计算播放时长并追加停顿，避免上一条没播完就跳到下一人格；`npm run typecheck` 通过

- 调整圆桌页听众头像 name label：保留遮挡头像底部的布局，支持显式 label 尺寸配置，并用 height/minHeight/maxHeight/lineHeight 强制锁定高度 28、字号 15；`npm run typecheck` 通过

- 修正 loading 页人格卡片对齐：头像圆形与 badge 使用同一中心轴布局，badge 按原始比例缩放，避免视觉中心偏移；`npm run typecheck` 通过

- 修复 loading 页顶部话题晚于头像/图片出现的问题：创建 session 后缓存话题，table 页首屏先读取缓存话题渲染 loading/header，再由 session API 数据覆盖；`npm run typecheck` 通过

- 修复第一条人格发言草稿未真正流式显示的问题：`content` 字段解析允许读取未闭合字符串，不再等第一条完整结束才显示；`npm run typecheck` 通过

- 进一步优化对话首屏等待：table 页新增未闭合 JSON object 的 `content` 草稿解析，第一条人格发言尚未完整闭合时也能先结束 loading 并流式显示；完整 object 到达后承接已显示草稿继续播放；`npm run typecheck` 通过

- 优化对话首屏等待：旁观/参与 prompt 输出协议从 JSON 数组改为 JSON Lines，要求模型每完成一条发言立刻闭合 object 并换行输出；前端/测试脚本按对象增量解析，可在第一条人格发言返回后先播放；`npm run typecheck` 通过

- 微调首页警告提示视觉对齐：固定文字行高并微调感叹号图标垂直位置；`npm run typecheck` 通过

- 首页 title 后新增副文案「听听不同MBTI人格的声音～」，使用像素字体与 `#D3D1D1` 颜色；`npm run typecheck` 通过

- 调整首页警告提示布局：选择人格错误提示改为绝对定位显示，出现/消失不再撑开后续内容；`npm run typecheck` 通过

- 优化选择人格页未选中态边缘：头像不再使用额外圆形遮罩层，改为圆形容器整体 `brightness()` 变暗，减少边缘锯齿亮边；`npm run typecheck` 通过

- 修复选择人格页未选中态遮罩重叠变深：圆形遮罩改到头像容器内部，标签通过文字灰度表达未选中状态；`npm run typecheck` 通过

- 修复选择人格页未选中蒙版：拆分为圆形头像遮罩和名称标签遮罩，避免透明区域出现多余黑色方块；`npm run typecheck` 通过

- 修正 loading 人格卡片对齐：头像和 badge 统一在固定卡片宽度内居中，badge 保持图片比例避免横向拉伸；`npm run typecheck` 通过

- 继续调整 loading 画面位置：将 loading 动画上移改为显式偏移常量，当前上移 96px；`npm run typecheck` 通过

- 微调 loading 画面：人格头像与 badge 标签间距加大，loading 动画整体上移；`npm run typecheck` 通过

- 优化 table 首屏 loading：进入 `/table/[sessionId]` 前缓存已选人格，loading 页面先用 `sessionStorage` 渲染人格头像，再由 session API 数据覆盖；`npm run typecheck` 通过

- 调整 loading 画面：放大 loading 动画图片，并将生成进度条嵌入图片自带框框内部；`npm run typecheck` 通过

- 完成 M5 数据存储 + 分享卡片：新增 `src/lib/db.ts`（Supabase null-safe 层，未配置时静默跳过）；`sessionStore` 在创建 session 时 fire-and-forget 写入 Supabase；新增 `PATCH /api/sessions/:id/end` 路由，对话达到 done 状态时自动批量写入消息并更新 `ended_by`；`GET /api/sessions/:id` 优先读 Supabase 再回退内存；新增 `ShareCard` 组件：9:16 黑底卡片含话题/人格/精彩消息/品牌，`html-to-image` 导出 PNG，优先 Web Share API 分享文件，不支持时回退下载；`npm run typecheck` 通过

- 去掉首页底部操作栏的 `Topic` 与当前话题显示，底部仅保留开始按钮；话题仍由卡片/输入框选择并通过 `sessionStorage` 传到 setup 流程
- 完成 M4 参与模式：圆桌页支持 `mode=participant`，AI 人格先发 1-2 条开场白后等待用户；底部新增用户输入框（Enter 发送/Shift+Enter 换行）；圆桌中央新增「我」头像并在用户发言时高亮；每轮用户发言后调用参与模式 API 返回 1-2 个人格回应，随后继续等待用户；`/api/chat` 新增 `opening` 参数处理开场逻辑、参与模式 `maxTokens` 调整为 500；`npm run typecheck` 通过

- 调整 M3 圆桌播放控制：生成过程中不显示暂停按钮和进度条，只保留逐字对话；生成完成后才显示回放进度条和播放/暂停按钮，并支持拖动进度条前进/后退
- 优化 M3 圆桌阅读体验：对话消息改为先进入播放队列，再按阅读速度逐字显示；前端气泡隐藏「反驳/追问/打断/共识」标签，仅保留人格名，标签继续作为内部结构化数据用于后续分享/分析
- 完成 M3 旁观模式 MVP 主流程：新增首页话题选择、人格选择页、临时 session API（内存 store，M5 替换 Supabase）、圆桌页、圆桌头像布局、发言气泡、播放控制、SSE JSON 增量解析与暂停/继续/结束；`npm run typecheck` / `npm run build` 通过，`npm run test:prompt` 在 3001 dev server 上通过一次冒烟
- M2 人工验收状态调整为部分通过：技术通路可用、人格辨识度初步可见；长句、JSON 截断和圆桌张力作为 M3/M4 联调阶段继续优化项，不再阻塞进入旁观模式 MVP
- 调整 M2 人格 prompt 提取规范：对话例句优先使用摘录/改写，但允许少量推导例句补足薄弱人格，前提是必须显式标注来源类型和依据，避免规范与现有 persona prompt 标注冲突
- 再次修复 M2 Codex review 问题（P1×3 / P2×1 / P3×1）：① 安装 `tsx` 为 devDependency，新增 `npm run test:prompt` 脚本，turn count 验收改为真实 10–15 范围判断；② `conflicts.ts` 修正 CONFLICT_DESCRIPTIONS 的 4 个 key 排序 bug（INTJ-ESFP → ESFP-INTJ 等）；③ 16 个 persona TS 文件全量补注例句来源类型（摘录/改写/推导），ENFJ/ESTJ/ESTP/ISFP/ISTP 来源偏薄处明确标 推导 而不静默保留；④ `dev-plan.md` M2 任务清单更新为实际状态（代码项打 ✓，人工验收仍未勾选）；⑤ `docs/changelog.md` 和 `dev-plan.md` 状态同步，消除「已完成」与「未勾选」的矛盾

- 修复 M2 Codex review 问题（P1×3 / P2×3）：① `scripts/test-prompt.ts` 改为真实 fetch API + SSE 解析 + 自动验收检查，改用 `tsx` 消除 `ts-node` 依赖；② `conflicts.ts` 修正 API 签名与计划一致：`getConflictPreview(personas[])` 返回组内张力文案，`suggestConflictGroup()` 无参返回扁平 4-persona 数组；③ `spectator.ts` 默认轮数从 6 改为 12（PRD 要求 10-15），`dev-plan.md` 补充 JSON 格式选型理由；④ `ENTP.ts` 例句补注来源类型（摘录/改写），移除无法审计的推导生成例句；⑤ `route.ts` 新增人格去重 + 2-4 个上限；⑥ `participant.ts` 强化人格之间互相回应约束

- 完成 M2 Prompt 系统：新增 `src/lib/prompts/personas/`（16 个人格 TS 文件 + index.ts）、`src/lib/conflicts.ts`（HIGH_TENSION_PAIRS / getConflictPreview / suggestConflictGroup）、`src/lib/prompts/spectator.ts`（旁观模式 system prompt builder）、`src/lib/prompts/participant.ts`（参与模式 system prompt builder + nextTurn message builder）；`/api/chat` 路由升级为调用真实 prompt builder，旁观模式 maxTokens 提升至 800，temperature 调整为 0.85；新增 `scripts/test-prompt.ts` CLI 验收脚本；`npm run typecheck` / `npm run build` 通过

- M1 本地连通性测试默认改用更快的免费额度模型 `qwen3.6-flash-2026-04-16`，并将 `/api/chat` 测试输出 token 上限降到 120/200，降低首轮等待时间；正式对话质量验收仍可通过 `QWEN_MODEL` 切回 plus
- 将默认 Qwen 模型从 `qwen-max` 调整为阿里云百炼免费额度模型 `qwen3.5-plus-2026-02-15`，并同步 `.env.example`、本地 `.env.local`、代码默认值与项目文档；仍可通过 `QWEN_MODEL` 切换
- 配置模型 API 环境变量：Qwen base URL 与 model 改为读取 `QWEN_BASE_URL` / `QWEN_MODEL`，新增本地 `.env.local` 模板并同步 `.env.example`
- 完成 M1 脚手架与 API 通路：在仓库根目录新增 Next.js 15 + React 18 + TypeScript strict + Tailwind 项目结构，加入 Qwen OpenAI-compatible streaming wrapper、`/api/chat` 服务端路由、Supabase browser/server client、基础类型定义、首页流式测试 UI、`.env.example` 与 npm scripts；`npm run typecheck` / `npm run build` 通过
- 新增 `docs/dev-plan.md`：阶段二产品开发详细执行计划，覆盖 M1-M5 五个里程碑（脚手架/Prompt系统/旁观模式/参与模式/数据存储与分享卡片），含目录结构、任务清单、类型定义、数据库 Schema、验收标准与上线 Checklist
- 调整 `docs/templates/raw-source-template.md` 的 raw 拆分规则：默认同域名合并为一份 raw；若 `docs/mbti-sources.md` 明确声明可按内容类型拆分，则允许同域名多 raw 文件，并要求写清文件名、计数口径和用途
- 阶段一 v2 知识库已通过人工验收：24 个 raw 文件、9 个认知功能文件、16 个人格文件均确认可作为阶段二 prompt 与产品开发基础
- v2 重建全部 16 个 persona 文件：消除三处系统性硬伤——① 核心驱动力与信息处理方式的 N/S 类型通用套话段落，替换为每种类型的具体描述；② 跟不同类型互动的差异从通用功能组模板改写为针对 ENTP/ISTJ 等具体类型的互动动态，引用 xhs.md 高赞组合帖（公路组/龙骨组/ISFJ+INFP 等）为证据；③ INTP、ENFP、ENTP、ENFJ 等 N 型文件删除 "这类 N 型不是脱离现实" 套话。INFJ.md 已为 v2 水准无需修改，共实际重建 11 个文件（ISTJ / ISFJ / ESFJ / ESTJ / ENTP / ENFJ / ESTP / ISFP / ISTP / ESFP / INTP）。确认：原始内容从 knowledge/raw/ 文件直接构建，未经认知功能文件中转。

- 生成 `knowledge/personas/` 中剩余 6 个 N 型人格文件：INTP / INFP / ENTP / ENFP / ENTJ / ENFJ；每个文件覆盖 persona 模板全部章节、10 个情绪分组、15 条带来源类型标注的例句与来源汇总
- 生成 `knowledge/personas/` 中 8 个 S 型人格文件：ISTJ / ISFJ / ESTJ / ESFJ / ISTP / ISFP / ESTP / ESFP；每个文件覆盖 persona 模板全部章节、10 个情绪分组、15 条带来源类型标注的例句与来源汇总
- 生成 `knowledge/personas/INFJ.md`：基于 v2 raw、认知功能文件与 persona 模板生成 INFJ（Ni-Fe-Ti-Se）人格文件，覆盖功能栈、一句话人设、核心驱动力、信息处理、决策方式、圆桌角色、跨类型互动、话题反应、情绪光谱、对话表现、15 条例句与来源汇总
- 生成 `knowledge/cognitive-functions/` 全部 9 个文件：Ni.md / Ne.md / Ti.md / Te.md / Fi.md / Fe.md / Si.md / Se.md / overview.md；每个功能文件含来源定义（totypes.com）、核心特征、对立功能场景对比、栈位表现、组合效应、圆桌行为模式、对话例句（≥15 条含来源标注）、来源汇总；overview.md 包含 8 功能速览表、16 型栈总览、4 组对立功能对比、圆桌识别线索与常见误判指南

- 统一产品需求文档的 Git 路径为 `docs/PRD.md`，消除大小写路径漂移风险
- 更新 `CLAUDE.md` 的目录说明，明确区分“当前仓库现状”与“阶段二启动后的计划结构”
- 将 `CLAUDE.md` 简化为 `@AGENTS.md` 跳转规则，统一由 `AGENTS.md` 维护项目规范
- 启动知识库 v2 raw 爬取
- 新增 `knowledge/raw/typeinmind.md`：整理 Type in Mind 的基础理论页与 16 型功能页，按新 raw 模板落盘
- 新增 `knowledge/raw/jobcannon.md`：整理 JobCannon 的功能总览、功能栈、inferior stress、类型页与对比页，按新 raw 模板落盘
- 补齐 `knowledge/raw/jobcannon.md` 中其余 13 型的类型页主题证据，并注明部分类型使用 career / relationship / result 页补齐
- 新增 `knowledge/raw/cognitiveprocesses.md`：整理 CognitiveProcesses 的 8 功能页、16 型角色表、type pages 与 uses-of-type 页面，按主题结构落盘
- 新增 `knowledge/raw/personalityhacker.md`：整理 Personality Hacker 的 Car Model、8 功能昵称体系、成长/loop/blind spot/shadow 文章与公开类型页样本
- 新增 `knowledge/raw/myersbriggs.md`：整理 Myers-Briggs 官方站的总览、type dynamics、type development、relationships、learning styles 与官方 16 型摘要，并记录 conflict style report 的公开盲区
- 新增 `knowledge/raw/mbtionline.md`：整理 MBTIonline 的 Type and Conflict 总览与 16 型 Relationships 页面，补关系/冲突场景证据
- 新增 `knowledge/raw/themyersbriggs.md`：整理 The Myers-Briggs Company 官方样本报告体系，补 Personal Impact / Communication / Conflict / Stress 四类应用场景证据
- 补充 `knowledge/raw/themyersbriggs.md`：重新爬取四份官方 sample report PDF，加入 ENFP / ESFP 在沟通、冲突、压力下的具体外显行为、触发点与他人视角
- 新增 `knowledge/raw/lucaluo.md`：整理不可解的 Luca 的中文 MBTI 专栏，提炼 8 功能定义、功能栈规律、误判原因、判型方法与生活化案例
- 新增 `knowledge/raw/jungus.md`：整理荣格斯心理测评的测试框架、样题映射、结果页 Top3 机制与公开类型页样本
- 新增 `knowledge/raw/sakinorva.md`：整理 Sakinorva 的旧版 96 题测试与新版 256 题 domain test，记录四域模型、多算法分型与 magic level 机制
- 新增 `knowledge/raw/personalitycafe.md`：整理 Personality Cafe 的论坛结构、类型比较、关系讨论、争论风格与社区纠偏机制，作为真实用户经验源
- 新增 `knowledge/raw/zhihu.md`：整理若化生的荣格八维系列知乎文章，回收 part1/part2 理论页与已检索到的 ISTJ/ENTJ 人格子页，并显式列出其余 14 型缺口
- 补充 `knowledge/raw/zhihu.md`：在按人格主体下新增 8 个认知功能分栏，便于后续同时按人格与按功能提取
- 重构 `knowledge/raw/zhihu.md`：改用用户已登录 Chrome 会话导出的知乎原文，修正总入口为 `561525061`，补齐 16 型子页与 `ENTP` 下篇，并记录 `ISTP / ESFJ / ENFJ` 公开下篇未检出的情况
- 新增 `knowledge/raw/zhihu-ruohuasheng.md`：基于若化生知乎系列重做长版 raw，按 16 型展开补充童年表现、关系模式、压力/loop、误判线索与他人观感等细节
- 新增 `knowledge/raw/typemyvibe.md`：整理 TypeMyVibe 的 MBTI guide、认知功能 guide 与 16 型聊天画像页，补聊天语言标记与示例消息模式证据
- 新增 `knowledge/raw/mbti.cat.md`：整理 MBTI.cat 的 8 功能总览、16 型总览、mirror functions、type development、persona、情绪触发/情绪需求/冲突沟通/关系配对等专题页
- 新增 `knowledge/raw/michaelcaloz.md`：整理 Michael Caloz 的测试理论页、判型校正页、8 个 N 型结果页、3 篇类型对比文与 `S types` 页，按主题结构落盘并显式记录 N 型偏置与 sensor 盲区
- 新增 `knowledge/raw/personality-type.md`：整理 Personality-Type.com 的首页方法论、8 功能页、16 型总览、兼容性/quadra 文章、INTP vs INTJ / INFJ vs INFP 对比页与 16 个类型页，按人格结构落盘并注明其 MBTI+Socionics+visual typing 的混合立场
- 新增 `knowledge/raw/truity.md`：整理 Truity 的 MBTI 基础解释页、认知功能入门页、16 型总览页、TypeFinder 测试说明与 16 个类型页，按人格结构落盘并注明其更偏四维偏好 + proprietary facets 的站点立场
- 新增 `knowledge/raw/assessfirst.md`：整理 AssessFirst 的认知功能入门页、两篇 16 型总览文、MBTI guide 与人格测评比较页，按人格结构落盘并注明其招聘语境、Big Five 优先立场与功能页术语误标风险
- 强化 `docs/templates/raw-source-template.md`：按人格结构时 16 型必须显式列举，按功能结构时 8 功能必须显式列举，不得无声省略
- 新增 `docs/templates/raw-source-template.md`：定义 raw 文件模板（头部元数据 + 问题覆盖矩阵 + 灵活主体四模式 + 每条 bullet 强制证据标注），取代 knowledge-build-plan.md 里的简陋旧模板
- 更新 `docs/knowledge-build-plan.md`：raw 文件模板节改为引用新模板，消除两处维护
- 更新 `AGENTS.md`：文档索引表新增"爬取单站原始内容"行，目录树补 raw-source-template.md 条目
- 存量 `knowledge/raw/psychologyjunkie.md` 和 `knowledge/raw/totypes.md` 标记为旧结构（无问题覆盖矩阵、无 bullet 级证据标注），待重爬后按新模板重建
- 更新 `docs/mbti-sources.md`：将 Quora 替换为 知乎社区问答（entry 24）+ 小红书（entry 25，新增唯一域名），共 25 条目 22 唯一域名
- 新增 `knowledge/raw/zhihu-community.md`：使用 MediaCrawler 抓取 191 篇知乎文章 + 5409 条评论，整理为按主题结构，覆盖雷点/口头禅/圆桌/安慰方式/刻板印象/自述例句六大主题
- 新增 `knowledge/raw/xhs.md`：使用 MediaCrawler 抓取小红书 773 帖（9个关键词去重后）+ 6049 条评论，整理为按主题结构；覆盖吵架风格/说话风格/圆桌场景/跨类型互动及 ISTJ/ISFJ/ESFJ/ESTJ 专项内容
- 补充 `knowledge/raw/personalitycafe.md` 与 `knowledge/raw/mbti.cat.md`：按 `docs/raw-coverage-assessment.md` 的方案 B 补抓 B7「话题反应差异」证据，新增 small talk / deep talk / texting / group context 与 relationship dynamics / pair pages 相关内容
- 继续补充 `knowledge/raw/personalitycafe.md`：新增 flirting / banter / boring conversations / favorite topics 相关 thread，细化 B7「话题反应差异」在调情、玩笑试探、无聊寒暄与偏好主题上的社区证据
- 继续补充 `knowledge/raw/personalitycafe.md`：新增 sarcasm / teasing / roast / intellectual chemistry / emotional disclosure 相关 thread，细化 B7 在玩笑边界、情绪暴露门槛与智性化学反应上的社区证据
- 补充 `knowledge/raw/xhs.md`：新增 ISTJ/ISFJ 口头禅与情绪自述专项内容（ISTJ圆桌/ISFJ圆桌补爬，共339条新帖），更新 B10 例句表与盲区记录
- 新增 `knowledge/raw/zhihu-supplement.md`：使用 MediaCrawler 补爬知乎 16 个专项关键词（1478条），覆盖 ESFJ/ESTJ/ENTJ/ENFJ/ESTP/ISTP/ESFP/ISFP 的说话风格与性格特点，含第一人称自述（ESTP女/ISTP自述/ISFP自述）
- 补充 `knowledge/raw/xhs.md`：补爬 ESFP 专项（日常/说话/口头禅三关键词共 220 帖），新增 ESFP 专项内容节，包括口头禅清单、Se主导认知功能解析、「自我保护型健忘」情绪模式、B10 第一人称自述三条、ISFP vs ESFP 对比表；B7 关键词因 CAPTCHA 中断未抓取
- 补充 `knowledge/raw/xhs.md`：补爬 B7 话题反应差异（5关键词共 420 帖），新增 B7 专节，覆盖 IN 四型文风对比表、T vs F 对同一句话解读差异、ENFP 话题跳跃模式、INTJ 话题偏好；S 型覆盖仍薄，最佳证据帖为图片内容无法提取
- 更新 `docs/raw-coverage-assessment.md`（v3）：全量 review 24 个文件；ESFP B10 从「偏薄」升至「基本够」；B7 从「稀疏→改善」升至「中等（IN型充分，S型推导）」；所有 P0 补爬已完成；结论：全16个人格文件 + 9个认知功能文件均可立即启动生成
- 新增 `src/app/card-transition-test/page.tsx`：独立卡牌切换测试页，验证 persona card 的 slide / flip / stack 过渡效果，不影响主圆桌逻辑
- 调整 `src/app/card-transition-test/page.tsx`：测试页改为沿用原圆桌的 speaker / audience 结构，只测试 speaker 的抽换与压栈过渡，不再展示独立的 demo UI
- 调整 `src/app/card-transition-test/page.tsx`：抽换方向统一为左出右进，不再按前后切换方向变化
- 调整 `src/components/roundtable/RoundTable.tsx`：旁观模式与参与模式共享的圆桌说话者切换改为左出右进抽换过渡，保留原对话区与听众区逻辑
- 优化线上圆桌进入稳定性：Vercel 环境创建 session 时要求 Supabase 持久化成功后再返回；圆桌页加载 session 增加短重试；聊天流初始连接增加一次网络重试与更友好的断连提示
