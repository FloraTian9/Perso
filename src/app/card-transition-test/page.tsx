'use client'

import { useEffect, useMemo, useState } from 'react'
import { PixelAvatar } from '@/components/roundtable/PixelAvatar'
import { PixelSprite } from '@/components/roundtable/PixelSprite'
import { getPersonaColors } from '@/lib/personaColors'
import type { PersonaId } from '@/types'

const PERSONAS: PersonaId[] = ['INTJ', 'ENFP', 'ISTJ', 'ESTP']

const MODE_LABELS = {
  slide: '抽换',
  stack: '压栈',
} as const

type Mode = keyof typeof MODE_LABELS

type TransitionState = {
  from: PersonaId
  to: PersonaId
  key: number
}

const DEMO_CONTENT: Partial<Record<PersonaId, string>> = {
  INTJ: '逻辑别动，先把这张卡的出场和退场分开。',
  ENFP: '可以，别把动画做成一整套新界面。',
  ISTJ: '对话区和听众区照旧，只改切换方式就够了。',
  ESTP: '换卡就像换人发言，干脆一点。',
}

function SpeechBubble({ content, persona }: { content: string; persona: PersonaId }) {
  const colors = getPersonaColors(persona)

  return (
    <div
      className="relative z-10 w-full overflow-hidden rounded-2xl"
      style={{ background: colors.bubbleBg, marginTop: -56, flexShrink: 0 }}
    >
      <div
        className="overflow-y-auto"
        style={{
          boxSizing: 'border-box',
          minHeight: 24 * 2 + 28,
          maxHeight: 24 * 5 + 28,
          padding: '14px 20px',
        }}
      >
        <p
          className="font-pixel"
          style={{
            fontSize: 15,
            lineHeight: '24px',
            color: colors.bubbleText,
            minHeight: 24 * 2,
          }}
        >
          {content}
        </p>
      </div>
    </div>
  )
}

function SpeakerCard({
  personaId,
  role,
  mode,
}: {
  personaId: PersonaId
  role: 'idle' | 'current' | 'incoming'
  mode: Mode
}) {
  const animationClass =
    mode === 'slide'
      ? role === 'current'
        ? 'speaker-slide-out-left'
        : role === 'incoming'
          ? 'speaker-slide-in-right'
          : ''
      : role === 'current'
        ? 'speaker-stack-out'
        : role === 'incoming'
          ? 'speaker-stack-in'
          : ''

  return (
    <div
      className={[
        'speaker-card absolute inset-0 flex w-full flex-col items-center justify-center',
        role === 'idle' ? 'speaker-idle' : '',
        animationClass,
      ].join(' ')}
      style={{ zIndex: role === 'incoming' ? 20 : role === 'current' ? 10 : 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/sprites/${personaId}/badge.png`}
        alt={personaId}
        className="shrink-0"
        style={{
          imageRendering: 'pixelated',
          width: 111,
          height: 'auto',
          transform: 'translateX(0)',
        }}
      />

      <PixelSprite personaId={personaId} motionState="speaking" size={200} />

      <SpeechBubble content={DEMO_CONTENT[personaId] ?? '这一轮换我接话。'} persona={personaId} />
    </div>
  )
}

export default function CardTransitionTestPage() {
  const [mode, setMode] = useState<Mode>('slide')
  const [activeIndex, setActiveIndex] = useState(0)
  const [transition, setTransition] = useState<TransitionState | null>(null)
  const [locked, setLocked] = useState(false)

  const currentPersona = transition?.from ?? PERSONAS[activeIndex]
  const audiencePersonas = useMemo(
    () => PERSONAS.filter((persona) => persona !== currentPersona),
    [currentPersona],
  )

  useEffect(() => {
    if (!transition) return
    const duration = mode === 'stack' ? 260 : 260
    const timer = window.setTimeout(() => {
      setActiveIndex(PERSONAS.indexOf(transition.to))
      setTransition(null)
      setLocked(false)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [mode, transition])

  function startTransition(nextIndex: number) {
    if (locked || nextIndex === activeIndex) return
    const nextPersona = PERSONAS[nextIndex]
    setLocked(true)
    setTransition({
      from: PERSONAS[activeIndex],
      to: nextPersona,
      key: Date.now(),
    })
  }

  function go(step: 1 | -1) {
    const next = (activeIndex + step + PERSONAS.length) % PERSONAS.length
    startTransition(next)
  }

  const hint = mode === 'stack' ? '压栈' : '抽换'

  return (
    <main
      className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#0a0a0a] md:mx-auto md:max-w-[430px] md:border-x md:border-neutral-800 md:shadow-2xl"
      style={{
        backgroundImage: "url('/bg/table-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75), rgba(0,0,0,0.95))',
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-5 pt-4">
          <p className="font-pixel text-white" style={{ fontSize: 14 }}>
            卡牌切换测试
          </p>
          <p className="font-mono text-[11px] tracking-[0.25em] text-neutral-500">{hint}</p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-6 pt-24" style={{ paddingBottom: 24 }}>
          <div className="relative flex min-h-[380px] w-full flex-1 flex-col items-center justify-center">
            <div className="relative flex min-h-[300px] w-full flex-1 items-center justify-center">
              {transition ? (
                <>
                  <SpeakerCard
                    personaId={transition.from}
                    role="current"
                    mode={mode}
                  />
                  <SpeakerCard
                    key={transition.key}
                    personaId={transition.to}
                    role="incoming"
                    mode={mode}
                  />
                </>
              ) : (
                <SpeakerCard personaId={currentPersona} role="idle" mode={mode} />
              )}
            </div>

            <div className="mt-auto flex w-full shrink-0 justify-around px-2">
              {audiencePersonas.map((personaId) => (
                <PixelAvatar key={personaId} personaId={personaId} size={80} />
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-neutral-900 bg-[#0a0a0a]/95 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(Object.keys(MODE_LABELS) as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={[
                    'rounded border px-3 py-2 font-mono text-xs transition',
                    mode === item
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-800 bg-black text-neutral-400 hover:border-neutral-600 hover:text-white',
                  ].join(' ')}
                  onClick={() => setMode(item)}
                >
                  {MODE_LABELS[item]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-neutral-200 transition hover:border-neutral-600"
                onClick={() => go(-1)}
                disabled={locked}
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded border border-white bg-white px-3 py-2 font-mono text-xs text-black transition disabled:opacity-50"
                onClick={() => go(1)}
                disabled={locked}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .speaker-card {
          transform-origin: center center;
          will-change: transform, opacity, filter;
        }

        .speaker-idle {
          animation: speaker-idle 1ms both;
        }

        .speaker-slide-out-left {
          animation: speaker-slide-out-left 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .speaker-slide-in-right {
          animation: speaker-slide-in-right 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .speaker-stack-out {
          animation: speaker-stack-out 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .speaker-stack-in {
          animation: speaker-stack-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes speaker-idle {
          from { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          to { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
        }

        @keyframes speaker-slide-out-left {
          from { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: blur(0); }
          to { transform: translateX(-22%) translateY(-4px) scale(0.96); opacity: 0; filter: blur(1px); }
        }

        @keyframes speaker-slide-in-right {
          from { transform: translateX(22%) translateY(6px) scale(0.96); opacity: 0; filter: blur(1px); }
          to { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: blur(0); }
        }

        @keyframes speaker-stack-out {
          from { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: brightness(1) saturate(1); }
          to { transform: translateX(0) translateY(-16px) scale(0.94); opacity: 0.45; filter: brightness(0.72) saturate(0.9); }
        }

        @keyframes speaker-stack-in {
          from { transform: translateX(0) translateY(16px) scale(0.92); opacity: 0; filter: blur(1px); }
          to { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: blur(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .speaker-card {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
}
