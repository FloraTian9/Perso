import { dbCreateSession } from "./db";
import type { ChatMode, PersonaId, Session } from "@/types";

type CreateSessionInput = {
  topic: string;
  mode: ChatMode;
  personas: PersonaId[];
};

type SessionStore = Map<string, Session>;

// WARNING: In-process store only. Vercel serverless spins up multiple isolated
// instances, so sessions created in one will 404 in another. Replace with
// Supabase persistence (M5) before any production deployment.
const globalWithSessions = globalThis as typeof globalThis & {
  __persoSessions?: SessionStore;
};

const sessions = globalWithSessions.__persoSessions ?? new Map<string, Session>();
globalWithSessions.__persoSessions = sessions;

function shouldRequirePersistentSessions(): boolean {
  return process.env.VERCEL === "1";
}

export async function createSession({ topic, mode, personas }: CreateSessionInput): Promise<Session> {
  const id = crypto.randomUUID();
  const session: Session = {
    id,
    topic,
    mode,
    personas,
    messages: [],
    createdAt: new Date().toISOString(),
    endedBy: "natural",
  };

  sessions.set(id, session);
  try {
    const persisted = await dbCreateSession(session);
    if (!persisted) {
      if (shouldRequirePersistentSessions()) {
        sessions.delete(id);
        throw new Error("Missing Supabase environment variables; cannot persist session on Vercel.");
      }

      console.warn("[session-store] Supabase env is missing; session is only stored in memory.");
    }
  } catch (error) {
    if (shouldRequirePersistentSessions()) {
      sessions.delete(id);
      throw error;
    }

    console.warn("[session-store] Failed to persist session; using in-memory fallback.", error);
  }

  return session;
}

export function getSession(id: string): Session | null {
  return sessions.get(id) ?? null;
}
