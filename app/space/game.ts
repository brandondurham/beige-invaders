import kaplay, { type GameObj } from "kaplay";

// Consts
import {
  COLOR_ENEMY,
  COLOR_BACKGROUND,
  COLOR_ENEMY_BULLET,
  COLOR_EXPLOSION,
  COLOR_H1,
  COLOR_LIVES,
  COLOR_PLAYER,
  COLOR_PLAYER_ACTIVE,
  COLOR_PLAYER_BULLET,
  COLOR_SHADOW,
  COLOR_SHIELD,
  COLOR_UFO,
  COLOR_UI_FONT,
  NUM_COLORS_IN_SPLAT,
  NUM_SHIELDS,
  SPLAT_COLORS,
  UI_FONT_SIZE,
} from './consts'

export function initGame(canvas: HTMLCanvasElement): () => void {
  const k = kaplay({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    crisp: true,
    background: COLOR_BACKGROUND,
  });

  const fgColor = () => k.color(COLOR_UI_FONT);
  const font = "Kongtext, MonaspaceArgon-Medium, 'Ringside Extra Wide', 'Monaspace Neon', monospace";

  // ─── SPRITE HELPERS ───

  function makeSpriteDataURL(pixels: (string | null)[], w: number, h: number, scale = 4) {
    const c = document.createElement("canvas");
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext("2d")!;
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

  function flipH(pixels: (string | null)[], w: number): (string | null)[] {
    const rows = pixels.length / w;
    const out: (string | null)[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = w - 1; x >= 0; x--)
        out.push(pixels[y * w + x]);
    return out;
  }

  function makeSpritesheetDataURL(pixelFrames: (string | null)[][], w: number, h: number, scale = 4) {
    const numFrames = pixelFrames.length;
    const c = document.createElement("canvas");
    c.width = w * scale * numFrames;
    c.height = h * scale;
    const ctx = c.getContext("2d")!;
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

  // ─── SPRITES ───

  // const playerPixels2 = [
  //   0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,
  //   0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
  //   0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
  //   0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
  //   0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
  //   0,0,0,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
  //   0,0,0,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
  //   0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,
  //   0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,
  //   0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,
  //   0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,
  //   0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,
  //   0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
  //   0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
  //   0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
  //   0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
  //   0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
  //   0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,
  //   1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,
  //   1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,
  //   1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,
  // ].map((v) => (v ? 'rgb(255,255,255)' : null));
  // k.loadSprite("player", makeSpriteDataURL(playerPixels2, 28, 26, 2));

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

  const enemyAF0 = [
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
  ].map((v) => (v ? `rgb(${COLOR_ENEMY.join(',')})` : null) as (string | null));
  const enemyAF1 = [
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,
  ].map((v) => (v ? `rgb(${COLOR_ENEMY.join(',')})` : null));
  k.loadSprite("enemyA", makeSpritesheetDataURL([enemyAF0, enemyAF1], 11, 8, 4), { sliceX: 2 });

  const enemyBF0 = [
    0,0,1,0,0,0,0,0,1,0,0,
    0,0,0,1,0,0,0,1,0,0,0,
    0,0,1,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,1,0,1,1,0,
    1,1,1,1,1,1,1,1,1,1,1,
    1,0,1,1,1,1,1,1,1,0,1,
    1,0,1,0,0,0,0,0,1,0,1,
    0,0,0,1,1,0,1,1,0,0,0,
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  const enemyBF1 = [
    0,0,1,0,0,0,0,0,1,0,0,
    1,0,0,1,0,0,0,1,0,0,1,
    1,0,1,1,1,1,1,1,1,0,1,
    1,1,1,0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,1,1,0,
    0,0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("enemyB", makeSpritesheetDataURL([enemyBF0, enemyBF1], 11, 8, 4), { sliceX: 2 });

  const enemyCF0 = [
    0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,1,1,0,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,0,
    0,0,1,1,1,0,0,1,1,1,0,0,
    0,1,1,0,0,0,0,0,0,1,1,0,
    0,0,1,0,0,0,0,0,0,1,0,0,
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  const enemyCF1 = [
    0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,1,1,0,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,0,
    0,0,0,1,0,0,0,0,1,0,0,0,
    0,0,1,0,1,0,0,1,0,1,0,0,
    0,1,0,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("enemyC", makeSpritesheetDataURL([enemyCF0, enemyCF1], 12, 8, 4), { sliceX: 2 });

  // ─── LETTER SPRITES (B-E-I-G-E) ───

  const row1Pixels = [
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
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("row1", makeSpritesheetDataURL([row1Pixels, flipH(row1Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const row2Pixels = [
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
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("row2", makeSpritesheetDataURL([row2Pixels, flipH(row2Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const row3Pixels = [
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
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("row3", makeSpritesheetDataURL([row3Pixels, flipH(row3Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const row4Pixels = [
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
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("row4", makeSpritesheetDataURL([row4Pixels, flipH(row4Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const row5Pixels = [
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
  ].map(v => v ? `rgb(${COLOR_ENEMY.join(',')})` : null);
  k.loadSprite("row5", makeSpritesheetDataURL([row5Pixels, flipH(row5Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const ufoPixels = [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ].map((v) => (v ? `rgb(${COLOR_UFO.join(',')})` : null));
  k.loadSprite("ufo", makeSpriteDataURL(ufoPixels, 16, 7, 4));
  k.loadSound("pew", "/game/audio/custom/pew-1.mp3");
  k.loadSound("splat", "/game/audio/custom/splat-1.mp3");
  k.loadSound("boom", "/game/audio/custom/boom-1.mp3");
  k.loadSound("beep1", "/game/audio/beep-1.m4a");
  k.loadSound("beep2", "/game/audio/beep-2.m4a");
  k.loadSound("beep3", "/game/audio/beep-3.m4a");
  k.loadSound("beep4", "/game/audio/beep-4.m4a");
  let ufoAudioBuf: AudioBuffer | null = null;
  fetch("/game/audio/custom/ufo-1.mp3")
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

  const explPixels = [
    0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1,
    0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  ].map((v) => (v ? `rgb(${COLOR_EXPLOSION.join(',')})` : null));
  k.loadSprite("explosion", makeSpriteDataURL(explPixels, 8, 8, 4));

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
  k.loadSprite("bg", "/building-gray.jpg");

  // ─── AUDIO ───

  const AudioContextCtor: typeof AudioContext = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
  const audioCtx = new AudioContextCtor();

  const LS_SOUND_KEY = "beige-invaders-sound";
  let soundEnabled = localStorage.getItem(LS_SOUND_KEY) === "1";

  function playBeep(freq = 440, dur = 0.05, type: OscillatorType = "square", vol = 0.15) {
    if (!soundEnabled) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  // ─── PERSISTENCE ───

  const LS_HI_KEY = "beige-invaders-hi";
  const persistedHiScore = parseInt(localStorage.getItem(LS_HI_KEY) ?? "0", 10) || 0;

  // ─── SCENES ───

  k.scene("title", () => {
    const W = k.width();
    const H = k.height();
    k.add([{ draw() {
      const spr = k.getSprite("bg");
      if (!spr?.data) return;
      const sw = spr.data.tex.width;
      const sh = spr.data.tex.height;
      const cw = k.width();
      const ch = k.height();
      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      k.drawSprite({ sprite: "bg", pos: k.vec2((cw - dw) / 2, (ch - dh) / 2), width: dw, height: dh });
    } }, k.fixed(), k.z(-10)]);

    for (let y = 0; y < H; y += 4) {
      k.add([
        k.rect(W, 1),
        k.color(0, 255, 65),
        k.opacity(0.03),
        k.pos(0, y),
        k.fixed(),
        k.z(-9),
      ]);
    }

    k.add([
      k.text("BEIGE", { size: 52, font }),
      k.color(...COLOR_SHADOW),
      k.pos(W / 2 - 2, H * 0.27 + 2),
      k.anchor("center"),
    ]);
    k.add([
      k.text("BEIGE", { size: 52, font }),
      k.color(...COLOR_H1),
      k.pos(W / 2, H * 0.27),
      k.anchor("center"),
    ]);
    k.add([
      k.text("INVADERS", { size: 52, font }),
      k.color(...COLOR_SHADOW),
      k.pos(W / 2 - 2, H * 0.36 + 2),
      k.anchor("center"),
    ]);
    k.add([
      k.text("INVADERS", { size: 52, font }),
      k.color(...COLOR_H1),
      k.pos(W / 2, H * 0.36),
      k.anchor("center"),
    ]);

    const scoreTable = [
      { sprite: "ufo",  label: "= ?",         color: COLOR_UFO   },
      { sprite: "row1", label: "= 50 POINTS",  color: COLOR_ENEMY },
      { sprite: "row2", label: "= 35 POINTS",  color: COLOR_ENEMY   },
      { sprite: "row3", label: "= 25 POINTS",  color: COLOR_ENEMY   },
      { sprite: "row4", label: "= 20 POINTS",  color: COLOR_ENEMY   },
      { sprite: "row5", label: "= 10 POINTS",  color: COLOR_ENEMY   },
    ];

    scoreTable.forEach((row, i) => {
      k.add([k.sprite(row.sprite), k.pos(W / 2 - 90, H * 0.5 + i * 38), k.scale(0.7), k.anchor("center")]);
      k.add([
        k.text(row.label, { size: 14, font }),
        k.color(...COLOR_ENEMY),
        k.pos(W / 2 - 55, H * 0.5 + i * 38),
        k.anchor("left"),
      ]);
    });

    const blink = k.add([
      k.text("< PRESS SPACE TO PLAY >", { size: 14, font }),
      k.color(255, 255, 255),
      k.opacity(1),
      k.pos(W / 2, H * 0.85),
      k.anchor("center"),
    ]);

    let blinkTimer = 0;
    k.onUpdate(() => {
      blinkTimer += k.dt();
      blink.opacity = Math.sin(blinkTimer * 4) > 0 ? 1 : 0;
    });

    k.onKeyPress("space", () => k.go("game", { hiScore: persistedHiScore }));
  });

  k.scene("game", (data: Record<string, number> = {}) => {
    const GAME_W = k.width();
    const GAME_H = k.height();
    const ENEMY_ROWS = 5;
    const ENEMY_W = 60;
    const ENEMY_H = 60;
    const GUTTER = 60;
    const ENEMY_COLS = Math.floor((GAME_W - GUTTER * 4) / ENEMY_W);
    const START_X = Math.floor((GAME_W - ENEMY_COLS * ENEMY_W) / 2);
    const START_Y = GUTTER * 2;

    let score = data.score || 0;
    let lives = data.lives !== undefined ? data.lives : 3;
    const level = data.level || 1;
    let hiScore = data.hiScore || 0;

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
      gain.gain.value = 0.4;
      src.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
      ufoSound = { stop: () => { src.stop(); src.disconnect(); } };
    };
    let playerObj: GameObj | null = null;
    let canShoot = true;
    let enemyDir = 1;
    let enemyMoveTimer = 0;
    let enemyMoveInterval = Math.max(0.08, 0.5 - (level - 1) * 0.05);
    let enemyFrame = 0;
    let ufoTimer = 0;
    let ufoInterval = k.rand(10, 20);
    let gameOver = false;
    let playerDead = false;
    let playerDeadTimer = 0;
    let stepSound = 0;

    let alienCount = ENEMY_COLS * ENEMY_ROWS;
    const aliensBulletChance = 0.003 + (level - 1) * 0.001;

    k.add([{ draw() {
      const spr = k.getSprite("bg");
      if (!spr?.data) return;
      const sw = spr.data.tex.width;
      const sh = spr.data.tex.height;
      const cw = k.width();
      const ch = k.height();
      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      k.drawSprite({ sprite: "bg", pos: k.vec2((cw - dw) / 2, (ch - dh) / 2), width: dw, height: dh });
    } }, k.fixed(), k.z(-10)]);

    // BEIGE shadow.
    k.add([
      k.text("BEIGE INVADERS", { size: UI_FONT_SIZE, font }),
      k.color(...COLOR_SHADOW),
      k.pos(GAME_W / 2 - 2, GUTTER / 2 + 2),
      k.anchor("top"),
    ]);
    k.add([
      k.text("BEIGE INVADERS", { size: UI_FONT_SIZE, font }),
      k.color(COLOR_UI_FONT),
      k.pos(GAME_W / 2, GUTTER / 2),
      k.anchor("top"),
    ]);

    // Sound toggle icon
    const soundIconObj = k.add([
      { draw() { k.drawSprite({ sprite: "speaker", frame: soundIconObj.frame, anchor: "left", pos: k.vec2(-2, 2), color: k.rgb(...COLOR_SHADOW) }); } },
      k.color(...COLOR_PLAYER),
      k.sprite("speaker", { frame: soundEnabled ? 0 : 1 }),
      k.pos(GUTTER / 2, GUTTER / 1.68),
      k.anchor("left"),
      k.fixed(),
      k.z(10),
      k.area(),
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

    const scoreShadow = k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE, font }),
      k.color(...COLOR_SHADOW),
      k.pos(GUTTER + 14, GUTTER / 1.6 + 2),
      k.anchor("left"),
      k.fixed(),
      k.z(9),
    ]);
    const scoreTxt = k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE, font }),
      fgColor(),
      k.pos(GUTTER + 16, GUTTER / 1.6),
      k.anchor("left"),
      k.fixed(),
      k.z(10),
    ]);
    const hiShadow = k.add([
      k.text(`HI SCORE ${Math.max(hiScore, score)}`, { size: UI_FONT_SIZE, font }),
      k.color(...COLOR_SHADOW),
      k.pos(GAME_W - GUTTER / 2 + 2, GUTTER / 1.6 + 2),
      k.anchor("right"),
      k.fixed(),
      k.z(9),
    ]);
    const hiTxt = k.add([
      k.text(`HI SCORE ${Math.max(hiScore, score)}`, {
        size: UI_FONT_SIZE,
        font,
      }),
      fgColor(),
      k.pos(GAME_W - GUTTER / 2, GUTTER / 1.6),
      k.anchor("right"),
      k.fixed(),
      k.z(10),
    ]);

    k.add([
      k.text(`LEVEL ${level}`, { size: UI_FONT_SIZE, font }),
      fgColor(),
      k.pos(GAME_W - GUTTER / 2, GAME_H - GUTTER / 1.6),
      k.anchor("right"),
      k.fixed(),
      k.z(10),
    ]);
    // LEVEL shadow.
    k.add([
      k.text(`LEVEL ${level}`, { size: UI_FONT_SIZE, font }),
      k.color(...COLOR_SHADOW),
      k.pos(GAME_W - GUTTER / 2 - 2, GAME_H - GUTTER / 1.6 + 2),
      k.anchor("right"),
      k.fixed(),
      k.z(9),
    ]);

    function renderLives() {
      k.get("lifeIcon").forEach((o: ReturnType<typeof k.add>) => o.destroy());
      for (let i = 0; i < lives; i++) {
        k.add([
          { draw() { k.drawSprite({ sprite: "player", pos: k.vec2(-2, 2), color: k.rgb(...COLOR_SHADOW) }); } },
          k.color(...COLOR_LIVES),
          k.sprite("player"),
          k.scale(0.5),
          k.pos(GUTTER / 2 + i * 40, GAME_H - (GUTTER * 0.9)),
          k.fixed(),
          k.z(10),
          "lifeIcon",
        ]);
      }
    }
    renderLives();

    const rowConfig = [
      { sprite: "row1", pts: 50 },
      { sprite: "row2", pts: 35 },
      { sprite: "row3", pts: 25 },
      { sprite: "row4", pts: 20 },
      { sprite: "row5", pts: 10 },
    ];

    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        const cfg = rowConfig[row];
        const e = k.add([
          {
            draw(this: { frame: number }) {
              k.drawSprite({
                sprite: cfg.sprite,
                frame: this.frame ?? 0,
                pos: k.vec2(-2, 2),
                color: k.rgb(...COLOR_SHADOW),
              });
            },
          },
          k.sprite(cfg.sprite),
          k.pos(START_X + col * ENEMY_W, START_Y + row * ENEMY_H + (level - 1) * 10),
          k.area(),
          "enemy",
          { row, col, pts: cfg.pts, alive: true },
        ]);
        enemies.push(e);
      }
    }

    const shieldPositions = Array.from({ length: NUM_SHIELDS }, (_, i) =>
      Math.round(GUTTER + (i + 0.5) * (GAME_W - GUTTER * 2) / NUM_SHIELDS)
    );
    const shieldShape: [number, number][] = [
      [2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],
      [1,1],[2,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],
      [0,2],[1,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],
      [0,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],
    ];
    shieldPositions.forEach(sx => {
      const remaining = new Set(shieldShape.map(([bx, by]) => `${bx},${by}`));
      k.add([
        k.pos(sx - 112, GAME_H * 0.88 - 95),
        k.z(3),
        { draw() { for (const key of remaining) { const [bx, by] = key.split(",").map(Number); k.drawRect({ pos: k.vec2(-2 + bx * 16, 2 + by * 12), width: 16, height: 12, color: k.rgb(...COLOR_SHADOW) }); } } },
      ]);
      shieldShape.forEach(([bx, by]) => {
        const s = k.add([
          k.rect(16, 12),
          k.color(...COLOR_SHIELD),
          k.pos(sx - 112 + bx * 16, GAME_H * 0.88 - 95 + by * 12),
          k.area(),
          k.z(4),
          "shield",
        ]);
        s.onDestroy(() => remaining.delete(`${bx},${by}`));
        shields.push(s);
      });
    });

    function spawnPlayer() {
      playerObj = k.add([
        { draw() { k.drawSprite({ sprite: "player", anchor: "center", pos: k.vec2(-2, 2), color: k.rgb(...COLOR_SHADOW) }); } },
        k.color(...COLOR_PLAYER),
        k.sprite("player"),
        k.pos(GAME_W / 2, GAME_H - GUTTER - 38),
        k.anchor("center"),
        k.area(),
        "player",
      ]);
    }
    spawnPlayer();

    function paintSplat(pos: ReturnType<typeof k.vec2>) {
      const P = 4;
      const scale = 0.4 + Math.random() * 1.5;
      const INNER_R = Math.round(16 * scale);
      const OUTER_R = Math.round(36 * scale);
      const DROP_R  = Math.round(72 * scale); // outlier drops reach further
      const pixels: { x: number; y: number; color: [number, number, number] }[] = [];

      // Pick up to 5 colors for this splat
      const palette = [...SPLAT_COLORS].sort(() => Math.random() - 0.5).slice(0, NUM_COLORS_IN_SPLAT);

      // Jagged edge: vary the effective radius per angular slice
      const SLICES = 24;
      const edgeR = Array.from({ length: SLICES }, () => INNER_R + Math.random() * (OUTER_R - INNER_R));

      const cx = Math.round(pos.x / P) * P;
      const cy = Math.round(pos.y / P) * P;
      const gridR = Math.ceil(OUTER_R / P);

      // Patch palette: spatially grouped so adjacent pixels form color blobs
      const patchPalette = Array.from({ length: 12 }, () => palette[Math.floor(Math.random() * palette.length)]);

      for (let gy = -gridR; gy <= gridR; gy++) {
        for (let gx = -gridR; gx <= gridR; gx++) {
          const dx = gx * P, dy = gy * P;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > OUTER_R) continue;

          const angle = Math.atan2(dy, dx);
          const slice = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * SLICES) % SLICES;
          const localR = edgeR[slice];

          const fillChance = dist <= INNER_R ? 0.96 : 0.96 - 0.88 * ((dist - INNER_R) / (localR - INNER_R + 1));
          if (Math.random() > fillChance) continue;

          const patchX = Math.floor((gx + gridR) / 3);
          const patchY = Math.floor((gy + gridR) / 3);
          const color = patchPalette[(patchX * 7 + patchY * 13) % patchPalette.length];
          pixels.push({ x: cx + dx, y: cy + dy, color });
        }
      }

      // Outlier drops scattered further out
      const NUM_DROPS = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < NUM_DROPS; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = OUTER_R + Math.random() * (DROP_R - OUTER_R);
        const ddx = Math.round((Math.cos(angle) * dist) / P) * P;
        const ddy = Math.round((Math.sin(angle) * dist) / P) * P;
        const color = palette[Math.floor(Math.random() * palette.length)];
        // Small cluster of 1–4 pixels per drop
        const dropSize = 1 + Math.floor(Math.random() * 4);
        for (let s = 0; s < dropSize; s++) {
          pixels.push({ x: cx + ddx + (s % 2) * P, y: cy + ddy + Math.floor(s / 2) * P, color });
        }
      }

      k.add([
        k.pos(0, 0),
        k.z(-1),
        { draw() { for (const px of pixels) k.drawRect({ pos: k.vec2(px.x, px.y), width: P, height: P, color: k.rgb(px.color[0], px.color[1], px.color[2]) }); } },
      ]);
    }

    function paintSplatDown(pos: ReturnType<typeof k.vec2>) {
      const P = 4;
      const scale = (0.6 + Math.random() * 1.2) * 1.2;
      const INNER_R = Math.round(16 * scale);
      const OUTER_R = Math.round(36 * scale);
      const DROP_R  = Math.round(260 * scale);
      const pixels: { x: number; y: number; color: [number, number, number] }[] = [];

      const palette = [...SPLAT_COLORS].sort(() => Math.random() - 0.5).slice(0, NUM_COLORS_IN_SPLAT);

      // Slices 12–23 are the downward half (angle 0→π, i.e. positive dy in screen space)
      const SLICES = 24;
      const edgeR = Array.from({ length: SLICES }, (_, i) => {
        const t = INNER_R + Math.random() * (OUTER_R - INNER_R);
        return i >= 12 ? t * (1.8 + Math.random() * 0.7) : t * (0.3 + Math.random() * 0.25);
      });

      const cx = Math.round(pos.x / P) * P;
      const cy = Math.round(pos.y / P) * P;
      const gridR = Math.ceil(OUTER_R * 2 / P);
      const patchPalette = Array.from({ length: 12 }, () => palette[Math.floor(Math.random() * palette.length)]);

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
          pixels.push({ x: cx + dx, y: cy + dy, color: patchPalette[(patchX * 7 + patchY * 13) % patchPalette.length] });
        }
      }

      // Drip drops biased steeply downward
      const NUM_DROPS = 14 + Math.floor(Math.random() * 8);
      for (let i = 0; i < NUM_DROPS; i++) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.35;
        const dist = OUTER_R + Math.random() * (DROP_R - OUTER_R);
        const ddx = Math.round((Math.cos(angle) * dist) / P) * P;
        const ddy = Math.round((Math.sin(angle) * dist) / P) * P;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const dropSize = 1 + Math.floor(Math.random() * 5);
        for (let s = 0; s < dropSize; s++)
          pixels.push({ x: cx + ddx + (s % 2) * P, y: cy + ddy + Math.floor(s / 2) * P, color });
      }

      k.add([
        k.pos(0, 0),
        k.z(-1),
        { draw() { for (const px of pixels) k.drawRect({ pos: k.vec2(px.x, px.y), width: P, height: P, color: k.rgb(px.color[0], px.color[1], px.color[2]) }); } },
      ]);
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

    k.onKeyPress("space", () => {
      if (gameOver || playerDead || !canShoot) return;
      if (k.get("bullet").length > 5) return;
      canShoot = false;
      k.add([
        k.rect(4, 16),
        k.color(...COLOR_PLAYER_BULLET),
        k.pos(playerObj!.pos.x - 2, playerObj!.pos.y - 36),
        k.area(),
        k.move(k.UP, 900),
        k.z(6),
        "bullet",
      ]);
      if (soundEnabled) k.play("pew", { volume: 4 });
      if (playerObj) {
        playerObj.color = k.rgb(...COLOR_PLAYER_ACTIVE);
        k.wait(0.08, () => { if (playerObj) playerObj.color = k.rgb(...COLOR_PLAYER); });
      }
      k.wait(0.15, () => { canShoot = true; });
    });

    k.onKeyDown("left", () => {
      if (gameOver || playerDead) return;
      const p = playerObj as unknown as { pos: { x: number } };
      p.pos.x = Math.max(GUTTER, p.pos.x - 286 * k.dt());
    });
    k.onKeyDown("right", () => {
      if (gameOver || playerDead) return;
      const p = playerObj as unknown as { pos: { x: number } };
      p.pos.x = Math.min(GAME_W - GUTTER, p.pos.x + 286 * k.dt());
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
      const aliveEnemies = enemies.filter(e => e.alive);
      alienCount = aliveEnemies.length;

      if (alienCount === 0) {
        ufoSound?.stop(); ufoSound = null;
        window.dispatchEvent(new CustomEvent('level-complete'));
        k.go("game", { score, lives, level: level + 1, hiScore: Math.max(hiScore, score) });
        return;
      }

      const speedFactor = Math.max(0.04, enemyMoveInterval * (alienCount / (ENEMY_COLS * ENEMY_ROWS)));

      if (enemyMoveTimer >= speedFactor) {
        enemyMoveTimer = 0;
        enemyFrame = (enemyFrame + 1) % 2;
        if (soundEnabled) k.play(`beep${(stepSound % 4) + 1}`, { volume: 0.08 });
        stepSound++;

        type EnemyE = { frame: number; pos: { x: number; y: number }; row: number };
        const te = aliveEnemies as unknown as EnemyE[];
        te.forEach(e => { e.frame = e.row % 2 === 0 ? enemyFrame : (enemyFrame + 1) % 2; });

        let hitWall = false;
        te.forEach(e => {
          const nextX = e.pos.x + enemyDir * 12;
          if (nextX < GUTTER || nextX > GAME_W - ENEMY_W - GUTTER) hitWall = true;
        });

        if (hitWall) {
          enemyDir *= -1;
          te.forEach(e => { e.pos.y += 10; });
          te.forEach(e => {
            if (e.pos.y > GAME_H - 90) {
              gameOver = true;
              localStorage.setItem(LS_HI_KEY, String(Math.max(hiScore, score)));
              ufoSound?.stop(); ufoSound = null;
              k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
            }
          });
        } else {
          te.forEach(e => { e.pos.x += enemyDir * 12; });
        }
      }

      if (aliveEnemies.length > 0 && Math.random() < aliensBulletChance) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        k.add([
          k.rect(4, 16),
          k.color(...COLOR_ENEMY_BULLET),
          k.pos(shooter.pos.x + 22, shooter.pos.y + 32),
          k.anchor("center"),
          k.area(),
          k.move(k.DOWN, 200 + level * 20),
          k.z(6),
          "enemyBullet",
        ]);
      }

      ufoTimer += k.dt();
      if (ufoTimer >= ufoInterval && !ufoObj) {
        ufoTimer = 0;
        ufoInterval = k.rand(15, 25);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const startX = dir === 1 ? -40 : GAME_W + 40;
        ufoObj = k.add([
          { draw() { k.drawSprite({ sprite: "ufo", anchor: "center", pos: k.vec2(-2, 2), color: k.rgb(...COLOR_SHADOW) }); } },
          k.sprite("ufo"),
          k.pos(startX, GUTTER * 1.4),
          k.anchor("center"),
          k.area(),
          k.move(dir === 1 ? k.RIGHT : k.LEFT, 60),
          k.z(6),
          "ufo",
        ]);
        if (soundEnabled) startUfoSound();
      }
      if (ufoObj) {
        if (ufoObj.pos.x < -60 || ufoObj.pos.x > GAME_W + 60) {
          ufoObj.destroy();
          ufoObj = null;
          ufoSound?.stop(); ufoSound = null;
        }
      }
    });

    k.onCollide("bullet", "enemy", (bullet: any, enemy: any) => {
      if (!enemy.alive) return;
      bullet.destroy();
      enemy.alive = false;
      score += enemy.pts;
      hiScore = Math.max(hiScore, score);
      localStorage.setItem(LS_HI_KEY, String(hiScore));
      scoreTxt.text = scoreShadow.text = `SCORE ${score}`;
      hiTxt.text = hiShadow.text = `HI SCORE ${hiScore}`;
      if (soundEnabled) k.play("boom", { volume: 0.22 });
      paintSplat(k.vec2(enemy.pos.x + 18, enemy.pos.y + 20));
      enemy.destroy();
      canShoot = true;
    });

    k.onCollide("bullet", "ufo", (bullet: any, ufo: any) => {
      bullet.destroy();
      const pts = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
      score += pts;
      hiScore = Math.max(hiScore, score);
      localStorage.setItem(LS_HI_KEY, String(hiScore));
      scoreTxt.text = scoreShadow.text = `SCORE ${String(score).padStart(4, "0")}`;
      hiTxt.text = hiShadow.text = `HI ${String(hiScore).padStart(4, "0")}`;
      if (soundEnabled) k.play("splat", { volume: 0.5 });
      paintSplatDown(k.vec2(ufo.pos.x, ufo.pos.y));
      const floatTxt = k.add([
        k.text(`+${pts}`, { size: 14, font }),
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

    k.onCollide("bullet", "shield", (bullet: any, shield: any) => {
      if (!bullet._shieldHit || shield.pos.y > bullet._shieldHit.pos.y) {
        bullet._shieldHit = shield;
      }
    });
    k.on("update", "bullet", (b: GameObj) => {
      const bullet = b as GameObj & { _shieldHit?: GameObj };
      if (bullet._shieldHit) {
        bullet._shieldHit.destroy();
        bullet._shieldHit = undefined;
        bullet.destroy();
        canShoot = true;
      }
    });

    k.onCollide("enemyBullet", "shield", (eb: any, shield: any) => {
      eb.destroy();
      shield.destroy();
    });

    k.onCollide("enemyBullet", "player", (eb: any, player: any) => {
      if (playerDead) return;
      eb.destroy();
      player.destroy();
      lives--;
      renderLives();
      playerDead = true;
      playerDeadTimer = 1.5;
      playBeep(100, 0.3, "sawtooth", 0.2);
      explode(k.vec2(playerObj!.pos.x, playerObj!.pos.y));
    });

    k.on("update", "enemyBullet", (eb: any) => {
      if (eb.pos.y > GAME_H) eb.destroy();
    });

    k.on("update", "bullet", (b: any) => {
      if (b.pos.y < 0) { b.destroy(); canShoot = true; }
    });

    k.onCollide("enemy", "player", (enemy: any, player: any) => {
      if (playerDead) return;
      lives = 0;
      renderLives();
      playerDead = true;
      playerDeadTimer = 1.5;
      player.destroy();
      k.wait(1.5, () => {
        localStorage.setItem(LS_HI_KEY, String(Math.max(hiScore, score)));
        ufoSound?.stop(); ufoSound = null;
        k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
      });
    });
  });

  k.scene("gameover", (data: Record<string, number> = {}) => {
    const score = data.score || 0;
    const hiScore = data.hiScore || 0;
    const W = k.width();
    const H = k.height();

    k.add([{ draw() {
      const spr = k.getSprite("bg");
      if (!spr?.data) return;
      const sw = spr.data.tex.width;
      const sh = spr.data.tex.height;
      const cw = k.width();
      const ch = k.height();
      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      k.drawSprite({ sprite: "bg", pos: k.vec2((cw - dw) / 2, (ch - dh) / 2), width: dw, height: dh });
    } }, k.fixed(), k.z(-10)]);

    k.add([
      k.text("GAME", { size: 52, font }),
      k.color(...COLOR_SHADOW),
      k.pos(W / 2 - 2, H * 0.27 + 2),
      k.anchor("center"),
    ]);
    k.add([
      k.text("GAME", { size: 52, font }),
      k.color(255, 0, 0),
      k.pos(W / 2, H * 0.27),
      k.anchor("center"),
    ]);
    k.add([
      k.text("OVER", { size: 52, font }),
      k.color(...COLOR_SHADOW),
      k.pos(W / 2 - 2, H * 0.36 + 2),
      k.anchor("center"),
    ]);
    k.add([
      k.text("OVER", { size: 52, font }),
      k.color(255, 0, 0),
      k.pos(W / 2, H * 0.36),
      k.anchor("center"),
    ]);

    k.add([
      k.text(`SCORE ${String(score).padStart(5, "0")}`, { size: UI_FONT_SIZE, font }),
      k.color(255, 255, 255),
      k.pos(W / 2, H * 0.46),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`HI SCORE ${String(hiScore).padStart(5, "0")}`, { size: UI_FONT_SIZE, font }),
      k.color(255, 235, 59),
      k.pos(W / 2, H * 0.505),
      k.anchor("center"),
    ]);

    const blink = k.add([
      k.text("PRESS SPACE TO RETRY", { size: 14, font }),
      k.color(0, 255, 65),
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
    k.add([
      k.text("PRESS T FOR TITLE", { size: 14, font }),
      k.color(100, 100, 100),
      k.pos(W / 2, H * 0.644),
      k.anchor("center"),
    ]);
    k.onKeyPress("t", () => k.go("title"));
  });

  const INITIAL_SCENE: "title" | "game" | "gameover" = "title";

  k.go(INITIAL_SCENE);

  return () => k.quit();
}
