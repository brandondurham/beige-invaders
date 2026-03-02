import kaplay, { type GameObj } from "kaplay";

const UI_FONT_SIZE = 16;
const NUM_SHIELDS = 4;
const COLOR_BACKGROUND = [241, 235, 223] as [number, number, number];
export const COLOR_ONE = "rgb(222, 206, 177)";
export const COLOR_TWO = COLOR_ONE;
export const COLOR_THREE = COLOR_ONE;
export const COLOR_PLAYER = "rgb(3, 255, 7)";
export const COLOR_SHIELD = COLOR_PLAYER;
export const COLOR_PLAYER_BULLET = COLOR_PLAYER;
export const COLOR_ENEMY_BULLET = "rgb(32, 0, 75)";
export const COLOR_UFO = "rgb(254, 5, 254)";
export const COLOR_EXPLOSION = COLOR_PLAYER;
export const COLOR_UI_FONT = COLOR_PLAYER.match(/\d+/g)!.map(Number) as [number, number, number];

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

  const playerPixels = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ].map((v) => (v ? COLOR_PLAYER : null));
  k.loadSprite("player", makeSpriteDataURL(playerPixels, 17, 9, 4));

  const enemyAF0 = [
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
  ].map((v) => (v ? COLOR_ONE : null));
  const enemyAF1 = [
    0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0,
  ].map((v) => (v ? COLOR_ONE : null));
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
  ].map(v => v ? COLOR_TWO : null);
  const enemyBF1 = [
    0,0,1,0,0,0,0,0,1,0,0,
    1,0,0,1,0,0,0,1,0,0,1,
    1,0,1,1,1,1,1,1,1,0,1,
    1,1,1,0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,1,1,0,
    0,0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? COLOR_TWO : null);
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
  ].map(v => v ? COLOR_THREE : null);
  const enemyCF1 = [
    0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,1,1,0,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,0,
    0,0,0,1,0,0,0,0,1,0,0,0,
    0,0,1,0,1,0,0,1,0,1,0,0,
    0,1,0,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? COLOR_THREE : null);
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
  ].map(v => v ? COLOR_THREE : null);
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
  ].map(v => v ? COLOR_TWO : null);
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
  ].map(v => v ? COLOR_TWO : null);
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
  ].map(v => v ? COLOR_ONE : null);
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
  ].map(v => v ? COLOR_ONE : null);
  k.loadSprite("row5", makeSpritesheetDataURL([row5Pixels, flipH(row5Pixels, 44)], 44, 32, 1), { sliceX: 2 });

  const ufoPixels = [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ].map((v) => (v ? COLOR_UFO : null));
  k.loadSprite("ufo", makeSpriteDataURL(ufoPixels, 16, 7, 4));

  const bulletPixels = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) =>
    v ? COLOR_PLAYER_BULLET : null,
  );
  k.loadSprite("bullet", makeSpriteDataURL(bulletPixels, 40, 80, 10));

  const enemyBulletPixels = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) =>
    v ? COLOR_ENEMY_BULLET : null,
  );
  k.loadSprite("enemyBullet", makeSpriteDataURL(enemyBulletPixels, 40, 80, 10));

  const explPixels = [
    0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1,
    0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  ].map((v) => (v ? COLOR_EXPLOSION : null));
  k.loadSprite("explosion", makeSpriteDataURL(explPixels, 8, 8, 4));

  const shieldBlock = Array(48)
    .fill(1)
    .map(() => COLOR_SHIELD);
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
  ].map(v => v ? COLOR_PLAYER : null);
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
  ].map(v => v ? COLOR_PLAYER : null);
  k.loadSprite("speaker", makeSpritesheetDataURL([speakerOnPixels, speakerOffPixels], 15, 10, 2), { sliceX: 2 });
  // k.loadSprite("bg", "/retro.jpg");
  k.loadSprite("bg", "/retro-2.jpg");

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
      k.color(0, 255, 65),
      k.pos(W / 2, H * 0.27),
      k.anchor("center"),
    ]);
    k.add([
      k.text("INVADERS", {
        size: 52,
        font,
      }),
      k.color(0, 255, 65),
      k.pos(W / 2, H * 0.36),
      k.anchor("center"),
    ]);

    const scoreTable = [
      { sprite: "ufo",    label: "= ?", color: COLOR_UFO },
      { sprite: "enemyC", label: "= 30 POINTS", color: COLOR_THREE },
      { sprite: "enemyB", label: "= 20 POINTS", color: COLOR_TWO },
      { sprite: "enemyA", label: "= 10 POINTS", color: COLOR_ONE },
    ];

    scoreTable.forEach((row, i) => {
      k.add([k.sprite(row.sprite), k.pos(W / 2 - 90, H * 0.59 + i * 44), k.scale(0.7), k.anchor("center")]);
      k.add([
        k.text(row.label, { size: 14, font }),
        k.color(...row.color.match(/\d+/g)!.map(Number) as [number, number, number]),
        k.pos(W / 2 - 55, H * 0.59 + i * 44),
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
    let playerObj: GameObj | null = null;
    let canShoot = true;
    let enemyDir = 1;
    let enemyMoveTimer = 0;
    let enemyMoveInterval = Math.max(0.08, 0.5 - (level - 1) * 0.05);
    let enemyFrame = 0;
    let ufoTimer = 0;
    let ufoInterval = k.rand(15, 25);
    let gameOver = false;
    let playerDead = false;
    let playerDeadTimer = 0;
    let stepSound = 0;
    const stepFreqs = [160, 130, 100, 80];
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

    k.add([
      k.text("BEIGE INVADERS", { size: UI_FONT_SIZE, font }),
      k.color(COLOR_UI_FONT),
      k.pos(GAME_W / 2, GUTTER / 2),
      k.anchor("top"),
    ]);
    // Sound toggle icon
    const soundIconObj = k.add([
      k.sprite("speaker", { frame: soundEnabled ? 0 : 1 }),
      k.pos(GUTTER / 2, GUTTER / 1.6),
      k.anchor("left"),
      k.fixed(),
      k.z(10),
      k.area(),
    ]);
    soundIconObj.onClick(() => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(LS_SOUND_KEY, soundEnabled ? "1" : "0");
      const snd = soundIconObj as unknown as { frame: number; opacity: number };
      snd.frame = soundEnabled ? 0 : 1;
    });

    const scoreTxt = k.add([
      k.text(`SCORE ${score}`, { size: UI_FONT_SIZE, font }),
      fgColor(),
      k.pos(GUTTER + 16, GUTTER / 1.6),
      k.anchor("left"),
      k.fixed(),
      k.z(10),
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

    function renderLives() {
      k.get("lifeIcon").forEach((o: ReturnType<typeof k.add>) => o.destroy());
      for (let i = 0; i < lives; i++) {
        k.add([
          k.sprite("player"),
          k.scale(0.65),
          k.pos(GUTTER / 2 + i * 50, GAME_H - (GUTTER * 0.9)),
          k.fixed(),
          k.z(10),
          "lifeIcon",
        ]);
      }
    }
    renderLives();

    const rowConfig = [
      { sprite: "row1", pts: 30 },
      { sprite: "row2", pts: 20 },
      { sprite: "row3", pts: 20 },
      { sprite: "row4", pts: 10 },
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
                color: k.rgb(0, 0, 0),
                opacity: 0.25,
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
      shieldShape.forEach(([bx, by]) => {
        const s = k.add([
          k.rect(16, 12),
          k.color(...COLOR_SHIELD.match(/\d+/g)!.map(Number) as [number, number, number]),
          k.pos(sx - 112 + bx * 16, GAME_H * 0.89 - 95 + by * 12),
          k.area(),
          k.z(4),
          "shield",
        ]);
        shields.push(s);
      });
    });

    function spawnPlayer() {
      playerObj = k.add([
        k.sprite("player"),
        k.pos(GAME_W / 2, GAME_H - GUTTER - 26),
        k.anchor("center"),
        k.area(),
        "player",
      ]);
    }
    spawnPlayer();

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
        k.color(...COLOR_PLAYER_BULLET.match(/\d+/g)!.map(Number) as [number, number, number]),
        k.pos(playerObj!.pos.x, playerObj!.pos.y - 20),
        k.anchor("center"),
        k.area(),
        k.move(k.UP, 900),
        k.z(6),
        "bullet",
      ]);
      playBeep(600, 0.06, "square", 0.1);
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
        k.go("game", { score, lives, level: level + 1, hiScore: Math.max(hiScore, score) });
        return;
      }

      const speedFactor = Math.max(0.04, enemyMoveInterval * (alienCount / (ENEMY_COLS * ENEMY_ROWS)));

      if (enemyMoveTimer >= speedFactor) {
        enemyMoveTimer = 0;
        enemyFrame = (enemyFrame + 1) % 2;
        playBeep(stepFreqs[stepSound % 4], 0.04, "square", 0.08);
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
          k.color(...COLOR_ENEMY_BULLET.match(/\d+/g)!.map(Number) as [number, number, number]),
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
          k.sprite("ufo"),
          k.pos(startX, GUTTER * 1.4),
          k.anchor("center"),
          k.area(),
          k.move(dir === 1 ? k.RIGHT : k.LEFT, 60),
          k.z(6),
          "ufo",
        ]);
        playBeep(880, 0.1, "sawtooth", 0.05);
      }
      if (ufoObj) {
        if (ufoObj.pos.x < -60 || ufoObj.pos.x > GAME_W + 60) {
          ufoObj.destroy();
          ufoObj = null;
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
      scoreTxt.text = `SCORE ${score}`;
      hiTxt.text = `HI SCORE ${hiScore}`;
      playBeep(200, 0.12, "square", 0.15);
      explode(k.vec2(enemy.pos.x + 22, enemy.pos.y + 16));
      enemy.destroy();
      canShoot = true;
    });

    k.onCollide("bullet", "ufo", (bullet: any, ufo: any) => {
      bullet.destroy();
      const pts = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
      score += pts;
      hiScore = Math.max(hiScore, score);
      localStorage.setItem(LS_HI_KEY, String(hiScore));
      scoreTxt.text = `SCORE ${String(score).padStart(4, "0")}`;
      hiTxt.text = `HI  ${String(hiScore).padStart(4, "0")}`;
      playBeep(880, 0.2, "sawtooth", 0.15);
      explode(k.vec2(ufo.pos.x, ufo.pos.y));
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
      canShoot = true;
    });

    k.onCollide("bullet", "shield", (bullet: any, shield: any) => {
      bullet.destroy();
      shield.destroy();
      canShoot = true;
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
      k.color(255, 0, 0),
      k.pos(W / 2, H * 0.27),
      k.anchor("center"),
    ]);
    k.add([
      k.text("OVER", {
        size: 52,
        font,
      }),
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
      k.pos(W / 2, H * 0.57),
      k.anchor("center"),
    ]);

    const blink = k.add([
      k.text("PRESS SPACE TO RETRY", { size: 14, font }),
      k.color(0, 255, 65),
      k.opacity(1),
      k.pos(W / 2, H * 0.68),
      k.anchor("center"),
    ]);

    let blinkTimer = 0;
    k.onUpdate(() => {
      blinkTimer += k.dt();
      blink.opacity = Math.sin(blinkTimer * 4) > 0 ? 1 : 0;
    });

    k.onKeyPress("space", () => k.go("game", { hiScore }));
    k.add([
      k.text("PRESS T FOR TITLE", { size: 12, font }),
      k.color(100, 100, 100),
      k.pos(W / 2, H * 0.75),
      k.anchor("center"),
    ]);
    k.onKeyPress("t", () => k.go("title"));
  });

  const INITIAL_SCENE: "title" | "game" | "gameover" = "title";

  k.go(INITIAL_SCENE);

  return () => k.quit();
}
