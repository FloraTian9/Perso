# AGENTS.md

> 项目级硬规则 + 文档索引入口。Claude Code / Codex / OpenCode / Kilo Code 等所有 AI IDE 统一从本文件读取项目规范。
> CLAUDE.md 只做跳转（`@AGENTS.md`），实际内容由本文件维护，避免重复维护两份仓库规范。

---

## 项目简介

**Perso** 是一个 MBTI 人格圆桌对话生成器。用户输入话题，不同 MBTI 人格围坐圆桌展开对话。核心体验：「太真实了、太好笑了、要发给某个人」。

完整产品需求见 `docs/PRD.md`。

---

## 当前阶段

**阶段一（知识库）：v2 已验收完成**
- v1 已作废（仅爬取 5 个网站，覆盖不足，例句多为推导生成）
- v2 已按 `docs/mbti-sources.md` 完成 raw 内容整理，并重新生成知识库
- 当前知识库包含：`knowledge/raw/` 24 个 raw 文件、`knowledge/cognitive-functions/` 9 个认知功能文件、`knowledge/personas/` 16 个人格文件
- 执行流程见 `docs/knowledge-build-plan.md`

**阶段二（产品开发）：准备启动**
- 阶段一 v2 已通过人工验收，可以进入阶段二
- 启动前读 `docs/PRD.md`

---

## 技术栈

```
前端：Next.js（React）+ Tailwind CSS（Mobile First）
API：Qwen API（默认 `qwen3.5-plus-2026-02-15`，兼容 OpenAI 格式；可通过 `QWEN_MODEL` 切换）
数据库：Supabase（PostgreSQL）
部署：Vercel
包管理：npm
```

### 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # 仅服务端使用，不得暴露给前端
QWEN_API_KEY=
```

### LLM API（Qwen）
- 模型：默认 `qwen3.5-plus-2026-02-15`（阿里云百炼免费额度模型）；可通过 `QWEN_MODEL` 切换
- max_tokens：旁观模式 2000，参与模式每轮 500
- 接口地址：https://dashscope.aliyuncs.com/compatible-mode/v1（兼容 OpenAI 格式）

---

## 目录结构

### 当前仓库现状

> 当前仓库已完成阶段一 v2 知识库搭建，产品代码尚未开始搭建。下面是当前实际存在的目录。

```
perso/
├── CLAUDE.md                           ← 跳转至 AGENTS.md（不维护具体内容）
├── AGENTS.md                           ← 本文件，唯一规范源
├── docs/
│   ├── PRD.md                          ← 产品需求
│   ├── mbti-sources.md                 ← 知识库爬取来源清单
│   ├── knowledge-build-plan.md         ← 知识库建设流程
│   ├── raw-coverage-assessment.md       ← raw 覆盖度与生成准备度评估
│   ├── changelog.md                    ← 版本记录
│   └── templates/
│       ├── raw-source-template.md
│       ├── cognitive-function-template.md
│       └── persona-template.md
├── knowledge/
│   ├── raw/                            ← v2 原始内容整理（24 个 raw 文件）
│   ├── cognitive-functions/            ← overview + 8 个认知功能文件
│   └── personas/                       ← 16 个人格文件
└── src/                                ← 当前为空，阶段二启动后再建立产品代码结构
```

### 计划目录结构（阶段二启动后）

> 以下为产品开发启动后的目标结构，不代表当前仓库已全部存在。

```
perso/
├── CLAUDE.md
├── AGENTS.md
├── docs/
├── knowledge/
├── src/
│   ├── app/                            ← Next.js App Router
│   ├── components/
│   │   ├── ui/
│   │   └── roundtable/
│   └── lib/
│       ├── qwen.ts
│       ├── supabase.ts
│       └── prompts/
│           ├── spectator.ts
│           ├── participant.ts
│           └── personas/
└── public/
```

---

## 文档索引

| 任务 | 要读的文档 |
|------|-----------|
| 任何任务开始前 | `AGENTS.md`（本文件） |
| 产品功能开发（需求） | `docs/PRD.md` |
| 产品功能开发（执行计划） | `docs/dev-plan.md` |
| 知识库相关（爬取/整理/生成） | `docs/knowledge-build-plan.md` |
| 查看爬取来源清单 | `docs/mbti-sources.md` |
| 爬取单站原始内容 | `docs/templates/raw-source-template.md` |
| 生成认知功能文件 | `docs/templates/cognitive-function-template.md` |
| 生成人格文件 | `docs/templates/persona-template.md` |
| 阶段完成后记录 | `docs/changelog.md` |

---


## 开发规范

- TypeScript 严格模式
- 组件文件名：PascalCase
- 工具函数文件名：camelCase
- API Key 通过环境变量注入，不得硬编码
- 所有对话生成使用流式输出（streaming）
- Mobile First，先确保手机端可用

---

## 常见陷阱（AI 容易踩坑的地方）

> 每次 AI 犯错或走弯路后，在这里追加一条。保持简短，每条 1-2 行。新规则追加在末尾。

_（暂无记录。）_

---

## 关键约束

### 文档层
- **单一事实源**：每条规则只在一个地方维护，其他地方只引用不复制
- **AGENTS.md 维护项目级硬规则**（技术栈 / 开发规范 / 当前阶段 / 常见陷阱）+ 文档索引。这些每次会话启动都值得加载
- **大规范在源头维护**（PRD / 模板 / 知识库流程 / 来源清单），AGENTS.md 只引用不复制
- **CLAUDE.md 不再独立维护**：只保留 `@AGENTS.md` 跳转 + 改写规则，避免同一套规范在 CLAUDE.md 和 AGENTS.md 两处漂移
- **判断标准**：如果一条规则每次会话都值得让 AI 读到，放 AGENTS.md；只在特定任务时需要的，放 docs/ 对应文档

### 知识库层
- **v1 数据作废**：`knowledge/cognitive-functions/` 和 `knowledge/personas/` 下的 v1 文件不得作为 v2 的参考，v2 必须从 raw 重建
- **v2 知识库已完成**：后续修改 `knowledge/cognitive-functions/` 或 `knowledge/personas/` 时，必须优先从 `knowledge/raw/` 追溯证据，不得凭空改写人格设定
- **爬取必须带问题**：每个站爬取前，先对照 `docs/knowledge-build-plan.md` 的问题清单（A1-A11 + B1-B12），评估本站能回答哪些问题，在 raw 文件中注明
- **必须标注来源**：知识库文件的每一小节末尾须标注来源；例句须标注类型（直接摘录 / 改写自原文 / 推导生成）
- **失败即记录不阻塞**：单站爬取失败时，写入 `knowledge/raw/[站名]-FAILED.md` 记录原因，跳过继续，等待人工补充
- **阶段二 prompt 不直接硬编码人格**：产品 prompt 应从 `knowledge/cognitive-functions/` 和 `knowledge/personas/` 提取/整理，不另起一套漂移的人格规则

### 技术层
- 技术栈已定：Next.js（React）+ Tailwind + Qwen API + Supabase + Vercel，不擅自变更
- API Key 通过环境变量注入，不硬编码
- 所有对话生成使用流式输出（streaming）
- Mobile First

---

## 每次迭代的收尾动作

1. 功能/流程改动 → 更新 `docs/changelog.md`
2. 项目级硬规则变动（技术栈 / 开发规范 / 当前阶段 / 常见陷阱） → 更新 `AGENTS.md`（**不要**动 CLAUDE.md）
3. 大规范变动（PRD / 模板 / 知识库流程 / 来源清单） → 更新对应源头文档
4. AI 犯错 / 走弯路 → 在 `AGENTS.md` 的「常见陷阱」区块追加一条规则（1-2 行）
5. 验收点完成 → 停下来等待人工验收，不自动进入下一步

---

## 重要原则

1. 任何任务开始前先读本文件，再按索引读具体文档
2. 不擅自改变技术栈
3. 知识库建完再写 prompt
4. 功能改动记录到 `docs/changelog.md`
5. **单一事实源**：大规范（PRD / 模板 / 知识库流程 / 来源清单）只在源头文档维护；项目级硬规则（技术栈 / 开发规范 / 当前阶段 / 常见陷阱）只在本文件维护
6. **不写 CLAUDE.md**：Claude 遇到要编辑 CLAUDE.md 的请求时，实际编辑 AGENTS.md
