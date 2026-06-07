'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// INFP 眨眼：睁眼停留 2.5s，闭眼 150ms，循环
const FRAMES = [
  { src: '/sprites/INFP/wink/wink_1.png', duration: 2500 },
  { src: '/sprites/INFP/wink/wink_2.png', duration: 150 },
]

function INFPSprite() {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFrameIndex((i) => (i + 1) % FRAMES.length)
    }, FRAMES[frameIndex].duration)
    return () => clearTimeout(timer)
  }, [frameIndex])

  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src={FRAMES[frameIndex].src}
        alt="INFP"
        width={160}
        height={160}
        style={{ imageRendering: 'pixelated' }}
        priority
      />
      <span className="text-green-400 font-mono text-sm tracking-widest">INFP</span>
    </div>
  )
}

export default function SpriteTestPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-12">
      <p className="text-green-600 font-mono text-xs tracking-widest">SPRITE TEST</p>
      <INFPSprite />
      <p className="text-zinc-600 font-mono text-xs">
        wink_1: 2500ms &nbsp;|&nbsp; wink_2: 150ms
      </p>
    </div>
  )
}
