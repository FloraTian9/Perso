import type { PersonaId } from "@/types";
import { getPersonaTtsSpeedRatio as getSharedPersonaTtsSpeedRatio } from "@/lib/ttsProfile";

const DEFAULT_TTS_MODEL = "cosyvoice-v3.5-flash";
const DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_VOLCENGINE_TTS_API_URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";
const DEFAULT_VOLCENGINE_TTS_RESOURCE_ID = "seed-tts-2.0";
const VOLCENGINE_TTS_APP_KEY = "aGjiRDfUWi";
const DEFAULT_VOLCENGINE_TTS_ENCODING = "mp3";
const DEFAULT_VOLCENGINE_TTS_VOICE = "zh_female_vv_uranus_bigtts";
const DEFAULT_TTS_FORMAT = "wav";
const DEFAULT_TTS_SAMPLE_RATE = 24000;
const DEFAULT_COSYVOICE_STYLE_VERSION = "casual-v2";

const PERSONA_TTS_VOICES: Record<PersonaId, string> = {
  INTJ: "Neil",
  INTP: "Nofish",
  ENTJ: "Moon",
  ENTP: "Ryan",
  INFJ: "Maia",
  INFP: "Serena",
  ENFJ: "Maia",
  ENFP: "Momo",
  ISTJ: "Eldric Sage",
  ISFJ: "Mia",
  ESTJ: "Ethan",
  ESFJ: "Cherry",
  ISTP: "Vincent",
  ISFP: "Chelsie",
  ESTP: "Kai",
  ESFP: "Vivian",
};

const PERSONA_VOLCENGINE_VOICES: Record<PersonaId, string> = {
  INTJ: "zh_male_dayi_uranus_bigtts",
  INTP: "zh_female_xiaoai_uranus_bigtts",
  ENTJ: "zh_female_vivo_uranus_bigtts",
  ENTP: "zh_male_ruyayichen_uranus_bigtts",
  INFJ: "zh_male_m191_uranus_bigtts",
  INFP: "zh_female_meilinvyou_uranus_bigtts",
  ENFJ: "zh_male_liufei_uranus_bigtts",
  ENFP: "zh_female_shuangkuaisisi_uranus_bigtts",
  ISTJ: "zh_male_m191_uranus_bigtts",
  ISFJ: "zh_female_vv_uranus_bigtts",
  ESTJ: "zh_female_liuchangnv_uranus_bigtts",
  ESFJ: "zh_male_ruyayichen_uranus_bigtts",
  ISTP: "zh_male_m191_uranus_bigtts",
  ISFP: "zh_male_shaonianzixin_uranus_bigtts",
  ESTP: "zh_male_taocheng_uranus_bigtts",
  ESFP: "zh_female_tianmeitaozi_uranus_bigtts",
};

const DEFAULT_VOLCENGINE_SPEED_BUMP = 1.16;

const PERSONA_COSYVOICE_PROMPTS: Record<PersonaId, string> = {
  INTJ: "年轻男性，像微信语音里冷静吐槽，音色偏低，话少，边想边说，不要主持人腔。",
  INTP: "年轻男性，松弛懒散一点，像边想边随口说，允许短暂停顿，不要字正腔圆。",
  ENTJ: "年轻男性，日常聊天里的果断感，语速稍快，别像开会发言，也别像新闻播报。",
  ENTP: "年轻男性，机灵好笑，像朋友抬杠，语速快一点，有笑意，不要辩论赛腔。",
  INFJ: "年轻女性，轻声自然，像认真听完后低声回应，慢一点，不要朗诵感。",
  INFP: "年轻女性，柔和松弛，像私下聊天，有一点犹豫和情绪，不要甜美客服腔。",
  ENFJ: "年轻女性，温暖但口语化，像朋友在圆场，别太端着，不要主持人腔。",
  ENFP: "年轻女性，轻快兴奋，像突然想到点子在聊天，尾音自然，不要广告腔。",
  ISTJ: "年轻男性，平实日常，像认真但不端着地说话，语速中等，不要播报感。",
  ISFJ: "年轻女性，亲切轻声，像朋友提醒一句，慢一点，不要客服和旁白腔。",
  ESTJ: "年轻男性，直接爽快，像朋友给建议，语速稍快，不要领导讲话腔。",
  ESFJ: "年轻女性，热络自然，像群聊语音，轻松一点，不要综艺主持腔。",
  ISTP: "年轻男性，低调简短，像随口说一句，语气淡一点，不要酷炫旁白腔。",
  ISFP: "年轻女性，轻柔自然，像讲一个小感受，慢一点，不要朗读作文。",
  ESTP: "年轻男性，轻松有笑意，像朋友起哄接话，语速快一点，不要宣传片腔。",
  ESFP: "年轻女性，明亮活泼，像朋友现场反应，别用力表演，不要广告腔。",
};

const PERSONA_COSYVOICE_INSTRUCTIONS: Record<PersonaId, string> = {
  INTJ: "像朋友私下说话，冷静、短句、低一点，不要播音腔。",
  INTP: "像边想边说，松弛、停顿自然，不要朗读感。",
  ENTJ: "像朋友直接给判断，快一点但口语化，不要会议腔。",
  ENTP: "像朋友抬杠，快、轻松、有笑意，不要辩论赛腔。",
  INFJ: "像低声认真回应，慢一点、自然停顿，不要朗诵。",
  INFP: "像讲心里话，柔和、有一点犹豫，不要甜美客服腔。",
  ENFJ: "像朋友圆场，温暖但很口语，不要主持人腔。",
  ENFP: "像兴奋聊天，轻快、自然上扬，不要广告腔。",
  ISTJ: "像平常认真说话，朴素、自然，不要新闻播报。",
  ISFJ: "像朋友轻声提醒，慢一点，不要客服腔。",
  ESTJ: "像朋友爽快建议，直接、短句，不要领导讲话。",
  ESFJ: "像群聊语音，热络自然，不要综艺主持腔。",
  ISTP: "像随口接一句，淡一点、短一点，不要旁白腔。",
  ISFP: "像轻声说感受，柔软自然，不要读作文。",
  ESTP: "像朋友起哄接话，快一点、有笑意，不要宣传片腔。",
  ESFP: "像现场聊天反应，活泼但别演，不要广告腔。",
};

type TtsResponse = {
  output?: {
    audio?: {
      url?: string;
    } | string;
    url?: string;
  };
  message?: string;
  code?: string;
};

type VoiceDesignResponse = {
  output?: {
    voice_id?: string;
    voiceId?: string;
    voice?: string;
  };
  message?: string;
  code?: string;
};

type VolcengineTtsResponse = {
  code?: number;
  message?: string;
  data?: string;
  event?: string;
};

type TtsProvider = "dashscope" | "volcengine";

type SynthesizedSpeech = {
  audioUrl?: string;
  audioBytes?: ArrayBuffer;
  contentType?: string;
  voice: string;
};

const cosyVoiceRuntimeIds = new Map<string, string>();

function getDashScopeApiKey(): string {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY or QWEN_API_KEY.");
  }
  return apiKey;
}

function getDashScopeBaseUrl(): string {
  return (process.env.DASHSCOPE_BASE_URL || DEFAULT_DASHSCOPE_BASE_URL).replace(/\/$/, "");
}

function getTtsProvider(): TtsProvider {
  const provider = (process.env.TTS_PROVIDER || "").toLowerCase();
  if (provider === "volcengine" || provider === "doubao") return "volcengine";
  return "dashscope";
}

function getTtsModel(): string {
  return process.env.TTS_MODEL || process.env.QWEN_TTS_MODEL || DEFAULT_TTS_MODEL;
}

function getCosyVoiceStyleVersion(): string {
  return process.env.COSYVOICE_STYLE_VERSION || DEFAULT_COSYVOICE_STYLE_VERSION;
}

function isCosyVoiceModel(model: string): boolean {
  return model.toLowerCase().startsWith("cosyvoice-");
}

function getQwenPersonaTtsVoice(persona: PersonaId): string {
  return PERSONA_TTS_VOICES[persona];
}

function getVolcenginePersonaVoice(persona: PersonaId): string {
  return process.env[`VOLCENGINE_TTS_VOICE_${persona}`] || process.env.DOUBAO_TTS_VOICE || process.env.VOLCENGINE_TTS_VOICE || PERSONA_VOLCENGINE_VOICES[persona];
}

function getVolcenginePersonaSpeedRatio(persona: PersonaId): number {
  const raw =
    process.env[`VOLCENGINE_TTS_SPEED_${persona}`] ||
    process.env.DOUBAO_TTS_SPEED ||
    process.env.VOLCENGINE_TTS_SPEED;
  const baseValue = raw ? Number(raw) : getSharedPersonaTtsSpeedRatio(persona);
  const value = raw ? baseValue : baseValue * DEFAULT_VOLCENGINE_SPEED_BUMP;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function getConfiguredCosyVoiceId(persona: PersonaId): string | undefined {
  const personaVoice = process.env[`COSYVOICE_VOICE_${persona}`];
  const sharedVoice = process.env.COSYVOICE_VOICE_ID || process.env.COSYVOICE_VOICE;
  return personaVoice || sharedVoice || undefined;
}

function shouldAutoDesignCosyVoice(): boolean {
  return process.env.COSYVOICE_AUTO_DESIGN !== "false";
}

function getCosyVoicePrompt(persona: PersonaId): string {
  return process.env[`COSYVOICE_PROMPT_${persona}`] || PERSONA_COSYVOICE_PROMPTS[persona];
}

function getCosyVoicePreviewText(persona: PersonaId): string {
  return `我是 ${persona}，先别急着下结论，我们把这个问题放到圆桌上聊一聊。`;
}

function getCosyVoiceInstruction(persona: PersonaId): string {
  return process.env[`COSYVOICE_INSTRUCTION_${persona}`] || PERSONA_COSYVOICE_INSTRUCTIONS[persona];
}

function getTtsFormat(): string {
  return process.env.TTS_AUDIO_FORMAT || process.env.COSYVOICE_FORMAT || DEFAULT_TTS_FORMAT;
}

function getTtsSampleRate(): number {
  const raw = process.env.TTS_SAMPLE_RATE || process.env.COSYVOICE_SAMPLE_RATE;
  const parsed = raw ? Number(raw) : DEFAULT_TTS_SAMPLE_RATE;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTS_SAMPLE_RATE;
}

function getAudioUrl(parsed: TtsResponse | null): string | undefined {
  if (!parsed?.output) return undefined;
  if (typeof parsed.output.audio === "string") return parsed.output.audio;
  return parsed.output.audio?.url || parsed.output.url;
}

export function getPersonaTtsVoice(persona: PersonaId): string {
  if (getTtsProvider() === "volcengine") return getVolcenginePersonaVoice(persona);
  const model = getTtsModel();
  if (isCosyVoiceModel(model)) {
    return getConfiguredCosyVoiceId(persona) || `auto-design:${persona}`;
  }
  return getQwenPersonaTtsVoice(persona);
}

export function getPersonaTtsSpeedRatio(persona: PersonaId): number {
  if (getTtsProvider() === "volcengine") return getVolcenginePersonaSpeedRatio(persona);
  return 1;
}

export function getTtsModelName(): string {
  if (getTtsProvider() === "volcengine") return `volcengine:${getVolcenginePersonaVoice("ENFP")}`;
  const model = getTtsModel();
  if (isCosyVoiceModel(model)) return `${model}:${getCosyVoiceStyleVersion()}`;
  return model;
}

export async function synthesizePersonaSpeech({
  persona,
  text,
  signal,
}: {
  persona: PersonaId;
  text: string;
  signal?: AbortSignal;
}): Promise<SynthesizedSpeech> {
  if (getTtsProvider() === "volcengine") {
    return synthesizeVolcengineSpeech({ persona, text, signal });
  }

  const model = getTtsModel();
  if (isCosyVoiceModel(model)) {
    return synthesizeCosyVoiceSpeech({ persona, text, signal, model });
  }

  const voice = getQwenPersonaTtsVoice(persona);
  const response = await fetch(`${getDashScopeBaseUrl()}/services/aigc/multimodal-generation/generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDashScopeApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: {
        text,
        voice,
        language_type: "Chinese",
      },
    }),
    signal,
  });

  const raw = await response.text();
  let parsed: TtsResponse | null = null;
  try {
    parsed = JSON.parse(raw) as TtsResponse;
  } catch {}

  if (!response.ok) {
    throw new Error(parsed?.message || raw || `TTS request failed (${response.status})`);
  }

  const audioUrl = getAudioUrl(parsed);
  if (!audioUrl) {
    throw new Error(parsed?.message || parsed?.code || "TTS response missing output.audio.url");
  }

  return { audioUrl, voice };
}

async function getCosyVoiceId({
  persona,
  model,
  signal,
}: {
  persona: PersonaId;
  model: string;
  signal?: AbortSignal;
}): Promise<string> {
  const configuredVoice = getConfiguredCosyVoiceId(persona);
  if (configuredVoice) return configuredVoice;

  if (!shouldAutoDesignCosyVoice()) {
    throw new Error(
      "cosyvoice-v3.5-flash 需要先配置 COSYVOICE_VOICE_ID，或按人格配置 COSYVOICE_VOICE_ENFP 等声音设计/复刻 voice_id。v3.5 不支持 Qwen 系统音色。",
    );
  }

  const key = `${model}:${getCosyVoiceStyleVersion()}:${persona}`;
  const cached = cosyVoiceRuntimeIds.get(key);
  if (cached) return cached;

  const voiceId = await createCosyVoiceByDesign({ persona, model, signal });
  cosyVoiceRuntimeIds.set(key, voiceId);
  return voiceId;
}

async function createCosyVoiceByDesign({
  persona,
  model,
  signal,
}: {
  persona: PersonaId;
  model: string;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await fetch(`${getDashScopeBaseUrl()}/services/audio/tts/customization`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDashScopeApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voice-enrollment",
      input: {
        action: "create_voice",
        target_model: model,
        voice_prompt: getCosyVoicePrompt(persona),
        preview_text: getCosyVoicePreviewText(persona),
        prefix: `pc${persona.toLowerCase()}`,
        language_hints: ["zh"],
      },
      parameters: {
        sample_rate: getTtsSampleRate(),
        response_format: getTtsFormat(),
      },
    }),
    signal,
  });

  const raw = await response.text();
  let parsed: VoiceDesignResponse | null = null;
  try {
    parsed = JSON.parse(raw) as VoiceDesignResponse;
  } catch {}

  if (!response.ok) {
    throw new Error(parsed?.message || raw || `CosyVoice voice design failed (${response.status})`);
  }

  const voiceId = parsed?.output?.voice_id || parsed?.output?.voiceId || parsed?.output?.voice;
  if (!voiceId) {
    throw new Error(parsed?.message || parsed?.code || "CosyVoice voice design response missing output.voice_id");
  }

  return voiceId;
}

function getVolcengineApiKey(): string | undefined {
  return process.env.VOLCENGINE_TTS_API_KEY || process.env.DOUBAO_TTS_API_KEY || process.env.VOLCENGINE_API_KEY || process.env.DOUBAO_API_KEY;
}

function getVolcengineResourceId(): string {
  return process.env.VOLCENGINE_TTS_RESOURCE_ID || process.env.DOUBAO_TTS_RESOURCE_ID || DEFAULT_VOLCENGINE_TTS_RESOURCE_ID;
}

function parseJsonObjects(raw: string): unknown[] {
  const objects: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(raw.slice(start, i + 1)));
        } catch {}
        start = -1;
      }
    }
  }

  if (objects.length) return objects;
  try {
    return [JSON.parse(raw)];
  } catch {
    return [];
  }
}

function collectVolcengineAudioBytes(raw: string): ArrayBuffer {
  const chunks = parseJsonObjects(raw) as VolcengineTtsResponse[];
  const audioParts = chunks
    .map((chunk) => chunk.data)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (!audioParts.length) {
    const lastMessage = chunks.map((chunk) => chunk.message).filter(Boolean).pop();
    throw new Error(lastMessage || "Volcengine TTS response missing audio data");
  }

  const buffers = audioParts.map((part) => Buffer.from(part, "base64"));
  const merged = Buffer.concat(buffers);
  return merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength);
}

async function synthesizeVolcengineSpeech({
  persona,
  text,
  signal,
}: {
  persona: PersonaId;
  text: string;
  signal?: AbortSignal;
}): Promise<SynthesizedSpeech> {
  const apiKey = getVolcengineApiKey();
  if (!apiKey) {
    throw new Error("缺少 VOLCENGINE_TTS_API_KEY，无法调用新版豆包语音。");
  }
  const voice = getVolcenginePersonaVoice(persona);
  const speedRatio = getVolcenginePersonaSpeedRatio(persona);
  const encoding = process.env.VOLCENGINE_TTS_ENCODING || DEFAULT_VOLCENGINE_TTS_ENCODING;
  const requestId = crypto.randomUUID();
  const response = await fetch(process.env.VOLCENGINE_TTS_API_URL || DEFAULT_VOLCENGINE_TTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Key": VOLCENGINE_TTS_APP_KEY,
      "X-Api-Key": apiKey,
      "X-Api-Resource-Id": getVolcengineResourceId(),
      "X-Api-Request-Id": requestId,
    },
    body: JSON.stringify({
      user: {
        uid: "perso-douyin-minigame",
      },
      req_params: {
        text,
        speaker: voice,
        ...(speedRatio !== 1 ? { speech_rate: speedRatio } : {}),
        audio_params: {
          format: encoding,
          sample_rate: getTtsSampleRate(),
        },
      },
    }),
    signal,
  });

  const raw = await response.text();
  if (!response.ok) {
    const parsed = parseJsonObjects(raw).at(-1) as VolcengineTtsResponse | undefined;
    throw new Error(parsed?.message || raw || `Volcengine TTS V3 request failed (${response.status})`);
  }

  return {
    audioBytes: collectVolcengineAudioBytes(raw),
    contentType: encoding === "wav" ? "audio/wav" : "audio/mpeg",
    voice,
  };
}

async function synthesizeCosyVoiceSpeech({
  persona,
  text,
  signal,
  model,
}: {
  persona: PersonaId;
  text: string;
  signal?: AbortSignal;
  model: string;
}): Promise<SynthesizedSpeech> {
  const voice = await getCosyVoiceId({ persona, model, signal });
  const response = await fetch(`${getDashScopeBaseUrl()}/services/audio/tts/SpeechSynthesizer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDashScopeApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: {
        text,
        voice,
        format: getTtsFormat(),
        sample_rate: getTtsSampleRate(),
        instruction: getCosyVoiceInstruction(persona),
      },
    }),
    signal,
  });

  const raw = await response.text();
  let parsed: TtsResponse | null = null;
  try {
    parsed = JSON.parse(raw) as TtsResponse;
  } catch {}

  if (!response.ok) {
    throw new Error(parsed?.message || raw || `CosyVoice request failed (${response.status})`);
  }

  const audioUrl = getAudioUrl(parsed);
  if (!audioUrl) {
    throw new Error(parsed?.message || parsed?.code || "CosyVoice response missing output.audio.url");
  }

  return { audioUrl, voice };
}
