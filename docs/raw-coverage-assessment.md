# Raw 文件覆盖度评估与补爬策略

> 评估日期：2026-04-26（v4，基于 `knowledge/raw/` 24 个文件全量复核）
> 评估范围：`knowledge/raw/` 下全部 24 个 raw 文件，共 7,963 行 raw 内容
> 评估目的：判断现有 raw 是否足以支撑生成 8 个认知功能文件 + 16 个人格文件，并记录仍需注意的弱项
> v3→v4 主要变化：逐文件复核覆盖矩阵，新增全局覆盖统计、8 功能/16 类型索引覆盖统计；结论不变——可立即进入生成

---

## 一、总体结论

**可以支撑后续生成认知功能文件和人格文件。**

- **认知功能文件（8 个 + overview）**：可立即启动。A1–A6/A9/A11 覆盖强；A7/A8/A10 为中等覆盖，但可通过多源交叉聚合补足。
- **人格文件（16 个）**：可立即启动。B1–B6/B8/B9/B11/B12 覆盖良好；B7 和 B10 是相对弱项，但已达到可生成门槛。
- **不需要 P0 补爬**：没有会阻塞生成的缺口。
- **生成时必须注意标注**：B7 中部分 S 型话题反应、A10 中部分 Si/Se 功能例句，需要标注为「改写自原文」或「推导生成」。

---

## 二、文件清单（24 个）

| 文件 | 语言 | 主体结构 | 核心价值 | 行数 |
|------|------|----------|----------|------|
| `assessfirst.md` | 英 | 按人格 | B1/B2 一句话人设与核心驱动（16型全有） | 309 |
| `cognitiveprocesses.md` | 英 | 按功能+人格 | **A1–A9/A11/B全系列** 最权威综合理论源（Linda Berens/Nardi） | 441 |
| `jobcannon.md` | 英 | 按人格 | A1/A2/A5 职业视角，A11 inferior stress，16型全有 | 339 |
| `jungus.md` | 中 | 按人格 | B3/B4/B12 易混淆类型识别，top-3 机制 | 139 |
| `lucaluo.md` | 中 | 按功能 | A4 Ni/Si/Te/Ti 中文对比，INTJ/INTP/ENFJ 深度 | 155 |
| `mbti.cat.md` | 英 | 按主题 | **A4/A11/B7/B8 最佳**：情绪触发、压力、话题反应；B6 120+ 配对索引 | 339 |
| `mbtionline.md` | 英 | 按人格 | B4/B6/B8/B9/B11/B12 关系/冲突/说话（16型全有） | 244 |
| `michaelcaloz.md` | 英 | 按人格 | B12 INFJ/INFP/INTJ/INTP 误判对比（N型专项） | 264 |
| `myersbriggs.md` | 英 | 按功能 | A2/A5/A6 官方功能栈表（最权威） | 146 |
| `personality-type.md` | 英 | 按人格+功能 | A1–A6 Beebe 原型语言，16型全有 | 403 |
| `personalitycafe.md` | 英 | 论坛/社区 | **B6/B7/B9/B11** 真实社区对比讨论帖，话题偏好场景丰富 | 198 |
| `personalityhacker.md` | 英 | 按人格 | A7 Car Model 组合效应，A11 loop/grip，B4/B8 | 280 |
| `personalityjunkie.md` | 英 | 按人格 | **A1–A6/B2/B3/B5** 全16型功能栈发展阶段，最大单文件 | 978 |
| `psychologyjunkie.md` | 英 | 按主题 | A11 八影子功能（16型全覆盖），B11 争论风格 | 515 |
| `sakinorva.md` | 英 | 测试平台 | B9/B12 测试结果辅助参考（理论立场特殊） | 157 |
| `themyersbriggs.md` | 英 | 官方报告 | **B4/B6/B8/B9/B11** ENFP/ESFP 官方详细行为报告 | 169 |
| `totypes.md` | 中 | 按功能 | A1/A2/A4 Beebe 动词链 + Jung 原文（纯定义源） | 187 |
| `truity.md` | 英 | 按人格 | B1/B2/B9/B12 通俗版（16型全有） | 315 |
| `typeinmind.md` | 英 | 按人格 | A1–A6/A9/B2–B5 完整，16型全有 | 337 |
| `typemyvibe.md` | 英 | 按人格 | **A1–A6/A8–A10/B1–B6/B9–B12 最全**：聊天语言标记 + 示例消息（16型全有） | 341 |
| `xhs.md` | 中 | 按主题 | **B9/B10/B11** 中文社区自述；ISTJ/ISFJ/ESFJ/ESTJ/ESFP 专项；B7 IN型文风对比 | 630 |
| `zhihu-community.md` | 中 | 按主题 | **A8/A10/B5/B8/B10** 圆桌场景 + 第一人称例句（IN型最丰） | 251 |
| `zhihu-supplement.md` | 中 | 按类型 | **B1/B2/B9/B10/B12** ESFJ/ESTJ/ENTJ/ENFJ/ESTP/ISTP/ESFP/ISFP 专项（1478条知乎） | 327 |
| `zhihu.md` | 中 | 按人格 | A1–A7/B1–B4/B8/B11/B12 若化生专栏（八维动力学，16型全有） | 499 |

---

## 三、全局覆盖统计（按 raw 文件自带覆盖矩阵复核）

> 统计口径：24 个 raw 文件各自的 A1–A11 / B1–B12 覆盖矩阵。数字表示有多少文件标记为 ✅ / 🟡 / ❌。

### A 系列：认知功能文件（A1–A11）

| 问题 | 全覆盖 ✅ | 部分 🟡 | 无 ❌ | 生成判断 | 主要可用来源 |
|------|----------|---------|------|----------|--------------|
| A1 核心定义 | 13 | 6 | 5 | ✅ 强 | `cognitiveprocesses.md` / `totypes.md` / `zhihu.md` / `personality-type.md` / `personalityjunkie.md` |
| A2 功能驱动力 | 10 | 10 | 4 | ✅ 强 | `cognitiveprocesses.md` / `typeinmind.md` / `typemyvibe.md` / `zhihu.md` / `myersbriggs.md` |
| A3 核心行为特征 | 16 | 7 | 1 | ✅ 强 | `typemyvibe.md` / `typeinmind.md` / `cognitiveprocesses.md` / `zhihu.md` / `personalitycafe.md` |
| A4 对立功能区别 | 5 | 14 | 5 | ✅ 良 | `totypes.md` / `lucaluo.md` / `mbti.cat.md` / `zhihu.md` / `personality-type.md` |
| A5 栈位表现 | 12 | 5 | 7 | ✅ 强 | `cognitiveprocesses.md` / `myersbriggs.md` / `typeinmind.md` / `typemyvibe.md` / `personalityjunkie.md` |
| A6 主要使用类型 | 12 | 6 | 6 | ✅ 强 | `cognitiveprocesses.md` / `myersbriggs.md` / `personality-type.md` / `personalityhacker.md` / `personalityjunkie.md` |
| A7 组合效应 | 4 | 12 | 8 | 🟡 中 | `personalityhacker.md` / `zhihu.md` / `totypes.md` / `lucaluo.md` / `cognitiveprocesses.md` |
| A8 圆桌行为模式 | 4 | 17 | 3 | 🟡 中 | `cognitiveprocesses.md` / `zhihu-community.md` / `xhs.md` / `typemyvibe.md` |
| A9 对话表现 | 11 | 12 | 1 | ✅ 良 | `typemyvibe.md` / `zhihu-community.md` / `zhihu-supplement.md` / `xhs.md` / `cognitiveprocesses.md` |
| A10 功能代表例句 | 3 | 1 | 20 | 🟡 中 | `typemyvibe.md` / `zhihu-community.md` / `xhs.md` / `michaelcaloz.md` |
| A11 压力反应 | 8 | 15 | 1 | ✅ 良 | `psychologyjunkie.md` / `personalityhacker.md` / `zhihu.md` / `mbti.cat.md` / `jobcannon.md` |

### B 系列：人格文件（B1–B12）

| 问题 | 全覆盖 ✅ | 部分 🟡 | 无 ❌ | 生成判断 | 主要可用来源 |
|------|----------|---------|------|----------|--------------|
| B1 一句话人设 | 13 | 9 | 2 | ✅ 强 | `assessfirst.md` / `truity.md` / `typemyvibe.md` / `cognitiveprocesses.md` / `zhihu-supplement.md` |
| B2 核心驱动力 | 14 | 9 | 1 | ✅ 强 | `assessfirst.md` / `typemyvibe.md` / `zhihu.md` / `cognitiveprocesses.md` / `personalityjunkie.md` |
| B3 信息处理 | 15 | 6 | 3 | ✅ 强 | `typemyvibe.md` / `typeinmind.md` / `cognitiveprocesses.md` / `zhihu.md` / `personalitycafe.md` |
| B4 决策方式 | 15 | 6 | 3 | ✅ 强 | `typemyvibe.md` / `typeinmind.md` / `zhihu.md` / `mbtionline.md` / `themyersbriggs.md` |
| B5 圆桌角色 | 4 | 16 | 4 | 🟡 中 | `cognitiveprocesses.md` / `zhihu-community.md` / `typemyvibe.md` / `xhs.md` / `personalityjunkie.md` |
| B6 跨类型互动 | 8 | 12 | 4 | ✅ 良 | `mbti.cat.md` / `personalitycafe.md` / `xhs.md` / `zhihu.md` / `mbtionline.md` |
| B7 话题反应差异 | 2 | 5 | 17 | 🟡 中偏弱 | `personalitycafe.md` / `mbti.cat.md` / `xhs.md` / `cognitiveprocesses.md` / `zhihu-community.md` |
| B8 情绪光谱 | 9 | 14 | 1 | ✅ 良 | `mbti.cat.md` / `psychologyjunkie.md` / `zhihu.md` / `xhs.md` / `zhihu-supplement.md` |
| B9 说话特征 | 11 | 11 | 2 | ✅ 强 | `typemyvibe.md` / `zhihu-community.md` / `xhs.md` / `zhihu-supplement.md` |
| B10 真实例句 | 4 | 1 | 19 | 🟡 中 | `typemyvibe.md` / `zhihu-community.md` / `xhs.md` / `zhihu-supplement.md` / `michaelcaloz.md` |
| B11 争论风格 | 8 | 14 | 2 | ✅ 良 | `psychologyjunkie.md` / `typemyvibe.md` / `zhihu-community.md` / `xhs.md` / `personalitycafe.md` |
| B12 类型对比 | 13 | 9 | 2 | ✅ 良 | `michaelcaloz.md` / `personalitycafe.md` / `zhihu.md` / `jungus.md` / `zhihu-supplement.md` |

---

## 四、索引覆盖检查

### 8 个认知功能

| 功能 | 出现文件数 | 判断 |
|------|------------|------|
| Ni | 21 | ✅ 充分 |
| Ne | 19 | ✅ 充分 |
| Ti | 21 | ✅ 充分 |
| Te | 22 | ✅ 充分 |
| Fi | 22 | ✅ 充分 |
| Fe | 22 | ✅ 充分 |
| Si | 20 | ✅ 充分 |
| Se | 21 | ✅ 充分 |

**结论**：8 个功能都有大量跨站证据，足以生成独立功能文件。弱项不在「有没有资料」，而在 A10 例句需要按功能从人格/社区素材中重新归纳。

### 16 个人格

| 类型 | 出现文件数 | 判断 |
|------|------------|------|
| INTJ | 21 | ✅ 充分 |
| INTP | 20 | ✅ 充分 |
| ENTJ | 20 | ✅ 充分 |
| ENTP | 21 | ✅ 充分 |
| INFJ | 20 | ✅ 充分 |
| INFP | 18 | ✅ 充分 |
| ENFJ | 21 | ✅ 充分 |
| ENFP | 21 | ✅ 充分 |
| ISTJ | 19 | ✅ 充分 |
| ISFJ | 19 | ✅ 充分 |
| ESTJ | 18 | ✅ 充分 |
| ESFJ | 21 | ✅ 充分 |
| ISTP | 19 | ✅ 充分 |
| ISFP | 18 | ✅ 充分 |
| ESTP | 19 | ✅ 充分 |
| ESFP | 21 | ✅ 充分 |

**结论**：16 型全部有跨站覆盖，不存在某个人格无法生成的问题。

---

## 五、B10 各类型例句存量细分

> 判断标准：直接可用例句（含 `typemyvibe.md` 示范消息、各站高赞第一人称自述、中文社区口头禅/冲突表达）。
> ✅ 够用 = ≥8 条；🟡 基本够 = 5–7 条；❌ 不足 = <5 条。

| 类型 | 估计可用例句数 | 主要来源 | 状态 |
|------|----------------|----------|------|
| INTP | 10–12 | `zhihu-community.md` / `typemyvibe.md` / `xhs.md` | ✅ 够用 |
| INTJ | 8–10 | `zhihu-community.md` / `typemyvibe.md` / `xhs.md` | ✅ 够用 |
| ENTP | 8–10 | `zhihu-community.md` / `typemyvibe.md` / `xhs.md` | ✅ 够用 |
| INFJ | 8–10 | `zhihu-community.md` / `typemyvibe.md` / `xhs.md` | ✅ 够用 |
| INFP | 8–10 | `zhihu-community.md` / `typemyvibe.md` / `xhs.md` | ✅ 够用 |
| ENFP | 6–8 | `typemyvibe.md` / `zhihu-community.md` / `xhs.md` | ✅ 基本够 |
| ESFJ | 8–10 | `xhs.md` / `typemyvibe.md` / `zhihu-supplement.md` | ✅ 够用 |
| ESTJ | 7–9 | `xhs.md` / `typemyvibe.md` / `zhihu-supplement.md` | ✅ 基本够 |
| ENTJ | 7–9 | `typemyvibe.md` / `zhihu-supplement.md` / `zhihu-community.md` | ✅ 基本够 |
| ENFJ | 7–9 | `typemyvibe.md` / `zhihu-supplement.md` / `xhs.md` | ✅ 基本够 |
| ISTJ | 10–12 | `xhs.md` 口头禅专项 / `typemyvibe.md` | ✅ 够用 |
| ISFJ | 10–12 | `xhs.md` 口头禅专项 / `typemyvibe.md` | ✅ 够用 |
| ESTP | 6–8 | `zhihu-supplement.md` / `typemyvibe.md` / `zhihu-community.md` | 🟡 基本够 |
| ISTP | 6–8 | `zhihu-supplement.md` / `typemyvibe.md` | 🟡 基本够 |
| ISFP | 7–9 | `zhihu-supplement.md` / `typemyvibe.md` / `zhihu.md` | ✅ 基本够 |
| ESFP | 6–8 | `xhs.md` ESFP 专项 / `typemyvibe.md` / `zhihu-supplement.md` | 🟡 基本够 |

**结论**：全 16 型均达到「基本够」以上。ESTP / ISTP / ESFP 生成时需提高「改写自原文」比例，不阻塞生成。

---

## 六、生成准备度评估

### 认知功能文件（8 个 + overview）

**✅ 可以立即启动。**

- **理论层**：A1–A6 强覆盖，可直接生成来源定义、核心驱动力、核心特征、对立功能区别、栈位表现、主要使用类型。
- **互动层**：A8/A9 中等到良好覆盖，可从 `cognitiveprocesses.md`、`typemyvibe.md`、`zhihu-community.md`、`xhs.md` 交叉生成圆桌和对话表现。
- **压力层**：A11 覆盖良好，`psychologyjunkie.md`、`mbti.cat.md`、`jobcannon.md`、`personalityhacker.md` 足够支撑 grip / inferior / shadow 描述。
- **例句层**：A10 是主要弱项。功能例句不应只找显式「Ni 说」这类材料，而应从主导/辅助该功能的人格例句中归纳，且明确标注「直接摘录 / 改写自原文 / 推导生成」。

**建议生成顺序**：Ni → Ne → Ti → Te → Fi → Fe → Si → Se。

### 人格文件（16 个）

**✅ 可以立即启动。**

| 批次 | 类型 | 状态 | 说明 |
|------|------|------|------|
| 第一批 | INTP / INTJ / ENTP / INFJ / INFP / ENFP | ✅ 立即启动 | B10 充足，理论 + 中文社区双覆盖 |
| 第二批 | ENTJ / ENFJ / ESFJ / ESTJ / ISTJ / ISFJ | ✅ 立即启动 | 口头禅、冲突风格、说话特征覆盖较好 |
| 第三批 | ESTP / ISTP / ISFP / ESFP | 🟡 可启动 | B10 达基本够；部分例句需改写标注 |

**B7 话题反应差异处理规则**：
- IN 四型：有 `xhs.md` 文风对比 + `personalitycafe.md` 深度讨论，可直接使用。
- N/E 型：`personalitycafe.md` + `mbti.cat.md` + `typemyvibe.md` 可支撑。
- S 型：仍偏薄，建议标注「推导生成（基于 B3+B8+A8 交叉）」或「改写自原文」。

---

## 七、补爬执行状态

```
已完成 ✅
  ✅ xhs 补爬：ISTJ口头禅 / ISFJ口头禅 / ISTJ圆桌 / ISFJ圆桌
     → ISTJ/ISFJ B9/B10 大幅改善
  ✅ zhihu 补爬：16个专项关键词 → zhihu-supplement.md
     → ENTJ/ENFJ/ESTP/ISTP/ESFP/ISFP 均补充第一人称内容
  ✅ xhs 补爬：ESFP专项（日常/说话/口头禅）→ xhs.md ESFP专节
     → ESFP B10 从「偏薄」升至「基本够」
  ✅ xhs 补爬：B7话题反应差异 → xhs.md B7专节
     → IN四型文风对比、T vs F反应差异、ENFP话题跳跃、INTJ偏好

待执行 🔲（可选，不阻塞生成）
  P1（可选）— 进一步强化 B7 S型覆盖
    🔲 PersonalityCafe 或 xhs：S型话题偏好专项（ESFP/ESTP/ISFP 各自聊什么）
       → 现有资料足以推导，补爬只会提升直接引用比例

  P2（低优先）— 补充 B12 S型误判对比
    🔲 PersonalityCafe：ISTJ vs ESTJ、ISFJ vs ESFJ 等 S型误判线程
```

---

## 八、最终判断

| 维度 | v4 判断 | 是否阻塞 |
|------|---------|----------|
| 8 个认知功能文件 | ✅ 可立即生成 | 否 |
| `overview.md` | ✅ 可立即生成 | 否 |
| 16 个人格文件 | ✅ 可立即生成 | 否 |
| A10 功能代表例句 | 🟡 中等，需跨人格归纳 | 否 |
| B7 话题反应差异 | 🟡 中偏弱，S 型需推导标注 | 否 |
| B10 ESTP/ISTP/ESFP | 🟡 基本够，改写比例略高 | 否 |
| 后续补爬 | 🔲 仅可选优化 | 否 |

**结论：现有 `knowledge/raw/` 已足以支撑生成全部 8 个认知功能文件、1 个 overview 文件和 16 个人格文件。**

下一步可以进入知识库生成阶段。生成时遵守 `docs/knowledge-build-plan.md` 的证据标注规范：每小节末尾标注来源；例句逐条标注「直接摘录 / 改写自原文 / 推导生成」。
