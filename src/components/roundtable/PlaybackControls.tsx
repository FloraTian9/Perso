'use client'

import { useRef } from 'react'

type Props = {
  currentIndex: number
  isPlaying: boolean
  total: number
  onSeek: (index: number) => void
  progressRatio?: number
  onSeekRatio?: (ratio: number) => void
  onTogglePlay: () => void
}

export function PlaybackControls({ currentIndex, isPlaying, total, onSeek, progressRatio, onSeekRatio, onTogglePlay }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const pct = (progressRatio ?? (total > 0 ? currentIndex / total : 0)) * 100


  function seekFromPointer(e: React.PointerEvent | PointerEvent) {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (onSeekRatio) {
      onSeekRatio(ratio)
    } else {
      onSeek(Math.round(ratio * total))
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekFromPointer(e)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    seekFromPointer(e)
  }

  function onPointerUp() {
    dragging.current = false
  }

  return (
    <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3">
      {/* 进度条轨道 */}
      <div
        ref={trackRef}
        className="relative flex-1 cursor-pointer select-none"
        style={{ height: 20, border: '3px solid white', background: '#000' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* 内层黑色区域（产生双线效果） */}
        <div className="absolute" style={{ inset: 2, background: '#000' }}>
          {/* 白色填充（已播放） */}
          <div
            className="absolute inset-0"
            style={{ right: `${100 - pct}%`, background: 'white' }}
          />
        </div>

        {/* 滑块：比轨道稍高，覆盖双线边框 */}
        <div
          className="absolute z-10"
          style={{
            top: '50%',
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 28,
            background: 'white',
          }}
        />
      </div>

      {/* 播放/暂停按钮 */}
      <button
        type="button"
        className="font-pixel text-white text-xs select-none"
        style={{
          border: '2px solid #888',
          background: '#111',
          padding: '6px 12px',
          letterSpacing: '0.1em',
          minWidth: 60,
        }}
        onClick={onTogglePlay}
      >
        {isPlaying ? '暂停' : '播放'}
      </button>
    </div>
  )
}
