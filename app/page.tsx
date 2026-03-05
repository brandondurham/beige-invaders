'use client'
import { useEffect, useRef, useState } from 'react'
import { COLOR_PLAYER, SPLAT_COLORS } from './space/game'

const FRAME_ANIMATION_DURATION = 100;
const FRAME_ANIMATION_REPEATS = 3;

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ringColor, setRingColor] = useState(COLOR_PLAYER)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cleanup: (() => void) | undefined
    Promise.all([import('./space/game'), document.fonts.load('16px Kongtext')]).then(([{ initGame }]) => {
      cleanup = initGame(canvas)
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    const handler = () => {
      const sequence = [...Array(FRAME_ANIMATION_REPEATS)].flatMap(() => SPLAT_COLORS);
      let i = 0;
      const interval = setInterval(() => {
        const [r, g, b] = sequence[i];
        setRingColor(`rgb(${r}, ${g}, ${b})`);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setTimeout(() => setRingColor(COLOR_PLAYER), 80);
        }
      }, FRAME_ANIMATION_DURATION);
    };
    window.addEventListener('level-complete', handler);
    return () => window.removeEventListener('level-complete', handler);
  }, []);

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
        style={{ '--color-player': ringColor } as React.CSSProperties}
      />
    </div>
  );
}
