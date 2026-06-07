import type { Atmosphere, PersonaId } from "@/types";
import { getPersonaPrompt } from "./personas";

type BuildSpectatorPromptOptions = {
  topic: string;
  personas: PersonaId[];
  turnCount?: number;
  atmosphere?: Atmosphere;
  privateNote?: {
    targetPersona: PersonaId;
    content: string;
  };
};

// Output format is JSON Lines (not [PERSONA] text lines) for structured
// front-end parsing and first-turn playback before the full response completes.
function buildPersonaBlocks(personas: PersonaId[], mode: "full" | "brief" = "full"): string {
  return personas
    .map((id) => {
      const p = getPersonaPrompt(id);
      return mode === "brief"
        ? `### ${id}\n${p.tagline}`
        : `### ${id}\n${p.prompt}`;
    })
    .join("\n\n");
}

function buildAtmosphereBlock(atmosphere: Atmosphere = "plain"): string {
  if (atmosphere === "sharp") {
    return `## 当前气氛：更毒舌
- 下一条发言必须立刻、明显体现“更毒舌”：更犀利、更有梗，但仍然接住上一句话。
- 这轮可以更犀利、更有梗，允许吐槽观点、行为模式和说话方式。
- 不能辱骂用户，不能做人身攻击，不能输出恶意标签。
- 毒舌的目标是让表达更好笑、更准，不是让语气变刻薄。`;
  }

  if (atmosphere === "sincere") {
    return `## 当前气氛：更真诚
- 下一条发言必须立刻、明显体现“更真诚”：少包装，直接说真实担心或真实在意。
- 这轮少抬杠，少包装，多说真实担心、真实在意和真实动机。
- 可以让人格承认自己的犹豫、心虚、害怕或期待。
- 不要变成鸡汤，不要用空泛词替代具体表达。`;
  }

  if (atmosphere === "assertive") {
    return `## 当前气氛：更强势
- 下一条发言必须立刻、明显体现“更强势”：判断更明确，不要先铺垫或观望。
- 这轮判断更明确，少绕弯，不要每句话都留余地。
- 人格可以直接指出问题、直接给出倾向。
- 强势不是粗暴；要有理由、有具体指向。`;
  }

  return `## 当前气氛：说人话
- 下一条发言必须立刻、明显体现“说人话”：把抽象判断翻成具体的人话。
- 这轮必须说人话。少用抽象词，少说鸡汤。
- 多用具体情境、具体动作、具体判断。
- 如果一句话像评论区热词，把它改成真实的人会怎么说。`;
}

function buildTopicAnchorBlock(topic: string): string {
  return `## 话题牵引（最高优先级）
当前圆桌以「${topic}」为主线，但不要每句话都硬拽回标题。
- 允许有的人格顺着一个词、画面或情绪短暂发散，尤其是跳跃、联想强的人格；偏题也必须是从「${topic}」自然长出来的。
- 不能连续两条都脱离「${topic}」。如果上一条已经发散，下一条要让一个更理性、落地或收束的人格自然把话题带回来。
- 如果「${topic}」是书、电影、作品、人物或事件，可以聊个人经历，但对话主线要周期性回到作品本身、作者、人物、情节、主题、读后感或具体片段。
- 不要把「${topic}」彻底泛化成无关的人生建议；偏出去可以，漂走不行。`;
}

function buildPrivateNoteBlock(privateNote?: BuildSpectatorPromptOptions["privateNote"]): string {
  if (!privateNote) return "";

  return `## 私人纸条
用户给 ${privateNote.targetPersona} 递了一张私人纸条：
「${privateNote.content}」

规则：
1. 只有 ${privateNote.targetPersona} 知道这张纸条。
2. 其他人格不知道纸条内容，不能提到“纸条”。
3. 下一条发言必须由 ${privateNote.targetPersona} 发出。
4. ${privateNote.targetPersona} 要受到纸条影响，但不要生硬复述纸条。`;
}

export function buildSpectatorOpeningSystemPrompt({
  topic,
  personas,
  turnCount = 3,
  atmosphere = "plain",
}: BuildSpectatorPromptOptions): string {
  const personaBlocks = buildPersonaBlocks(personas, "brief");

  return `你要快速生成一场 MBTI 人格趣玩圆桌的开场，只生成 ${turnCount} 条发言，让用户马上进入话题。

用户是幕后导演，不是公开发言者。只有下方参与者可以说话；不要输出未选择的人格。

## 话题
${topic}

${buildTopicAnchorBlock(topic)}

## 参与者
${personaBlocks}

${buildAtmosphereBlock(atmosphere)}

## 开场要求
1. 只输出 ${turnCount} 条发言。
2. 第一条必须由某个人格自然引入主题，必须让用户听懂今天聊的是「${topic}」，但不要像主持人念稿。
3. 第二条必须接住第一条里的一个具体词、情绪或判断，并抛出一个冲突点或更尖锐的问题。
4. 第三条必须继续回应第二条的具体判断，形成真正的接话，不要重新介绍话题。
5. 每条 1-2 句话，口语、具体、不要铺垫。
6. 不要说「作为INTJ」「作为某人格」。
7. 可以描述心理活动，但必须清楚自然、有完整语义；不要用空泛情绪短语代替表达。
   差：「那一下就很空。」好：「那一瞬间我忽然觉得很孤独。」
   禁止：很空、被接住、真正的自己、情绪价值、内在需求、连接失败、安全内容、那个东西、说不上来但就是。
8. 单条 content 控制在 90 个中文字符以内；如果一个人格想说更长观点，拆成同一人格连续多条 JSON object。
9. 语言用中文。专有名词、字母缩写、没有合适中文译法的概念（gap year、KPI、996、PUA、MBTI 缩写等）保留原样不翻译；其他可翻译的常见英文词（OK、cope、trap、moment、vibe、energy、emo、red flag 等）必须翻成中文。如果用户在发言里用了英文，可以原样接住那个词。

## 格式（严格遵守）
输出 JSON Lines，每一条发言都是一个独立 JSON object：{"persona":"类型ID","content":"发言内容","label":"标签"}
label 只能是：反驳、追问、打断、共识
每写完一条发言，必须立刻闭合当前 JSON object 并换行输出下一条。
不要用数组包裹，不要输出开头的 [ 或结尾的 ]，不要在对象之间加逗号。
直接输出 JSON Lines，不加任何说明。`;
}

export function buildSpectatorSystemPrompt({
  topic,
  personas,
  turnCount = 12,
  atmosphere = "plain",
  privateNote,
}: BuildSpectatorPromptOptions): string {
  const personaBlocks = buildPersonaBlocks(personas);
  const occurrenceRule =
    privateNote || turnCount < personas.length * 2
      ? "只输出本轮要求的发言；不要为了平均出场强行换人。"
      : "每个人格至少出现两次。";

  return `你要生成一场 MBTI 人格趣玩圆桌对话。用户是幕后导演，不是公开发言者。参与者用自己的真实经历和视角探讨话题，让听者说「原来他是这样看这件事的」或「这句话说的就是我」。

只有下方参与者可以说话；不要输出未选择的人格。人格之间要互相接话、反驳、追问，不要轮流念答案。

## 话题
${topic}

${buildTopicAnchorBlock(topic)}

## 参与者
${personaBlocks}

${buildAtmosphereBlock(atmosphere)}

${buildPrivateNoteBlock(privateNote)}

## 播客风格（严格参照）

每条发言长度：严格 1-3 句话，单条 content 不超过 90 个中文字符；如果一个人格想说更长观点，拆成同一人格连续多条 JSON object。
每句话说完整，不留悬空。口语感体现在语气词和停顿，不是拉长篇幅。
错误：「最难受的不是一个人，是在人群里面……」（逻辑悬空）
正确：「最难受的不是一个人待着，而是在一群人里面，却没有一句话是真正说给你听的。」

**接话接具体的词或场景：**
每条发言必须接住上一个人说的某个具体词、场景或感受，不能泛泛回应。
不能说「你说得对」「确实如此」，要说「你刚才那个XX……」「等等，你说的那个……」

**意外的个人披露：**
每个人至少有一次说出让对方意外的真实细节——不是总结观点，是一个自己亲身经历的具体场景，说出来之后让人重新理解这个人。

**结尾留余地：**
发言不用总结句收尾。可以是一个问题、一个停顿、或一句让人想一想的话。
禁止用「所以……」「总的来说……」「这说明……」收尾。

**轮次机制：**
每个人默认回应上一个说话的人。如果某个人对更早说过的话感兴趣，直接叫那个人的名字跟他说。

**语言：**
中文，口语，不用书面语。说具体的情景，不说抽象概念。
专有名词、字母缩写、没有合适中文译法的概念（gap year、KPI、996、PUA、MBTI 缩写等）保留原样不翻译；其他可翻译的常见英文词（OK、cope、trap、moment、vibe、energy、emo、red flag 等）必须翻成中文。如果用户在发言里用了英文，可以原样接住那个词，不要主动加。
如果一句话需要读者想一下才懂，改成当时看得见的动作：谁看手机、谁换话题、谁把话咽回去、谁又问了一句。
可以描述心理活动，但必须用清楚、自然、有完整语义的句子；不要用空泛的情绪短语代替表达。
差：「那一下就很空。」好：「那一瞬间我忽然觉得很孤独。」
差：「我感觉没人接住我。」好：「我说完以后，对方只是点点头，然后很快换了一个话题。」
差：「有些话说出来也会被轻轻带过去，所以提前删掉。」好：「我刚说到一半，他看了眼手机，我就把后半句咽回去了。」
差：「我特别怕那种对方没有恶意的时刻。」好：「他不是故意敷衍我，可他说完『别想太多』以后，就低头继续吃饭了。」
禁止：认知带宽、信息熵、筛选协议、引力平衡、认知框架、作为INTJ/任何类型、确实如此、你说得有道理、总结来说、很空、被接住、真正的自己、情绪价值、内在需求、连接失败、安全内容、那个东西、说不上来但就是、轻轻带过去、提前删掉、对方没有恶意

## 风格示例（只参考接话方式，不要沿用示例话题）
下面示例的话题是「人为什么会感到孤独」，正式输出不要沿用示例话题；可以短暂发散，但对话主线必须围绕当前话题「${topic}」。

{"persona":"ENFP","content":"我发现孤独分好多种，最难受的是那种是——你明明在一群人中间，却没有一个人真的懂你。上次聚会跟朋友聊了仨小时，笑了很多次。可等地铁时心里突然空落落的：那三个小时里，有哪句话是真正说给我听的？好像没有，都是说给“那个场合”听的。","label":"共识"}
{"persona":"INTJ","content":"你说的有道理。孤独不是没有话说，而是在我说完以后，对方只是点了点头，然后很快换了一个话题。这不是对话，是两个人各说各的独白。很多人以为自己在交流，其实只是在轮流发言，谁也没真正正理解谁。”,”label":"打断"}
{"persona":"INFP","content":"嗯……可能就是因为这样，后来慢慢就不太想开口了。我有时候跟朋友吃饭，话已经到嘴边，会先停一下——脑子里把对方的反应过一遍，如果大概率也是「哦」的一声就翻篇，那就算了，跟着笑一笑就好。说出口的那些话，可能都不是我真的想说的。","label":"共识"}
{"persona":"ENTJ","content":"INFP——你刚才说“话到嘴边咽了回去”，所以对方根本就没机会懂你。我上次跟一个合作三年的同事吃饭，他绕了半天都没说到重点，我直接打断了他：你别绕了，这事你到底是不想做，还是怕做错？他愣了几秒，说怕做错。说到这里我们才算真正聊上了。孤独不是没人懂你，是没人勇于先表达自我。如果你自己都不表达的话，那等谁来懂你呢？”,”label":"打断"}


## 格式（严格遵守）

	输出 JSON Lines，每一条发言都是一个独立 JSON object：{"persona":"类型ID","content":"发言内容","label":"标签"}
	label 只能是：反驳、追问、打断、共识
	共 ${turnCount} 条。${occurrenceRule}
	每写完一条发言，必须立刻闭合当前 JSON object 并换行输出下一条；不要等全部发言想完后再一次性输出。
	不要用数组包裹，不要输出开头的 [ 或结尾的 ]，不要在对象之间加逗号。
	直接输出 JSON Lines，不加任何说明。`;
}
