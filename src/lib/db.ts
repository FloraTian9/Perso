import { createServerSupabaseClient } from "./supabase";
import type { RoundtableMessage, Session } from "@/types";

export async function dbCreateSession(session: Session): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("sessions").insert({
    id: session.id,
    topic: session.topic,
    mode: session.mode,
    personas: session.personas,
    created_at: session.createdAt,
  });

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }
  return true;
}

export async function dbGetSession(id: string): Promise<Session | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data: row } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!row) return null;

  const { data: msgRows } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("turn", { ascending: true });

  const messages: RoundtableMessage[] = (msgRows ?? []).map((m) => ({
    id: m.id as string,
    persona: m.persona as RoundtableMessage["persona"],
    content: m.content as string,
    turn: m.turn as number,
    timestamp: new Date(m.created_at as string).getTime(),
    label: (m.label as RoundtableMessage["label"]) ?? undefined,
  }));

  return {
    id: row.id as string,
    topic: row.topic as string,
    mode: row.mode as Session["mode"],
    personas: row.personas as Session["personas"],
    messages,
    createdAt: row.created_at as string,
    endedBy: (row.ended_by as Session["endedBy"]) ?? "natural",
  };
}

export async function dbSaveConversation(
  sessionId: string,
  endedBy: "natural" | "user",
  messages: RoundtableMessage[],
): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from("sessions").update({ ended_by: endedBy }).eq("id", sessionId);

  if (messages.length === 0) return;

  await supabase.from("messages").insert(
    messages.map((m) => ({
      session_id: sessionId,
      persona: m.persona,
      content: m.content,
      turn: m.turn,
      label: m.label ?? null,
    })),
  );
}
