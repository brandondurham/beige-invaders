'use client'
import { useEffect, useRef } from 'react'
import { COLOR_PLAYER } from './game'

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cleanup: (() => void) | undefined
    import('./game').then(({ initGame }) => {
      cleanup = initGame(canvas)
    })
    return () => cleanup?.()
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
      />
      <div
        className="fixed inset-0 inset-ring-10 inset-ring-(--color-player) pointer-events-none"
        style={{ '--color-player': COLOR_PLAYER } as React.CSSProperties}
      />
    </div>
  );
}
