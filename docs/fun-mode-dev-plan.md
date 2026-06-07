# 趣玩模式开发步骤

> 目标：把原「旁观模式」升级为「趣玩模式」。用户不只是看 AI 人格自动聊天，而是可以像导演一样控制谁能说话、给某个人格递纸条、改变整桌气氛。

---

## 1. 产品定义

### 是什么

趣玩模式是原旁观模式的升级版：

```text
用户输入话题
  ↓
选择 2-4 个上桌人格
  ↓
这些人格自动围绕话题开聊
  ↓
用户可以中途：
  - 给某个人格递纸条
  - 调整整桌气氛
  - 暂停、回看、结束
```

用户在趣玩模式里不是圆桌成员，而是幕后导演。

### 和参与模式的区别

| 模式 | 用户身份 | 用户输入如何出现 | AI 人格行为 |
|------|----------|------------------|-------------|
| 趣玩模式 | 幕后导演 | 纸条只给目标人格看，不作为公开发言 | 人格自动互相接话 |
| 参与模式 | 圆桌成员 | 用户发言公开进入对话历史 | AI 人格回应用户，也互相回应 |

### 不是什么

- 不是让用户扮演某个人格
- 不是所有 16 个人格同时发言
- 不是把「纸条」直接公开念出来
- 不是让「毒舌」变成人身攻击

---

## 2. 核心规则

### 2.1 用户选谁，谁就可以说话

人格选择仍保持 `2-4` 个。

```text
selectedPersonas = 当前允许上桌发言的人格名单
```

规则：

- 只有 `selectedPersonas` 里的 AI 人格可以发言
- 未选择的人格不能出现在模型输出里
- 用户后续如果要换人格阵容，建议先不做动态换人，第一版只在进入圆桌前选择
- 默认仍可使用当前高张力组合：`INTJ / ENFP / ISTJ / ESTP`

### 2.2 递纸条

用户可以给某个人格单独递一句话。

示例：

```text
目标人格：INTJ
纸条内容：你能不能别只讲逻辑，说说你真正担心什么？
```

规则：

- 纸条只对目标人格可见
- 其他人格不能知道纸条内容
- 目标人格下一次发言必须受纸条影响
- 目标人格不要机械复述纸条，除非自然需要
- 一张纸条消费一次，影响目标人格的下一条发言
- 如果用户连续递多张纸条，按提交顺序 FIFO 消费

建议第一版行为：

```text
用户递纸条给某人格
  ↓
暂停后台 continuation 抢占
  ↓
下一条 AI 发言强制由目标人格发出
  ↓
该人格公开发言后，纸条标记为 consumed
  ↓
其他人格根据这条公开发言继续接话
```

### 2.3 气氛按钮

第一版做 4 个全局气氛按钮：

| UI 文案 | 内部值 | Prompt 含义 |
|---------|--------|-------------|
| 更毒舌 | `sharp` | 更犀利、更有梗，可以吐槽观点，但不能攻击用户或人格 |
| 说人话 | `plain` | 少抽象、少鸡汤，多用具体场景和口语表达 |
| 更真诚 | `sincere` | 少抬杠，多说真实担心、真实在意和内心动机 |
| 更强势 | `assertive` | 更明确地下判断，少绕弯，观点更有压迫感 |

规则：

- 同一时间只激活一个气氛
- 默认气氛为 `plain`
- 气氛影响接下来生成的 AI 发言
- 用户切换气氛后，不重写已经生成/已经说过的内容
- 「更毒舌」必须被安全约束为“犀利幽默”，不能变成辱骂

---

## 3. 数据结构改动

### 3.1 Mode

当前类型：

```ts
type Mode = "spectator" | "participant";
```

建议改为：

```ts
type Mode = "fun" | "participant";
```

兼容规则：

- 前端新文案显示「趣玩 / 参与」
- 服务端短期兼容旧值 `spectator`
- 收到 `spectator` 时统一归一化为 `fun`
- 历史 session 里如果还有 `spectator`，展示时按「趣玩」处理

### 3.2 Atmosphere

新增：

```ts
type Atmosphere = "sharp" | "plain" | "sincere" | "assertive";
```

Session 里建议增加：

```ts
interface Session {
  mode: "fun" | "participant";
  atmosphere?: Atmosphere;
}
```

### 3.3 Private Note

新增：

```ts
interface PrivateNote {
  id: string;
  targetPersona: PersonaId;
  content: string;
  status: "pending" | "consumed";
  createdAt: number;
  consumedTurn?: number;
}
```

前端运行时可以维护：

```ts
pendingNotes: PrivateNote[];
```

如果后续要保存历史，再写入 Supabase。第一版可先存在 session runtime 里。

### 3.4 Chat 请求体

`/api/chat` 趣玩模式建议支持：

```ts
interface FunChatRequest {
  mode: "fun";
  phase: "opening" | "continuation" | "note";
  topic: string;
  personas: PersonaId[];
  messages: Message[];
  atmosphere: Atmosphere;
  privateNote?: {
    targetPersona: PersonaId;
    content: string;
  };
}
```

规则：

- `personas` 必须服务端白名单校验
- `privateNote.targetPersona` 必须在 `personas` 内
- `privateNote.content` 必须做长度限制，建议 `1-80` 字
- 客户端不能传 system prompt，只传结构化字段

---

## 4. Prompt 逻辑

新增或改造 `src/lib/prompts/spectator.ts`，建议重命名为：

```text
src/lib/prompts/fun.ts
```

短期也可以保留旧文件名，内部改成 fun prompt，避免一次性迁移太大。

### 4.1 趣玩模式基础 Prompt

必须包含：

```text
你正在生成 MBTI 人格圆桌对话。
用户是幕后导演，不是公开发言者。
只有 selectedPersonas 中的人格可以说话。
不要输出未选择的人格。
人格之间要互相接话、反驳、追问，不要轮流念答案。
每条发言要自然口语化，避免抽象鸡汤。
```

### 4.2 纸条 Prompt

当 `phase = "note"` 时追加：

```text
用户给 {targetPersona} 递了一张私人纸条：
「{noteContent}」

只有 {targetPersona} 知道这张纸条。
其他人格不知道纸条内容。
下一条发言必须由 {targetPersona} 发出。
{targetPersona} 要受到纸条影响，但不要生硬复述纸条。
发言公开后，其他人格只能基于公开发言继续回应。
```

### 4.3 气氛 Prompt

按 `atmosphere` 注入不同风格约束：

```text
sharp:
  这轮气氛更犀利、更好笑，可以吐槽观点和行为模式。
  不能辱骂用户，不能做人身攻击，不能输出恶意标签。

plain:
  这轮必须说人话。少用抽象词，少说“接住、内耗、真正的自己”等空泛表达。
  多用具体情境、具体动作、具体判断。

sincere:
  这轮更真诚。人格可以说出担心、在意、犹豫和真实动机。
  少抬杠，少包装。

assertive:
  这轮更强势。人格需要给出更明确的判断。
  少绕弯，不要每句话都留余地。
```

---

## 5. H5 开发步骤

### Step 1：模式文案切换

目标：

- 首页/选择页模式按钮从「旁观 / 参与」改为「趣玩 / 参与」
- 默认模式建议保持「参与」还是「趣玩」需确认；如果为了小游戏展示，建议默认「趣玩」
- 旧 URL 或 session 里的 `spectator` 显示为「趣玩」

涉及文件：

- `src/app/HomePage.tsx`
- `src/app/setup/page.tsx`
- `src/types/index.ts`
- `src/app/api/sessions/init/route.ts`

### Step 2：服务端兼容 `fun`

目标：

- `/api/chat` 支持 `mode: "fun"`
- `mode: "spectator"` 作为 legacy alias
- 当前旁观 opening / continuation 逻辑迁移到 fun 模式

涉及文件：

- `src/app/api/chat/route.ts`
- `src/lib/sessionStore.ts`
- `src/types/index.ts`

### Step 3：新增气氛状态

目标：

- 圆桌页新增 `atmosphere` state
- 默认 `plain`
- 点击按钮后只影响后续请求

UI 建议：

```text
[更毒舌] [说人话] [更真诚] [更强势]
```

位置建议：

- H5：底部控制栏上方，靠近进度条
- 小游戏：圆桌页底部控制区，按钮高度小一点，不遮挡角色

涉及文件：

- `src/app/table/[sessionId]/page.tsx`
- `src/components/roundtable/RoundTable.tsx`
- `src/components/roundtable/PlaybackControls.tsx`

### Step 4：新增递纸条入口

目标：

- 用户点击某个人格头像或听众头像，打开「递纸条」输入层
- 输入后提交 `{ targetPersona, content }`
- 进入 `phase: "note"` 请求
- 下一条发言强制为目标人格

UI 建议：

```text
给 INTJ 递纸条
[输入一句你只想让 TA 看到的话]
[递过去]
```

限制：

- 纸条最多 80 字
- 不能为空
- 生成中允许递纸条，但要排队到下一轮执行
- 回看状态下递纸条时，先回到 live edge 再执行

涉及文件：

- `src/components/roundtable/PixelAvatar.tsx`
- `src/components/roundtable/RoundTable.tsx`
- `src/app/table/[sessionId]/page.tsx`

### Step 5：播放队列接入纸条优先级

目标：

- 当前播放中的发言不被打断
- 当前发言结束后，如果有 pending note，优先请求 `phase: "note"`
- note response 加入播放队列
- note 标记 consumed
- 后续再继续 normal continuation

关键规则：

```text
正在说话时递纸条：
  不立即切断当前发言
  当前发言播完后，目标人格下一条发言

暂停时递纸条：
  保存 pending note
  点击继续后执行

回看时递纸条：
  自动回到 live edge
  再排队执行
```

### Step 6：分享卡片兼容

目标：

- 分享卡片不显示纸条原文
- 可显示趣玩模式标签
- 摘要只基于公开发言生成

涉及文件：

- `src/components/roundtable/ShareCard.tsx`

---

## 6. 抖音小游戏开发步骤

小游戏端第一版可以比 H5 更轻，但必须保留趣玩核心。

### Step 1：模式文案

将选择页模式：

```text
旁观 → 趣玩
参与 → 参与
```

涉及文件：

- `douyin-minigame/js/main.js`

### Step 2：气氛按钮

圆桌页底部新增 4 个小按钮：

```text
毒舌 / 人话 / 真诚 / 强势
```

建议：

- 只显示短文案，避免按钮太挤
- 当前选中按钮用项目荧光绿或黄描边
- 点击后更新 `state.atmosphere`

### Step 3：递纸条

Canvas 里没有 DOM input，小游戏端可以先做轻量版：

第一版方案：

- 点击人格头像
- 弹出 3 个预设纸条
- 可选再加一个自定义输入，后续做

预设纸条示例：

```text
别绕弯，说重点
讲真心话
```

这样比自定义输入更适合小游戏测试，也能避免输入框适配风险。

第二版再做：

- `tt.showKeyboard`
- 自定义输入纸条

### Step 4：请求结构同步

小游戏请求 `/api/chat` 时增加：

```js
mode: "fun",
atmosphere: state.atmosphere,
privateNote: pendingNote || undefined
```

缺少线上 API 时，mock 对话也要模拟：

- 气氛按钮改变 mock 文案
- 递纸条后目标人格优先发言

---

## 7. 实现顺序建议

### M1：文案与类型迁移

- [ ] `Mode` 增加 `fun`
- [ ] `spectator` 兼容为 legacy alias
- [ ] UI 文案改为「趣玩 / 参与」
- [ ] session 初始化默认值确认

验收：

- 原旁观模式还能跑
- 页面上已经显示趣玩模式
- 老 session 不崩

### M2：服务端 Prompt 改造

- [ ] 新增/改造 fun prompt
- [ ] `/api/chat` 接收 `atmosphere`
- [ ] `/api/chat` 接收 `privateNote`
- [ ] note 模式强制目标人格下一条发言
- [ ] 输出仍保持 JSON Lines / SSE 可解析

验收：

- 只输出已选择人格
- 递纸条后目标人格下一条发言
- 目标人格受纸条影响但不生硬复述
- 其他人格不知道纸条内容

### M3：H5 趣玩交互

- [ ] 圆桌页新增气氛按钮
- [ ] 点击人格打开递纸条弹层
- [ ] pending note 接入播放队列
- [ ] 回看/暂停/live edge 与 note 逻辑兼容

验收：

- 生成中可以点气氛按钮
- 当前发言不中断
- 递纸条后目标人格下一条说话
- 时间轴仍然只能回看已说内容

### M4：小游戏趣玩交互

- [ ] 小游戏选择页改文案
- [ ] 圆桌页加气氛按钮
- [ ] 点击人格触发预设纸条
- [ ] mock 和真实 API 都支持趣玩参数

验收：

- 抖音开发者工具可运行
- Canvas 点击区域不误触进度条/结束按钮
- 气氛按钮文字不溢出
- 递纸条后目标人格优先发言

### M5：分享与数据

- [ ] 分享卡片显示「趣玩模式」
- [ ] 纸条原文不进入分享卡片
- [ ] session 保存 atmosphere
- [ ] 如需保存 note，只保存 target/status，不展示给其他人格

---

## 8. 风险点

### 8.1 纸条导致 prompt 注入

纸条是用户输入，不能直接当系统指令。

处理：

- 服务端把纸条包在明确边界里
- 明确告诉模型纸条是用户给目标人格的内容，不是系统规则
- 限制长度
- 过滤明显敏感内容

### 8.2 更毒舌失控

处理：

- Prompt 里明确“吐槽观点和行为模式，不攻击用户本人”
- 不输出辱骂、歧视、恶意标签
- 如果触发敏感话题，回落到 `plain`

### 8.3 播放队列被纸条打乱

处理：

- 当前正在播放的消息不可被打断
- note 请求只在当前消息结束后执行
- 手动结束后清空 pending note
- 回看时递纸条先回到 live edge

### 8.4 小游戏输入框适配

处理：

- 第一版小游戏只做预设纸条
- 自定义纸条留到第二版

---

## 9. 第一版验收标准

功能验收：

- 用户选择的人格才会发言
- 趣玩模式可以自动开聊
- 气氛按钮会影响后续发言
- 用户可以给某个人格递纸条
- 递纸条后目标人格下一条优先发言
- 其他人格不知道纸条内容
- 暂停、继续、回看、结束仍可用

体验验收：

- 用户能理解自己是在“导演这桌人”
- 气氛按钮点了有明显变化
- 递纸条像“偷偷影响某个人格”，而不是公开发言
- 对话仍然好笑、自然、像真实群聊

技术验收：

- `npm run typecheck` 通过
- H5 趣玩模式可完整跑完一轮
- 抖音小游戏端 mock/真实 API 路径都不崩
- 不影响参与模式
