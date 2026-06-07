'use client'

import { useEffect, useRef, useState } from 'react'

type MotionState = 'walking' | 'thinking' | 'speaking'

// 只有这些人格有分帧动画素材，其余用单张静态图
const PERSONAS_WITH_FRAMES = new Set<string>()

function getFrames(personaId: string, state: MotionState): string[] {
  const p = personaId
  if (state === 'speaking') {
    return [`/sprites/${p}/talk/talk_1.png`, `/sprites/${p}/talk/talk_2.png`]
  }
  if (state === 'thinking') {
    return [1, 2, 3, 4, 5].map((i) => `/sprites/${p}/think/think_${i}.png`)
  }
  return [`/sprites/${p}/walk/walk_1.png`, `/sprites/${p}/walk/walk_2.png`]
}

const INTERVAL: Record<MotionState, number> = {
  walking: 220,
  thinking: 280,
  speaking: 360,
}

type Props = {
  personaId: string
  motionState: MotionState
  facingLeft?: boolean
  size?: number
}

export function PixelSprite({ personaId, motionState, facingLeft = false, size = 128 }: Props) {
  const [frameIndex, setFrameIndex] = useState(0)
  const prevStateRef = useRef<MotionState>(motionState)
  const prevPersonaRef = useRef(personaId)

  const hasFrames = PERSONAS_WITH_FRAMES.has(personaId)

  useEffect(() => {
    if (prevStateRef.current !== motionState || prevPersonaRef.current !== personaId) {
      setFrameIndex(0)
      prevStateRef.current = motionState
      prevPersonaRef.current = personaId
    }
  }, [motionState, personaId])

  useEffect(() => {
    if (!hasFrames) return
    const frames = getFrames(personaId, motionState)
    const timer = setTimeout(
      () => setFrameIndex((i) => (i + 1) % frames.length),
      INTERVAL[motionState],
    )
    return () => clearTimeout(timer)
  }, [frameIndex, motionState, personaId, hasFrames])

  const imgSrc = hasFrames
    ? (getFrames(personaId, motionState)[frameIndex] ?? getFrames(personaId, motionState)[0])
    : `/sprites/${personaId}/${personaId.toLowerCase()}.png`

  function handleError(e: React.SyntheticEvent<HTMLImageElement>) {
    // 单张图加载失败 → 试 INFP 动画第一帧
    const fallback = getFrames('INFP', motionState)[0]
    if (e.currentTarget.src !== window.location.origin + fallback) {
      e.currentTarget.src = fallback
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt=""
      onError={handleError}
      style={{
        imageRendering: 'pixelated',
        width: size,
        height: size,
        transform: facingLeft ? 'scaleX(-1)' : undefined,
        flexShrink: 0,
      }}
    />
  )
}
