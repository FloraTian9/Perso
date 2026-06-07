"use client";

import { useRef, useState } from "react";
import { PixelAvatar } from "@/components/roundtable/PixelAvatar";
import { PERSONA_IDS } from "@/lib/personaIds";
import type { PersonaId } from "@/types";

type VoiceState = "idle" | "loading" | "playing" | "error";

const VOICE_TEST_CACHE_VERSION = "20260606-voice-feedback-v7-infp-speed";

const SAMPLE_TEXT: Record<PersonaId, string> = {
  INTJ: "先别急着下结论，逻辑边界要先定清楚。",
  INTP: "这个问题我需要想一下，可能还有第三种解释。",
  ENTJ: "我直接说结论吧，这件事应该先定目标。",
  ENTP: "等一下，这个说法很好拆，我先抬个杠。",
  INFJ: "我感觉重点不只是答案，而是你为什么会这样问。",
  INFP: "我会在意这件事背后的感受，不想太快评判。",
  ENFJ: "我先帮大家把话接一下，其实你们说的都有道理。",
  ENFP: "这个话题突然变有意思了，我脑子里有好多画面。",
  ISTJ: "先按事实顺序来，这样比较不容易跑偏。",
  ISFJ: "我会先看看大家舒服不舒服，再慢慢把话说清楚。",
  ESTJ: "这个不用绕，先把可执行的方案列出来。",
  ESFJ: "我懂你的意思，大家先别僵住，我们换个说法。",
  ISTP: "可以，先试一下，不行再改。",
  ISFP: "我不太想把感受讲得太满，但这句话我能理解。",
  ESTP: "别光分析了，直接上手试试就知道了。",
  ESFP: "这个场面我已经能想象到了，太有戏了。",
};

const PERSONA_HINTS: Record<PersonaId, string> = {
  INTJ: "冷静低沉",
  INTP: "松弛理性",
  ENTJ: "果断干练",
  ENTP: "机敏自然",
  INFJ: "克制洞察",
  INFP: "轻柔真诚",
  ENFJ: "温暖圆场",
  ENFP: "明亮跳跃",
  ISTJ: "稳定朴素",
  ISFJ: "温和顺畅",
  ESTJ: "直接爽快",
  ESFJ: "热络自然",
  ISTP: "低调简短",
  ISFP: "轻柔感受",
  ESTP: "行动感强",
  ESFP: "活泼现场",
};

export default function VoiceTestPage() {
  const audioRefs = useRef<Partial<Record<PersonaId, HTMLAudioElement>>>({});
  const queueCancelledRef = useRef(false);
  const playRunRef = useRef(0);
  const [activePersona, setActivePersona] = useState<PersonaId | null>(null);
  const [states, setStates] = useState<Partial<Record<PersonaId, VoiceState>>>({});
  const [error, setError] = useState("");
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  function setPersonaState(persona: PersonaId, state: VoiceState) {
    setStates((current) => ({ ...current, [persona]: state }));
  }

  function getTtsUrl(persona: PersonaId) {
    const params = new URLSearchParams({
      persona,
      text: SAMPLE_TEXT[persona],
      v: VOICE_TEST_CACHE_VERSION,
    });
    return `/api/tts?${params.toString()}`;
  }

  function stopAudio() {
    playRunRef.current += 1;
    queueCancelledRef.current = true;
    setIsPlayingAll(false);
    for (const audio of Object.values(audioRefs.current)) {
      if (audio) audio.pause();
    }
    if (activePersona) setPersonaState(activePersona, "idle");
    setActivePersona(null);
  }

  async function playPersona(persona: PersonaId) {
    queueCancelledRef.current = false;
    setError("");
    for (const [id, audio] of Object.entries(audioRefs.current)) {
      if (id !== persona) audio?.pause();
    }
    if (activePersona && activePersona !== persona) setPersonaState(activePersona, "idle");

    const audio = audioRefs.current[persona];
    if (!audio) {
      setError(`${persona}: 音频控件还没加载好，请刷新后再试`);
      return;
    }
    const runId = playRunRef.current + 1;
    playRunRef.current = runId;
    setActivePersona(persona);
    setPersonaState(persona, "loading");

    try {
      const ended = new Promise<void>((resolve, reject) => {
        audio.onplaying = () => {
          if (playRunRef.current === runId) setPersonaState(persona, "playing");
        };
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("语音加载或播放失败"));
      });

      audio.currentTime = 0;
      await audio.play();
      await ended;

      if (!queueCancelledRef.current && playRunRef.current === runId) {
        setPersonaState(persona, "idle");
        setActivePersona(null);
      }
    } catch (event) {
      const message = event instanceof Error ? event.message : "语音请求失败";
      setError(`${persona}: ${message}`);
      setPersonaState(persona, "error");
      setActivePersona(null);
      throw event;
    }
  }

  async function playAll() {
    if (isPlayingAll) {
      stopAudio();
      return;
    }
    setIsPlayingAll(true);
    queueCancelledRef.current = false;
    try {
      for (const persona of PERSONA_IDS) {
        if (queueCancelledRef.current) break;
        await playPersona(persona);
      }
    } catch {
      // The row already shows the failure state.
    } finally {
      setIsPlayingAll(false);
    }
  }

  return (
    <main
      className="h-dvh max-h-dvh overflow-y-auto overscroll-contain bg-[#121212] px-5 py-6 text-neutral-100 md:mx-auto md:max-w-[760px] md:px-8"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(18,18,18,0.92), rgba(18,18,18,0.98)), url('/bg/table-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-normal text-white">人格声线试听</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-300">直接调用 /api/tts，试听结果与抖音小游戏一致。</p>
        </div>
        <button
          type="button"
          onClick={playAll}
          className="h-10 shrink-0 border border-[#89B93B] bg-[#B1FD00] px-4 text-sm font-bold text-black shadow-[inset_3px_3px_0_rgba(255,255,255,0.35),inset_-3px_-3px_0_rgba(0,0,0,0.2)]"
        >
          {isPlayingAll ? "停止" : "连续试听"}
        </button>
      </header>

      {error ? (
        <div className="mb-4 border border-[#FFC700] bg-black/70 px-3 py-2 text-sm text-[#FFC700]">{error}</div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        {PERSONA_IDS.map((persona) => {
          const state = states[persona] || "idle";
          const isActive = activePersona === persona;
          const label = state === "loading" ? "加载中" : state === "playing" ? "播放中" : "试听";
          return (
            <article
              key={persona}
              className="flex min-h-[116px] gap-3 border border-neutral-700 bg-black/68 p-3"
              style={{ borderRadius: 8 }}
            >
              <div className="shrink-0">
                <PixelAvatar personaId={persona} size={58} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-black leading-5 text-white">{persona}</h2>
                    <p className="text-xs leading-5 text-[#B1FD00]">{PERSONA_HINTS[persona]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isActive && state === "playing") {
                        stopAudio();
                        return;
                      }
                      void playPersona(persona).catch(() => {});
                    }}
                    disabled={state === "loading"}
                    className="h-8 w-[70px] shrink-0 border border-neutral-500 bg-neutral-950 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {isActive && state === "playing" ? "停止" : label}
                  </button>
                </div>
                <p className="line-clamp-2 text-sm leading-5 text-neutral-200">{SAMPLE_TEXT[persona]}</p>
                <p className="mt-2 truncate text-[11px] leading-4 text-neutral-500">
                  {state === "loading" ? "正在加载音频" : state === "playing" ? "正在播放" : "点击试听"}
                </p>
                <audio
                  ref={(node) => {
                    if (node) audioRefs.current[persona] = node;
                  }}
                  controls
                  preload="none"
                  src={getTtsUrl(persona)}
                  className="mt-2 h-8 w-full"
                />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
