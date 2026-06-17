'use client'
import { useEffect, useRef, useState } from 'react'
import { COLOR_FRAME, SPLAT_COLORS } from './space/consts'

const FRAME_ANIMATION_DURATION = 100;
const FRAME_ANIMATION_REPEATS = 3;

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    const measureFps = () => new Promise<number>(resolve => {
      const FRAMES = 20
      let count = 0
      const start = performance.now()
      const tick = () => ++count >= FRAMES
        ? resolve(FRAMES / (performance.now() - start) * 1000)
        : requestAnimationFrame(tick)
      requestAnimationFrame(tick)
    })
    Promise.all([import('./space/game'), document.fonts.load('16px Kongtext'), measureFps()]).then(([{ initGame }, , fps]) => {
      cleanup = initGame(canvas, { enableCRT: fps >= 50 })
      setLoading(false)
    })
    return () => cleanup?.()
  }, [isTouch])

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
        setRingColor([r, g, b, 1]);
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
        className="relative z-10 rounded-[54px] overflow-hidden"
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
        className="shadow-[0_0_140px_rgb(255_255_255/0.12)] fixed rounded-[54px] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-20 pointer-events-none"
        style={{ width: "min(calc(100vw - 84px), calc((100vh - 84px) * 224 / 256))", height: "min(calc(100vh - 84px), calc((100vw - 84px) * 256 / 224))" }}
      />
      <div
        className="fixed rounded-[54px] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-21 pointer-events-none"
        style={{
          boxShadow: "inset 0 12px 72px rgb(0 0 0), inset 0 -2px 0 1px rgb(255 255 255/0.4)",
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
