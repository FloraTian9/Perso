import { createSession } from "@/lib/sessionStore";
import { DEFAULT_PERSONAS, isPersonaId } from "@/lib/personaIds";
import type { ChatMode, PersonaId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InitSessionBody = {
  topic?: unknown;
  mode?: unknown;
  personas?: unknown;
};

function asMode(value: unknown): ChatMode {
  if (value === "participant") return "participant";
  if (value === "fun" || value === "spectator") return "fun";
  return "participant";
}

function asTopic(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 120);
  }

  return "今晚吃什么？";
}

function asPersonas(value: unknown): PersonaId[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PERSONAS;
  }

  const seen = new Set<PersonaId>();
  for (const item of value) {
    if (isPersonaId(item)) {
      seen.add(item);
    }
    if (seen.size === 4) break;
  }

  return seen.size >= 2 ? [...seen] : DEFAULT_PERSONAS;
}

export async function POST(request: Request) {
  let body: InitSessionBody;

  try {
    body = (await request.json()) as InitSessionBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const session = await createSession({
      topic: asTopic(body.topic),
      mode: asMode(body.mode),
      personas: asPersonas(body.personas),
    });

    return Response.json({ session_id: session.id, session });
  } catch (error) {
    console.error("[sessions:init] Failed to create session", error);
    return Response.json(
      { error: "创建圆桌失败，请稍后重试。" },
      { status: 503 },
    );
  }
}
