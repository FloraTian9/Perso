import { isPersonaId } from "@/lib/personaIds";
import { getPersonaTtsSpeedRatio, getPersonaTtsVoice, getTtsModelName, synthesizePersonaSpeech } from "@/lib/tts";
import type { PersonaId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TTS_CHARS = 180;
const TTS_CACHE_CONTROL = "no-store";
const ttsCache = new Map<string, { bytes: ArrayBuffer; contentType: string; voice: string }>();
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_TTS_CHARS);
}

function cacheKey(persona: PersonaId, text: string): string {
  return `${getTtsModelName()}:${getPersonaTtsVoice(persona)}:${getPersonaTtsSpeedRatio(persona)}:${persona}:${text}`;
}

function toClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : "TTS failed";
  if (message.includes("Missing DASHSCOPE_API_KEY") || message.includes("Missing QWEN_API_KEY")) {
    return "缺少 DASHSCOPE_API_KEY 或 QWEN_API_KEY，无法生成语音。";
  }
  if (message.includes("VOLCENGINE_TTS_API_KEY")) {
    return "缺少 VOLCENGINE_TTS_API_KEY，无法调用新版豆包语音。";
  }
  return message.length > 300 ? `${message.slice(0, 300)}...` : message;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const persona = url.searchParams.get("persona");
  const text = normalizeText(url.searchParams.get("text") ?? "");

  if (!isPersonaId(persona)) {
    return Response.json({ error: "Invalid persona" }, { status: 400, headers: corsHeaders });
  }

  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400, headers: corsHeaders });
  }

  const key = cacheKey(persona, text);
  const cached = ttsCache.get(key);
  if (cached) {
    return new Response(cached.bytes.slice(0), {
      headers: {
        ...corsHeaders,
        "Content-Type": cached.contentType,
        "Cache-Control": TTS_CACHE_CONTROL,
        "X-Perso-TTS-Voice": cached.voice,
      },
    });
  }

  try {
    const speech = await synthesizePersonaSpeech({ persona, text });
    let bytes = speech.audioBytes;
    let contentType = speech.contentType || "audio/mpeg";

    if (!bytes && speech.audioUrl) {
      const audioResponse = await fetch(speech.audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`TTS audio fetch failed (${audioResponse.status})`);
      }

      bytes = await audioResponse.arrayBuffer();
      contentType = audioResponse.headers.get("Content-Type") || contentType;
    }

    if (!bytes) {
      throw new Error("TTS response missing audio bytes");
    }

    const voice = speech.voice;
    ttsCache.set(key, { bytes, contentType, voice });

    return new Response(bytes.slice(0), {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": TTS_CACHE_CONTROL,
        "X-Perso-TTS-Voice": voice,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: toClientError(error),
        voice: getPersonaTtsVoice(persona),
      },
      { status: 503, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
