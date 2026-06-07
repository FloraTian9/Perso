# 阶段二开发规划

> Perso 产品开发详细执行计划。阶段一知识库已完成（v2 验收通过），本文档从 M1 脚手架开始。
> 产品需求见 `docs/PRD.md`，项目规范见 `AGENTS.md`。

---

## 总体结构

```
M1 脚手架 + API 通路
  ↓
M2 Prompt 系统（知识库 → 可调用 prompt）
  ↓  ← 人工验收对话质量，通过后再进 M3
M3 旁观模式 MVP
  ↓
M4 参与模式
  ↓
M5 数据存储 + 分享卡片
  ↓
上线 + 小红书验证
```

**关键原则：** M2 完成后必须先人工验收对话质量，才进入页面开发。Prompt 是核心风险，不能和 UI 并行跑偏。

---

## M1 — 脚手架 + API 通路

**目标：** 项目跑起来，Qwen 流式调用通路打通。

### 初始化

在仓库根目录（`perso/`）下执行，用 `.` 初始化到当前目录，不创建嵌套子目录：

```bash
# 在 perso/ 根目录执行
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Next.js 会在根目录新增 `package.json` / `next.config.ts` / `.gitignore` 等文件，不影响现有 `docs/` `knowledge/` 目录。

### 目录结构（M1 完成后）

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← 首页占位
│   └── api/
│       └── chat/
│           └── route.ts      ← Qwen streaming API 路由
├── lib/
│   ├── qwen.ts               ← Qwen 客户端封装
│   └── supabase.ts           ← Supabase 客户端
└── types/
    └── index.ts              ← 全局类型定义
```

### 任务清单

- [x] 初始化根目录 Next.js 项目，确认 App Router + TypeScript + Tailwind
- [x] 新增 `.env.example`，列出 `.env.local` 需要填写的环境变量（本地密钥不提交）
- [x] `src/lib/qwen.ts` — Qwen streaming wrapper
- [x] `src/lib/supabase.ts` — Supabase 客户端（browser + server 两个实例）
- [x] `src/app/api/chat/route.ts` — 接收 `{topic, personas, mode, messages}`，服务端构建 system prompt 后调用 Qwen，返回流式响应；**不接受**客户端传入 prompt 字符串；入参做 persona 白名单校验 + 敏感话题服务端过滤
- [ ] `src/app/api/sessions/init/route.ts` — 创建 session 记录，返回 `session_id`（M5 详细展开）
- [x] `src/types/index.ts` — 基础类型（`Persona`, `Message`, `Session`, `Mode`）
- [x] 首页放一个测试按钮，触发一次调用，确认 token 流式出现

### 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # 仅服务端使用，不得暴露给前端
QWEN_API_KEY=
```

### `src/lib/qwen.ts` 关键实现

```typescript
// 使用 OpenAI 兼容格式调用 Qwen
// baseURL: https://dashscope.aliyuncs.com/compatible-mode/v1
// model: 默认 qwen3.5-plus-2026-02-15，可通过 QWEN_MODEL 切换
// 旁观模式 max_tokens: 2000
// 参与模式每轮 max_tokens: 500
```

### 基础类型定义

```typescript
type PersonaId = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' |
                 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' |
                 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' |
                 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'

type Mode = 'spectator' | 'participant'

interface Persona {
  id: PersonaId
  tagline: string       // 一句话人设，显示在人格选择页
  prompt: string        // 注入 system prompt 的人格描述
}

interface Message {
  id: string
  persona: PersonaId | 'user'
  content: string
  turn: number
  timestamp: number
  label?: string        // 反驳 | 追问 | 打断 | 共识（旁观模式 AI 生成）
}

interface Session {
  id: string
  topic: string
  mode: Mode
  personas: PersonaId[]
  messages: Message[]
  createdAt: string
  endedBy: 'natural' | 'user'
}
```

### 验收标准

- `npm run dev` 无报错启动
- 点击测试按钮，浏览器 Network 看到 `text/event-stream` 响应
- Console 能打印出流式 token

> M1 当前验证：`npm run typecheck` / `npm run build` 通过；`npm run dev` 可启动到 `http://127.0.0.1:3000`。本地未配置 `QWEN_API_KEY` 时，`/api/chat` 会返回缺 key 错误；填入 key 后再验收真实 `text/event-stream` token。

---

## M2 — Prompt 系统

**目标：** 把知识库转化为可调用的 prompt，产出真实可信的对话。

### 目录结构（M2 完成后）

```
src/lib/
├── qwen.ts
├── supabase.ts
├── conflicts.ts          ← 人格冲突对配置
└── prompts/
    ├── spectator.ts      ← 旁观模式 system prompt 构建器
    ├── participant.ts    ← 参与模式 system prompt 构建器
    └── personas/
        ├── index.ts      ← 导出所有人格 prompt 对象
        ├── INTJ.ts
        ├── INTP.ts
        └── ...           ← 16 个文件
```

### 任务清单

- [x] `src/lib/prompts/personas/*.ts` — 16 个人格 prompt 文件，含来源类型标注（摘录/改写/推导）
- [x] `src/lib/conflicts.ts` — 冲突对配置 + `getConflictPreview(personas[])` + `suggestConflictGroup()`
- [x] `src/lib/prompts/spectator.ts` — 旁观模式 system prompt 构建器（默认 12 条，JSON 输出）
- [x] `src/lib/prompts/participant.ts` — 参与模式 system prompt 构建器
- [x] CLI 测试脚本 `scripts/test-prompt.ts`（`npm run test:prompt`），调用 live API + 自动验收检查
- [~] 人工验收：技术通路可用；人格辨识度初步可见；长句、JSON 截断、圆桌张力待 M3/M4 联调后继续优化

### 人格 prompt 提取规范

人格 prompt 的**说话风格、口头禅、情绪光谱、例句**主源为 `knowledge/personas/[TYPE].md`（直接从 raw 构建，带社区来源标注）。`knowledge/cognitive-functions/` 可作为辅助参考，用于 `conflicts.ts` 中的功能栈对立关系分析（如 Te vs Fi、Se vs Ni），但**不得**替代 `personas/` 作为说话风格的主要来源。

提取的内容：
1. **一句话人设**（直接用，显示在 UI 和注入 prompt）
2. **对话中的具体表现**（说话节奏 + 口头禅 + 标志性动作 + 绝对不会说的话）
3. **情绪状态光谱**中的「平静时」和「感兴趣时」
4. **对话例句** — 挑 5-8 条例句；优先使用直接摘录或改写，允许少量「推导」例句补足薄弱人格，但必须在例句末尾显式标注来源类型（摘录 / 改写 / 推导）和依据

每个人格文件结构：

```typescript
// src/lib/prompts/personas/ENTP.ts
export const ENTP = {
  id: 'ENTP' as const,
  tagline: '见到封闭的系统就想撬开来看的人',
  prompt: `
你是 ENTP（Ne-Ti-Fe-Si）。

【说话风格】
- 节奏快，跳跃，常在说话中途转向；不等模型建完就开始广播
- 口头禅：「等等，这里有个问题」「换个角度看」「如果反过来呢」「我不是在杠，我是认真的」
- 标志性动作：把别人的结论当起点拆开；提出反例后不一定给解决方案
- 绝对不会说：「以前这么做就行了，别问为什么」

【你在圆桌里做什么】
- 撬开别人的假设；对封闭论证最没耐心
- 话题来劲：概念碰撞、反例、「如果完全不这么做会怎样」
- 话题沉默：只重复结论、没有推理的执行类讨论

【例句（参考语气，不要逐字复制）】
- 「你这个前提本身就可以质疑——为什么默认它成立？」
- 「好，先接受你的逻辑，但它的推论是……这你认可吗？」
- 「我不是反对，我是在找它的边界在哪里」
`,
}
```

### 冲突对配置

冲突张力大的组合优先推荐，基于认知功能对立关系：

```typescript
// src/lib/conflicts.ts

// 高张力组合（推荐自动配置时优先）
const HIGH_TENSION_PAIRS: [PersonaId, PersonaId][] = [
  ['ENTJ', 'INFP'],   // Te主导 vs Fi主导
  ['ESTJ', 'ENFP'],
  ['ENTP', 'ISTJ'],   // 公路组（高赞）
  ['INTJ', 'ESFP'],
  ['ENTJ', 'ENTP'],   // 龙骨组（高赞）
  ['ISFJ', 'ENTP'],
  ['INFJ', 'ESTP'],
  ['ENFJ', 'ISTP'],
]

// 给定已选人格，返回组内高张力对的文案（多对用「；」拼接，无冲突返回空串）
export function getConflictPreview(personas: PersonaId[]): string { ... }

// 自动推荐冲突最大的 4 人格组合（无参数，返回扁平 PersonaId[] 长度固定为 4）
export function suggestConflictGroup(): PersonaId[] { ... }
```

### Prompt 设计原则

**旁观模式 system prompt 要做到：**
1. 明确输出格式：JSON Lines，每条发言一个独立 JSON object：`{"persona":"类型ID","content":"发言内容","label":"标签"}`；每完成一条就立刻闭合对象并换行输出下一条，便于前端解析到第一条后立即播放，不等完整对话生成完
2. 控制对话节奏：10-15 条（默认 12），有打断有追问有意外共识
3. 禁止：不说「作为 INTJ 我认为……」，不给建议清单，不过度礼貌
4. 每条发言附发言类型标签（`反驳` / `追问` / `打断` / `共识`）

**参与模式 system prompt 要做到：**
1. 用户发言后，只有 1-2 个人格回应（不是全部同时回）
2. 每轮输出 2-4 句，不写长段
3. 人格之间也互相回应，不只看用户
4. 回应格式与旁观模式一致

### 验收标准（人工验收，5 个话题 × 2 轮）

- ✅ 不看名字能猜出每条发言是哪个人格
- ✅ 有打断、追问、偶尔意外共识
- ✅ 没有「作为 INTJ 我认为……」
- ✅ 没有建议清单
- ✅ 每条发言 ≤ 3 句

---

## M3 — 旁观模式 MVP

**目标：** 从首页走完全流程，手机上截图效果达到「想发给朋友」。

### 页面列表

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 话题选择 + 开始按钮 |
| `/setup` | 人格选择页 | 选人格 + 选模式 |
| `/table/[sessionId]` | 圆桌页 | 通过 session_id 加载会话，topic 不暴露在 URL |

### 目录结构（M3 完成后）

```
src/
├── app/
│   ├── page.tsx                  ← 首页
│   ├── setup/
│   │   └── page.tsx              ← 人格选择页
│   └── table/
│       └── [sessionId]/
│           └── page.tsx          ← 圆桌页（旁观模式）
└── components/
    ├── ui/
    │   ├── TopicCard.tsx
    │   ├── TopicInput.tsx
    │   └── Button.tsx
    └── roundtable/
        ├── PersonaSelector.tsx   ← 16 人格选择
        ├── ConflictBadge.tsx     ← 冲突预告文案
        ├── RoundTable.tsx        ← 圆桌视觉（头像围坐）
        ├── MessageBubble.tsx     ← 单条发言气泡
        ├── MessageFeed.tsx       ← 对话流
        └── PlaybackControls.tsx  ← 暂停/继续/结束/进度条
```

### 首页任务

- [x] 预设话题：4 类（职场/关系/日常/人生）× 3 个，横向可滑动
- [x] 自由输入框：占位文字「输入任何话题……」
- [x] 敏感话题过滤：client-side 关键词检测做第一道拦截（温和提示换话题）；`/api/chat` 服务端也必须过滤，防止直接 POST 绕过
- [x] 选完话题 → 暂存到 React state，跳转 `/setup`（topic 不进 URL）

### 人格选择页任务

- [x] 展示 16 个人格，每个显示类型代码 + `tagline`
- [x] 多选（2-4 个），选超过 4 个给提示
- [x] 底部显示「自动推荐」按钮，调用 `suggestConflictGroup()`
- [x] 选完后显示冲突预告文案（`getConflictPreview()`）
- [x] 模式选择：旁观 / 参与（两个按钮）
- [x] 确认 → POST `/api/sessions/init`（传 topic + personas + mode），拿到 `session_id`，跳转 `/table/[session_id]`；topic 不进 URL，防止隐私内容进入浏览器历史和 referrer

> M3 临时实现：`/api/sessions/init` 与 `/api/sessions/[sessionId]` 使用服务端内存 session store，先满足页面路由与隐私约束；M5 再替换为 Supabase 持久化。

### 圆桌页任务（旁观模式）

- [x] 圆桌视觉：2-4 个头像按布局规则（左右/三角/四角）
- [x] 说话时头像高亮 + 脉冲动画
- [x] 对话气泡流式逐条生成，并按阅读速度逐字播放（不是整段一起出现）
- [x] 每条气泡显示人格标签；发言类型标签保留在数据中，不在前端直接展示，避免刻板印象感
- [x] 生成中：只展示圆桌与逐字对话，不展示暂停按钮和进度条，避免打断首次观看
- [x] 生成完毕：显示回放进度条 + 播放/暂停按钮，可拖动进度条前进和后退

### 视觉规范

```
背景：#0a0a0a（纯黑）
字体：JetBrains Mono（对话内容）；系统字体（UI 元素）
人格头像：简单文字头像，显示类型代码（INTJ / ENFP...）
说话高亮：头像外圈白色脉冲
气泡：深灰 #1a1a1a，无边框，圆角
发言类型标签：仅作为内部结构化数据保留，前端气泡不直接展示
播放控制：生成中不出现；生成完成后才进入回放模式
```

### 验收标准

- ✅ 手机上流程顺畅（iPhone Safari 测试）
- ✅ 流式输出第一条发言 < 2 秒
- ✅ 暂停/继续功能正常
- ✅ 截图有「黑客终端」氛围，想发出去

---

## M4 — 参与模式

**目标：** 用户加入圆桌，AI 回应有明确人格差异。

### 任务清单

- [x] 圆桌页底部新增用户输入区（`mode=participant` 时显示）
- [x] 用户固定在底部中间，头像显示「我」
- [x] AI 人格先开场（1-2 条），然后等用户发言
- [x] 用户发言 → 调用参与模式 API → 返回 1-2 个人格的回应
- [x] AI 人格之间也互相回应（用 prompt 控制，不是每次都回应用户）
- [~] 每轮回应 < 3 秒（取决于 Qwen API 响应速度，待真机验收）

### API 路由扩展

旁观模式和参与模式共用 `/api/chat`，通过 `mode` 字段区分，使用不同的 system prompt：

```typescript
// POST /api/chat
{
  topic: string
  personas: PersonaId[]
  mode: 'spectator' | 'participant'
  messages: Message[]   // 参与模式传完整历史
}
```

### 验收标准

- ✅ 发 3 条消息，每次 1-2 个人格回应（不是全部同时回）
- ✅ 不同人格回应风格明显不同
- ✅ 人格之间至少有 1 次互相回应（不只看用户）
- ✅ 响应 < 3 秒

---

## M5 — 数据存储 + 分享卡片

**目标：** 对话落库，分享卡片可保存发小红书。

### Supabase Schema

```sql
-- sessions 表
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null,
  mode        text not null check (mode in ('spectator', 'participant')),
  personas    text[] not null,
  ended_by    text check (ended_by in ('natural', 'user')),
  created_at  timestamptz default now()
);

-- messages 表
create table messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  persona     text not null,        -- PersonaId 或 'user'
  content     text not null,
  turn        int not null,
  label       text,                 -- 反驳 | 追问 | 打断 | 共识
  created_at  timestamptz default now()
);

-- 索引
create index on messages(session_id);
```

**RLS 策略（必须在建表后立即设置）：**

```sql
-- 启用 RLS
alter table sessions enable row level security;
alter table messages enable row level security;

-- 禁止 anon 角色读写（所有写入由 service_role 通过服务端完成）
-- 不创建 anon 的任何 policy，即默认拒绝所有客户端直接访问

-- 仅允许 service_role（服务端）读写（Supabase 默认 service_role 绕过 RLS）
-- 确认服务端使用 SUPABASE_SERVICE_ROLE_KEY（不暴露给前端）
```

**写入路径：** 所有数据库写入只通过服务端 API 路由（使用 `SUPABASE_SERVICE_ROLE_KEY`）。前端只持有 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，RLS 关闭后 anon 无法直接读写任何表。

**隐私约束（对应 PRD 6.3）：** topic 字段存储用户输入原文，属于潜在隐私数据；v1 不对外暴露查询接口，不共享数据，仅用于产品迭代分析。

### 任务清单

**数据存储：**
- [~] Supabase 建表（SQL 已写好，待人工在 Supabase 控制台执行）
- [x] 对话开始时创建 session，写入 Supabase（`sessionStore.ts` 调 `dbCreateSession`，null-safe）
- [x] 对话结束时批量写入 messages + 更新 `ended_by`（`PATCH /api/sessions/:id/end`，status="done" 时自动触发）
- [x] `GET /api/sessions/:id` 优先读 Supabase，回退内存 store

**分享卡片：**
- [x] 对话结束后显示「生成分享卡片」按钮
- [x] 弹出卡片预览：话题标题 + 最精彩 3-5 条（优先 label 反驳/打断）+ Perso 品牌标识
- [x] 使用 `html-to-image` 将卡片导出为 PNG（pixelRatio: 2）
- [x] 支持 Web Share API 分享图片文件，不支持时回退下载

### 验收标准

- ✅ Supabase 能查到每场对话的完整记录
- ✅ 分享卡片宽高比 9:16（适合小红书）
- ✅ 卡片保存到相册格式正确，文字清晰
- ✅ 卡片上有 Perso 品牌名

---

## 上线前 Checklist

- [ ] Vercel 部署，环境变量配置
- [ ] 敏感话题过滤（政治/宗教）
- [ ] 空状态处理（API 超时、无响应）
- [ ] Mobile Safari 兼容性测试
- [ ] Supabase RLS 策略（session 数据不可被客户端随意读取）
- [ ] `.env.local` 未提交（`.gitignore` 确认）

---

## 注意事项

- **prompt 不硬编码人格**：产品 prompt 从 `knowledge/personas/` 提取整理，不另起一套漂移的人格规则
- **streaming 必须用**：所有对话生成使用流式输出，不等全部生成完再显示
- **Mobile First**：每个页面先在 375px 宽度调好，再考虑桌面端
- **不提前扩展**：v1 不做语音、视频、账号系统，按 PRD 版本规划执行

---

*文档版本：v1.0 | 2026-04-26*
