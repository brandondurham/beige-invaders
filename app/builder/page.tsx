"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { COLOR_BACKGROUND, SPLAT_COLORS, COLOR_PLAYER, COLOR_PLAYER_ACTIVE, COLOR_ENEMY } from "../space/consts";
import { SPRITES, type Sprite } from "./sprites";
import { Tabs } from "@chakra-ui/react"

const GRID_COLS = 32;
const GRID_ROWS = 32;
const PREVIEW_SCALE = 4;

type RGB = [number, number, number];

const PALETTE: { name: string; rgb: RGB }[] = [
  { name: "White",   rgb: [255, 255, 255] },
  { name: "Blue",    rgb: COLOR_PLAYER },
  { name: "Red",     rgb: COLOR_PLAYER_ACTIVE },
  { name: "Beige",   rgb: COLOR_ENEMY },
  ...SPLAT_COLORS.slice(0, 5).map((rgb, i) => ({ name: `Color ${i + 5}`, rgb })),
];

const bg = `rgb(${COLOR_BACKGROUND.join(",")})`;
const bgDark = `rgb(${COLOR_BACKGROUND.map(v => Math.round(v * 0.88)).join(",")})`;
const cellEmpty = 'rgb(255 255 255)';

function makeEmptyGrid(): boolean[][] {
  return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
}

// Loads a sprite into the grid using the largest integer upscale that fits,
// then centers the result. Each source pixel expands to scale×scale cells.
function loadSpriteIntoGrid(sprite: Sprite): boolean[][] {
  // Trim to content bounding box first so empty padding doesn't constrain the scale
  let minR = sprite.rows, maxR = -1, minC = sprite.cols, maxC = -1;
  for (let ri = 0; ri < sprite.rows; ri++) {
    for (let ci = 0; ci < sprite.cols; ci++) {
      if (sprite.pixels[ri * sprite.cols + ci]) {
        minR = Math.min(minR, ri); maxR = Math.max(maxR, ri);
        minC = Math.min(minC, ci); maxC = Math.max(maxC, ci);
      }
    }
  }
  if (maxR === -1) return makeEmptyGrid();

  const contentW = maxC - minC + 1;
  const contentH = maxR - minR + 1;
  const scale = Math.max(1, Math.floor(Math.min(GRID_COLS / contentW, GRID_ROWS / contentH)));
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const offsetR = Math.floor((GRID_ROWS - scaledH) / 2);
  const offsetC = Math.floor((GRID_COLS - scaledW) / 2);

  const grid = makeEmptyGrid();
  for (let ri = 0; ri < contentH; ri++) {
    for (let ci = 0; ci < contentW; ci++) {
      if (sprite.pixels[(minR + ri) * sprite.cols + (minC + ci)] === 1) {
        for (let dr = 0; dr < scale; dr++) {
          for (let dc = 0; dc < scale; dc++) {
            grid[offsetR + ri * scale + dr][offsetC + ci * scale + dc] = true;
          }
        }
      }
    }
  }
  return grid;
}

function SpriteThumb({ sprite, color, size = 80 }: { sprite: Sprite; color: RGB; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.min(size / sprite.cols, size / sprite.rows);
    canvas.width = Math.round(sprite.cols * scale);
    canvas.height = Math.round(sprite.rows * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgb(${color.join(",")})`;
    for (let ri = 0; ri < sprite.rows; ri++) {
      for (let ci = 0; ci < sprite.cols; ci++) {
        if (sprite.pixels[ri * sprite.cols + ci]) {
          ctx.fillRect(
            Math.round(ci * scale),
            Math.round(ri * scale),
            Math.ceil(scale),
            Math.ceil(scale)
          );
        }
      }
    }
  }, [sprite, color, size]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block" }} />;
}

export default function BuilderPage() {
  const [grid, setGrid] = useState<boolean[][]>(makeEmptyGrid);
  const [colorIdx, setColorIdx] = useState(0);
  const [tool, setTool] = useState<"paint" | "erase">("paint");
  const [copied, setCopied] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [previewScale, setPreviewScale] = useState(PREVIEW_SCALE);

  const [history, setHistory] = useState<boolean[][][]>([]);

  const isDown = useRef(false);
  const paintVal = useRef(true);
  const strokeStart = useRef<boolean[][] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // Find content bounding box
    let minR = GRID_ROWS, maxR = -1, minC = GRID_COLS, maxC = -1;
    grid.forEach((row, ri) => row.forEach((filled, ci) => {
      if (filled) {
        minR = Math.min(minR, ri); maxR = Math.max(maxR, ri);
        minC = Math.min(minC, ci); maxC = Math.max(maxC, ci);
      }
    }));

    if (maxR === -1) {
      canvas.width = GRID_COLS * previewScale;
      canvas.height = GRID_ROWS * previewScale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const contentW = maxC - minC + 1;
    const contentH = maxR - minR + 1;
    canvas.width = contentW * previewScale;
    canvas.height = contentH * previewScale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { rgb } = PALETTE[colorIdx];
    ctx.fillStyle = `rgb(${rgb.join(",")})`;
    for (let ri = minR; ri <= maxR; ri++) {
      for (let ci = minC; ci <= maxC; ci++) {
        if (grid[ri][ci]) {
          ctx.fillRect((ci - minC) * previewScale, (ri - minR) * previewScale, previewScale, previewScale);
        }
      }
    }
  }, [grid, colorIdx, previewScale]);

  const paint = useCallback((ri: number, ci: number, val: boolean) => {
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[ri][ci] = val;
      return next;
    });
  }, []);

  const pushHistory = (snapshot: boolean[][]) =>
    setHistory(h => [...h, snapshot]);

  const handleDown = (ri: number, ci: number) => {
    isDown.current = true;
    strokeStart.current = grid.map(r => [...r]);
    const val = tool === "erase" ? false : !grid[ri][ci];
    paintVal.current = val;
    paint(ri, ci, val);
  };

  const handleEnter = (ri: number, ci: number) => {
    if (!isDown.current) return;
    paint(ri, ci, tool === "erase" ? false : paintVal.current);
  };

  const handleUp = () => {
    if (isDown.current && strokeStart.current) {
      pushHistory(strokeStart.current);
      strokeStart.current = null;
    }
    isDown.current = false;
  };

  const undo = () => {
    if (history.length === 0) return;
    setGrid(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const copyCode = () => {
    const { rgb } = PALETTE[colorIdx];
    const rowStrings = grid
      .map(row => "  " + row.map(v => (v ? "1" : "0")).join(","))
      .join(",\n");
    const code = `const pixels = [\n${rowStrings}\n].map(v => v ? \`rgb(${rgb.join(",")})\` : null);\n// loadSprite("name", makeSpriteDataURL(pixels, ${GRID_COLS}, ${GRID_ROWS}, scale));`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const btnBase: React.CSSProperties = {
    padding: "6px 14px",
    border: "1px solid #aaa",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
    letterSpacing: 1,
  };

  return (
    <>
      <div
        className="flex font-mono text-foreground items-stretch h-screen bg-white"
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      >
        <div
          className="grow flex flex-col items-center p-6"
        >
          <h1 style={{ fontSize: 18, color: "#1e64ff", letterSpacing: 3, margin: "0 0 28px" }}>
            CHARACTER BUILDER
          </h1>

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <Tabs.Root
              defaultValue="members"
              orientation='vertical'
              variant="subtle"
            >
              <Tabs.List>
                <Tabs.Trigger value="members">Members</Tabs.Trigger>
                <Tabs.Trigger value="projects">Projects</Tabs.Trigger>
                <Tabs.Trigger value="tasks">Settings</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <button
              onClick={() => setTool("paint")}
              style={{ ...btnBase, background: tool === "paint" ? "#333" : bgDark, color: tool === "paint" ? "#fff" : "#333" }}
            >
              PAINT
            </button>
            <button
              onClick={() => setTool("erase")}
              style={{ ...btnBase, background: tool === "erase" ? "#333" : bgDark, color: tool === "erase" ? "#fff" : "#333" }}
            >
              ERASE
            </button>
            <button
              onClick={() => { pushHistory(grid); setGrid(makeEmptyGrid()); }}
              style={{ ...btnBase, background: bgDark, color: "#333" }}
            >
              CLEAR
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              style={{ ...btnBase, background: bgDark, color: history.length === 0 ? "#aaa" : "#333", cursor: history.length === 0 ? "default" : "pointer" }}
            >
              UNDO
            </button>
            <button
              onClick={() => setShowPicker(true)}
              style={{ ...btnBase, background: bgDark, color: "#333" }}
            >
              LOAD
            </button>
            <button
              onClick={copyCode}
              style={{ ...btnBase, background: copied ? "#0a8a50" : "#1e64ff", color: "#fff", border: "1px solid transparent" }}
            >
              {copied ? "COPIED!" : "COPY CODE"}
            </button>
          </div>

          {/* Palette */}
          <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap", justifyContent: "center" }}>
            {PALETTE.map((color, i) => (
              <button
                key={i}
                onClick={() => { setColorIdx(i); setTool("paint"); }}
                title={color.name}
                style={{
                  width: 28,
                  height: 28,
                  background: `rgb(${color.rgb.join(",")})`,
                  border: colorIdx === i && tool === "paint" ? "3px solid #000" : "3px solid rgba(0,0,0,0.15)",
                  borderRadius: 4,
                  cursor: "pointer",
                  outline: colorIdx === i && tool === "paint" ? "2px solid rgba(255,255,255,0.8)" : "none",
                  outlineOffset: 1,
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div className="aspect-square bg-[#7db8e4] border-l-px border-gray-300">
          <div className="grid grid-cols-32 gap-px h-full p-px touch-none">
            {grid.map((row, ri) =>
              row.map((filled, ci) => (
                <div
                  className='cursor-crosshair'
                  key={`${ri}-${ci}`}
                  onPointerDown={e => { e.preventDefault(); handleDown(ri, ci); }}
                  onPointerEnter={() => handleEnter(ri, ci)}
                  style={{
                    background: filled ? `rgb(${PALETTE[colorIdx].rgb.join(",")})` : cellEmpty,
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "#888", letterSpacing: 2 }}>PREVIEW ({previewScale}x)</span>
        <canvas
          ref={canvasRef}
          style={{
            imageRendering: "pixelated",
            border: "1px solid #aaa",
            background: "transparent",
          }}
        />
      </div>

      <p style={{ marginTop: 20, fontSize: 10, color: "#999", letterSpacing: 1, textAlign: "center" }}>
        {GRID_COLS}×{GRID_ROWS} — CLICK OR DRAG TO PAINT
      </p>

      {/* Character Picker */}
      {showPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowPicker(false); }}
        >
          <div
            style={{
              background: bg,
              border: "2px solid #8a7f75",
              borderRadius: 6,
              padding: "28px 24px",
              width: 520,
              maxWidth: "92vw",
              maxHeight: "80vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 13, color: "#1e64ff", letterSpacing: 2, margin: 0 }}>
                LOAD CHARACTER
              </h2>
              <button
                onClick={() => setShowPicker(false)}
                style={{ ...btnBase, padding: "3px 10px", background: bgDark, color: "#555", fontSize: 10 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {SPRITES.map(sprite => (
                <button
                  key={sprite.name}
                  onClick={() => { pushHistory(grid); setGrid(loadSpriteIntoGrid(sprite)); setPreviewScale(sprite.bakeScale); setShowPicker(false); }}
                  style={{
                    background: bgDark,
                    border: "2px solid transparent",
                    borderRadius: 5,
                    padding: "14px 10px 10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    transition: "border-color 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#1e64ff")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                >
                  <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SpriteThumb sprite={sprite} color={PALETTE[colorIdx].rgb} size={80} />
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: 1, color: "#555" }}>
                    {sprite.name.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, color: "#999" }}>
                    {sprite.cols}×{sprite.rows}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
