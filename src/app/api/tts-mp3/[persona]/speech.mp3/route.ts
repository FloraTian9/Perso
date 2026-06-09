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
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
  "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, Content-Type, X-Perso-TTS-Voice",
};

type RouteContext = {
  params: Promise<{ persona: string }>;
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

function audioHeaders(contentType: string, voice: string, contentLength: number): HeadersInit {
  return {
    ...corsHeaders,
    "Accept-Ranges": "bytes",
    "Content-Type": contentType,
    "Content-Length": String(contentLength),
    "Cache-Control": TTS_CACHE_CONTROL,
    "X-Perso-TTS-Voice": voice,
  };
}

function parseRange(range: string | null, size: number): { start: number; end: number } | null {
  if (!range) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : size - 1;

  if (!match[1] && match[2]) {
    const suffixLength = Number(match[2]);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

function audioResponse({
  bytes,
  contentType,
  voice,
  request,
  headOnly = false,
}: {
  bytes: ArrayBuffer;
  contentType: string;
  voice: string;
  request: Request;
  headOnly?: boolean;
}) {
  const size = bytes.byteLength;
  const range = parseRange(request.headers.get("range"), size);

  if (range) {
    const chunk = bytes.slice(range.start, range.end + 1);
    return new Response(headOnly ? null : chunk, {
      status: 206,
      headers: {
        ...audioHeaders(contentType, voice, chunk.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      },
    });
  }

  return new Response(headOnly ? null : bytes.slice(0), {
    headers: audioHeaders(contentType, voice, size),
  });
}

async function readPersona(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.persona;
}

async function handleTtsMp3(request: Request, context: RouteContext, headOnly = false) {
  const url = new URL(request.url);
  const persona = await readPersona(context);
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
    return audioResponse({
      bytes: cached.bytes,
      contentType: cached.contentType,
      voice: cached.voice,
      request,
      headOnly,
    });
  }

  try {
    const speech = await synthesizePersonaSpeech({ persona, text });
    let bytes = speech.audioBytes;
    let contentType = speech.contentType || "audio/mpeg";

    if (!bytes && speech.audioUrl) {
      const audioResponseResult = await fetch(speech.audioUrl);
      if (!audioResponseResult.ok) {
        throw new Error(`TTS audio fetch failed (${audioResponseResult.status})`);
      }

      bytes = await audioResponseResult.arrayBuffer();
      contentType = audioResponseResult.headers.get("Content-Type") || contentType;
    }

    if (!bytes) {
      throw new Error("TTS response missing audio bytes");
    }

    const voice = speech.voice;
    ttsCache.set(key, { bytes, contentType, voice });

    return audioResponse({
      bytes,
      contentType,
      voice,
      request,
      headOnly,
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

export async function GET(request: Request, context: RouteContext) {
  return handleTtsMp3(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return handleTtsMp3(request, context, true);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
