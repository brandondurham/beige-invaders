'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { COLOR_FRAME, COLOR_TOUCH_BTN_BG, COLOR_TOUCH_BTN_BORDER, COLOR_TOUCH_BTN_TEXT, SPLAT_COLORS } from './space/consts'
import { JoystickSVG } from './JoystickSVG'

const FRAME_ANIMATION_DURATION = 100;
const FRAME_ANIMATION_REPEATS = 3;
const JOYSTICK_DRAG_THRESHOLD = 20;

export default function SpacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grainRef = useRef<SVGFETurbulenceElement>(null)
  const [ringColor, setRingColor] = useState(COLOR_FRAME)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [scene, setScene] = useState<string>('title')
  const leftBtnRef = useRef<HTMLButtonElement>(null)
  const rightBtnRef = useRef<HTMLButtonElement>(null)
  const [joystickFrame, setJoystickFrame] = useState<'center' | 'left' | 'right'>('center')
  const touchStartX = useRef<number | null>(null)

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
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return
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
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => setScene((e as CustomEvent).detail)
    window.addEventListener('scene-change', handler)
    return () => window.removeEventListener('scene-change', handler)
  }, [])

  // Non-passive touch listeners to allow preventDefault (prevents scroll/zoom while using buttons)
  useEffect(() => {
    if (!isTouchDevice) return
    const prevent = (e: TouchEvent) => e.preventDefault()
    const opts = { passive: false }
    leftBtnRef.current?.addEventListener('touchstart', prevent, opts)
    leftBtnRef.current?.addEventListener('touchmove', prevent, opts)
    rightBtnRef.current?.addEventListener('touchstart', prevent, opts)
    rightBtnRef.current?.addEventListener('touchmove', prevent, opts)
    return () => {
      leftBtnRef.current?.removeEventListener('touchstart', prevent)
      leftBtnRef.current?.removeEventListener('touchmove', prevent)
      rightBtnRef.current?.removeEventListener('touchstart', prevent)
      rightBtnRef.current?.removeEventListener('touchmove', prevent)
    }
  }, [isTouchDevice])

  const touchInput = useCallback(() => (window as any).__spaceTouchInput as { left: boolean; right: boolean; shoot: boolean } | undefined, [])

  const handleMoveStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartX.current = touch.clientX
    setJoystickFrame('center')
    const input = touchInput()
    if (!input) return
    input.left = false
    input.right = false
  }, [touchInput])

  const handleMoveMove = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0]
    if (!touch || touchStartX.current === null) return
    const delta = touch.clientX - touchStartX.current
    const input = touchInput()
    if (!input) return
    if (delta < -JOYSTICK_DRAG_THRESHOLD) {
      setJoystickFrame('left')
      input.left = true
      input.right = false
    } else if (delta > JOYSTICK_DRAG_THRESHOLD) {
      setJoystickFrame('right')
      input.left = false
      input.right = true
    } else {
      setJoystickFrame('center')
      input.left = false
      input.right = false
    }
  }, [touchInput])

  const handleMoveEnd = useCallback(() => {
    touchStartX.current = null
    setJoystickFrame('center')
    const input = touchInput()
    if (!input) return
    input.left = false
    input.right = false
  }, [touchInput])

  const handleShootStart = useCallback(() => {
    const input = touchInput()
    if (input) input.shoot = true
  }, [touchInput])

  const handleShootEnd = useCallback(() => {
    const input = touchInput()
    if (input) input.shoot = false
  }, [touchInput])

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
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: isTouchDevice ? 1200 : "100%",
          height: isTouchDevice ? 800 : "100%",
          imageRendering: "pixelated",
        }}
      />
      {!isTouchDevice && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ filter: 'url(#grain)', opacity: 0.25, mixBlendMode: 'overlay', background: 'white' }}
        />
      )}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={grainRef} type="fractalNoise" baseFrequency="0.45" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="70" intercept="-2.5" />
              <feFuncG type="linear" slope="70" intercept="-2.5" />
              <feFuncB type="linear" slope="70" intercept="-2.5" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div
        className="fixed inset-0 inset-ring-[2vmin] inset-ring-(--color-player) pointer-events-none"
        style={{ '--color-player': `rgb(${ringColor.join(',')})` } as React.CSSProperties}
      />
      {isTouchDevice && scene === 'game' && (
        <>
          <button
            ref={leftBtnRef}
            onTouchStart={handleMoveStart}
            onTouchMove={handleMoveMove}
            onTouchEnd={handleMoveEnd}
            onTouchCancel={handleMoveEnd}
            onContextMenu={(e) => e.preventDefault()}
            className="fixed bottom-20 left-12 select-none z-50"
            style={{
              width: 81,
              height: 97,
              background: 'none',
              border: 'none',
              padding: 0,
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <JoystickSVG frame={joystickFrame} />
          </button>
          <button
            ref={rightBtnRef}
            onTouchStart={handleShootStart}
            onTouchEnd={handleShootEnd}
            onTouchCancel={handleShootEnd}
            onContextMenu={(e) => e.preventDefault()}
            className="fixed bottom-20 right-12 w-18 h-18 rounded-full flex items-center justify-center select-none active:opacity-60 z-50"
            style={{
              background: COLOR_TOUCH_BTN_BG,
              border: `2px solid ${COLOR_TOUCH_BTN_BORDER}`,
              color: COLOR_TOUCH_BTN_TEXT,
              fontSize: 28,
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
