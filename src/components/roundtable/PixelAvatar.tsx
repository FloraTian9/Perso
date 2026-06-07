'use client'

import type { PersonaId } from '@/types'
import { getPersonaColors } from '@/lib/personaColors'

const PERSONAS_WITH_FRAMES = new Set(['INFP'])

type Props = {
  personaId: string
  size?: number
  overlay?: boolean  // 未选中时盖上黑色蒙版
  labelHeight?: number
  labelFontSize?: number
  onClick?: (personaId: PersonaId) => void
}

export function PixelAvatar({
  personaId,
  size = 80,
  overlay = false,
  labelHeight = 28,
  labelFontSize = 16,
  onClick,
}: Props) {
  const src = PERSONAS_WITH_FRAMES.has(personaId)
    ? `/sprites/${personaId}/think/think_1.png`
    : `/sprites/${personaId}/${personaId.toLowerCase()}.png`

  const colors = getPersonaColors(personaId as PersonaId)

  const content = (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* 圆形背景 + 头像 */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: colors.avatarBg,
          overflow: 'hidden',
          position: 'relative',
          filter: overlay ? 'brightness(0.45)' : undefined,
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
            width: size * 1.05,
            height: size * 1.05,
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* 黑色名称标签 */}
      <div
        className="font-pixel text-center flex items-center justify-center"
        style={{
          position: 'absolute',
          bottom: -5,
          left: 0,
          width: size,
          height: labelHeight,
          minHeight: labelHeight,
          maxHeight: labelHeight,
          background: '#000',
          borderRadius: 2,
          fontSize: labelFontSize,
          lineHeight: `${labelHeight}px`,
          letterSpacing: '0.1em',
          padding: '0 0 0 0.2em',
          overflow: 'hidden',
          color: overlay ? '#777' : '#fff',
        }}
      >
        {personaId}
      </div>

      {onClick && isPersonaIdLike(personaId) ? (
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            right: -4,
            top: -6,
            width: 24,
            height: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/page.svg"
            alt=""
            style={{
              width: 20,
              height: 20,
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </div>
      ) : null}
    </div>
  )

  if (!onClick || !isPersonaIdLike(personaId)) return content

  return (
    <button
      type="button"
      onClick={() => onClick(personaId)}
      className="shrink-0"
      style={{ width: size, height: size, cursor: 'pointer', padding: 0, border: 0, background: 'transparent' }}
      aria-label={`给 ${personaId} 递纸条`}
    >
      {content}
    </button>
  )
}

function isPersonaIdLike(value: string): value is PersonaId {
  return /^[EI][NS][FT][JP]$/.test(value)
}
