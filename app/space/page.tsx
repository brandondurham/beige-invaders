'use client'
import { useEffect, useRef } from 'react'

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
      <div className="fixed inset-0 inset-ring-6 inset-ring-[rgb(0_255_65)] pointer-events-none" />
    </div>
  );
}
