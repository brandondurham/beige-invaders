import kaplay, { type GameObj } from "kaplay";

import type { RGB } from './consts';

// Consts
import {
  themes,
  ACTIVE_THEME,
  setActiveTheme,
  COLOR_ACCENT,
  COLOR_CANVAS_BG,
  COLOR_DIM,
  COLOR_ENEMY_ROWS,
  COLOR_ENEMY_BULLET,
  COLOR_GAMEOVER_HEADING,

  COLOR_HI_SCORE,
  COLOR_LIVES,
  COLOR_PLAYER,
  COLOR_PLAYER_ACTIVE,
  COLOR_PLAYER_BULLET,
  COLOR_SHADOW,
  COLOR_SHIELD,
  COLOR_UFO,
  COLOR_UI_FONT,
  COLOR_WHITE,
  DIALOG_QUESTION,
  DIALOG_BG,
  DIALOG_FG,
  DIALOG_BTN_YES_BG,
  DIALOG_BTN_YES_FG,
  DIALOG_BTN_NO_BG,
  DIALOG_BTN_NO_FG,
  ENEMY_DECOR_H,
  ENEMY_DECOR_MIN_X,
  ENEMY_DECOR_MIN_Y,
  ENEMY_DECOR_W,
  ENEMY_ROWS,
  ENEMY_SHADOW_OFFSET,
  ENEMY_SPEED_INCREASE_PER_LEVEL,
  ENEMY_SPRITE_PIXEL_H,
  ENEMY_SPRITE_PIXEL_W,
  ENEMY_STROKE_PX,
  getLayout,
  HAS_SHADOW,
  NUM_COLORS_IN_SPLAT,
  NUM_SHIELDS,
  SHIELD_SHAPE,
  SPLAT_COLORS,
  UI_FONT_SIZE,
} from './consts'

export function initGame(canvas: HTMLCanvasElement): () => void {
  const GUTTER_PX = 42;
  const scale = Math.min((window.innerWidth - GUTTER_PX * 2) / 224, (window.innerHeight - GUTTER_PX * 2) / 256);
  const k = kaplay({
    background: COLOR_CANVAS_BG,
    canvas,
    crisp: true,
    height: Math.round(256 * scale),
    loadingScreen: true,
    pixelDensity: 1,
    texFilter: "nearest",
    width: Math.round(224 * scale),
  });

  k.loadShader("crt", null, `
    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
      vec2 c = (uv - 0.5) * 0.92;
      float r2 = dot(c, c);
      vec2 d = c * (1.0 + 0.18 * r2) + 0.5;
      return texture2D(tex, d);
    }
  `);
  k.usePostEffect("crt");


  const r = k.width() / 844; // proportional scale: 1.0 at design canvas width, scales all layout values

  const fgColor = () => k.color(COLOR_UI_FONT);
  const [SHADOW_R, SHADOW_G, SHADOW_B, SHADOW_A] = COLOR_SHADOW;
  const shadowColor = () => k.color(SHADOW_R, SHADOW_G, SHADOW_B);
  const shadowRgb = () => k.rgb(SHADOW_R, SHADOW_G, SHADOW_B);
  const shadowOpacity = () => k.opacity(SHADOW_A);

  // Render Kongtext TTF to a bitmap atlas and threshold to binary pixels so
  // canvas font antialiasing doesn't soften the text.
  function buildCrispFont() {
    const chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    const size = Math.round(16 * r);
    const probe = document.createElement("canvas");
    const pctx = probe.getContext("2d")!;
    pctx.font = `${size}px Kongtext`;
    const charW = Math.round(pctx.measureText("AAAA").width / 4);
    const charH = size;
    const c = document.createElement("canvas");
    c.width = charW * chars.length;
    c.height = charH;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.font = `${size}px Kongtext`;
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    chars.split("").forEach((ch, i) => ctx.fillText(ch, i * charW, 0));
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = d[i + 3] > 128 ? 255 : 0;
    }
    ctx.putImageData(imgData, 0, 0);
    k.loadBitmapFont("kongtext", c.toDataURL(), charW, charH, { chars });
  }
  buildCrispFont();
  const font = "kongtext";

  k.loadSprite("bf-logo", "/bf.png");

  // ─── SPRITE HELPERS ───

  type PixelFrame = (string | null)[];

  function makeSpriteDataURL(pixels: PixelFrame, w: number, h: number, scale = 4) {
    const c = document.createElement("canvas");
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = pixels[y * w + x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return c.toDataURL();
  }

  function flipH(pixels: PixelFrame, w: number): PixelFrame {
    const rows = pixels.length / w;
    const out: PixelFrame = [];
    for (let y = 0; y < rows; y++)
      for (let x = w - 1; x >= 0; x--)
        out.push(pixels[y * w + x]);
    return out;
  }

  function makeSpritesheetDataURL(pixelFrames: PixelFrame[], w: number, h: number, scale = 4) {
    const numFrames = pixelFrames.length;
    const c = document.createElement("canvas");
    c.width = w * scale * numFrames;
    c.height = h * scale;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    pixelFrames.forEach((pixels, fi) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const color = pixels[y * w + x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect((fi * w + x) * scale, y * scale, scale, scale);
          }
        }
      }
    });
    return c.toDataURL();
  }

  const ENEMY_DECOR_OFFSET_X = -ENEMY_DECOR_MIN_X;
  const ENEMY_DECOR_OFFSET_Y = -ENEMY_DECOR_MIN_Y;
  const ENEMY_DECOR_ANCHOR_DX = (ENEMY_DECOR_OFFSET_X + ENEMY_SPRITE_PIXEL_W / 2 - ENEMY_DECOR_W / 2) * r;
  const ENEMY_DECOR_ANCHOR_DY = (ENEMY_DECOR_OFFSET_Y + ENEMY_SPRITE_PIXEL_H / 2 - ENEMY_DECOR_H / 2) * r;
  const ENEMY_STROKE_COLOR = `rgb(${COLOR_SHADOW.join(',')})`;
  const ENEMY_SHADOW_COLOR = `rgb(${COLOR_SHADOW.join(',')})`;

  function makeEnemyDecorFrame(pixels: PixelFrame): PixelFrame {
    const out: PixelFrame = Array(ENEMY_DECOR_W * ENEMY_DECOR_H).fill(null);
    const setPixel = (x: number, y: number, color: string) => {
      const ox = x + ENEMY_DECOR_OFFSET_X;
      const oy = y + ENEMY_DECOR_OFFSET_Y;
      if (ox < 0 || ox >= ENEMY_DECOR_W || oy < 0 || oy >= ENEMY_DECOR_H) return;
      out[oy * ENEMY_DECOR_W + ox] = color;
    };

    for (let y = 0; y < ENEMY_SPRITE_PIXEL_H; y++) {
      for (let x = 0; x < ENEMY_SPRITE_PIXEL_W; x++) {
        if (!pixels[y * ENEMY_SPRITE_PIXEL_W + x]) continue;
        setPixel(x + ENEMY_SHADOW_OFFSET.x, y + ENEMY_SHADOW_OFFSET.y, ENEMY_SHADOW_COLOR);
      }
    }

    for (let y = 0; y < ENEMY_SPRITE_PIXEL_H; y++) {
      for (let x = 0; x < ENEMY_SPRITE_PIXEL_W; x++) {
        if (!pixels[y * ENEMY_SPRITE_PIXEL_W + x]) continue;
        for (let dy = -ENEMY_STROKE_PX; dy <= ENEMY_STROKE_PX; dy++) {
          for (let dx = -ENEMY_STROKE_PX; dx <= ENEMY_STROKE_PX; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) > ENEMY_STROKE_PX) continue;
            setPixel(x + dx, y + dy, ENEMY_STROKE_COLOR);
          }
        }
      }
    }

    return out;
  }

  // ─── SPRITES ───

  const playerPixels2 = [
    0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,
    0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
    0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
    0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,
    0,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,
  ].map((v) => (v ? 'rgb(255,255,255)' : null));
  k.loadSprite("player", makeSpriteDataURL(playerPixels2, 22, 15, 3));

  // ─── ENEMY SPRITES (loaded for each theme) ───

  const row1Data = [
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
  ];

  const row2Data = [
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
  ];

  const row3Data = [
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
  ];

  const row4Data = [
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,
  ];

  const row5Data = [
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
  ];

  const ufoData = [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ];

  for (const [tName, t] of Object.entries(themes)) {
    const px1 = row1Data.map(v => v ? `rgb(${t.COLOR_ENEMY_ROWS[0].join(',')})` : null);
    const fr1 = [px1, flipH(px1, ENEMY_SPRITE_PIXEL_W)];
    k.loadSprite(`row1Decor_${tName}`, makeSpritesheetDataURL(fr1.map(makeEnemyDecorFrame), ENEMY_DECOR_W, ENEMY_DECOR_H, 1), { sliceX: 2 });
    k.loadSprite(`row1_${tName}`, makeSpritesheetDataURL(fr1, ENEMY_SPRITE_PIXEL_W, ENEMY_SPRITE_PIXEL_H, 1), { sliceX: 2 });

    const px2 = row2Data.map(v => v ? `rgb(${t.COLOR_ENEMY_ROWS[1].join(',')})` : null);
    const fr2 = [px2, flipH(px2, ENEMY_SPRITE_PIXEL_W)];
    k.loadSprite(`row2Decor_${tName}`, makeSpritesheetDataURL(fr2.map(makeEnemyDecorFrame), ENEMY_DECOR_W, ENEMY_DECOR_H, 1), { sliceX: 2 });
    k.loadSprite(`row2_${tName}`, makeSpritesheetDataURL(fr2, ENEMY_SPRITE_PIXEL_W, ENEMY_SPRITE_PIXEL_H, 1), { sliceX: 2 });

    const px3 = row3Data.map(v => v ? `rgb(${t.COLOR_ENEMY_ROWS[2].join(',')})` : null);
    const fr3 = [px3, flipH(px3, ENEMY_SPRITE_PIXEL_W)];
    k.loadSprite(`row3Decor_${tName}`, makeSpritesheetDataURL(fr3.map(makeEnemyDecorFrame), ENEMY_DECOR_W, ENEMY_DECOR_H, 1), { sliceX: 2 });
    k.loadSprite(`row3_${tName}`, makeSpritesheetDataURL(fr3, ENEMY_SPRITE_PIXEL_W, ENEMY_SPRITE_PIXEL_H, 1), { sliceX: 2 });

    const px4 = row4Data.map(v => v ? `rgb(${t.COLOR_ENEMY_ROWS[3].join(',')})` : null);
    const fr4 = [px4, flipH(px4, ENEMY_SPRITE_PIXEL_W)];
    k.loadSprite(`row4Decor_${tName}`, makeSpritesheetDataURL(fr4.map(makeEnemyDecorFrame), ENEMY_DECOR_W, ENEMY_DECOR_H, 1), { sliceX: 2 });
    k.loadSprite(`row4_${tName}`, makeSpritesheetDataURL(fr4, ENEMY_SPRITE_PIXEL_W, ENEMY_SPRITE_PIXEL_H, 1), { sliceX: 2 });

    const px5 = row5Data.map(v => v ? `rgb(${t.COLOR_ENEMY_ROWS[4].join(',')})` : null);
    const fr5 = [px5, flipH(px5, ENEMY_SPRITE_PIXEL_W)];
    k.loadSprite(`row5Decor_${tName}`, makeSpritesheetDataURL(fr5.map(makeEnemyDecorFrame), ENEMY_DECOR_W, ENEMY_DECOR_H, 1), { sliceX: 2 });
    k.loadSprite(`row5_${tName}`, makeSpritesheetDataURL(fr5, ENEMY_SPRITE_PIXEL_W, ENEMY_SPRITE_PIXEL_H, 1), { sliceX: 2 });

    const pxUfo = ufoData.map(v => v ? `rgb(${t.COLOR_UFO.join(',')})` : null);
    k.loadSprite(`ufo_${tName}`, makeSpriteDataURL(pxUfo, 16, 7, 4));
  }

  for (let i = 1; i <= 6; i++) k.loadSound(`shoot${i}`, `/game/audio/custom/eep-${i}.mp3`);
  k.loadSound("pop", "/game/audio/custom/pop.mp3");
  k.loadSound("fart", "/game/audio/custom/fart.mp3");
  k.loadSound("explosion1", "/game/audio/custom/explosion-1.mp3");
  k.loadSound("explosion2", "/game/audio/custom/explosion-2.mp3");
  k.loadSound("explosion3", "/game/audio/custom/explosion-3.mp3");
  k.loadSound("explosion4", "/game/audio/custom/explosion-4.mp3");
  k.loadSound("beep1", "/game/audio/beep-1.m4a");
  k.loadSound("beep2", "/game/audio/beep-2.m4a");
  k.loadSound("beep3", "/game/audio/beep-3.m4a");
  k.loadSound("beep4", "/game/audio/beep-4.m4a");
  k.loadSound("levelup", "/game/audio/custom/level-up.mp3");
  let ufoAudioBuf: AudioBuffer | null = null;
  fetch("/game/audio/custom/andrew-2.mp3")
    .then(r => { if (!r.ok) throw new Error(`ufo-1.mp3 fetch failed: ${r.status}`); return r.arrayBuffer(); })
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(buffer => { ufoAudioBuf = buffer; })
    .catch(e => console.error("[ufo]", e));

  const bulletPixels = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) =>
    v ? `rgb(${COLOR_PLAYER_BULLET.join(',')})` : null,
  );
  k.loadSprite("bullet", makeSpriteDataURL(bulletPixels, 40, 80, 10));

  const enemyBulletPixels = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) =>
    v ? `rgb(${COLOR_ENEMY_BULLET.join(',')})` : null,
  );
  k.loadSprite("enemyBullet", makeSpriteDataURL(enemyBulletPixels, 40, 80, 10));

  const pixels = [
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0
  ].map(v => v ? `rgb(255,255,255)` : null);
  k.loadSprite("explosion", makeSpriteDataURL(pixels, 32, 32, 1));

  const shieldBlock = Array(48)
    .fill(1)
    .map(() => `rgb(${COLOR_SHIELD.join(',')})`);
  k.loadSprite("shield", makeSpriteDataURL(shieldBlock, 8, 6, 2));
  const speakerOnPixels = [
    0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,
    0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,
    0,0,0,0,1,0,1,0,0,0,1,0,0,1,0,
    0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,
    1,1,1,0,0,0,1,1,0,1,0,0,1,0,1,
    1,0,0,0,0,0,0,1,0,0,1,0,1,0,1,
    1,1,1,0,0,0,1,1,0,1,0,0,1,0,1,
    0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,
    0,0,0,0,1,0,1,0,0,0,1,0,0,1,0,
    0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,
  ].map(v => v ? `rgb(${COLOR_UI_FONT.join(',')})` : null);
  const speakerOffPixels = [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,
    0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,
    0,0,0,1,0,0,1,0,0,1,0,0,0,1,0,
    1,1,1,0,0,0,1,1,0,0,1,0,1,0,0,
    1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,
    1,1,1,0,0,0,1,1,0,0,1,0,1,0,0,
    0,0,0,1,0,0,1,0,0,1,0,0,0,1,0,
    0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,
    0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,
  ].map(v => v ? `rgb(${COLOR_UI_FONT.join(',')})` : null);
  k.loadSprite("speaker", makeSpritesheetDataURL([speakerOnPixels, speakerOffPixels], 15, 10, 2), { sliceX: 2 });
  k.loadSprite("bg", "/stars-a.png");

  // ─── AUDIO ───

  const AudioContextCtor: typeof AudioContext = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
  const audioCtx = new AudioContextCtor();

  const LS_SOUND_KEY = "beige-FORCE-sound";
  let soundEnabled = localStorage.getItem(LS_SOUND_KEY) === "1";

  // ─── VISIBILITY ───
  const onVisibilityChange = () => {
    if (document.hidden) audioCtx.suspend();
    else audioCtx.resume();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  // ─── PERSISTENCE ───

  const LS_HI_KEY = "beige-FORCE-hi";
  const persistedHiScore = parseInt(localStorage.getItem(LS_HI_KEY) ?? "0", 10) || 0;

  // ─── SCENES ───

  function drawBgCover() {
    const spr = k.getSprite("bg");
    if (!spr?.data) return;
    const { width: iw, height: ih } = spr.data.tex;
    const s = Math.max(k.width() / iw, k.height() / ih);
    const w = iw * s, h = ih * s;
    k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(...COLOR_CANVAS_BG) });
    k.drawSprite({ sprite: "bg", pos: k.vec2((k.width() - w) / 2, (k.height() - h) / 2), width: w, height: h, opacity: 0.16 });
  }

  k.scene("title", () => {
    window.dispatchEvent(new CustomEvent('scene-change', { detail: 'title' }));
    const W = k.width();
    const H = k.height();
    k.add([{ draw() {
      drawBgCover();
    } }, k.fixed(), k.z(-10)]);

    for (let y = 0; y < H; y += 4 * r) {
      k.add([
        k.rect(W, 1),
        k.color(...COLOR_ACCENT),
        k.opacity(0.03),
        k.pos(0, y),
        k.fixed(),
        k.z(-9),
      ]);
    }

    k.add([k.sprite("bf-logo"), k.pos(W / 2, H * 0.26), k.anchor("center"), k.scale((W * 0.37) / 1397)]);

    const scoreTable = [
      { sprite: `ufo_${ACTIVE_THEME}`,  label: "= ?",         color: COLOR_UFO   },
      { sprite: `row1_${ACTIVE_THEME}`, decorSprite: `row1Decor_${ACTIVE_THEME}`, label: "= 50 POINTS",  color: COLOR_ENEMY_ROWS[0] },
      { sprite: `row2_${ACTIVE_THEME}`, decorSprite: `row2Decor_${ACTIVE_THEME}`, label: "= 35 POINTS",  color: COLOR_ENEMY_ROWS[1] },
      { sprite: `row3_${ACTIVE_THEME}`, decorSprite: `row3Decor_${ACTIVE_THEME}`, label: "= 25 POINTS",  color: COLOR_ENEMY_ROWS[2] },
      { sprite: `row4_${ACTIVE_THEME}`, decorSprite: `row4Decor_${ACTIVE_THEME}`, label: "= 20 POINTS",  color: COLOR_ENEMY_ROWS[3] },
      { sprite: `row5_${ACTIVE_THEME}`, decorSprite: `row5Decor_${ACTIVE_THEME}`, label: "= 10 POINTS",  color: COLOR_ENEMY_ROWS[4] },
    ];

    scoreTable.forEach((row, i) => {
      const iconStartY = 0.45;
      const iconX = W / 2 - 90 * r;
      const iconY = H * iconStartY + i * 40 * r;
      const iconScale = 0.7;
      if (row.decorSprite) {
        k.add([
          k.sprite(row.decorSprite),
          k.pos(iconX - ENEMY_DECOR_ANCHOR_DX * iconScale, iconY - ENEMY_DECOR_ANCHOR_DY * iconScale),
          k.scale(iconScale),
          k.anchor("center"),
        ]);
      }
      k.add([k.sprite(row.sprite), k.pos(iconX, iconY), k.scale(iconScale), k.anchor("center")]);
      k.add([
        k.text(row.label, { size: 12 * r, font }),
        k.color(...row.color),
        k.pos(W / 2 - 55 * r, H * iconStartY + i * 40 * r),
        k.anchor("left"),
      ]);
    });

    const blink = k.add([
      k.text("< PRESS SPACE TO PLAY >", { size: 12 * r, font }),
      k.color(...COLOR_WHITE),
      k.opacity(1),
      k.pos(W / 2, H * 0.77),
      k.anchor("center"),
    ]);

    let blinkTimer = 0;
    k.onUpdate(() => {
      blinkTimer += k.dt();
      blink.opacity = Math.sin(blinkTimer * 4) > 0 ? 1 : 0;
    });

    let soundsPrewarmed = false;
    const prewarmSounds = () => {
      if (soundsPrewarmed) return;
      soundsPrewarmed = true;
      if (audioCtx.state === "suspended") audioCtx.resume();
      const names = [
        ...Array.from({ length: 6 }, (_, i) => `shoot${i + 1}`),
        "pop", "fart", "levelup", "explosion1", "explosion2", "explosion3", "explosion4",
        "beep1", "beep2", "beep3", "beep4",
      ];
      for (const name of names) k.play(name, { volume: 0 });
    };

    const handleTitleAction = () => {
      prewarmSounds();
      if (k.get("dialogBtn").length > 0) return;
      if (localStorage.getItem(LS_SOUND_KEY) !== null) {
        k.go("game", { hiScore: persistedHiScore });
        return;
      }
      const W = k.width(), H = k.height();
      const DW = 480 * r, DH = 160 * r;
      const dx = W / 2 - DW / 2, dy = H / 2 - DH / 2;
      const BTN_W = 140 * r, BTN_H = 40 * r;

      const overlay = k.add([k.rect(W, H), k.color(...DIALOG_BG), k.opacity(0.7), k.pos(0, 0), k.fixed(), k.z(50)]);
      const box = k.add([k.rect(DW, DH), k.color(...DIALOG_BG), k.outline(2, k.rgb(...DIALOG_FG)), k.pos(dx, dy), k.fixed(), k.z(51)]);
      k.add([k.text(DIALOG_QUESTION, { size: 11 * r, font }), k.color(...DIALOG_FG), k.pos(W / 2, dy + 44 * r), k.anchor("center"), k.fixed(), k.z(52)]);

      const startGame = (withSound: boolean) => {
        soundEnabled = withSound;
        localStorage.setItem(LS_SOUND_KEY, withSound ? "1" : "0");
        [overlay, box].forEach(o => o.destroy());
        k.get("dialogBtn").forEach((o: GameObj) => o.destroy());
        k.get("dialogLabel").forEach((o: GameObj) => o.destroy());
        enterHandler.cancel();
        k.go("game", { hiScore: persistedHiScore });
      };

      const makeBtn = (label: string, bg: [number,number,number], fg: [number,number,number], bx: number, withSound: boolean, focused = false) => {
        const btn = k.add([k.rect(BTN_W, BTN_H), k.color(...bg), k.outline(focused ? 2 : 0, k.rgb(...COLOR_WHITE)), k.pos(bx, dy + 96 * r), k.fixed(), k.z(52), k.area(), "dialogBtn"]);
        k.add([k.text(label, { size: 11 * r, font }), k.color(...fg), k.pos(bx + BTN_W / 2, dy + 96 * r + BTN_H / 2), k.anchor("center"), k.fixed(), k.z(53), "dialogLabel"]);
        btn.onHover(() => { canvas.style.cursor = "pointer"; });
        btn.onHoverEnd(() => { canvas.style.cursor = "default"; });
        btn.onClick(() => startGame(withSound));
        return { trigger: () => startGame(withSound) };
      };

      makeBtn("NO",  DIALOG_BTN_NO_BG,  DIALOG_BTN_NO_FG,  dx + 60 * r,          false);
      const yesBtn = makeBtn("YES", DIALOG_BTN_YES_BG, DIALOG_BTN_YES_FG, dx + DW - 60 * r - BTN_W, true, true);
      const enterHandler = k.onKeyPress("enter", () => yesBtn.trigger());
    };
    k.onKeyPress("space", handleTitleAction);
    k.onMousePress(handleTitleAction);

  });

  k.scene("game", (data: Record<string, number> = {}) => {
    window.dispatchEvent(new CustomEvent('scene-change', { detail: 'game' }));
    const GAME_W = k.width();
    const GAME_H = k.height();
    const {
      UI_Y_TOP, UI_Y_BOT, ENEMY_COLS, START_X, START_Y, SHIELD_ORIGIN_Y,
      ENEMY_W, ENEMY_H, GUTTER,
      SHIELD_BLOCK_W, SHIELD_BLOCK_H, SHIELD_CENTER_X, SHIELD_SHADOW_OFFSET,
      LIVES_ICON_SPACING, PLAYER_SPEED, PLAYER_BULLET_SPEED, UFO_SPEED,
    } = getLayout(GAME_W, GAME_H);

    let score = data.score || 0;
    let lives = data.lives !== undefined ? data.lives : 3;
    const level = data.level || 1;
    let hiScore = data.hiScore || 0;

    // Debounced hi-score persist — avoids synchronous localStorage write on every kill.
    let hiScoreSavePending = false;
    const scheduleHiScoreSave = () => {
      if (hiScoreSavePending) return;
      hiScoreSavePending = true;
      k.wait(0, () => {
        localStorage.setItem(LS_HI_KEY, String(hiScore));
        hiScoreSavePending = false;
      });
    };

    const enemies: GameObj[] = [];
    const shields: GameObj[] = [];
    let ufoObj: GameObj | null = null;
    let ufoSound: { stop: () => void } | null = null;
    const startUfoSound = () => {
      ufoSound?.stop();
      if (!ufoAudioBuf) return;
      if (audioCtx.state === "suspended") audioCtx.resume();
      const src = audioCtx.createBufferSource();
      src.buffer = ufoAudioBuf;
      src.loop = true;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.2;
      src.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
      ufoSound = { stop: () => { src.stop(); src.disconnect(); } };
    };
    let playerObj: GameObj | null = null;
    let canShoot = true;
    let enemyDir = 1;
    let enemyMoveTimer = 0;
    const enemyMoveInterval = Math.max(0.08, 0.5 * Math.pow(1 - ENEMY_SPEED_INCREASE_PER_LEVEL, level - 1));
    let enemyFrame = 0;
    let ufoTimer = 0;
    let ufoInterval = k.rand(10, 20);
    let gameOver = false;
    let playerDead = false;
    let playerDeadTimer = 0;
    let stepSound = 0;

    const TOTAL_ENEMIES = ENEMY_COLS * ENEMY_ROWS;
    let alienCount = TOTAL_ENEMIES;
    let aliveEnemies: GameObj[] = [];
    const aliensBulletChance = 0.003 + (level - 1) * 0.001;
    let speedFactor = enemyMoveInterval; // recalculated on each enemy death

    k.add([{ draw() {
      drawBgCover();
    } }, k.fixed(), k.z(-10)]);

    if (HAS_SHADOW) k.add([
      k.text("BEIGE FORCE", { size: UI_FONT_SIZE * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(GAME_W / 2 - 2 * r, UI_Y_TOP + 2 * r),
      k.anchor("center"),
    ]);
    k.add([
      k.text("BEIGE FORCE", { size: UI_FONT_SIZE * r, font }),
      k.color(COLOR_UI_FONT),
      k.pos(GAME_W / 2 - 2, UI_Y_TOP),
      k.anchor("center"),
    ]);

    // Sound toggle icon
    const soundIconObj = k.add([
      ...(HAS_SHADOW ? [{ draw() { k.drawSprite({ sprite: "speaker", frame: soundIconObj.frame, anchor: "center", pos: k.vec2(-2 * r, 2 * r), color: shadowRgb(), opacity: SHADOW_A }); } }] : []),
      k.color([255, 255, 255] as RGB),
      k.sprite("speaker", { frame: soundEnabled ? 0 : 1 }),
      k.pos(GAME_W / 2, GAME_H - GUTTER - 10),
      k.anchor("center"),
      k.fixed(),
      k.z(10),
      k.area({ offset: k.vec2(0, 12), scale: k.vec2(2, 3) }),
    ]);
    soundIconObj.onHover(() => { canvas.style.cursor = "pointer"; });
    soundIconObj.onHoverEnd(() => { canvas.style.cursor = "default"; });
    soundIconObj.onClick(() => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(LS_SOUND_KEY, soundEnabled ? "1" : "0");
      const snd = soundIconObj as unknown as { frame: number; opacity: number };
      snd.frame = soundEnabled ? 0 : 1;
      if (!soundEnabled) { ufoSound?.stop(); ufoSound = null; }
      else if (ufoObj) startUfoSound();
    });

    const scoreShadow = HAS_SHADOW ? k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(GUTTER, UI_Y_TOP + 2),
      k.anchor("left"),
      k.fixed(),
      k.z(9),
    ]) : null;
    const scoreTxt = k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE * r, font }),
      fgColor(),
      k.pos(GUTTER, UI_Y_TOP),
      k.anchor("left"),
      k.fixed(),
      k.z(10),
    ]);
    const hiShadow = HAS_SHADOW ? k.add([
      k.text(`HI-SCORE ${Math.max(hiScore, score)}`, { size: UI_FONT_SIZE * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(GAME_W - GUTTER + 2 * r, UI_Y_TOP + 2 * r),
      k.anchor("right"),
      k.fixed(),
      k.z(9),
    ]) : null;
    const hiTxt = k.add([
      k.text(`HI-SCORE ${Math.max(hiScore, score)}`, {
        size: UI_FONT_SIZE * r,
        font,
      }),
      fgColor(),
      k.pos(GAME_W - GUTTER, UI_Y_TOP),
      k.anchor("right"),
      k.fixed(),
      k.z(10),
    ]);

    k.add([
      k.text(`LEVEL ${level}`, { size: UI_FONT_SIZE * r, font }),
      fgColor(),
      k.pos(GAME_W - GUTTER, UI_Y_BOT),
      k.anchor("right"),
      k.fixed(),
      k.z(10),
    ]);
    if (HAS_SHADOW) k.add([
      k.text(`LEVEL ${level}`, { size: UI_FONT_SIZE * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(GAME_W - GUTTER / 2 - 2 * r, UI_Y_BOT + 2 * r),
      k.anchor("right"),
      k.fixed(),
      k.z(9),
    ]);

    function renderLives() {
      k.get("lifeIcon").forEach((o: ReturnType<typeof k.add>) => o.destroy());
      for (let i = 0; i < lives; i++) {
        k.add([
          ...(HAS_SHADOW ? [{ draw() { k.drawText({ text: "A", font, size: 24 * r, pos: k.vec2(-2 * r, 2 * r), color: shadowRgb(), opacity: SHADOW_A }); } }] : []),
          k.color(...COLOR_LIVES),
          k.text("A", { font, size: 24 * r }),
          k.pos(GUTTER + i * LIVES_ICON_SPACING, GAME_H - UI_Y_TOP - 18 * r),
          k.fixed(),
          k.z(10),
          "lifeIcon",
        ]);
      }
    }
    renderLives();

    const rowConfig = [
      { sprite: `row1_${ACTIVE_THEME}`, decorSprite: `row1Decor_${ACTIVE_THEME}`, pts: 50 },
      { sprite: `row2_${ACTIVE_THEME}`, decorSprite: `row2Decor_${ACTIVE_THEME}`, pts: 35 },
      { sprite: `row3_${ACTIVE_THEME}`, decorSprite: `row3Decor_${ACTIVE_THEME}`, pts: 25 },
      { sprite: `row4_${ACTIVE_THEME}`, decorSprite: `row4Decor_${ACTIVE_THEME}`, pts: 20 },
      { sprite: `row5_${ACTIVE_THEME}`, decorSprite: `row5Decor_${ACTIVE_THEME}`, pts: 10 },
    ];

    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        const cfg = rowConfig[row];
        const e = k.add([
          {
            draw(this: { frame: number }) {
              k.drawSprite({
                sprite: cfg.decorSprite,
                frame: this.frame ?? 0,
                pos: k.vec2(-ENEMY_DECOR_OFFSET_X * r, -ENEMY_DECOR_OFFSET_Y * r),
              });
            },
          },
          k.sprite(cfg.sprite),
          k.pos(START_X + col * ENEMY_W, START_Y + row * ENEMY_H + (level - 1) * 10 * r),
          k.area(),
          "enemy",
          { row, col, pts: cfg.pts, alive: true },
        ]);
        enemies.push(e);
      }
    }
    aliveEnemies = [...enemies];

    const shieldPositions = Array.from({ length: NUM_SHIELDS }, (_, i) =>
      Math.round(GUTTER + (i + 0.5) * (GAME_W - GUTTER * 2) / NUM_SHIELDS)
    );
    shieldPositions.forEach(sx => {
      const shadowCoords = SHIELD_SHAPE.map(([bx, by]: [number, number]) => ({
        x: SHIELD_SHADOW_OFFSET.x + bx * SHIELD_BLOCK_W,
        y: SHIELD_SHADOW_OFFSET.y + by * SHIELD_BLOCK_H,
      }));
      const alive = SHIELD_SHAPE.map(() => true);
      k.add([
        k.pos(sx - SHIELD_CENTER_X, SHIELD_ORIGIN_Y),
        k.z(3),
        {
          draw() {
            for (let i = 0; i < shadowCoords.length; i++) {
              if (!alive[i]) continue;
              k.drawRect({
                pos: k.vec2(shadowCoords[i].x, shadowCoords[i].y),
                width: SHIELD_BLOCK_W,
                height: SHIELD_BLOCK_H,
                color: shadowRgb(), opacity: SHADOW_A,
              });
            }
          },
        },
      ]);
      SHIELD_SHAPE.forEach(([bx, by]: [number, number], idx: number) => {
        const s = k.add([
          k.rect(SHIELD_BLOCK_W, SHIELD_BLOCK_H),
          k.color(...COLOR_SHIELD),
          k.pos(sx - SHIELD_CENTER_X + bx * SHIELD_BLOCK_W, SHIELD_ORIGIN_Y + by * SHIELD_BLOCK_H),
          k.area(),
          k.z(4),
          "shield",
        ]);
        s.onDestroy(() => { alive[idx] = false; });
        shields.push(s);
      });
    });

    function spawnPlayer() {
      playerObj = k.add([
        { draw() {
          k.drawText({ text: "A", font, size: 48 * r, anchor: "center", pos: k.vec2(-5 * r, 5 * r), color: shadowRgb(), opacity: SHADOW_A });
          for (const [dx, dy] of [[-2,-2],[0,-2],[2,-2],[-2,0],[2,0],[-2,2],[0,2],[2,2]] as [number,number][]) {
            k.drawText({ text: "A", font, size: 48 * r, anchor: "center", pos: k.vec2(dx * r, dy * r), color: shadowRgb(), opacity: SHADOW_A });
          }
        } },
        k.color(...COLOR_PLAYER),
        k.text("A", { font, size: 48 * r }),
        k.pos(GAME_W / 2, GAME_H - 124 * r),
        k.anchor("center"),
        k.area(),
        "player",
      ]);
    }
    spawnPlayer();

    // ─── SPLAT ───

    type RelPixel = { dx: number; dy: number; color: [number, number, number]; opacity: number };



    function genSplatUpRelPixels(): RelPixel[] {
      const P = 5 * r;
      const scale = (0.4 + Math.random() * 1.5) * 0.6;
      const INNER_R = Math.round(16 * scale * r);
      const OUTER_R = Math.round(36 * scale * r);
      const DROP_R  = Math.round(220 * scale * r);
      const palette = [...SPLAT_COLORS].sort(() => Math.random() - 0.5).slice(0, NUM_COLORS_IN_SPLAT);
      const SLICES = 24;
      const edgeR = Array.from({ length: SLICES }, (_, i) => {
        const t = INNER_R + Math.random() * (OUTER_R - INNER_R);
        return i < 12 ? t * (1.8 + Math.random() * 0.7) : t * (0.3 + Math.random() * 0.25);
      });
      const gridR = Math.ceil(OUTER_R * 2 / P);
      const patchPalette = Array.from({ length: 12 }, () => palette[Math.floor(Math.random() * palette.length)]);
      const pixels: RelPixel[] = [];
      for (let gy = -gridR; gy <= gridR; gy++) {
        for (let gx = -gridR; gx <= gridR; gx++) {
          const dx = gx * P, dy = gy * P;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const slice = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * SLICES) % SLICES;
          const localR = edgeR[slice];
          if (dist > localR) continue;
          const fillChance = dist <= INNER_R ? 0.96 : 0.96 - 0.88 * ((dist - INNER_R) / (localR - INNER_R + 1));
          if (Math.random() > fillChance) continue;
          const patchX = Math.floor((gx + gridR) / 3);
          const patchY = Math.floor((gy + gridR) / 3);
          const opacity = 1 - 0.25 * (dist / localR);
          pixels.push({ dx, dy, color: patchPalette[(patchX * 7 + patchY * 13) % patchPalette.length], opacity });
        }
      }
      const NUM_DROPS = 22 + Math.floor(Math.random() * 10);
      for (let i = 0; i < NUM_DROPS; i++) {
        const t = i / NUM_DROPS;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (0.6 + t * 0.6);
        const dist = OUTER_R + Math.random() * (DROP_R - OUTER_R);
        const ddx = Math.round((Math.cos(angle) * dist) / P) * P;
        const ddy = Math.round((Math.sin(angle) * dist) / P) * P;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const dropOpacity = 1 - 0.25 * (dist / DROP_R);
        const dropSize = 1 + Math.floor(Math.random() * 5);
        for (let s = 0; s < dropSize; s++)
          pixels.push({ dx: ddx + (s % 2) * P, dy: ddy - Math.floor(s / 2) * P, color, opacity: dropOpacity });
      }
      return pixels;
    }

    function genUfoSplatRelPixels(): RelPixel[] {
      const P = 5 * r;
      const scale = 1 + Math.random() * 0.5;
      const INNER_R = Math.round(20 * scale * r);
      const OUTER_R = Math.round(45 * scale * r);
      const DROP_R  = Math.round(325 * scale * r);
      const palette = [...SPLAT_COLORS].sort(() => Math.random() - 0.5).slice(0, NUM_COLORS_IN_SPLAT);
      const SLICES = 24;
      const edgeR = Array.from({ length: SLICES }, (_, i) => {
        const t = INNER_R + Math.random() * (OUTER_R - INNER_R);
        return i >= 12 ? t * (1.8 + Math.random() * 0.7) : t * (0.3 + Math.random() * 0.25);
      });
      const gridR = Math.ceil(OUTER_R * 2 / P);
      const patchPalette = Array.from({ length: 12 }, () => palette[Math.floor(Math.random() * palette.length)]);
      const pixels: RelPixel[] = [];
      for (let gy = -gridR; gy <= gridR; gy++) {
        for (let gx = -gridR; gx <= gridR; gx++) {
          const dx = gx * P, dy = gy * P;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const slice = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * SLICES) % SLICES;
          const localR = edgeR[slice];
          if (dist > localR) continue;
          const fillChance = dist <= INNER_R ? 0.96 : 0.96 - 0.88 * ((dist - INNER_R) / (localR - INNER_R + 1));
          if (Math.random() > fillChance) continue;
          const patchX = Math.floor((gx + gridR) / 3);
          const patchY = Math.floor((gy + gridR) / 3);
          const opacity = 1 - 0.25 * (dist / localR);
          pixels.push({ dx, dy, color: patchPalette[(patchX * 7 + patchY * 13) % patchPalette.length], opacity });
        }
      }
      const NUM_DROPS = 14 + Math.floor(Math.random() * 8);
      for (let i = 0; i < NUM_DROPS; i++) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.35;
        const dist = OUTER_R + Math.random() * (DROP_R - OUTER_R);
        const ddx = Math.round((Math.cos(angle) * dist) / P) * P;
        const ddy = Math.round((Math.sin(angle) * dist) / P) * P;
        const dropColor = palette[Math.floor(Math.random() * palette.length)];
        const dropOpacity = 1 - 0.25 * (dist / DROP_R);
        const dropSize = 1 + Math.floor(Math.random() * 5);
        for (let s = 0; s < dropSize; s++)
          pixels.push({ dx: ddx + (s % 2) * P, dy: ddy + Math.floor(s / 2) * P, color: dropColor, opacity: dropOpacity });
      }
      return pixels;
    }

    // Pre-generate 8 pixel layouts at scene init.
    const splatUpPool: RelPixel[][] = Array.from({ length: 8 }, () => genSplatUpRelPixels());
    const ufoSplatPool: RelPixel[][] = Array.from({ length: 8 }, () => genUfoSplatRelPixels());

    const DRAW_SIZE = 4.5 * r;
    const EXPANSION = 0.45;

    let splatId = 0;

    function spawnBakedSplat(relPixels: RelPixel[], cx: number, cy: number, withFade: boolean, onReady: () => void) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const px of relPixels) {
        const fx = px.dx * (1 + EXPANSION), fy = px.dy * (1 + EXPANSION);
        if (fx < minX) minX = fx;
        if (fy < minY) minY = fy;
        if (fx + DRAW_SIZE > maxX) maxX = fx + DRAW_SIZE;
        if (fy + DRAW_SIZE > maxY) maxY = fy + DRAW_SIZE;
      }
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.ceil(maxX - minX) || 1;
      offscreen.height = Math.ceil(maxY - minY) || 1;
      const ctx2d = offscreen.getContext('2d')!;
      ctx2d.imageSmoothingEnabled = false;
      for (const px of relPixels) {
        const fx = px.dx * (1 + EXPANSION), fy = px.dy * (1 + EXPANSION);
        ctx2d.globalAlpha = px.opacity;
        ctx2d.fillStyle = `rgb(${px.color[0]},${px.color[1]},${px.color[2]})`;
        ctx2d.fillRect(Math.round(fx - minX), Math.round(fy - minY), DRAW_SIZE, DRAW_SIZE);
      }
      const name = `sb${splatId++}`;
      k.loadSprite(name, offscreen.toDataURL()).onLoad(() => {
        const baked = k.add([k.sprite(name), k.pos(cx + minX, cy + minY), k.opacity(1), k.z(-1)]);
        onReady();
        if (withFade) {
          const timer = k.loop(1, () => {
            baked.opacity -= 0.05;
            if (baked.opacity <= 0) { baked.destroy(); timer.cancel(); }
          });
        }
      });
    }

    function paintSplatUp(pos: ReturnType<typeof k.vec2>) {
      const relPixels = splatUpPool[Math.floor(Math.random() * splatUpPool.length)];
      spawnBakedSplat(relPixels, Math.round(pos.x), Math.round(pos.y), true, () => {});
    }

    function paintUfoSplat(pos: ReturnType<typeof k.vec2>) {
      const relPixels = ufoSplatPool[Math.floor(Math.random() * ufoSplatPool.length)];
      spawnBakedSplat(relPixels, Math.round(pos.x), Math.round(pos.y), false, () => {});
    }

    function explode(pos: ReturnType<typeof k.vec2>) {
      const exp = k.add([
        k.sprite("explosion"),
        k.pos(pos),
        k.anchor("center"),
        k.opacity(1),
        k.z(8),
      ]);
      k.wait(0.4, () => exp.destroy());
    }

    const doShoot = () => {
      if (gameOver || playerDead || !canShoot) return;
      if (k.get("bullet").length > 5) return;
      canShoot = false;
      k.add([
        k.rect(4 * r, 16 * r),
        k.color(...COLOR_PLAYER_BULLET),
        k.pos(playerObj!.pos.x - 2 * r, playerObj!.pos.y - 29 * r),
        k.area(),
        k.move(k.UP, PLAYER_BULLET_SPEED),
        k.z(6),
        "bullet",
      ]);
      if (soundEnabled) k.play(`shoot${Math.ceil(Math.random() * 6)}`, { volume: 0.2 });
      if (playerObj) {
        playerObj.color = k.rgb(...COLOR_PLAYER_ACTIVE);
        k.wait(0.08, () => { if (playerObj) playerObj.color = k.rgb(...COLOR_PLAYER); });
      }
      k.wait(0.15, () => { canShoot = true; });
    };
    k.onKeyPress("space", doShoot);

    k.onKeyDown("left", () => {
      if (gameOver || playerDead) return;
      const p = playerObj as unknown as { pos: { x: number } };
      p.pos.x = Math.max(GUTTER, p.pos.x - PLAYER_SPEED * k.dt());
    });
    k.onKeyDown("right", () => {
      if (gameOver || playerDead) return;
      const p = playerObj as unknown as { pos: { x: number } };
      p.pos.x = Math.min(GAME_W - GUTTER, p.pos.x + PLAYER_SPEED * k.dt());
    });

    k.onUpdate(() => {
      if (gameOver) return;

      if (playerDead) {
        playerDeadTimer -= k.dt();
        if (playerDeadTimer <= 0) {
          if (lives <= 0) {
            localStorage.setItem(LS_HI_KEY, String(Math.max(hiScore, score)));
            ufoSound?.stop(); ufoSound = null;
            k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
          } else {
            playerDead = false;
            spawnPlayer();
          }
        }
        return;
      }

      enemyMoveTimer += k.dt();

      if (alienCount === 0) {
        ufoSound?.stop(); ufoSound = null;
        if (soundEnabled) {
          const snd = k.play("levelup", { volume: 0.7 });
          setTimeout(() => {
            const steps = 20, dur = 600;
            let step = 0;
            const id = setInterval(() => {
              step++;
              snd.volume = 0.7 * (1 - step / steps);
              if (step >= steps) { snd.stop(); clearInterval(id); }
            }, dur / steps);
          }, 3000);
        }
        window.dispatchEvent(new CustomEvent('level-complete'));
        setActiveTheme(level + 1 >= 4 ? 'neoon' : 'beige');
        k.go("game", { score, lives, level: level + 1, hiScore: Math.max(hiScore, score) });
        return;
      }

      if (enemyMoveTimer >= speedFactor) {
        enemyMoveTimer = 0;
        enemyFrame = (enemyFrame + 1) % 2;
        if (soundEnabled) k.play(`beep${(stepSound % 4) + 1}`, { volume: 0.08 });
        stepSound++;

        type EnemyE = { frame: number; pos: { x: number; y: number }; row: number };
        const te = aliveEnemies as unknown as EnemyE[];
        let hitWall = false;
        for (const e of te) {
          e.frame = e.row % 2 === 0 ? enemyFrame : (enemyFrame + 1) % 2;
          if (e.pos.x + enemyDir * 12 * r < GUTTER || e.pos.x + enemyDir * 12 * r > GAME_W - ENEMY_W - GUTTER) hitWall = true;
        }
        if (hitWall) {
          enemyDir *= -1;
          for (const e of te) {
            e.pos.y += 10 * r;
            if (e.pos.y > GAME_H - 90 * r) {
              gameOver = true;
              localStorage.setItem(LS_HI_KEY, String(Math.max(hiScore, score)));
              ufoSound?.stop(); ufoSound = null;
              k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
            }
          }
        } else {
          for (const e of te) e.pos.x += enemyDir * 12 * r;
        }
      }

      if (aliveEnemies.length > 0 && Math.random() < aliensBulletChance) {
        type ShooterE = { col: number; pos: { x: number; y: number } };
        const se = aliveEnemies as unknown as ShooterE[];
        const cols = [...new Set(se.map(e => e.col))];
        const col = cols[Math.floor(Math.random() * cols.length)];
        const shooter = se
          .filter(e => e.col === col)
          .reduce((a, b) => (a.pos.y > b.pos.y ? a : b));
        k.add([
          k.rect(4 * r, 16 * r),
          k.color(...COLOR_ENEMY_BULLET),
          k.pos(shooter.pos.x + 22 * r, shooter.pos.y + 32 * r),
          k.anchor("center"),
          k.area(),
          k.move(k.DOWN, (200 + level * 20) * r),
          k.z(6),
          "enemyBullet",
        ]);
      }

      ufoTimer += k.dt();
      if (ufoTimer >= ufoInterval && !ufoObj) {
        ufoTimer = 0;
        ufoInterval = k.rand(15, 25);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const startX = dir === 1 ? -40 * r : GAME_W + 40 * r;
        ufoObj = k.add([
          ...(HAS_SHADOW ? [{ draw() { k.drawSprite({ sprite: `ufo_${ACTIVE_THEME}`, anchor: "center", pos: k.vec2(-2, 2), color: shadowRgb(), opacity: SHADOW_A }); } }] : []),
          k.sprite(`ufo_${ACTIVE_THEME}`),
          k.pos(startX, UI_Y_TOP * 2),
          k.anchor("center"),
          k.area(),
          k.move(dir === 1 ? k.RIGHT : k.LEFT, UFO_SPEED),
          k.z(6),
          "ufo",
        ]);
        if (soundEnabled) startUfoSound();
      }
      if (ufoObj) {
        if (ufoObj.pos.x < -60 * r || ufoObj.pos.x > GAME_W + 60 * r) {
          ufoObj.destroy();
          ufoObj = null;
          ufoSound?.stop(); ufoSound = null;
        }
      }
    });

    k.onCollide("bullet", "enemy", (bullet: GameObj, enemy: GameObj) => {
      const e = enemy as GameObj & { alive: boolean; pts: number };
      if (!e.alive) return;
      bullet.destroy();
      e.alive = false;
      const idx = aliveEnemies.indexOf(enemy);
      if (idx !== -1) aliveEnemies.splice(idx, 1);
      alienCount = aliveEnemies.length;
      speedFactor = Math.max(0.04, enemyMoveInterval * (alienCount / TOTAL_ENEMIES));
      score += e.pts;
      hiScore = Math.max(hiScore, score);
      scheduleHiScoreSave();
      scoreTxt.text = `SCORE ${score}`;
      if (scoreShadow) scoreShadow.text = scoreTxt.text;
      hiTxt.text = `HI-SCORE ${hiScore}`;
      if (hiShadow) hiShadow.text = hiTxt.text;
      if (soundEnabled) k.play(`explosion${Math.ceil(Math.random() * 4)}`, { volume: 0.22 });
      paintSplatUp(k.vec2(enemy.pos.x + 18 * r, enemy.pos.y + 20 * r));
      enemy.destroy();
      canShoot = true;
    });

    k.onCollide("bullet", "ufo", (bullet: GameObj, ufo: GameObj) => {
      bullet.destroy();
      const pts = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
      score += pts;
      hiScore = Math.max(hiScore, score);
      scheduleHiScoreSave();
      scoreTxt.text = `SCORE ${score}`;
      if (scoreShadow) scoreShadow.text = scoreTxt.text;
      hiTxt.text = `HI-SCORE ${hiScore}`;
      if (hiShadow) hiShadow.text = hiTxt.text;
      if (soundEnabled) k.play("fart", { volume: 0.5 });
      paintUfoSplat(k.vec2(ufo.pos.x, ufo.pos.y));
      const floatTxt = k.add([
        k.text(`+${pts}`, { size: 11 * r, font }),
        k.color(...COLOR_UI_FONT),
        k.pos(ufo.pos.x, ufo.pos.y),
        k.anchor("center"),
        k.z(9),
      ]);
      k.wait(1, () => floatTxt.destroy());
      ufo.destroy();
      ufoObj = null;
      ufoSound?.stop(); ufoSound = null;
      canShoot = true;
    });

    k.onCollide("bullet", "shield", (bullet: GameObj, shield: GameObj) => {
      const b = bullet as GameObj & { _hit?: boolean };
      if (b._hit) return;
      b._hit = true;
      shield.destroy();
      bullet.destroy();
      canShoot = true;
    });
    k.on("update", "bullet", (b: GameObj) => {
      if (b.pos.y < 0) {
        b.destroy();
        canShoot = true;
      }
    });

    k.onCollide("enemyBullet", "shield", (eb: GameObj, shield: GameObj) => {
      eb.destroy();
      shield.destroy();
    });

    k.onCollide("enemyBullet", "player", (eb: GameObj, player: GameObj) => {
      if (playerDead) return;
      eb.destroy();
      player.destroy();
      lives--;
      renderLives();
      playerDead = true;
      playerDeadTimer = 1.5;
      if (soundEnabled) k.play("pop", { volume: 0.8 });
      explode(k.vec2(playerObj!.pos.x, playerObj!.pos.y));
    });

    k.on("update", "enemyBullet", (eb: GameObj) => {
      if (eb.pos.y > GAME_H) eb.destroy();
    });

    k.onCollide("enemy", "player", (enemy: GameObj, player: GameObj) => {
      if (playerDead) return;
      lives = 0;
      renderLives();
      playerDead = true;
      playerDeadTimer = 1.5;
      if (soundEnabled) k.play("pop", { volume: 0.08 });
      player.destroy();
      k.wait(1.5, () => {
        localStorage.setItem(LS_HI_KEY, String(Math.max(hiScore, score)));
        ufoSound?.stop(); ufoSound = null;
        k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
      });
    });
  });

  k.scene("gameover", (data: Record<string, number> = {}) => {
    window.dispatchEvent(new CustomEvent('scene-change', { detail: 'gameover' }));
    const score = data.score || 0;
    const hiScore = data.hiScore || 0;
    const W = k.width();
    const H = k.height();

    k.add([{ draw() {
      drawBgCover();
    } }, k.fixed(), k.z(-10)]);

    if (HAS_SHADOW) k.add([
      k.text("GAME", { size: 42 * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(W / 2 - 2 * r, H * 0.27 + 2 * r),
      k.anchor("center"),
    ]);
    k.add([
      k.text("GAME", { size: 42 * r, font }),
      k.color(...COLOR_GAMEOVER_HEADING),
      k.pos(W / 2, H * 0.27),
      k.anchor("center"),
    ]);
    if (HAS_SHADOW) k.add([
      k.text("OVER", { size: 42 * r, font }),
      shadowColor(),
      shadowOpacity(),
      k.pos(W / 2 - 2 * r, H * 0.36 + 2 * r),
      k.anchor("center"),
    ]);
    k.add([
      k.text("OVER", { size: 42 * r, font }),
      k.color(...COLOR_GAMEOVER_HEADING),
      k.pos(W / 2, H * 0.36),
      k.anchor("center"),
    ]);

    k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE * r, font }),
      k.color(...COLOR_WHITE),
      k.pos(W / 2, H * 0.46),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`HI-SCORE ${hiScore}`, { size: UI_FONT_SIZE * r, font }),
      k.color(...COLOR_HI_SCORE),
      k.pos(W / 2, H * 0.505),
      k.anchor("center"),
    ]);

    const blink = k.add([
      k.text("PRESS SPACE TO RETRY", { size: 11 * r, font }),
      k.color(...COLOR_ACCENT),
      k.opacity(1),
      k.pos(W / 2, H * 0.6),
      k.anchor("center"),
    ]);

    let blinkTimer = 0;
    k.onUpdate(() => {
      blinkTimer += k.dt();
      blink.opacity = Math.sin(blinkTimer * 4) > 0 ? 1 : 0;
    });

    k.onKeyPress("space", () => k.go("game", { hiScore }));
    k.onMousePress(() => k.go("game", { hiScore }));


    k.add([
      k.text("PRESS T FOR TITLE", { size: 11 * r, font }),
      k.color(...COLOR_DIM),
      k.pos(W / 2, H * 0.644),
      k.anchor("center"),
    ]);
    k.onKeyPress("t", () => k.go("title"));
  });

  const INITIAL_SCENE: "title" | "game" | "gameover" = "title";

  k.go(INITIAL_SCENE);

  return () => { document.removeEventListener("visibilitychange", onVisibilityChange); k.quit(); };
}
