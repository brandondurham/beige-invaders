'use client'
import { useEffect, useRef, useState } from 'react'
import { COLOR_FRAME, SPLAT_COLORS } from './space/consts'

const FRAME_ANIMATION_DURATION = 100;
const FRAME_ANIMATION_REPEATS = 3;

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grainRef = useRef<SVGFETurbulenceElement>(null)
  const [ringColor, setRingColor] = useState(COLOR_FRAME)

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
    let frame: number
    let seed = 0
    const tick = () => {
      seed = (seed + 1) % 200
      grainRef.current?.setAttribute('seed', String(seed))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
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

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={grainRef} type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="6" intercept="-1" />
              <feFuncG type="linear" slope="6" intercept="-1" />
              <feFuncB type="linear" slope="6" intercept="-1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
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
        className="fixed inset-0 pointer-events-none"
        style={{ filter: 'url(#grain)', opacity: 0.5, mixBlendMode: 'overlay', background: 'white' }}
      />
      <div
        className="fixed inset-0 inset-ring-10 inset-ring-(--color-player) pointer-events-none"
        style={{ '--color-player': `rgb(${ringColor.join(',')})` } as React.CSSProperties}
      />
    </div>
  );
}
