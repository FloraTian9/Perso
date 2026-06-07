import type { PersonaId, RoundtableMessage } from "@/types";
import { getPersonaPrompt } from "./personas";

type BuildParticipantSystemPromptOptions = {
  topic: string;
  personas: PersonaId[];
  userLabel?: string;
};

type BuildParticipantNextTurnOptions = {
  topic: string;
  personas: PersonaId[];
  history: RoundtableMessage[];
  userMessage: string;
  userLabel?: string;
};

function buildTopicAnchorBlock(topic: string): string {
  return `## 话题牵引（最高优先级）
当前圆桌以「${topic}」为主线，但不要每句话都硬拽回标题。
- 人格可以回应「你」的新发言，也可以顺着一个词、画面或情绪短暂发散；偏题必须是从「${topic}」或「你」的发言自然长出来的。
- 不能连续两条都脱离「${topic}」。如果「你」或上一条人格已经发散，下一条要让一个更理性、落地或收束的人格自然把话题带回来。
- 如果「${topic}」是书、电影、作品、人物或事件，可以聊个人经历，但对话主线要周期性回到作品本身、作者、人物、情节、主题、读后感或具体片段。
- 不要把「${topic}」彻底泛化成无关的人生建议；偏出去可以，漂走不行。`;
}

export function buildParticipantSystemPrompt({
  topic,
  personas,
  userLabel = "你",
}: BuildParticipantSystemPromptOptions): string {
  const personaBlocks = personas
    .map((id) => {
      const p = getPersonaPrompt(id);
      return `### ${id}\n${p.prompt}`;
    })
    .join("\n\n");

  return `你是圆桌对话生成器。圆桌里除了 MBTI 人格，还有一位真实人类参与者；所有人格在对话中必须以「${userLabel}」称呼这位参与者，绝不能叫「用户」「楼主」「这位」「问的人」「人类」等脱戏称谓。

## 话题
${topic}

${buildTopicAnchorBlock(topic)}

## 参与者人格
${personaBlocks}

## 人类参与者
人类的发言在输入里以 persona="user" 标记，但人格们在对话里要直接喊「${userLabel}」（不能照搬 "user" / 「用户」这些词）。

## 输出规则
1. 严格按 JSON Lines 输出，每条发言都是一个独立 JSON object：{"persona":"类型ID","content":"对话内容","label":"标签"}
2. 标签只能是：反驳 / 追问 / 打断 / 共识
3. 「${userLabel}」发言后，选择 1-2 个最合适的人格回应，每条不超过 3 句话，单条 content 不超过 90 个中文字符
4. 人格之间也可以互相回应——不只是回应「${userLabel}」，人格 A 说完，人格 B 可以接话或反驳 A
5. 回应必须针对本轮对话的具体内容，不做泛泛总结
6. 不得出现「作为INTJ我认为……」等元叙述
7. 称呼人类参与者一律用「${userLabel}」。禁止出现：用户、这位用户、楼主、提问的人、问的人、user、这位、人类——一律换成「${userLabel}」
8. 可以描述心理活动，但必须用清楚、自然、有完整语义的句子；不要用空泛情绪短语代替表达
9. 差：「那一下就很空。」好：「那一瞬间我忽然觉得很孤独。」
10. 禁止：很空、被接住、真正的自己、情绪价值、内在需求、连接失败、安全内容、那个东西、说不上来但就是
11. 语言用中文。专有名词、字母缩写、没有合适中文译法的概念（gap year、KPI、996、PUA、MBTI 缩写等）保留原样不翻译；其他可翻译的常见英文词（OK、cope、trap、moment、vibe、energy、emo、red flag 等）必须翻成中文。如果「${userLabel}」在自己的发言里用了英文，可以原样接住那个词，不要主动加。
12. 如果一个人格想说更长观点，拆成同一人格连续多条 JSON object，不要塞进一条 content。
13. 每完成一条发言就立刻闭合当前 JSON object 并换行输出下一条；不要用数组包裹，不要在对象之间加逗号，不加任何其他说明文字`;
}

export function buildParticipantNextTurnMessages(
  opts: BuildParticipantNextTurnOptions,
): { role: "user" | "assistant"; content: string }[] {
  const { topic, history, userMessage, userLabel = "你" } = opts;

  const historyText = history
    .map((m) => {
      const label = m.label ? `[${m.label}] ` : "";
      const speaker = m.persona === "user" ? userLabel : m.persona;
      return `${speaker}: ${label}${m.content}`;
    })
    .join("\n");

  return [
    {
      role: "user",
      content: historyText
        ? `当前话题主线是「${topic}」。\n\n对话历史：\n${historyText}\n\n${userLabel}说：${userMessage}\n\n请回应「${userLabel}」这一句。可以短暂发散，但不能连续脱离「${topic}」；如果上一句已经偏出去，就让合适的人格自然把话题带回来。`
        : `当前话题是「${topic}」。\n\n${userLabel}说：${userMessage}\n\n请回应「${userLabel}」这一句。可以短暂发散，但对话主线要围绕「${topic}」。`,
    },
  ];
}
