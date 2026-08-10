"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelAvatar } from "@/components/roundtable/PixelAvatar";
import { PERSONA_IDS, DEFAULT_PERSONAS } from "@/lib/personaIds";
import type { ChatMode, PersonaId } from "@/types";

const PRESET_TOPICS = [
  "你们喜欢毛姆的《刀锋》吗？",
  "30岁了还在迷茫怎么办？",
  "异地恋值不值得坚持？"
];

const TOPIC_LINE_HEIGHT = 21;
const TOPIC_MAX_ROWS = 5;
const TOPIC_MAX_HEIGHT = TOPIC_LINE_HEIGHT * TOPIC_MAX_ROWS;

const sensitivePatterns = [/政治/, /宗教/, /选举/, /政党/, /民族仇恨/, /极端主义/];
const SESSION_PERSONAS_KEY_PREFIX = "perso:session-personas:";
const SESSION_TOPIC_KEY_PREFIX = "perso:session-topic:";

export function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PersonaId[]>(DEFAULT_PERSONAS);
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [mode, setMode] = useState<ChatMode>("participant");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customTopicRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = customTopicRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TOPIC_MAX_HEIGHT)}px`;
  }, [customTopic]);

  const topic = customTopic.trim() || selectedTopic;

  useEffect(() => {
    const topicParam = new URLSearchParams(window.location.search).get("topic")?.trim();
    if (!topicParam) return;

    if (PRESET_TOPICS.includes(topicParam)) {
      setSelectedTopic(topicParam);
      setCustomTopic("");
      return;
    }

    setSelectedTopic(PRESET_TOPICS[0]);
    setCustomTopic(topicParam);
  }, []);

  function togglePersona(id: PersonaId) {
    if (selected.includes(id)) {
      setSelected(selected.filter((p) => p !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    } else {
      setError("最多选择 4 个人格");
    }
  }

  async function handleStart() {
    setError("");
    if (selected.length < 2) { setError("至少选择 2 个人格"); return; }
    if (!topic.trim()) { setError("先给圆桌一个话题。"); return; }
    if (sensitivePatterns.some((p) => p.test(topic))) {
      setError("这个话题暂时不适合圆桌生成。换一个更日常的问题试试。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sessions/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), personas: selected, mode }),
      });
      const responseText = await res.text();
      let payload: { session_id?: string; session?: { topic?: string }; error?: string } | null = null;
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as { session_id?: string; session?: { topic?: string }; error?: string };
        } catch {
          payload = { error: responseText };
        }
      }
      if (!res.ok) {
        throw new Error(payload?.error || "创建圆桌失败");
      }
      if (!payload?.session_id) {
        throw new Error("创建圆桌失败");
      }
      try {
        window.sessionStorage.setItem(
          `${SESSION_PERSONAS_KEY_PREFIX}${payload.session_id}`,
          JSON.stringify(selected),
        );
        window.sessionStorage.setItem(
          `${SESSION_TOPIC_KEY_PREFIX}${payload.session_id}`,
          payload.session?.topic ?? topic.trim(),
        );
      } catch {}
      router.push(`/table/${payload.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建圆桌失败");
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden text-neutral-100 md:mx-auto md:max-w-[430px] md:border-x md:border-neutral-800 md:shadow-2xl"
      style={{
        backgroundImage: "url('/bg/table-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#111",
      }}
    >
      {/* 黑色半透明遮罩 */}
      <div className="pointer-events-none absolute inset-0  z-0"  style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75), rgba(0,0,0,0.95))",
      }}
   />

      {/* 滚动区域 */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-[30px] pt-10">
        {/* Header */}
        <header className="mb-5 flex items-end gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/title.png"
            alt="Perso 人格圆桌"
            className="shrink-0"
            style={{ imageRendering: "pixelated", height: 48, width: "auto" }}
          />
          <p
            className="font-pixel min-w-0 leading-none"
            style={{ color: "#D3D1D1", fontSize: 13 }}
          >
            听听不同MBTI人格的声音～
          </p>
        </header>

        {/* Persona grid */}
        <section className="mb-5">
          <p className="font-pixel mb-4 text-white" style={{ fontSize: 13 }}>选择2-4个人格</p>
          <div className="grid grid-cols-4 gap-x-[10px] gap-y-6">
            {PERSONA_IDS.map((id) => {
              const isSelected = selected.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePersona(id)}
                  className="flex flex-col items-center"
                >
                  <PixelAvatar personaId={id} size={64} overlay={!isSelected} />
                </button>
              );
            })}
          </div>

          {/* 警告提示 */}
          <div className="pointer-events-none mt-4 flex min-h-[18px] items-start gap-2" style={{ paddingLeft: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/warning-icon.png"
              alt="warning"
              style={{
                height: 13,
                width: "auto",
                imageRendering: "pixelated",
                flexShrink: 0,
                transform: "translateY(1px)",
                opacity: error ? 1 : 0,
              }}
            />
            <p
              className="font-pixel"
              style={{ fontSize: 12, lineHeight: "16px", color: "#FFC700", opacity: error ? 1 : 0 }}
            >
              {error || "请选择2-4个人格"}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-5">
            <p className="font-pixel shrink-0 text-white" style={{ fontSize: 13 }}>选择模式</p>
            <div className="flex" role="group" aria-label="选择模式">
              {([
                ["participant", "参与"],
                ["fun", "趣玩"],
              ] as const).map(([value, label]) => {
                const isActive = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className="font-pixel flex h-7 w-[62px] items-center justify-center border transition"
                    style={{
                      background: isActive ? "#B1FD00" : "#111111",
                      borderColor: isActive ? "#89B93B" : "#454545",
                      boxShadow: isActive ? "inset 3px 3px 0 rgba(255,255,255,0.35), inset -3px -3px 0 rgba(0,0,0,0.2)" : "none",
                      color: isActive ? "#000000" : "#ffffff",
                      fontSize: 13,
                    }}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Topic section */}
        <section className="mb-6">
          <p className="font-pixel mt-7 mb-4 text-white" style={{ fontSize: 13 }}>输入一个话题</p>

          {/* Vertically stacked topic pills */}
          <div className="flex flex-col items-start gap-4 mb-6">
            {PRESET_TOPICS.map((t) => {
              const isActive = !customTopic.trim() && selectedTopic === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setCustomTopic(""); setSelectedTopic(t); setError(""); }}
                  className="px-4 py-3 text-left font-pixel transition"
                  style={{
                    background: isActive ? "#B1FD00" : "#000000",
                    color: isActive ? "#5B5CF3" : "#ffffff",
                    fontSize: 13,
                    border: isActive ? "none" : "1px solid #454545",
                    borderRadius: 15,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Custom input — gradient pill, grows up to 5 lines */}
          <div
            className="flex items-center gap-2 rounded-3xl px-4 py-2"
            style={{
              background: "linear-gradient(to right, #515050, #202020)",
              minHeight: 44,
            }}
          >
            <textarea
              ref={customTopicRef}
              rows={1}
              className="flex-1 resize-none bg-transparent text-neutral-100 outline-none placeholder-neutral-500"
              placeholder="自由输入"
              value={customTopic}
              maxLength={300}
              onChange={(e) => { setCustomTopic(e.target.value); setError(""); }}
              style={{ fontSize: 16, lineHeight: `${TOPIC_LINE_HEIGHT}px`, maxHeight: TOPIC_MAX_HEIGHT }}
            />
          </div>
        </section>

      </div>

      {/* Bottom bar */}
      <div className="relative z-10 shrink-0 flex items-center justify-between px-[30px] py-3"
        style={{ borderTop: "1px solid #1f1f1f", background: "#0a0a0a" }}
      >
        {/* Selected personas */}
        <p className="font-pixel text-white truncate flex-1 min-w-0 mr-3" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
          {selected.length > 0 ? selected.join(" / ") : "未选择人格"}
        </p>

        {/* 开始 button — button-1 image */}
        <button
          type="button"
          disabled={isSubmitting || selected.length < 2}
          onClick={handleStart}
          className="relative shrink-0 disabled:opacity-40"
          style={{ width: 63, height: 28 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/button-1.png"
            alt=""
            style={{ width: 63, height: 28, imageRendering: "pixelated", display: "block" }}
          />
          <span
            className="font-pixel absolute inset-0 flex items-center justify-center text-black"
            style={{ fontSize: 13, letterSpacing: "0.1em" }}
          >
            开始
          </span>
        </button>
      </div>
    </main>
  );
}
