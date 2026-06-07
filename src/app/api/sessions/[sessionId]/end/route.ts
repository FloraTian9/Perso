import { dbSaveConversation } from "@/lib/db";
import type { RoundtableMessage } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type EndSessionBody = {
  ended_by?: unknown;
  messages?: unknown;
};

function asEndedBy(value: unknown): "natural" | "user" {
  return value === "user" ? "user" : "natural";
}

function asMessages(value: unknown): RoundtableMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (m): m is RoundtableMessage =>
      m !== null &&
      typeof m === "object" &&
      typeof m.persona === "string" &&
      typeof m.content === "string" &&
      typeof m.turn === "number",
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  let body: EndSessionBody;
  try {
    body = (await request.json()) as EndSessionBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  await dbSaveConversation(sessionId, asEndedBy(body.ended_by), asMessages(body.messages));

  return Response.json({ ok: true });
}
