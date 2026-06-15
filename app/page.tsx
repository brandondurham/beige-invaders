'use client'
import { useEffect, useRef, useState } from 'react'
import { COLOR_FRAME, SPLAT_COLORS } from './space/consts'

const FRAME_ANIMATION_DURATION = 100;
const FRAME_ANIMATION_REPEATS = 3;

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grainRef = useRef<SVGFETurbulenceElement>(null)
  const [ringColor, setRingColor] = useState(COLOR_FRAME)
  const [, setScene] = useState<string>('title')
  const [loading, setLoading] = useState(true)
  const [isTouch, setIsTouch] = useState<boolean | null>(null)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    if (isTouch !== false) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cleanup: (() => void) | undefined
    Promise.all([import('./space/game'), document.fonts.load('16px Kongtext')]).then(([{ initGame }]) => {
      cleanup = initGame(canvas)
      setLoading(false)
    })
    return () => cleanup?.()
  }, [isTouch])

  useEffect(() => {
    let frame: number
    let seed = 0
    const tick = () => {
      if (seed % 3 === 0) grainRef.current?.setAttribute('seed', String(seed / 3 | 0))
      seed = (seed + 1) % 600
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => setScene((e as CustomEvent).detail)
    window.addEventListener('scene-change', handler)
    return () => window.removeEventListener('scene-change', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      const sequence = [...Array(FRAME_ANIMATION_REPEATS)].flatMap(() => SPLAT_COLORS);
      let i = 0;
      const interval = setInterval(() => {
        const [r, g, b] = sequence[i];
        setRingColor([r, g, b]);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setTimeout(() => setRingColor(COLOR_FRAME), 80);
        }
      }, FRAME_ANIMATION_DURATION);
    };
    window.addEventListener('level-complete', handler);
    return () => window.removeEventListener('level-complete', handler);
  }, []);

  if (isTouch) return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <p className="text-white text-sm font-mono text-center px-8">
      U Can’t Touch This.<br />Please visit on a desktop browser.</p>
    </div>
  )

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center relative">
      <div
        className="relative z-10 rounded-4xl overflow-hidden"
        style={{
          width: "min(calc(100vw - 84px), calc((100vh - 84px) * 224 / 256))",
          height: "min(calc(100vh - 84px), calc((100vw - 84px) * 256 / 224))",
          margin: "42px",
          flexShrink: 0,
          boxShadow: `0 0 0 20px rgb(${ringColor.join(',')})`,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: [
              "radial-gradient(ellipse 110% 55% at 38% 8%, rgba(255,255,255,0.07) 0%, transparent 100%)",
              "radial-gradient(ellipse 55% 22% at 72% 4%, rgba(255,255,255,0.04) 0%, transparent 100%)",
            ].join(", "),
          }}
        />
      </div>
      <div
        className="shadow-[0_0_140px_rgb(0_0_0/0.3)] fixed rounded-4xl -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-20 pointer-events-none"
        style={{ width: "min(calc(100vw - 84px), calc((100vh - 84px) * 224 / 256))", height: "min(calc(100vh - 84px), calc((100vw - 84px) * 256 / 224))" }}
      />
      <div
        className="fixed rounded-4xl -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-21 pointer-events-none"
        style={{
          boxShadow: "inset 16px 16px 72px rgb(0 0 0/0.7), inset -2px -2px 0 rgb(255 255 255/0.06), inset -16px -16px 72px rgb(255 255 255/0.1)",
          height: "min(calc(100vh - 86px), calc((100vw - 86px) * 256 / 224))",
          width: "min(calc(100vw - 86px), calc((100vh - 86px) * 224 / 256))",
        }}
      />
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-30 bg-black">
          <span className="text-white text-sm font-mono">Loading…</span>
        </div>
      )}
    </div>
  );
}
