"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingScreen } from "@/components/roundtable/LoadingScreen";
import { PlaybackControls } from "@/components/roundtable/PlaybackControls";
import { RoundTable } from "@/components/roundtable/RoundTable";
import { ShareCard } from "@/components/roundtable/ShareCard";
import { USER_INPUT_AREA_HEIGHT, UserInput } from "@/components/roundtable/UserInput";
import { isPersonaId } from "@/lib/personaIds";
import type { Atmosphere, MessageLabel, PersonaId, RoundtableMessage, Session } from "@/types";

type StreamStatus = "loading" | "generating" | "paused" | "done" | "waiting" | "error";
type DialogLine = { persona?: unknown; content?: unknown; label?: unknown };
type StreamDraft = { persona: PersonaId; content: string };
type PrivateNoteDraft = { targetPersona: PersonaId; content: string };

const MAX_DIALOG_CONTENT_CHARS = 90;
const labels = new Set<MessageLabel>(["反驳", "追问", "打断", "共识"]);
const TYPEWRITER_INTERVAL_MS = 150;   
const CHARS_PER_TICK = 1;
const BETWEEN_MSG_PAUSE_MS = 1500;   // 每条消息结束后停顿
const USER_SPEAKER_HOLD_MS = 2000;
const PLAYBACK_CONTROLS_AREA_HEIGHT = 80;  // 回放底栏（PlaybackControls）的固定可视高度，含 safe-area 余量
const FOOTER_AREA_HEIGHT = 90;             // 实时控制栏（进度条 + 暂停 + 结束）的高度，含 safe-area 余量
const ATMOSPHERE_CONTROLS_AREA_HEIGHT = 48;
const REPLAY_TICK_MS = 80;
const REPLAY_CHAR_MS = TYPEWRITER_INTERVAL_MS / CHARS_PER_TICK;
const SESSION_PERSONAS_KEY_PREFIX = "perso:session-personas:";
const SESSION_TOPIC_KEY_PREFIX = "perso:session-topic:";
const SESSION_LOAD_RETRY_DELAYS_MS = [250, 600, 1200];
const CHAT_FETCH_RETRY_DELAYS_MS = [700];
const ATMOSPHERE_OPTIONS: { value: Atmosphere; label: string }[] = [
  { value: "sharp", label: "更毒舌" },
  { value: "plain", label: "说人话" },
  { value: "sincere", label: "更真诚" },
  { value: "assertive", label: "更强势" },
];
const QUICK_PRIVATE_NOTE = "让 TA 说话";

type ReplayFrame = {
  index: number;
  content: string;
  timeMs: number;
};

type LiveProgressControlsProps = {
  progressRatio: number;
  paused: boolean;
  pauseDisabled: boolean;
  onSeekLiveWindow: (ratio: number) => void;
  onTogglePause: () => void;
  onEnd: () => void;
};

function PixelTextButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="relative shrink-0 disabled:opacity-40"
      style={{ width: 63, height: 28 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/button.png"
        alt=""
        style={{ width: 63, height: 28, imageRendering: "pixelated", display: "block" }}
      />
      <span
        className="font-pixel absolute inset-0 flex items-center justify-center text-black"
        style={{ fontSize: 13, letterSpacing: "0.1em", color: "#ffffff" }}
      >
        {label}
      </span>
    </button>
  );
}

function AtmosphereControls({
  value,
  onChange,
}: {
  value: Atmosphere;
  onChange: (value: Atmosphere) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-[30px] pb-2">
      {ATMOSPHERE_OPTIONS.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className="font-pixel shrink-0 border px-3 py-2"
            style={{
              background: active ? "#B1FD00" : "#111111",
              borderColor: active ? "#89B93B" : "#454545",
              color: active ? "#000000" : "#ffffff",
              fontSize: 12,
              borderRadius: 12,
            }}
            aria-pressed={active}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function PrivateNoteComposer({
  target,
  value,
  disabled,
  onChange,
  onSubmit,
  onQuickSubmit,
  onClose,
}: {
  target: PersonaId;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickSubmit: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/55 px-5 pb-5">
      <div className="w-full rounded-2xl border border-[#454545] bg-[#0a0a0a] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-pixel text-white" style={{ fontSize: 14 }}>
            给 {target} 递纸条
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-pixel text-neutral-300"
            style={{ fontSize: 13 }}
          >
            取消
          </button>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onQuickSubmit(QUICK_PRIVATE_NOTE)}
          className="font-pixel mb-3 w-full rounded-xl px-4 py-2 disabled:opacity-40"
          style={{ background: "#B1FD00", color: "#000000", fontSize: 13 }}
        >
          让 TA 说话
        </button>
        <textarea
          value={value}
          maxLength={80}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-none rounded-xl border border-[#454545] bg-[#202020] px-3 py-2 text-white outline-none"
          style={{ fontSize: 16, lineHeight: "22px" }}
          placeholder="写一句只想让 TA 看到的话"
          autoFocus
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-neutral-500">{value.trim().length}/80</span>
          <button
            type="button"
            disabled={disabled || value.trim().length === 0}
            onClick={onSubmit}
            className="font-pixel rounded-xl px-4 py-2 disabled:opacity-40"
            style={{ background: "#B1FD00", color: "#000000", fontSize: 13 }}
          >
            递过去
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveProgressControls({
  progressRatio,
  paused,
  pauseDisabled,
  onSeekLiveWindow,
  onTogglePause,
  onEnd,
}: LiveProgressControlsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pct = Math.max(0, Math.min(1, progressRatio)) * 100;

  function seekFromPointer(event: React.PointerEvent | PointerEvent) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onSeekLiveWindow(ratio);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    seekFromPointer(event);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-6 px-[30px] py-3"
      style={{
        borderTop: "1px solid #1f1f1f",
        background: "#0a0a0a",
      }}
    >
      <div
        ref={trackRef}
        className="relative min-w-0 flex-1 cursor-pointer select-none"
        style={{ height: 20, border: "3px solid white", background: "#000" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute" style={{ inset: 2, background: "#000" }}>
          <div
            className="absolute inset-0"
            style={{ right: `${100 - pct}%`, background: "white" }}
          />
        </div>
        <div
          className="absolute z-10"
          style={{
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 28,
            background: "white",
          }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <PixelTextButton
          label={paused ? "继续" : "暂停"}
          disabled={pauseDisabled}
          onClick={onTogglePause}
        />
        <PixelTextButton label="结束" onClick={onEnd} />
      </div>
    </div>
  );
}

function isMessageLabel(v: unknown): v is MessageLabel {
  return typeof v === "string" && labels.has(v as MessageLabel);
}

function parseSsePayload(line: string): string | null {
  if (!line.startsWith("data:")) return null;
  const raw = line.slice(5).trim();
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as { type?: string; content?: string };
    return p.type === "token" && typeof p.content === "string" ? p.content : null;
  } catch { return null; }
}

function extractDialogLines(raw: string): DialogLine[] {
  const objects: DialogLine[] = [];
  let depth = 0, start = -1, inString = false, escaping = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === "\\") escaping = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") { if (depth === 0) start = i; depth++; continue; }
    if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try { objects.push(JSON.parse(raw.slice(start, i + 1)) as DialogLine); } catch {}
        start = -1;
      }
    }
  }
  return objects;
}

function extractJsonStringField(raw: string, key: string, options: { allowPartial?: boolean } = {}): string | null {
  const keyIndex = raw.indexOf(`"${key}"`);
  if (keyIndex < 0) return null;

  const colonIndex = raw.indexOf(":", keyIndex);
  if (colonIndex < 0) return null;

  const quoteIndex = raw.indexOf('"', colonIndex + 1);
  if (quoteIndex < 0) return null;

  let value = "";
  let escaping = false;
  for (let i = quoteIndex + 1; i < raw.length; i++) {
    const ch = raw[i];
    if (escaping) {
      value += ch;
      escaping = false;
      continue;
    }
    if (ch === "\\") {
      escaping = true;
      continue;
    }
    if (ch === '"') return value;
    value += ch;
  }

  return options.allowPartial ? value : null;
}

function extractCurrentDialogDraft(raw: string, completedCount: number): StreamDraft | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaping = false;
  let completed = 0;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === "\\") escaping = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        completed++;
        start = -1;
      }
    }
  }

  if (depth <= 0 || start < 0 || completed !== completedCount) return null;

  const currentObject = raw.slice(start);
  const persona = extractJsonStringField(currentObject, "persona");
  const content = extractJsonStringField(currentObject, "content", { allowPartial: true });
  if (!isPersonaId(persona) || !content) return null;

  return { persona, content };
}

function splitDialogContent(content: string, maxChars = MAX_DIALOG_CONTENT_CHARS): string[] {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const units = normalized.match(/[^。！？!?；;，,]+[。！？!?；;，,]?/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";

  function pushCurrent() {
    const text = current.trim();
    if (text) chunks.push(text);
    current = "";
  }

  for (const unit of units) {
    const piece = unit.trim();
    if (!piece) continue;

    if (piece.length > maxChars) {
      pushCurrent();
      for (let i = 0; i < piece.length; i += maxChars) {
        const sliced = piece.slice(i, i + maxChars).trim();
        if (sliced) chunks.push(sliced);
      }
      continue;
    }

    if (current && current.length + piece.length > maxChars) pushCurrent();
    current += piece;
  }

  pushCurrent();
  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChars)];
}

function toRoundtableMessages(line: DialogLine, startIndex: number): RoundtableMessage[] {
  if (!isPersonaId(line.persona) || typeof line.content !== "string") return [];
  const persona = line.persona;
  return splitDialogContent(line.content).map((content, offset) => ({
    id: `${startIndex + offset}-${persona}-${content.slice(0, 12)}`,
    persona,
    content,
    label: isMessageLabel(line.label) ? line.label : undefined,
    turn: startIndex + offset + 1,
    timestamp: Date.now(),
  }));
}

function asDisplayPersona(value: RoundtableMessage["persona"] | undefined): PersonaId | undefined {
  return isPersonaId(value) ? value : undefined;
}

function asDisplaySpeaker(value: RoundtableMessage["persona"] | undefined): PersonaId | "user" | undefined {
  if (value === "user") return "user";
  return asDisplayPersona(value);
}

function findLastPersonaMessage(messages: RoundtableMessage[]): RoundtableMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isPersonaId(messages[i].persona)) return messages[i];
  }
  return undefined;
}

async function readResponseError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `请求失败（${response.status}）`;

  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {}

  if (
    text.includes("AllocationQuota.FreeTierOnly") ||
    text.includes("free tier of the model has been exhausted")
  ) {
    return "Qwen 模型免费额度已耗尽。请切换可用的 QWEN_MODEL / API Key，或在百炼控制台关闭仅使用免费额度后重试。";
  }

  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isFetchNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message);
}

function getClientErrorMessage(error: unknown, fallback: string): string {
  if (isFetchNetworkError(error)) {
    return "网络连接中断，未能连接到圆桌服务。请检查网络后重试。";
  }

  return error instanceof Error ? error.message : fallback;
}

function isTransientSessionLoadStatus(status: number): boolean {
  return status === 404 || status === 408 || status === 425 || status === 429 || status >= 500;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function fetchSessionWithRetry(sessionId: string, signal: AbortSignal): Promise<Session> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= SESSION_LOAD_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { signal });
      if (res.ok) {
        const data = (await res.json()) as { session: Session };
        return data.session;
      }

      const message = await readResponseError(res);
      const error = new Error(message);
      lastError = error;

      if (!isTransientSessionLoadStatus(res.status) || attempt === SESSION_LOAD_RETRY_DELAYS_MS.length) {
        throw error;
      }
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;

      if (!isFetchNetworkError(error) || attempt === SESSION_LOAD_RETRY_DELAYS_MS.length) {
        throw error;
      }
    }

    await wait(SESSION_LOAD_RETRY_DELAYS_MS[attempt], signal);
  }

  throw lastError instanceof Error ? lastError : new Error("加载圆桌失败");
}

async function fetchChatResponseWithRetry(
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= CHAT_FETCH_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;

      if (!isFetchNetworkError(error) || attempt === CHAT_FETCH_RETRY_DELAYS_MS.length) {
        throw error;
      }
    }

    await wait(CHAT_FETCH_RETRY_DELAYS_MS[attempt], signal);
  }

  throw lastError instanceof Error ? lastError : new Error("生成连接失败");
}

function getReplayMessageDuration(message: RoundtableMessage): number {
  return Math.max(REPLAY_CHAR_MS, message.content.length * REPLAY_CHAR_MS) + BETWEEN_MSG_PAUSE_MS;
}

function getVisibleReplayTime(fullMessages: RoundtableMessage[], visibleMessages: RoundtableMessage[]): number {
  let elapsed = 0;
  const count = Math.min(fullMessages.length, visibleMessages.length);

  for (let i = 0; i < count; i++) {
    const full = fullMessages[i];
    const visible = visibleMessages[i];
    if (full.id !== visible.id) break;

    const visibleChars = Math.min(full.content.length, visible.content.length);
    if (visibleChars < full.content.length) {
      return elapsed + Math.max(0, visibleChars * REPLAY_CHAR_MS);
    }

    elapsed += getReplayMessageDuration(full);
  }

  return elapsed;
}

function getReplayTotalDuration(messages: RoundtableMessage[]): number {
  return messages.reduce((sum, message) => sum + getReplayMessageDuration(message), 0);
}

function getReplayTimeForIndex(messages: RoundtableMessage[], index: number): number {
  return messages.slice(0, Math.max(0, Math.min(index, messages.length))).reduce(
    (sum, message) => sum + getReplayMessageDuration(message),
    0,
  );
}

function getReplayFrame(messages: RoundtableMessage[], timeMs: number): ReplayFrame {
  if (messages.length === 0) return { index: 0, content: "", timeMs: 0 };

  let elapsed = Math.max(0, timeMs);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const typingMs = Math.max(REPLAY_CHAR_MS, message.content.length * REPLAY_CHAR_MS);
    const durationMs = typingMs + BETWEEN_MSG_PAUSE_MS;

    if (elapsed <= typingMs) {
      const visibleChars = Math.min(message.content.length, Math.ceil(elapsed / REPLAY_CHAR_MS));
      return { index: i + 1, content: message.content.slice(0, visibleChars), timeMs };
    }

    if (elapsed < durationMs) {
      return { index: i + 1, content: message.content, timeMs };
    }

    elapsed -= durationMs;
  }

  const last = messages[messages.length - 1];
  return { index: messages.length, content: last.content, timeMs: getReplayTotalDuration(messages) };
}

function getSessionPersonasKey(sessionId: string) {
  return `${SESSION_PERSONAS_KEY_PREFIX}${sessionId}`;
}

function getSessionTopicKey(sessionId: string) {
  return `${SESSION_TOPIC_KEY_PREFIX}${sessionId}`;
}

function readCachedPersonas(sessionId: string): PersonaId[] {
  try {
    const raw = window.sessionStorage.getItem(getSessionPersonasKey(sessionId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPersonaId);
  } catch {
    return [];
  }
}

function readCachedTopic(sessionId: string): string {
  try {
    return window.sessionStorage.getItem(getSessionTopicKey(sessionId))?.trim() ?? "";
  } catch {
    return "";
  }
}

function cacheSessionPersonas(sessionId: string, personas: PersonaId[]) {
  try {
    window.sessionStorage.setItem(getSessionPersonasKey(sessionId), JSON.stringify(personas));
  } catch {}
}

function cacheSessionTopic(sessionId: string, topic: string) {
  try {
    window.sessionStorage.setItem(getSessionTopicKey(sessionId), topic);
  } catch {}
}

export default function TablePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<RoundtableMessage[]>([]);
  const [status, setStatus] = useState<StreamStatus>("loading");
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [hasOpened, setHasOpened] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [replayDisplayContent, setReplayDisplayContent] = useState("");
  const [cachedPersonas, setCachedPersonas] = useState<PersonaId[]>([]);
  const [cachedTopic, setCachedTopic] = useState("");
  const [streamDraft, setStreamDraft] = useState<StreamDraft | null>(null);
  const [userSpeakerMessage, setUserSpeakerMessage] = useState<RoundtableMessage | null>(null);
  const [isLiveRewound, setIsLiveRewound] = useState(false);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("plain");
  const [noteTarget, setNoteTarget] = useState<PersonaId | null>(null);
  const [noteText, setNoteText] = useState("");
  const [, bumpLiveProgress] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const fullMessagesRef = useRef<RoundtableMessage[]>([]);
  const revealQueueRef = useRef<RoundtableMessage[]>([]);
  const revealTimerRef = useRef<number | null>(null);
  const replayTimerRef = useRef<number | null>(null);
  const streamDraftRevealTimerRef = useRef<number | null>(null);
  const streamDraftTargetRef = useRef<StreamDraft | null>(null);
  const userSpeakerTimerRef = useRef<number | null>(null);
  const userSpeakerMessageRef = useRef<RoundtableMessage | null>(null);
  const replayTimeRef = useRef(0);
  const isReplayPlayingRef = useRef(false);
  const betweenPauseRef = useRef<number | null>(null);
  const currentRevealRef = useRef<{ message: RoundtableMessage; visibleChars: number } | null>(null);
  const streamFinishedRef = useRef(false);
  const statusRef = useRef<StreamStatus>("loading");
  const sessionModeRef = useRef<"fun" | "participant">("fun");
  const conversationEndedRef = useRef(false);
  const streamDraftRef = useRef<StreamDraft | null>(null);
  const displayedMessagesRef = useRef<RoundtableMessage[]>([]);
  const liveEdgeMessagesRef = useRef<RoundtableMessage[]>([]);
  const isLiveRewoundRef = useRef(false);
  const atmosphereRef = useRef<Atmosphere>("plain");
  const pendingPrivateNoteRef = useRef<PrivateNoteDraft | null>(null);
  const processPendingPrivateNoteRef = useRef<(() => void) | null>(null);
  const privateNoteOpenRef = useRef(false);
  const resumeAfterPrivateNoteCancelRef = useRef(false);
  const resumeAfterPrivateNoteCancelRunnerRef = useRef<(() => void) | null>(null);

  // 当前场景展示的活跃人格和气泡内容
  const lastMessage = messages[messages.length - 1];
  const lastPersonaMessage = findLastPersonaMessage(messages);
  const isParticipant = session?.mode === "participant";
  const isFunMode = !!session && session.mode !== "participant";
  const isLiveStatus = status === "generating" || status === "paused";
  const isUserSpeakerActive = isParticipant && isLiveStatus && !!userSpeakerMessage;

  const sceneActiveSpeaker: PersonaId | "user" | undefined =
    isUserSpeakerActive
      ? "user"
      : isLiveStatus && !isLiveRewound && streamDraft
      ? streamDraft.persona
      : isLiveStatus && lastMessage?.persona !== "user"
      ? asDisplayPersona(lastMessage?.persona)
      : isParticipant && isLiveStatus && lastMessage?.persona === "user"
      ? "user"
      : isParticipant && (status === "waiting" || (isLiveStatus && lastMessage?.persona === "user"))
      ? asDisplayPersona(lastPersonaMessage?.persona)
      : status === "done" && replayIndex > 0
        ? asDisplaySpeaker(fullMessagesRef.current[replayIndex - 1]?.persona)
        : undefined;

  const sceneActiveSpeechContent: string | undefined =
    isUserSpeakerActive
      ? userSpeakerMessage?.content
      : isLiveStatus && !isLiveRewound && streamDraft
      ? streamDraft.content
      : isLiveStatus
      ? lastMessage?.persona === "user" && isParticipant
        ? lastMessage.content
        : lastMessage?.content
      : isParticipant && status === "waiting"
      ? lastPersonaMessage?.content
      : status === "done" && replayIndex > 0
        ? replayDisplayContent
        : undefined;

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isReplayPlayingRef.current = isReplayPlaying; }, [isReplayPlaying]);
  useEffect(() => { streamDraftRef.current = streamDraft; }, [streamDraft]);
  useEffect(() => { userSpeakerMessageRef.current = userSpeakerMessage; }, [userSpeakerMessage]);
  useEffect(() => { isLiveRewoundRef.current = isLiveRewound; }, [isLiveRewound]);
  useEffect(() => { atmosphereRef.current = atmosphere; }, [atmosphere]);
  useEffect(() => {
    displayedMessagesRef.current = messages;
    if (!isLiveRewoundRef.current && statusRef.current !== "done") {
      liveEdgeMessagesRef.current = messages;
    }
  }, [messages]);

  useEffect(() => {
    setCachedPersonas(readCachedPersonas(params.sessionId));
    setCachedTopic(readCachedTopic(params.sessionId));
  }, [params.sessionId]);

  const stopRevealLoop = useCallback(() => {
    if (revealTimerRef.current !== null) { window.clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
    if (betweenPauseRef.current !== null) { window.clearTimeout(betweenPauseRef.current); betweenPauseRef.current = null; }
  }, []);

  const stopReplayLoop = useCallback(() => {
    if (replayTimerRef.current !== null) { window.clearInterval(replayTimerRef.current); replayTimerRef.current = null; }
  }, []);

  const stopStreamDraftRevealLoop = useCallback(() => {
    if (streamDraftRevealTimerRef.current !== null) {
      window.clearInterval(streamDraftRevealTimerRef.current);
      streamDraftRevealTimerRef.current = null;
    }
  }, []);

  const clearUserSpeakerTimer = useCallback(() => {
    if (userSpeakerTimerRef.current !== null) {
      window.clearTimeout(userSpeakerTimerRef.current);
      userSpeakerTimerRef.current = null;
    }
  }, []);

  const clearStreamDraft = useCallback(() => {
    streamDraftTargetRef.current = null;
    streamDraftRef.current = null;
    setStreamDraft(null);
    stopStreamDraftRevealLoop();
  }, [stopStreamDraftRevealLoop]);

  const isRevealIdle = useCallback(() => (
    currentRevealRef.current === null &&
    revealQueueRef.current.length === 0 &&
    revealTimerRef.current === null &&
    betweenPauseRef.current === null
  ), []);

  const startStreamDraftRevealLoop = useCallback(() => {
    if (statusRef.current === "paused") return;
    if (streamDraftRevealTimerRef.current !== null) return;

    streamDraftRevealTimerRef.current = window.setInterval(() => {
      if (statusRef.current === "paused") return;
      const target = streamDraftTargetRef.current;
      if (userSpeakerMessageRef.current) return;
      if (!target) {
        clearStreamDraft();
        return;
      }

      setStreamDraft((prev) => {
        const shouldReset = !prev || prev.persona !== target.persona || !target.content.startsWith(prev.content);
        const currentContent = shouldReset ? "" : prev.content;
        const nextLength = Math.min(target.content.length, currentContent.length + CHARS_PER_TICK);
        const nextDraft = { persona: target.persona, content: target.content.slice(0, nextLength) };
        streamDraftRef.current = nextDraft;
        return nextDraft;
      });
    }, TYPEWRITER_INTERVAL_MS);
  }, [clearStreamDraft]);

  const applyReplayTime = useCallback((timeMs: number) => {
    const all = fullMessagesRef.current;
    const totalMs = getReplayTotalDuration(all);
    const boundedTime = Math.max(0, Math.min(timeMs, totalMs));
    const frame = getReplayFrame(all, boundedTime);

    replayTimeRef.current = boundedTime;
    setReplayIndex(frame.index);
    setReplayDisplayContent(frame.content);
    setMessages(all.slice(0, frame.index));
  }, []);

  const finishGeneration = useCallback(() => {
    clearStreamDraft();
    setMessages(fullMessagesRef.current);
    if (sessionModeRef.current === "participant") {
      setHasOpened(true); setStatus("waiting");
    } else {
      applyReplayTime(0);
      setIsReplayPlaying(false); setStatus("done");
    }
  }, [applyReplayTime, clearStreamDraft]);

  const startRevealLoop = useCallback(() => {
    if (revealTimerRef.current !== null) return;
    if (betweenPauseRef.current !== null) return;
    revealTimerRef.current = window.setInterval(() => {
      if (statusRef.current === "paused") { stopRevealLoop(); return; }
      if (userSpeakerMessageRef.current) return;
      let cur = currentRevealRef.current;
      if (!cur) {
        const next = revealQueueRef.current.shift();
        if (!next) {
          stopRevealLoop();
          if (streamFinishedRef.current && statusRef.current === "generating") finishGeneration();
          return;
        }
        cur = { message: next, visibleChars: 0 };
        currentRevealRef.current = cur;
        setMessages((prev) => [...prev, { ...next, content: "" }]);
      }
      const nextChars = Math.min(cur.message.content.length, cur.visibleChars + CHARS_PER_TICK);
      cur.visibleChars = nextChars;
      setMessages((prev) =>
        prev.map((m) => m.id === cur!.message.id ? { ...cur!.message, content: cur!.message.content.slice(0, nextChars) } : m),
      );
      if (nextChars >= cur.message.content.length) {
        currentRevealRef.current = null;
        // 每条消息打完后暂停一下再显示下一条
        window.clearInterval(revealTimerRef.current!);
        revealTimerRef.current = null;
        betweenPauseRef.current = window.setTimeout(() => {
          betweenPauseRef.current = null;
          if (pendingPrivateNoteRef.current && sessionModeRef.current !== "participant") {
            processPendingPrivateNoteRef.current?.();
            return;
          }
          if (privateNoteOpenRef.current) return;
          if (resumeAfterPrivateNoteCancelRef.current && sessionModeRef.current !== "participant") {
            resumeAfterPrivateNoteCancelRef.current = false;
            resumeAfterPrivateNoteCancelRunnerRef.current?.();
            return;
          }
          startRevealLoop();
        }, BETWEEN_MSG_PAUSE_MS);
      }
    }, TYPEWRITER_INTERVAL_MS);
  }, [finishGeneration, stopRevealLoop]);

  const enqueueMessages = useCallback((next: RoundtableMessage[]) => {
    if (next.length === 0) return;
    fullMessagesRef.current = [...fullMessagesRef.current, ...next];
    bumpLiveProgress((value) => value + 1);
    revealQueueRef.current.push(...next);
    startRevealLoop();
  }, [startRevealLoop]);

  const startStream = useCallback(async (
    history: RoundtableMessage[],
    options: {
      opening?: boolean;
      userMessage?: string;
      phase?: "opening" | "continuation" | "note" | "full";
      finishOnComplete?: boolean;
      privateNote?: PrivateNoteDraft;
      followupContinuation?: boolean;
    } = {},
  ) => {
    if (!session) return;
    abortRef.current?.abort();
    conversationEndedRef.current = false;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    streamFinishedRef.current = false;
    clearStreamDraft();
    setStatus("generating"); setError("");

    let streamText = "", emittedCount = 0;
    const baseTurn = fullMessagesRef.current.length;

    try {
      const res = await fetchChatResponseWithRetry(
        {
          mode: session.mode, topic: session.topic, personas: session.personas,
          messages: history,
          atmosphere: atmosphereRef.current,
          ...(options.opening ? { opening: true } : {}),
          ...(options.phase ? { phase: options.phase } : {}),
          ...(options.privateNote ? { privateNote: options.privateNote } : {}),
          ...(options.userMessage !== undefined ? { userMessage: options.userMessage } : {}),
        },
        ctrl.signal,
      );
      if (!res.ok) throw new Error(await readResponseError(res));
      if (!res.body) throw new Error("生成接口没有返回可读取的流。");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const frames = sseBuffer.split("\n\n");
        sseBuffer = frames.pop() ?? "";
        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            const token = parseSsePayload(line.trim());
            if (!token) continue;
            streamText += token;
            const parsed = extractDialogLines(streamText);
            const newlyParsed = parsed.slice(emittedCount);
            const next: RoundtableMessage[] = [];
            for (const item of newlyParsed) {
              next.push(...toRoundtableMessages(item, fullMessagesRef.current.length + next.length));
            }
            if (newlyParsed.length > 0) {
              emittedCount = parsed.length;
              if (next.length === 0) {
                clearStreamDraft();
                continue;
              }

              const draft = streamDraftRef.current;

              if (
                draft &&
                isRevealIdle() &&
                fullMessagesRef.current.length === baseTurn &&
                next[0].persona === draft.persona &&
                next[0].content.startsWith(draft.content)
              ) {
                const [first, ...rest] = next;
                const visibleChars = Math.min(draft.content.length, first.content.length);
                fullMessagesRef.current = [...fullMessagesRef.current, first, ...rest];
                bumpLiveProgress((value) => value + 1);
                currentRevealRef.current = { message: first, visibleChars };
                if (rest.length > 0) revealQueueRef.current.push(...rest);
                clearStreamDraft();
                setMessages((prev) => [...prev, { ...first, content: first.content.slice(0, visibleChars) }]);
                startRevealLoop();
              } else {
                clearStreamDraft();
                enqueueMessages(next);
              }
            } else {
              const draft =
                isRevealIdle() && fullMessagesRef.current.length === baseTurn
                  ? extractCurrentDialogDraft(streamText, emittedCount)
                  : null;
              streamDraftTargetRef.current = draft;
              if (draft) startStreamDraftRevealLoop();
              else clearStreamDraft();
            }
          }
        }
      }
      if (options.finishOnComplete !== false) {
        streamFinishedRef.current = true;
        if (revealQueueRef.current.length === 0 && !currentRevealRef.current) finishGeneration();
      } else if (options.followupContinuation && !ctrl.signal.aborted && !conversationEndedRef.current) {
        await startStream([...fullMessagesRef.current], { phase: "continuation" });
      }
    } catch (e) {
      if (ctrl.signal.aborted) {
        if (abortRef.current === ctrl) {
          clearStreamDraft();
          if (sessionModeRef.current === "participant" && !conversationEndedRef.current) setStatus("waiting");
        }
        return;
      }
      clearStreamDraft();
      setLoadingVisible(false);
      setError(getClientErrorMessage(e, "生成失败")); setStatus("error");
    }
  }, [clearStreamDraft, enqueueMessages, finishGeneration, isRevealIdle, session, startRevealLoop, startStreamDraftRevealLoop]);

  const truncateToVisibleHistory = useCallback(() => {
    abortRef.current?.abort();
    stopRevealLoop();
    clearStreamDraft();
    revealQueueRef.current = [];
    streamFinishedRef.current = false;
    isLiveRewoundRef.current = false;
    setIsLiveRewound(false);

    const visibleHistory = displayedMessagesRef.current
      .filter((message) => message.content.trim().length > 0)
      .map((message, index) => ({ ...message, turn: index + 1 }));
    const current = currentRevealRef.current;
    if (current) {
      const index = visibleHistory.findIndex((message) => message.id === current.message.id);
      if (index >= 0) visibleHistory[index] = { ...current.message, turn: index + 1 };
      else visibleHistory.push({ ...current.message, turn: visibleHistory.length + 1 });
    }

    currentRevealRef.current = null;
    fullMessagesRef.current = visibleHistory;
    liveEdgeMessagesRef.current = visibleHistory;
    setMessages(visibleHistory);
    bumpLiveProgress((value) => value + 1);
    return visibleHistory;
  }, [clearStreamDraft, stopRevealLoop]);

  const freezeFutureAfterCurrentMessage = useCallback(() => {
    abortRef.current?.abort();
    clearStreamDraft();
    revealQueueRef.current = [];
    streamFinishedRef.current = false;
    resumeAfterPrivateNoteCancelRef.current = false;
    isLiveRewoundRef.current = false;
    setIsLiveRewound(false);

    const visibleHistory = displayedMessagesRef.current
      .filter((message) => message.content.trim().length > 0)
      .map((message, index) => ({ ...message, turn: index + 1 }));
    const current = currentRevealRef.current;
    if (current) {
      const index = visibleHistory.findIndex((message) => message.id === current.message.id);
      if (index >= 0) visibleHistory[index] = { ...current.message, turn: index + 1 };
      else visibleHistory.push({ ...current.message, turn: visibleHistory.length + 1 });
    }

    fullMessagesRef.current = visibleHistory;
    liveEdgeMessagesRef.current = visibleHistory;
    bumpLiveProgress((value) => value + 1);
  }, [clearStreamDraft]);

  const resumeContinuationAfterPrivateNoteCancel = useCallback(() => {
    const visibleHistory = truncateToVisibleHistory();
    void startStream(visibleHistory, { phase: "continuation" });
  }, [startStream, truncateToVisibleHistory]);

  useEffect(() => {
    resumeAfterPrivateNoteCancelRunnerRef.current = resumeContinuationAfterPrivateNoteCancel;
  }, [resumeContinuationAfterPrivateNoteCancel]);

  const processPendingPrivateNote = useCallback(() => {
    const note = pendingPrivateNoteRef.current;
    if (!note || !session || session.mode === "participant") return;

    pendingPrivateNoteRef.current = null;
    const visibleHistory = truncateToVisibleHistory();

    void startStream(visibleHistory, {
      phase: "note",
      privateNote: note,
      finishOnComplete: false,
      followupContinuation: true,
    });
  }, [session, startStream, truncateToVisibleHistory]);

  useEffect(() => {
    processPendingPrivateNoteRef.current = processPendingPrivateNote;
  }, [processPendingPrivateNote]);

  const handleOpenPrivateNote = useCallback((personaId: PersonaId) => {
    if (!session || session.mode === "participant" || status === "done" || status === "error" || status === "loading") return;
    privateNoteOpenRef.current = true;
    freezeFutureAfterCurrentMessage();
    setNoteTarget(personaId);
    setNoteText("");
  }, [freezeFutureAfterCurrentMessage, session, status]);

  const submitPrivateNoteContent = useCallback((content: string) => {
    const text = content.trim();
    if (!noteTarget || !text) return;
    pendingPrivateNoteRef.current = {
      targetPersona: noteTarget,
      content: text.slice(0, 80),
    };
    privateNoteOpenRef.current = false;
    resumeAfterPrivateNoteCancelRef.current = false;
    setNoteTarget(null);
    setNoteText("");

    if (statusRef.current === "paused") {
      statusRef.current = "generating";
      setStatus("generating");
    }

    if (isRevealIdle()) {
      processPendingPrivateNote();
    }
  }, [isRevealIdle, noteTarget, processPendingPrivateNote]);

  const handleSubmitPrivateNote = useCallback(() => {
    submitPrivateNoteContent(noteText);
  }, [noteText, submitPrivateNoteContent]);

  const handleClosePrivateNote = useCallback(() => {
    privateNoteOpenRef.current = false;
    pendingPrivateNoteRef.current = null;
    setNoteTarget(null);
    setNoteText("");

    if (!session || session.mode === "participant") return;
    if (statusRef.current === "loading" || statusRef.current === "done" || statusRef.current === "error") return;

    if (isRevealIdle()) {
      resumeContinuationAfterPrivateNoteCancel();
      return;
    }

    resumeAfterPrivateNoteCancelRef.current = true;
  }, [isRevealIdle, resumeContinuationAfterPrivateNoteCancel, session]);

  const handleAtmosphereChange = useCallback((next: Atmosphere) => {
    if (atmosphereRef.current === next) {
      setAtmosphere(next);
      return;
    }

    setAtmosphere(next);
    atmosphereRef.current = next;

    if (!session || session.mode === "participant") return;
    if (statusRef.current === "loading" || statusRef.current === "done" || statusRef.current === "error") return;

    statusRef.current = "generating";
    setStatus("generating");

    if (pendingPrivateNoteRef.current) {
      processPendingPrivateNote();
      return;
    }

    const visibleHistory = truncateToVisibleHistory();
    void startStream(visibleHistory, { phase: "continuation" });
  }, [processPendingPrivateNote, session, startStream, truncateToVisibleHistory]);

  useEffect(() => {
    // AbortController：dev 模式下 React Strict Mode 会双 mount，
    // 没有 cleanup 时第一次 fetch 返回会覆盖 fullMessagesRef，把已经流入的消息清掉，
    // 导致 spectator 模式 continuation 阶段误判 length === 0 直接 return。
    const ctrl = new AbortController();
    async function loadSession() {
      try {
        const loadedSession = await fetchSessionWithRetry(params.sessionId, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setSession(loadedSession);
        setCachedPersonas(loadedSession.personas);
        setCachedTopic(loadedSession.topic);
        cacheSessionPersonas(params.sessionId, loadedSession.personas);
        cacheSessionTopic(params.sessionId, loadedSession.topic);
        sessionModeRef.current = loadedSession.mode === "participant" ? "participant" : "fun";
        fullMessagesRef.current = loadedSession.messages;
        bumpLiveProgress((value) => value + 1);
        const totalReplayTime = getReplayTotalDuration(loadedSession.messages);
        applyReplayTime(totalReplayTime);
      } catch (e) {
        if (isAbortError(e) || ctrl.signal.aborted) return;
        setLoadingVisible(false);
        setError(getClientErrorMessage(e, "加载圆桌失败")); setStatus("error");
      }
    }
    loadSession();
    return () => ctrl.abort();
  }, [applyReplayTime, params.sessionId]);

  useEffect(() => {
    if (!session || startedRef.current) return;
    startedRef.current = true;
    if (session.mode === "participant") {
      startStream([], { opening: true });
      return;
    }

    (async () => {
      await startStream([], { phase: "opening", finishOnComplete: false });
      if (
        conversationEndedRef.current ||
        abortRef.current?.signal.aborted ||
        statusRef.current === "error" ||
        fullMessagesRef.current.length === 0
      ) {
        return;
      }
      await startStream([...fullMessagesRef.current], { phase: "continuation" });
    })();
  }, [session, startStream]);

  const handleEndConversation = useCallback(() => {
    const displayedHistory = isLiveRewoundRef.current ? liveEdgeMessagesRef.current : displayedMessagesRef.current;
    const visibleMessages = displayedHistory.filter((message) => message.content.trim().length > 0);
    conversationEndedRef.current = true;
    abortRef.current?.abort(); stopRevealLoop();
    revealQueueRef.current = [];
    currentRevealRef.current = null;
    streamFinishedRef.current = false;
    fullMessagesRef.current = visibleMessages;
    bumpLiveProgress((value) => value + 1);
    isLiveRewoundRef.current = false;
    setIsLiveRewound(false);
    clearUserSpeakerTimer();
    setUserSpeakerMessage(null);
    clearStreamDraft();
    applyReplayTime(0);
    setIsReplayPlaying(false); setStatus("done");
  }, [applyReplayTime, clearStreamDraft, clearUserSpeakerTimer, stopRevealLoop]);

  const handleUserSend = useCallback(async () => {
    const text = userInput.trim();
    if (!text || status !== "waiting") return;
    setUserInput("");
    const historyBeforeUser = [...fullMessagesRef.current];
    const userMsg: RoundtableMessage = {
      id: `user-${Date.now()}`, persona: "user", content: text,
      turn: fullMessagesRef.current.length + 1, timestamp: Date.now(),
    };
    fullMessagesRef.current = [...historyBeforeUser, userMsg];
    bumpLiveProgress((value) => value + 1);
    setMessages([...fullMessagesRef.current]);
    clearUserSpeakerTimer();
    userSpeakerMessageRef.current = userMsg;
    setUserSpeakerMessage(userMsg);
    userSpeakerTimerRef.current = window.setTimeout(() => {
      userSpeakerMessageRef.current = null;
      setUserSpeakerMessage((current) => current?.id === userMsg.id ? null : current);
      userSpeakerTimerRef.current = null;
    }, USER_SPEAKER_HOLD_MS);
    await startStream(historyBeforeUser, { userMessage: text });
  }, [clearUserSpeakerTimer, userInput, status, startStream]);

  useEffect(() => {
    if (status !== "done" || !session) return;
    fetch(`/api/sessions/${session.id}/end`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ended_by: conversationEndedRef.current ? "user" : "natural", messages: fullMessagesRef.current }),
    }).catch(() => {});
  }, [status, session]);

  const seekReplay = useCallback((index: number) => {
    const all = fullMessagesRef.current;
    const nextIndex = Math.max(0, Math.min(index, all.length));
    const targetTime = nextIndex === 0 ? 0 : Math.max(0, getReplayTimeForIndex(all, nextIndex) - 1);
    applyReplayTime(targetTime);
  }, [applyReplayTime]);

  const seekReplayRatio = useCallback((ratio: number) => {
    const total = getReplayTotalDuration(fullMessagesRef.current);
    applyReplayTime(Math.max(0, Math.min(1, ratio)) * total);
  }, [applyReplayTime]);

  const seekLiveWindowRatio = useCallback((ratio: number) => {
    const liveEdgeMessages = liveEdgeMessagesRef.current.length > 0
      ? liveEdgeMessagesRef.current
      : displayedMessagesRef.current;
    const totalMs = getReplayTotalDuration(liveEdgeMessages);
    if (totalMs <= 0) return;

    const currentTime = isLiveRewoundRef.current
      ? getVisibleReplayTime(liveEdgeMessages, displayedMessagesRef.current)
      : totalMs;
    const targetTime = Math.max(0, Math.min(totalMs, ratio * totalMs));
    if (Math.abs(targetTime - currentTime) <= 1) return;

    const frame = getReplayFrame(liveEdgeMessages, targetTime);
    const rewoundMessages = liveEdgeMessages.slice(0, frame.index);
    const activeMessage = liveEdgeMessages[frame.index - 1];

    if (activeMessage && frame.content.length < activeMessage.content.length) {
      rewoundMessages[frame.index - 1] = { ...activeMessage, content: frame.content };
    }

    const isAtLiveEdge = targetTime >= totalMs - 1;
    isLiveRewoundRef.current = !isAtLiveEdge;
    setIsLiveRewound(!isAtLiveEdge);
    statusRef.current = "paused";
    setStatus("paused");
    stopRevealLoop();
    stopStreamDraftRevealLoop();
    setMessages(isAtLiveEdge ? liveEdgeMessages : rewoundMessages);
  }, [stopRevealLoop, stopStreamDraftRevealLoop]);

  const toggleLivePause = useCallback(() => {
    if (statusRef.current === "paused") {
      if (isLiveRewoundRef.current) {
        isLiveRewoundRef.current = false;
        setIsLiveRewound(false);
        setMessages(liveEdgeMessagesRef.current);
      }
      statusRef.current = "generating";
      setStatus("generating");
      if (streamDraftTargetRef.current && isRevealIdle()) startStreamDraftRevealLoop();
      startRevealLoop();
      return;
    }

    if (statusRef.current === "generating") {
      statusRef.current = "paused";
      setStatus("paused");
      stopRevealLoop();
      stopStreamDraftRevealLoop();
    }
  }, [isRevealIdle, startRevealLoop, startStreamDraftRevealLoop, stopRevealLoop, stopStreamDraftRevealLoop]);

  const handleLoadingDone = useCallback(() => {
    setLoadingVisible(false);
  }, []);

  function toggleReplay() {
    const total = getReplayTotalDuration(fullMessagesRef.current);
    if (isReplayPlaying) { setIsReplayPlaying(false); return; }
    if (replayTimeRef.current >= total) applyReplayTime(0);
    setIsReplayPlaying(true);
  }

  useEffect(() => () => {
    abortRef.current?.abort();
    stopRevealLoop();
    stopReplayLoop();
    stopStreamDraftRevealLoop();
    clearUserSpeakerTimer();
  }, [clearUserSpeakerTimer, stopRevealLoop, stopReplayLoop, stopStreamDraftRevealLoop]);

  useEffect(() => {
    if (!isReplayPlaying) { stopReplayLoop(); return; }
    stopReplayLoop();
    replayTimerRef.current = window.setInterval(() => {
      const total = getReplayTotalDuration(fullMessagesRef.current);
      const next = Math.min(total, replayTimeRef.current + REPLAY_TICK_MS);
      applyReplayTime(next);
      if (next >= total) setIsReplayPlaying(false);
    }, REPLAY_TICK_MS);
    return stopReplayLoop;
  }, [applyReplayTime, isReplayPlaying, stopReplayLoop]);

  const loadingComplete = messages.length > 0 || !!streamDraft?.content;
  const displayPersonas = session?.personas ?? cachedPersonas;
  const displayTopic = session?.topic ?? cachedTopic;
  const replayTotalTime = getReplayTotalDuration(fullMessagesRef.current);
  const replayProgressRatio = replayTotalTime > 0 ? replayTimeRef.current / replayTotalTime : 0;
  const liveEdgeMessages = isLiveRewound ? liveEdgeMessagesRef.current : messages;
  const liveTotalTime = getReplayTotalDuration(liveEdgeMessages);
  const liveProgressTime = isLiveRewound ? getVisibleReplayTime(liveEdgeMessages, messages) : liveTotalTime;
  const liveProgressRatio = isLiveRewound && liveTotalTime > 0 ? Math.min(1, liveProgressTime / liveTotalTime) : 1;
  const isBlockingLoading = loadingVisible && status !== "error";
  const showEndButton = status !== "loading" && status !== "error" && status !== "done";

  return (
    <main
      className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#0a0a0a] md:mx-auto md:max-w-[430px] md:border-x md:border-neutral-800 md:shadow-2xl"
      style={{
        backgroundImage: "url('/bg/table-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75), rgba(0,0,0,0.95))",
      }} />

      {/* 等待加载屏：有消息后进度条跑完再消失 */}
      {isBlockingLoading && (
        <LoadingScreen
          topic={displayTopic}
          personas={displayPersonas}
          isComplete={loadingComplete}
          onDone={handleLoadingDone}
        />
      )}

      {/* 场景区：loading 消失后显示 */}
      <div
        className="relative z-10 min-h-0 flex-1"
        style={{
          display: isBlockingLoading ? 'none' : undefined,
        }}
      >
        <RoundTable
          personas={displayPersonas}
          activeSpeaker={sceneActiveSpeaker}
          activeSpeechContent={sceneActiveSpeechContent}
          onPersonaClick={isFunMode ? handleOpenPrivateNote : undefined}
          bottomReservation={
            status === "done"
              ? PLAYBACK_CONTROLS_AREA_HEIGHT
              : isParticipant
                ? USER_INPUT_AREA_HEIGHT
                : showEndButton
                  ? FOOTER_AREA_HEIGHT + (isFunMode ? ATMOSPHERE_CONTROLS_AREA_HEIGHT : 0)
                  : 12
          }
        />

        {/* 顶部悬浮 header：返回 | 居中标题 | 分享 */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between px-5"
          style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}
        >
          <button
            className="pointer-events-auto shrink-0"
            type="button"
            onClick={() => router.push(`/?topic=${encodeURIComponent(displayTopic)}`)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/back.png"
              alt="返回"
              width={40}
              height={40}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const span = e.currentTarget.nextElementSibling as HTMLElement | null
                if (span) span.style.display = 'inline'
              }}
            />
            <span className="hidden font-pixel text-white text-xl">&lt;</span>
          </button>

          <p className="flex-1 truncate px-3 text-center font-pixel text-white" style={{ fontSize: 16 }}>
            {displayTopic}
          </p>

          {status === "done" ? (
            <button
              className="pointer-events-auto shrink-0"
              type="button"
              onClick={() => setShowShareCard(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/share.png"
                alt="分享"
                width={40}
                height={40}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const span = e.currentTarget.nextElementSibling as HTMLElement | null
                  if (span) span.style.display = 'inline'
                }}
              />
              <span className="hidden font-pixel text-white text-xl">&#8599;</span>
            </button>
          ) : (
            <div className="shrink-0" style={{ width: 40, height: 40 }} />
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 rounded border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      {noteTarget && (
        <PrivateNoteComposer
          target={noteTarget}
          value={noteText}
          disabled={status === "loading" || status === "error" || status === "done"}
          onChange={setNoteText}
          onSubmit={handleSubmitPrivateNote}
          onQuickSubmit={submitPrivateNoteContent}
          onClose={handleClosePrivateNote}
        />
      )}

      {/* 分享卡片：放在 main 直属层级，避免被「场景区」的 stacking context 限制，被底部 PlaybackControls 漏出 */}
      {showShareCard && session && (
        <ShareCard
          topic={session.topic}
          personas={session.personas}
          messages={fullMessagesRef.current}
          mode={session.mode}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* 底部固定栏：回放进度条（完成后）— absolute 浮在场景区上，固定高度便于上方说话区计算居中预留空间 */}
      {status === "done" && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 border-t border-neutral-900 bg-[#0a0a0a]/95 backdrop-blur"
          style={{
            height: PLAYBACK_CONTROLS_AREA_HEIGHT,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <PlaybackControls
            currentIndex={replayIndex}
            isPlaying={isReplayPlaying}
            total={fullMessagesRef.current.length}
            onSeek={seekReplay}
            progressRatio={replayProgressRatio}
            onSeekRatio={seekReplayRatio}
            onTogglePlay={toggleReplay}
          />
        </div>
      )}

      {/* 底部固定栏：参与模式 = UserInput + footer；趣玩模式 = 气氛按钮 + footer
          absolute bottom-0 浮在场景区上：UserInput（仅参与）在上、footer 行（进度条 + 暂停 + 结束按钮）紧贴下方
          textarea 多行长高时整个底栏向上扩展，footer 始终钉在 UserInput 下方。 */}
      {status !== "done" && (isParticipant || showEndButton) && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 flex flex-col"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* UserInput：参与模式且轮到用户时显示 */}
          {isParticipant && hasOpened && status === "waiting" && (
            <UserInput
              value={userInput}
              disabled={false}
              onChange={setUserInput}
              onSubmit={handleUserSend}
            />
          )}
          {/* Footer：实时进度条 + 暂停 + 结束按钮（参与/旁观共用） */}
          {isFunMode && showEndButton && (
            <AtmosphereControls value={atmosphere} onChange={handleAtmosphereChange} />
          )}
          {showEndButton && (
            <LiveProgressControls
              progressRatio={liveProgressRatio}
              paused={status === "paused"}
              pauseDisabled={status !== "generating" && status !== "paused"}
              onSeekLiveWindow={seekLiveWindowRatio}
              onTogglePause={toggleLivePause}
              onEnd={handleEndConversation}
            />
          )}
        </div>
      )}
    </main>
  );
}
