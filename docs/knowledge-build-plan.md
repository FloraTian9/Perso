# 知识库建立任务（阶段一 v2）

## 任务目标
建立 MBTI 认知功能知识库，存放在 knowledge/ 目录下。

v1 只爬取了 5 个网站，覆盖不足。v2 将按 `docs/mbti-sources.md` 全量爬取，再重新整理知识库。

---

## 来源策略（canonical policy）

### 范围
**全量爬取 `docs/mbti-sources.md` 中列出的所有网站（22 个唯一域名）**。

### 爬取原则
- 每站爬取"关键信息"而非整站镜像
- 主要站（psychologyjunkie / personalityjunkie / totypes / typeinmind / jobcannon 等）尽量爬全
- 带着"模板需要什么"的问题去爬（见 `问题清单` 一节）

### 失败处理
- 单个网站失败：记录失败原因到 `knowledge/raw/[网站名]-FAILED.md`，跳过继续
- 失败站点后续由人工手动上传内容补齐
- 不因单站失败阻塞整体流程

### v2 完成条件
- `mbti-sources.md` 中列出的所有网站都已尝试爬取
- 成功站点的原始内容保存到 `knowledge/raw/[网站名].md`
- 失败站点有书面记录
- 基于 raw 数据重新生成 8 个认知功能文件 + 16 个人格文件

---

## 问题清单（爬取时带着这些问题找答案）

> 问题清单与 `docs/templates/` 的模板章节一一对应，爬取时逐条找证据，避免后续靠推导补洞。

### A. 认知功能相关（对应 cognitive-function-template.md）

| # | 问题 | 对应模板章节 |
|---|------|-------------|
| A1 | **核心定义** — 这个功能的本质是什么？原文定义怎么说？ | 来源定义 |
| A2 | **功能驱动力** — 满足什么心理需求？底层动机是什么？ | 核心驱动力 |
| A3 | **核心行为特征** — 5-8 条可观察行为 | 核心特征 |
| A4 | **对立功能区别** — Fi vs Fe / Ti vs Te / Ni vs Ne / Si vs Se 本质差异，同一场景两者反应对比 | 与对立功能的本质区别 |
| A5 | **栈位表现** — 主导/辅助/第三/劣势位置的不同表现 | 在不同功能栈位置的表现 |
| A6 | **主要使用类型** — 哪些类型在哪个位置使用这个功能 | 主要使用类型 |
| A7 | **组合效应** — 搭配不同辅助功能（如 Fi+Ne vs Fi+Se）的差异 | 与其他功能的组合效应 |
| A8 | **圆桌行为模式** — 多人讨论中扮演什么角色、何时沉默/爆发 | 在圆桌对话中的行为模式 |
| A9 | **对话表现** — 说话节奏、句式偏好、压力下变化、不会说的话 | 在对话中的具体表现 |
| A10 | **功能代表例句** — 可识别这个功能的典型话语 | 对话例句 |
| A11 | **压力反应** — 劣势位置（grip/inferior）失控的具体表现 | 在不同功能栈位置的表现（劣势位） |

### B. 人格相关（对应 persona-template.md）

| # | 问题 | 对应模板章节 |
|---|------|-------------|
| B1 | **一句话人设** — 生活化描述，不用学术术语 | 一句话人设 |
| B2 | **核心驱动力** — 这个类型最在乎什么 | 核心驱动力 |
| B3 | **信息处理** — 听到话题的第一/第二反应，与其他类型差别 | 信息处理方式 |
| B4 | **决策方式** — 面对分歧的判断逻辑、能说服他的论据 | 决策方式 |
| B5 | **圆桌角色** — 发起者/回应者/总结者/搅局者、激活和沉默话题 | 在圆桌对话中的角色 |
| B6 | **跨类型互动** — 面对 Te/Fe/Ne/Fi/Si/Se 主导时的反应 | 跟不同类型互动的差异 |
| B7 | **话题反应差异** — 严肃话题 vs 轻松话题 vs 价值观话题的投入度 | 不同话题类型的反应差异 |
| B8 | **情绪光谱** — 平静/兴奋/被认同/被反驳/被误解/失控时的表现 | 情绪状态光谱 |
| B9 | **说话特征** — 节奏、句式、口头禅、标志性动作、不会说的话 | 对话中的具体表现 |
| B10 | **真实例句** — 可直接用于 prompt 的对话样本（按情绪分组） | 对话例句 |
| B11 | **争论风格** — 冲突时的反应（arguing style by type） | 情绪状态光谱（被反驳/被误解） |
| B12 | **类型对比** — 相邻类型（如 INFJ vs INTJ）的区别 | 多处章节的交叉验证 |

### 爬取操作建议
- 每站爬取前，先评估它主要能回答 A / B 的哪几个问题（在 raw 文件摘要中注明）
- 主要站（psychologyjunkie / personalityjunkie / totypes / typeinmind 等）尽量覆盖 A1-A11 + B1-B12 全部
- 辅助站聚焦自己最擅长的问题即可（如 jobcannon 重点回答 A5/A11，myersbriggs 重点回答 B4/B11）

---

## 证据标注规范

所有知识库文件中，每小节内容末尾标注来源，格式：

> 来源：totypes.com + psychologyjunkie.com

例句须逐条标注类型（写在句末括号内）：
- `（直接摘录 — source）` 原文引用
- `（改写自原文 — source）` 基于原文改写
- `（推导生成）` 基于认知功能推导，无直接来源

---

## 目录结构
```
knowledge/
├── raw/                                  （v2 新增，一站一文件）
│   ├── psychologyjunkie.md
│   ├── personalityjunkie.md
│   ├── totypes.md
│   ├── ...（每个成功爬取的站一个）
│   └── [网站名]-FAILED.md               （失败站点，记录失败原因）
├── cognitive-functions/
│   ├── overview.md
│   └── Ni.md / Ne.md / Ti.md / Te.md / Fi.md / Fe.md / Si.md / Se.md
└── personas/
    └── INTJ.md / ...（16个）
```

### raw 文件模板
详见 [docs/templates/raw-source-template.md](templates/raw-source-template.md)。头部元数据、问题覆盖矩阵、每条证据的来源标注均为硬约束，主体从 4 种预设结构（按人格 / 按功能 / 按冲突对 / 按主题）中选一种匹配站点原生组织方式。

---

## 执行步骤

### 第一步：全量爬取
按 `mbti-sources.md` 顺序逐站爬取，每站产出 `knowledge/raw/[网站名].md`。

推荐分批：
- **批次 A**（核心认知功能站）：psychologyjunkie / personalityjunkie / totypes / typeinmind / jobcannon / cognitiveprocesses
- **批次 B**（辅助定义站）：personalityhacker / michaelcaloz / mbti.cat / personality-type / truity / assessfirst
- **批次 C**（冲突/沟通风格站）：myersbriggs / mbtionline / themyersbriggs
- **批次 D**（中文站）：lucaluo / zhihu / jungus
- **批次 E**（社区/测试）：sakinorva / xiaohongshu / personalitycafe / typemyvibe

### 第二步：raw 完整性检查（验收点 0）
所有批次完成后停下来，输出抓取汇总：
- 成功/失败列表
- 每站抓到的页面数和字数
- 失败原因分类（SSL / 403 / timeout / 其他）

**验收 checklist：**
- [ ] 22 个站点都已尝试
- [ ] 失败站点有书面记录
- [ ] 成功站点覆盖了问题清单中大部分问题

**等待人工验收后继续。**

### 第三步：提取整理
基于 raw 数据按 8 个认知功能分类整理，每小节标注来源。

### 第四步：生成认知功能文件（验收点 1）
按照 `docs/templates/cognitive-function-template.md` 生成 9 个文件。

**验收 checklist：**
- [ ] 每个功能文件有 totypes.com 的来源定义
- [ ] "与对立功能的本质区别"有具体场景对比
- [ ] 例句均已标注来源类型
- [ ] 内容冲突处已注明以哪个来源为准

**等待人工验收后继续。**

### 第五步：生成核心人格文件（验收点 2）
先生成 4 个冲突张力最大的人格：INTJ / ENFP / INFP / ENTJ。

**验收 checklist：**
- [ ] 说话节奏、句式偏好可区分类型（不能互换）
- [ ] 例句读完能"认出"这个类型
- [ ] 至少 2 条例句有来源标注（非全部推导）
- [ ] 劣势功能爆发场景有具体细节

**等待人工验收后继续。**

### 第六步：生成剩余 12 个人格文件（验收点 3）
按认知功能栈相似度分组：
- Ni 组：INFJ / ENFJ
- Ti 组：INTP / ENTP / ISTP / ESTP
- Fi/Si 组：ISFP / ESFP / ISFJ / ESFJ
- Te/Si 组：ISTJ / ESTJ

**验收 checklist：**
- [ ] 同组类型（如 INFJ vs INTJ）可通过例句区分
- [ ] 推导生成例句占比 ≤ 60%（超出须在 changelog 注明）

### 第七步：完成记录
在 `docs/changelog.md` 写入 v2 版本条目：
- 完成日期
- 实际成功/失败的站点列表
- 生成文件数量
- 推导内容占比估计
- 相比 v1 的改进点
