'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PersonaId } from '@/types'
import { getPersonaColors } from '@/lib/personaColors'
import { PixelSprite } from './PixelSprite'
import { PixelAvatar } from './PixelAvatar'

type ActiveSpeaker = PersonaId | 'user'

const SPEAKER_BADGE_OFFSET_X: Partial<Record<PersonaId, number>> = {
  ENFJ: 0,
  ENFP: 0,
  ENTJ: 0,
  ENTP: 0,
  ESFJ: 0,
  ESFP: 0,
  ESTJ: 0,
  ESTP: 0,
  INFJ: 0,
  INFP: 0,
  INTJ: 0,
  INTP: 0,
  ISFJ: 0,
  ISFP: 0,
  ISTJ: 0,
  ISTP: 0,
}

const USER_BUBBLE_COLORS = {
  bubbleBg: '#E5E5E5',
  bubbleText: '#111111',
}
const SPEECH_LINE_HEIGHT = 24
const SPEECH_MIN_LINES = 2
const SPEECH_MAX_LINES = 5
const SPEECH_VERTICAL_PADDING = 28
const PERSONAS_WITH_FRAMES = new Set<PersonaId>()
const SPEAKER_TRANSITION_MS = 260

type SpeakerSnapshot = {
  speaker: ActiveSpeaker
  content?: string
}

function preloadImage(src: string) {
  const img = new Image()
  img.src = src
}

function getPreloadSources(personas: PersonaId[]): string[] {
  const sources = new Set<string>(['/sprites/user/badge.png', '/sprites/user/user.png'])

  for (const persona of personas) {
    sources.add(`/sprites/${persona}/badge.png`)
    sources.add(`/sprites/${persona}/${persona.toLowerCase()}.png`)

    if (PERSONAS_WITH_FRAMES.has(persona)) {
      sources.add(`/sprites/${persona}/talk/talk_1.png`)
      sources.add(`/sprites/${persona}/talk/talk_2.png`)
      for (let i = 1; i <= 5; i++) sources.add(`/sprites/${persona}/think/think_${i}.png`)
    }
  }

  return [...sources]
}

function SpeechBubble({ content, speaker }: { content: string; speaker: ActiveSpeaker }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const colors = speaker === 'user' ? USER_BUBBLE_COLORS : getPersonaColors(speaker)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [content])
  return (
    <div
      className="relative z-10 w-full rounded-2xl overflow-hidden"
      style={{ background: colors.bubbleBg, marginTop: -56, flexShrink: 0 }}
    >
      <div
        className="overflow-y-auto"
        style={{
          boxSizing: 'border-box',
          minHeight: SPEECH_LINE_HEIGHT * SPEECH_MIN_LINES + SPEECH_VERTICAL_PADDING,
          maxHeight: SPEECH_LINE_HEIGHT * SPEECH_MAX_LINES + SPEECH_VERTICAL_PADDING,
          padding: '14px 20px',
        }}
      >
        <p
          className={speaker === 'user' ? '' : 'font-pixel'}
          style={{
            fontSize: 15,
            lineHeight: `${SPEECH_LINE_HEIGHT}px`,
            color: colors.bubbleText,
            minHeight: SPEECH_LINE_HEIGHT * SPEECH_MIN_LINES,
          }}
        >
          {content}
        </p>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function SpeakerCard({
  speaker,
  content,
  isSpeaking,
  animationClass = '',
  onPersonaClick,
}: {
  speaker: ActiveSpeaker
  content?: string
  isSpeaking: boolean
  animationClass?: string
  onPersonaClick?: (personaId: PersonaId) => void
}) {
  const hasSpeech = isSpeaking && !!content
  const speakerBadgeOffsetX = speaker !== 'user' ? SPEAKER_BADGE_OFFSET_X[speaker] ?? 0 : 0

  const clickable = speaker !== 'user' && !!onPersonaClick

  return (
    <div
      className={[
        'roundtable-speaker-card relative flex w-full shrink-0 flex-col items-center',
        animationClass,
      ].join(' ')}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onPersonaClick?.(speaker as PersonaId) : undefined}
      onKeyDown={clickable ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onPersonaClick?.(speaker as PersonaId)
        }
      } : undefined}
      style={{ cursor: clickable ? 'pointer' : undefined }}
    >
      {clickable ? (
        <div
          className="pointer-events-none absolute z-20 flex items-center justify-center"
          style={{
            right: 'calc(50% - 82px)',
            top: 4,
            width: 28,
            height: 28,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/page.svg"
            alt=""
            style={{ width: 22, height: 22, imageRendering: 'pixelated', display: 'block' }}
          />
        </div>
      ) : null}

      {/* 人格名称徽章图片 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={speaker === 'user' ? '/sprites/user/badge.png' : `/sprites/${speaker}/badge.png`}
        alt={speaker}
        style={{
          imageRendering: 'pixelated',
          height: 'auto',
          width: 111,
          transform: `translateX(${speakerBadgeOffsetX}px)`,
        }}
      />

      {/* 大精灵图 */}
      {speaker === 'user' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/sprites/user/user.png"
          alt=""
          style={{
            imageRendering: 'pixelated',
            width: 200,
            height: 200,
            flexShrink: 0,
          }}
        />
      ) : (
        <PixelSprite
          personaId={speaker}
          motionState={isSpeaking ? 'speaking' : 'thinking'}
          size={200}
        />
      )}

      {/* 对话气泡：叠压人格身体下半部分 */}
      {hasSpeech && (
        <SpeechBubble content={content ?? ''} speaker={speaker} />
      )}
    </div>
  )
}

type RoundTableProps = {
  personas: PersonaId[]
  activeSpeaker?: ActiveSpeaker
  activeSpeechContent?: string
  /** 底部被 absolute 元素遮挡的高度（pt）。说话区将以此为 paddingBottom，让内容居中于「header 下方 ↔ 底栏上方」之间 */
  bottomReservation?: number
  onPersonaClick?: (personaId: PersonaId) => void
}

export function RoundTable({
  personas,
  activeSpeaker,
  activeSpeechContent,
  bottomReservation = 12,
  onPersonaClick,
}: RoundTableProps) {
  const [displaySpeaker, setDisplaySpeaker] = useState<ActiveSpeaker | undefined>(activeSpeaker)
  const [displayContent, setDisplayContent] = useState<string | undefined>(activeSpeechContent)
  const [outgoingSpeaker, setOutgoingSpeaker] = useState<SpeakerSnapshot | null>(null)
  const prevSpeakerRef = useRef<ActiveSpeaker | undefined>(activeSpeaker)
  const prevContentRef = useRef<string | undefined>(activeSpeechContent)
  const transitionTimerRef = useRef<number | null>(null)
  const preloadKey = useMemo(() => personas.join('|'), [personas])

  useEffect(() => {
    getPreloadSources(personas).forEach(preloadImage)
  }, [preloadKey, personas])

  // 说话者切换时，新 speaker 立即接管布局，旧 speaker 只作为 overlay 做左退过渡。
  useEffect(() => {
    const prevSpeaker = prevSpeakerRef.current
    const speakerChanged = activeSpeaker !== prevSpeaker

    if (speakerChanged) {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }

      if (prevSpeaker && activeSpeaker) {
        setOutgoingSpeaker({
          speaker: prevSpeaker,
          content: prevContentRef.current,
        })
        transitionTimerRef.current = window.setTimeout(() => {
          setOutgoingSpeaker(null)
          transitionTimerRef.current = null
        }, SPEAKER_TRANSITION_MS)
      } else {
        setOutgoingSpeaker(null)
      }

      setDisplaySpeaker(activeSpeaker)
      prevSpeakerRef.current = activeSpeaker
    }

    setDisplayContent(activeSpeechContent)
    prevContentRef.current = activeSpeechContent
  }, [activeSpeaker, activeSpeechContent])

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
  }, [])

  const speaker = displaySpeaker ?? personas[0]
  const audiencePersonas = speaker === 'user' ? personas : personas.filter((p) => p !== speaker)
  const isSpeaking = !!displaySpeaker

  if (personas.length === 0) return null

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      <div className="relative flex h-full min-h-0 flex-col">
        {/* 说话者 + 听众行：在可用舞台中垂直居中 */}
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-24"
          style={{ paddingBottom: bottomReservation }}
        >
          {/* 说话者区域：布局不变，只在 speaker 切换时做左退右进抽换 */}
          <div
            className="relative flex w-full shrink-0 flex-col items-center"
          >
            {outgoingSpeaker && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
                <SpeakerCard
                  speaker={outgoingSpeaker.speaker}
                  content={outgoingSpeaker.content}
                  isSpeaking={true}
                  animationClass="roundtable-speaker-slide-out-left"
                  onPersonaClick={onPersonaClick}
                />
              </div>
            )}

            <SpeakerCard
              speaker={speaker}
              content={displayContent}
              isSpeaking={isSpeaking}
              animationClass={outgoingSpeaker ? 'roundtable-speaker-slide-in-right' : ''}
              onPersonaClick={onPersonaClick}
            />
          </div>

          {/* 听众行：紧跟说话者下方 */}
          <div className="mt-4 flex w-full shrink-0 justify-around px-2">
            {audiencePersonas.slice(0, 4).map((p) => {
              const isFour = audiencePersonas.length >= 4
              return (
                <PixelAvatar
                  key={p}
                  personaId={p}
                  size={isFour ? 74 : 80}
                  labelHeight={isFour ? 33 : 36}
                  labelFontSize={isFour ? 18 : 20}
                  onClick={onPersonaClick}
                />
              )
            })}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .roundtable-speaker-card {
          transform-origin: center center;
          will-change: transform, opacity, filter;
        }

        .roundtable-speaker-slide-out-left {
          animation: roundtable-speaker-slide-out-left ${SPEAKER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .roundtable-speaker-slide-in-right {
          animation: roundtable-speaker-slide-in-right ${SPEAKER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes roundtable-speaker-slide-out-left {
          from { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: blur(0); }
          to { transform: translateX(-22%) translateY(-4px) scale(0.96); opacity: 0; filter: blur(1px); }
        }

        @keyframes roundtable-speaker-slide-in-right {
          from { transform: translateX(22%) translateY(6px) scale(0.96); opacity: 0; filter: blur(1px); }
          to { transform: translateX(0) translateY(0) scale(1); opacity: 1; filter: blur(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .roundtable-speaker-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
