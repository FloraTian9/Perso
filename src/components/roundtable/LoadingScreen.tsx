'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PersonaId } from '@/types'
import { getPersonaColors } from '@/lib/personaColors'

const PERSONAS_WITH_FRAMES = new Set<string>()
const DEFAULT_CARD_SIZE = {
  avatar: 110,
  badgeHeight: 51,
  badgeMaxWidth: 128,
}
const COMPACT_CARD_SIZE = {
  avatar: 82,
  badgeHeight: 38,
  badgeMaxWidth: 96,
}
const DOT_FRAMES = [
  '/images/loading/loading-0.png',
  '/images/loading/loading-1.png',
  '/images/loading/loading-2.png',
  '/images/loading/loading-3.png',
]
const LOADING_IMAGE_WIDTH = 300
const LOADING_PROGRESS_FRAME = {
  left: 38,
  top: 83,
  width: 225,
  height: 24,
}

type Props = {
  topic: string
  personas: PersonaId[]
  isComplete: boolean
  onDone: () => void
}

function PersonaCard({ personaId, compact = false }: { personaId: PersonaId; compact?: boolean }) {
  const colors = getPersonaColors(personaId)
  const src = PERSONAS_WITH_FRAMES.has(personaId)
    ? `/sprites/${personaId}/think/think_1.png`
    : `/sprites/${personaId}/${personaId.toLowerCase()}.png`
  const size = compact ? COMPACT_CARD_SIZE : DEFAULT_CARD_SIZE
  const cardWidth = Math.max(size.avatar, size.badgeMaxWidth)

  return (
    <div
      style={{
        width: cardWidth,
        display: 'grid',
        justifyItems: 'center',
        justifySelf: 'center',
      }}
    >
      <div
        style={{
          width: size.avatar,
          height: size.avatar,
          borderRadius: '50%',
          background: colors.avatarBg,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
          margin: '0 auto',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={personaId}
          onError={(e) => {
            const fb = '/sprites/INFP/think/think_1.png'
            if (e.currentTarget.src !== window.location.origin + fb) e.currentTarget.src = fb
          }}
          style={{
            imageRendering: 'pixelated',
            width: size.avatar * 1.05,
            height: size.avatar * 1.05,
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
      {/* badge 图片 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/sprites/${personaId}/badge.png`}
        alt={personaId}
        style={{
          imageRendering: 'pixelated',
          height: size.badgeHeight,
          width: 'auto',
          maxWidth: size.badgeMaxWidth,
          objectFit: 'contain',
          marginTop: 12,
          display: 'block',
        }}
      />
    </div>
  )
}

function getPersonaGridClassName(count: number) {
  if (count <= 1) return "grid grid-cols-1 gap-x-10 gap-y-8";
  if (count === 2) return "grid grid-cols-2 gap-x-10 gap-y-8";
  if (count === 3) return "grid grid-cols-3 gap-x-2 gap-y-8";
  return "grid grid-cols-2 gap-x-8 gap-y-4";
}

export function LoadingScreen({ topic, personas, isComplete, onDone }: Props) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [dotFrame, setDotFrame] = useState(0)
  const progressRef = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const visiblePersonas = personas.slice(0, 4)
  const isCompactPersonaGrid = visiblePersonas.length >= 3

  // 省略号帧动画：每 400ms 切换一帧
  useEffect(() => {
    const t = window.setInterval(() => setDotFrame(f => (f + 1) % 4), 400)
    return () => window.clearInterval(t)
  }, [])

  // 进度条动画：0→70（前 3s）→ 90（缓慢爬行）→ 卡住等待
  useEffect(() => {
    const startTime = Date.now()
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const prev = progressRef.current
      let next: number
      if (elapsed < 3000) {
        // 前 5s 快速到 70%（每 50ms +0.7）
        next = Math.min(70, prev + 0.7)
      } else {
        // 之后缓慢爬到 90%（每 50ms +0.08，约 25s 爬完）
        next = Math.min(90, prev + 0.08)
      }
      progressRef.current = next
      setProgress(next)
    }, 50)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [])

  // 收到第一条消息后：跳到 100%，400ms 后回调隐藏
  useEffect(() => {
    if (!isComplete) return
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    progressRef.current = 100
    setProgress(100)
    const t = window.setTimeout(onDone, 400)
    return () => window.clearTimeout(t)
  }, [isComplete, onDone])

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/bg/table-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#111',
        zIndex: 40,
      }}
    >
      {/* 遮罩 */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75), rgba(0,0,0,0.95))",
      }}/>

      {/* 顶部 header */}
      <div
        className="relative z-10 flex h-14 shrink-0 items-center justify-between px-5"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
      >
        <button type="button" className="shrink-0" onClick={() => router.push('/')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/back.png" alt="返回" width={40} height={40} style={{ imageRendering: 'pixelated' }} />
        </button>
        <p className="flex-1 truncate px-3 text-center font-pixel text-white" style={{ fontSize: 16 }}>
          {topic}
        </p>
        <div style={{ width: 40, flexShrink: 0 }} />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-3">
        {/* 人格 2×2 网格 */}
        <div className="flex shrink-0 items-center justify-center">
          <div className={getPersonaGridClassName(visiblePersonas.length)}>
            {visiblePersonas.map((id) => (
              <PersonaCard key={id} personaId={id} compact={isCompactPersonaGrid} />
            ))}
          </div>
        </div>

        {/* loading 区域 */}
        <div
          className="mt-8 flex shrink-0 flex-col items-center"
        >
          <div
            className="relative"
            style={{
              width: LOADING_IMAGE_WIDTH,
              aspectRatio: '214 / 113',
            }}
          >
            {/* 省略号帧动画 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DOT_FRAMES[dotFrame]}
              alt="loading"
              style={{
                imageRendering: 'pixelated',
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            />
            {/* 进度条填充：位于 loading 图片自带框框内部 */}
            <div
              style={{
                position: 'absolute',
                left: LOADING_PROGRESS_FRAME.left,
                top: LOADING_PROGRESS_FRAME.top,
                height: LOADING_PROGRESS_FRAME.height,
                width: (progress / 100) * LOADING_PROGRESS_FRAME.width,
                background: '#B1FD00',
                transition: progress === 100
                  ? 'width 0.2s ease-out'   // 完成时快速冲到头
                  : 'width 0.05s linear',   // 正常推进平滑
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
