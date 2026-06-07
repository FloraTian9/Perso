import { streamQwenChat } from "@/lib/qwen";
import { buildSpectatorOpeningSystemPrompt, buildSpectatorSystemPrompt } from "@/lib/prompts/spectator";
import { buildParticipantAutoContinuationMessages, buildParticipantSystemPrompt, buildParticipantNextTurnMessages } from "@/lib/prompts/participant";
import type { Atmosphere, ChatMessage, NormalizedChatMode, PersonaId, RoundtableMessage } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby 默认 10s 超时，continuation 阶段流式生成 10 条消息容易超过；
// Hobby 允许配到最大 60s，确保 fun/continuation 全程能跑完。
export const maxDuration = 60;

type ChatRequestBody = {
  topic?: unknown;
  mode?: unknown;
  personas?: unknown;
  messages?: unknown;
  userMessage?: unknown;
  opening?: unknown;
  phase?: unknown;
  atmosphere?: unknown;
  privateNote?: unknown;
  nextPersona?: unknown;
};

const personaIds = new Set<PersonaId>([
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
]);

const sensitiveTopicPatterns = [
  /政治/,
  /宗教/,
  /选举/,
  /政党/,
  /民族仇恨/,
  /极端主义/,
];
const FUN_OPENING_TURNS = 3;
const roundOpeningAngles = [
  "从一个具体片段或画面切入，不从结论切入",
  "从一个反常的少数派判断切入，让第二个人格马上想反驳",
  "从一个人物/关系/行为细节切入，不先讲大道理",
  "从读后感、使用体验或亲身场景切入，再回到话题本身",
  "从最容易被误解的一点切入，让圆桌先拆这个误解",
  "从一个尖锐问题切入，但问题必须指向当前话题",
  "从一个轻微冒犯但好笑的吐槽切入，随后给出理由",
  "从一个犹豫或不确定的真实感受切入，不要一上来下定论",
];

function asMode(value: unknown): NormalizedChatMode {
  return value === "participant" ? "participant" : "fun";
}

function asFunPhase(value: unknown): "opening" | "continuation" | "note" | "full" {
  if (value === "note") return "note";
  if (value === "opening" || value === "continuation") return value;
  return "full";
}

function asAtmosphere(value: unknown): Atmosphere {
  if (value === "sharp" || value === "sincere" || value === "assertive") return value;
  return "plain";
}

function atmosphereLabel(atmosphere: Atmosphere): string {
  if (atmosphere === "sharp") return "更毒舌";
  if (atmosphere === "sincere") return "更真诚";
  if (atmosphere === "assertive") return "更强势";
  return "说人话";
}

function asPersonas(value: unknown): PersonaId[] {
  const defaults: PersonaId[] = ["INTJ", "ENFP", "ISTJ", "ENTP"];

  if (!Array.isArray(value)) return defaults;

  // Deduplicate and filter to valid IDs, then cap at 4
  const seen = new Set<PersonaId>();
  for (const item of value) {
    if (typeof item === "string" && personaIds.has(item as PersonaId)) {
      seen.add(item as PersonaId);
      if (seen.size === 4) break;
    }
  }

  if (seen.size < 2) return defaults;
  return [...seen];
}

function asTopic(body: ChatRequestBody): string {
  if (typeof body.topic === "string" && body.topic.trim()) {
    return body.topic.trim();
  }

  return "今晚吃什么？";
}

const validHistoryPersonas = new Set<string>([...personaIds, "user"]);

function asHistory(value: unknown): RoundtableMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m, index): RoundtableMessage | null => {
      if (
        m === null ||
        typeof m !== "object" ||
        typeof (m as { persona?: unknown }).persona !== "string" ||
        !validHistoryPersonas.has((m as { persona: string }).persona) ||
        typeof (m as { content?: unknown }).content !== "string" ||
        (m as { content: string }).content.length > 500
      ) {
        return null;
      }
      const raw = m as {
        id?: unknown;
        persona: PersonaId | "user";
        content: string;
        turn?: unknown;
        timestamp?: unknown;
        label?: unknown;
      };
      return {
        id: typeof raw.id === "string" ? raw.id : `history-${index}`,
        persona: raw.persona,
        content: raw.content,
        turn: typeof raw.turn === "number" ? raw.turn : index + 1,
        timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
        label: typeof raw.label === "string" ? (raw.label as RoundtableMessage["label"]) : undefined,
      };
    })
    .filter((m): m is RoundtableMessage => m !== null)
    .slice(0, 50);
}

function asPrivateNote(value: unknown, personas: PersonaId[]): { targetPersona: PersonaId; content: string } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const note = value as { targetPersona?: unknown; content?: unknown };
  if (!isPersonaInList(note.targetPersona, personas)) return undefined;
  if (typeof note.content !== "string") return undefined;
  const content = note.content.trim().slice(0, 80);
  if (!content) return undefined;
  return { targetPersona: note.targetPersona, content };
}

function isPersonaInList(value: unknown, personas: PersonaId[]): value is PersonaId {
  return typeof value === "string" && personaIds.has(value as PersonaId) && personas.includes(value as PersonaId);
}

function asNextPersona(value: unknown, personas: PersonaId[]): PersonaId | undefined {
  return isPersonaInList(value, personas) ? value : undefined;
}

function isSensitiveTopic(topic: string): boolean {
  return sensitiveTopicPatterns.some((pattern) => pattern.test(topic));
}

function createTraceId(): string {
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildRoundOpeningVariantHint(): string {
  const angle = roundOpeningAngles[Math.floor(Math.random() * roundOpeningAngles.length)] ?? roundOpeningAngles[0];
  const variantCode = Math.random().toString(36).slice(2, 8);
  return `本局切入角度：${angle}。本局变体码：${variantCode}。变体码只用于打散生成，禁止输出。`;
}

function toClientErrorMessage(message: string): string {
  if (
    message.includes("AllocationQuota.FreeTierOnly") ||
    message.includes("free tier of the model has been exhausted")
  ) {
    return "Qwen 模型免费额度已耗尽。请切换可用的 QWEN_MODEL / API Key，或在百炼控制台关闭仅使用免费额度后重试。";
  }

  if (message.includes("Missing QWEN_API_KEY")) {
    return "缺少 QWEN_API_KEY，请先在环境变量中配置后再生成圆桌。";
  }

  return message.length > 600 ? `${message.slice(0, 600)}...` : message;
}

function buildMessages(body: ChatRequestBody): ChatMessage[] {
  const mode = asMode(body.mode);
  const topic = asTopic(body);
  const personas = asPersonas(body.personas);
  const atmosphere = asAtmosphere(body.atmosphere);

  if (mode === "fun") {
    const phase = asFunPhase(body.phase);
    const history = asHistory(body.messages);
    const privateNote = asPrivateNote(body.privateNote, personas);
    const nextPersona = phase === "opening" || privateNote ? undefined : asNextPersona(body.nextPersona, personas);
    const remainingTurns = phase === "opening" ? FUN_OPENING_TURNS : phase === "note" ? 1 : Math.max(4, 12 - history.length);
    const roundOpeningVariantHint = phase === "opening" && history.length === 0 ? buildRoundOpeningVariantHint() : "";
    const systemPrompt = phase === "opening"
      ? buildSpectatorOpeningSystemPrompt({ topic, personas, turnCount: FUN_OPENING_TURNS, atmosphere })
      : buildSpectatorSystemPrompt({ topic, personas, turnCount: remainingTurns, atmosphere, privateNote, nextPersona });
    const historyText = history
      .map((message) => {
        const label = message.label ? `[${message.label}] ` : "";
        return `${message.persona}: ${label}${message.content}`;
      })
      .join("\n");
    const nextSpeakerInstruction = nextPersona
      ? `下一条发言必须由 ${nextPersona} 发出，content 必须按 ${nextPersona} 的人格和当前气氛从一开始生成。`
      : "下一条发言的人格由上下文自然决定。";
    const nextAtmosphereInstruction = `当前气氛是「${atmosphereLabel(atmosphere)}」。${nextSpeakerInstruction} 下一条发言必须立刻、明显体现这个气氛，同时接住上一条的具体内容。`;

    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: phase === "opening"
          ? `当前话题是「${topic}」。${roundOpeningVariantHint}\n\n请生成 ${FUN_OPENING_TURNS} 条开场。第一条自然引入「${topic}」，第二条接住第一条并抛出冲突点，第三条继续回应第二条的具体判断，让第三个人格能直接开口。开场主线必须围绕「${topic}」，但可以有一句由话题自然引发的联想或吐槽。同一个话题重新开局时，不要默认采用最常规、最安全的开头。`
          : phase === "note" && privateNote
            ? `当前话题主线仍然是「${topic}」。${nextAtmosphereInstruction}\n\n已生成公开历史：\n${historyText || "暂无"}\n\n请只生成 1 条后续发言。下一条必须由 ${privateNote.targetPersona} 发出，并自然受私人纸条影响。可以顺着纸条短暂发散，但不要让对话从「${topic}」漂走；如果纸条和话题无关，要让 ${privateNote.targetPersona} 把它转成对「${topic}」的反应。只输出 1 个 JSON object，闭合后结束。`
          : historyText
            ? `当前话题主线仍然是「${topic}」。${nextAtmosphereInstruction}\n\n已生成开场/历史：\n${historyText}\n\n请承接已有开场继续生成后续 ${remainingTurns} 条。不要重复介绍话题，不要重新开场；下一条必须回应上一条的具体词、情绪或判断。允许短暂发散，但不能连续两条脱离「${topic}」；如果上一条已经跑偏，下一条要让合适的人格自然把话题带回来。只输出后续 JSON Lines；每条发言一个 JSON object，闭合一条就立刻换行输出下一条。`
            : `请开始生成圆桌对话。当前话题是「${topic}」，对话主线要围绕这个话题，但允许自然发散。`,
      },
    ];
  }

  const systemPrompt = buildParticipantSystemPrompt({ topic, personas });

  if (body.opening === true) {
    const roundOpeningVariantHint = buildRoundOpeningVariantHint();
    const openingTurnCount = personas.length;
    const openingOrder = personas.join(" → ");
    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `当前话题是「${topic}」。${roundOpeningVariantHint}\n\n请先开场。必须生成 ${openingTurnCount} 条发言，让所选人格按这个顺序各说 1 条：${openingOrder}。每条都要展示该人格对「${topic}」的初始看法，语气自然。主线必须围绕「${topic}」，但可以有一句由话题自然引发的联想或吐槽。同一个话题重新开局时，不要默认采用最常规、最安全的开头。只输出这 ${openingTurnCount} 条；只写人格之间的讨论，不写面向人类参与者的开场白、邀请或催促。`,
      },
    ];
  }

  const history = asHistory(body.messages);
  const lastUserMessage = typeof body.userMessage === "string" && body.userMessage.trim()
    ? body.userMessage.trim().slice(0, 500)
    : "";

  if (!lastUserMessage) {
    const autoMessages = buildParticipantAutoContinuationMessages({
      topic,
      history,
      turnCount: Math.max(3, Math.min(4, personas.length)),
    });
    return [{ role: "system", content: systemPrompt }, ...autoMessages];
  }

  const turnMessages = buildParticipantNextTurnMessages({
    topic,
    personas,
    history,
    userMessage: lastUserMessage,
  });

  return [{ role: "system", content: systemPrompt }, ...turnMessages];
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const traceId = createTraceId();
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = asMode(body.mode);
  const phase = asFunPhase(body.phase);
  const participantHasUserMessage = typeof body.userMessage === "string" && body.userMessage.trim();
  const maxTokens = mode === "participant"
    ? (body.opening === true || !participantHasUserMessage ? 900 : 500)
    : phase === "opening" ? 700 : phase === "note" ? 500 : 4000;
  const topic = asTopic(body);
  const personas = asPersonas(body.personas);
  const traceLabel =
    mode === "fun"
      ? `fun:${phase}`
      : body.opening === true
        ? "participant:opening"
        : "participant:turn";

  console.info("[chat-ttft]", {
    id: traceId,
    label: traceLabel,
    event: "route_received",
    elapsedMs: 0,
    mode,
    phase: mode === "fun" ? phase : undefined,
    personaCount: personas.length,
    historyCount: Array.isArray(body.messages) ? body.messages.length : 0,
  });

  if (isSensitiveTopic(topic)) {
    return Response.json(
      {
        error: "这个话题暂时不适合圆桌生成。换一个更日常的问题试试。",
      },
      { status: 400 },
    );
  }

  try {
    const messages = buildMessages(body);
    const stream = await streamQwenChat({
      messages,
      maxTokens,
      temperature: 0.85,
      trace: {
        id: traceId,
        label: traceLabel,
        startedAt,
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Qwen API error";
    const clientMessage = toClientErrorMessage(message);
    console.info("[chat-ttft]", {
      id: traceId,
      label: traceLabel,
      event: "route_error",
      elapsedMs: Date.now() - startedAt,
      message,
    });
    return Response.json({ error: clientMessage }, { status: 503 });
  }
}
