import { RGBAValue } from "kaplay";

export type RGB = [number, number, number];

interface Theme {
  HAS_SHADOW: boolean;
  COLOR_CANVAS_BG: RGB;
  COLOR_H1: RGB;
  COLOR_PLAYER: RGB;
  COLOR_PLAYER_ACTIVE: RGB;
  COLOR_PLAYER_BULLET: RGB;
  COLOR_GAMEOVER_HEADING: RGB;
  COLOR_UI_FONT: RGB;
  COLOR_LIVES: RGB;
  COLOR_ACCENT: RGB;
  COLOR_DIM: RGB;
  COLOR_ENEMY: RGB;
  COLOR_ENEMY_ROWS: RGB[];
  COLOR_ENEMY_BULLET: RGB;
  COLOR_EXPLOSION: RGB;
  COLOR_FRAME: RGBAValue;
  COLOR_HI_SCORE: RGB;
  COLOR_SHADOW: RGBAValue;
  COLOR_SHIELD: RGB;
  COLOR_UFO: RGB;
  DIALOG_BG: RGB;
  DIALOG_FG: RGB;
  DIALOG_BTN_YES_BG: RGB;
  DIALOG_BTN_YES_FG: RGB;
  DIALOG_BTN_NO_BG: RGB;
  DIALOG_BTN_NO_FG: RGB;
  SPLAT_COLORS: RGB[];
}

const SPLAT_MEMPHIS: RGB[] = [
  [28, 118, 194],
  [237, 183, 18],
  [226, 107, 28],
  [207, 42, 42],
  [203, 74, 102],
  [107, 44, 156],
  [224, 118, 92],
  [174, 218, 226],
  [248, 246, 242],
];

const SPLAT_VIVID: RGB[] = [
  [255, 0, 30],
  [255, 0, 185],
  [255, 247, 0],
  [12, 36, 255],
  [0, 105, 12],
  [255, 134, 243],
  [0, 255, 165],
  [0, 221, 255],
  [111, 0, 159],
];

const themes = {
  beige: {
    HAS_SHADOW: true,
    COLOR_CANVAS_BG:        [255, 16, 14] as RGB,
    COLOR_H1:               [162, 142, 122] as RGB,
    COLOR_PLAYER:           [46, 207, 140] as RGB,
    COLOR_PLAYER_ACTIVE:    [255, 0, 30] as RGB,
    COLOR_PLAYER_BULLET:    [252, 250, 244] as RGB,
    COLOR_GAMEOVER_HEADING: [255, 238, 215] as RGB,
    COLOR_UI_FONT:          [175, 172, 165] as RGB,
    COLOR_LIVES:            [175, 172, 165] as RGB,
    COLOR_ACCENT:           [252, 250, 244] as RGB,
    COLOR_DIM:              [65, 63, 60] as RGB,
    COLOR_ENEMY:            [100, 98, 93] as RGB,
    COLOR_ENEMY_ROWS: [
      [220, 215, 210],
      [180, 175, 170],
      [140, 135, 130],
      [100, 95, 90],
      [60, 55, 50],
    ] as RGB[],
    COLOR_ENEMY_BULLET:     [195, 192, 186] as RGB,
    COLOR_EXPLOSION:        [140, 138, 132] as RGB,
    COLOR_FRAME:            [55, 53, 50, 0] as RGBAValue,
    COLOR_HI_SCORE:         [255, 238, 215] as RGB,
    COLOR_SHADOW:           [8, 8, 6, 0.7] as RGBAValue,
    COLOR_SHIELD:           [65, 62, 59] as RGB,
    COLOR_UFO:              [255, 245, 235] as RGB,
    DIALOG_BG:              [10, 10, 8] as RGB,
    DIALOG_FG:              [210, 208, 202] as RGB,
    DIALOG_BTN_YES_BG:      [255, 238, 215] as RGB,
    DIALOG_BTN_YES_FG:      [10, 10, 8] as RGB,
    DIALOG_BTN_NO_BG:       [35, 33, 30] as RGB,
    DIALOG_BTN_NO_FG:       [175, 172, 165] as RGB,
    SPLAT_COLORS: SPLAT_VIVID,
  },
  memphis: {
    HAS_SHADOW: true,
    COLOR_CANVAS_BG:        [14, 12, 10] as RGB,
    COLOR_H1:               [248, 246, 242] as RGB,
    COLOR_PLAYER:           [248, 246, 242] as RGB,
    COLOR_PLAYER_ACTIVE:    [255, 255, 255] as RGB,
    COLOR_PLAYER_BULLET:    [237, 183, 18] as RGB,
    COLOR_GAMEOVER_HEADING: [248, 246, 242] as RGB,
    COLOR_UI_FONT:          [174, 218, 226] as RGB,
    COLOR_LIVES:            [237, 183, 18] as RGB,
    COLOR_ACCENT:           [28, 118, 194] as RGB,
    COLOR_DIM:              [55, 50, 45] as RGB,
    COLOR_ENEMY:            [28, 118, 194] as RGB,
    COLOR_ENEMY_ROWS: [
      [28, 118, 194],
      [107, 44, 156],
      [226, 107, 28],
      [207, 42, 42],
      [237, 183, 18],
    ] as RGB[],
    COLOR_ENEMY_BULLET:     [203, 74, 102] as RGB,
    COLOR_EXPLOSION:        [226, 107, 28] as RGB,
    COLOR_FRAME:            [28, 118, 194, 1] as RGBAValue,
    COLOR_HI_SCORE:         [248, 246, 242] as RGB,
    COLOR_SHADOW:           [8, 6, 4, 0.7] as RGBAValue,
    COLOR_SHIELD:           [174, 218, 226] as RGB,
    COLOR_UFO:              [203, 74, 102] as RGB,
    DIALOG_BG:              [14, 12, 10] as RGB,
    DIALOG_FG:              [220, 215, 205] as RGB,
    DIALOG_BTN_YES_BG:      [237, 183, 18] as RGB,
    DIALOG_BTN_YES_FG:      [14, 12, 10] as RGB,
    DIALOG_BTN_NO_BG:       [40, 36, 32] as RGB,
    DIALOG_BTN_NO_FG:       [160, 155, 145] as RGB,
    SPLAT_COLORS: SPLAT_MEMPHIS,
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const ACTIVE_THEME: ThemeName = 'beige';

const t = themes[ACTIVE_THEME];

export const COLOR_WHITE: RGB = [255, 255, 255];
export const {
  HAS_SHADOW,
  COLOR_CANVAS_BG,
  COLOR_H1,
  COLOR_PLAYER,
  COLOR_PLAYER_ACTIVE,
  COLOR_PLAYER_BULLET,
  COLOR_GAMEOVER_HEADING,
  COLOR_UI_FONT,
  COLOR_LIVES,
  COLOR_ACCENT,
  COLOR_DIM,
  COLOR_ENEMY,
  COLOR_ENEMY_ROWS,
  COLOR_ENEMY_BULLET,
  COLOR_EXPLOSION,
  COLOR_FRAME,
  COLOR_HI_SCORE,
  COLOR_SHADOW,
  COLOR_SHIELD,
  COLOR_UFO,
  DIALOG_BG,
  DIALOG_FG,
  DIALOG_BTN_YES_BG,
  DIALOG_BTN_YES_FG,
  DIALOG_BTN_NO_BG,
  DIALOG_BTN_NO_FG,
  SPLAT_COLORS,
} = t;

export const NUM_COLORS_IN_SPLAT = 5;
export const ENEMY_SPEED_INCREASE_PER_LEVEL = 0.18;
export const NUM_SHIELDS = 3;
export const UI_FONT_SIZE = 13;
export const DIALOG_QUESTION = "Would you like to enable sound?";

// ─── ENEMY / SPRITE DIMENSIONS ───

export const ENEMY_ROWS = 5;
export const ENEMY_W = 55;
export const ENEMY_H = 56;
export const GUTTER = 60;

export const ENEMY_SPRITE_PIXEL_W = 44;
export const ENEMY_SPRITE_PIXEL_H = 32;
export const ENEMY_STROKE_PX = 3;
export const ENEMY_SHADOW_OFFSET = { x: -5, y: 5 };
export const SHIELD_SHADOW_OFFSET = { x: -8, y: 8 };
export const ENEMY_DECOR_MIN_X = Math.min(-ENEMY_STROKE_PX, ENEMY_SHADOW_OFFSET.x);
export const ENEMY_DECOR_MIN_Y = Math.min(-ENEMY_STROKE_PX, ENEMY_SHADOW_OFFSET.y);
export const ENEMY_DECOR_MAX_X = ENEMY_SPRITE_PIXEL_W - 1 + Math.max(ENEMY_STROKE_PX, ENEMY_SHADOW_OFFSET.x);
export const ENEMY_DECOR_MAX_Y = ENEMY_SPRITE_PIXEL_H - 1 + Math.max(ENEMY_STROKE_PX, ENEMY_SHADOW_OFFSET.y);
export const ENEMY_DECOR_W = ENEMY_DECOR_MAX_X - ENEMY_DECOR_MIN_X + 1;
export const ENEMY_DECOR_H = ENEMY_DECOR_MAX_Y - ENEMY_DECOR_MIN_Y + 1;

// ─── SHIELD ───

export const SHIELD_BLOCK_W = 11;
export const SHIELD_BLOCK_H = 8;

export const BUILDER_SHIELD_GRID = [
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,
  0,0,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,
  1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,
  1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
];

function flatGridToShieldShape(
  flat: number[],
  w: number,
  h: number,
  factor = 1,
): [number, number][] {
  const blocks = new Set<string>();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!flat[y * w + x]) continue;
      blocks.add(`${Math.floor(x / factor)},${Math.floor(y / factor)}`);
    }
  }
  const shape = [...blocks].map((key) => key.split(",").map(Number) as [number, number]);
  if (!shape.length) return shape;
  const minX = Math.min(...shape.map(([x]) => x));
  const minY = Math.min(...shape.map(([, y]) => y));
  return shape.map(([x, y]) => [x - minX, y - minY]);
}

export const SHIELD_SHAPE = flatGridToShieldShape(BUILDER_SHIELD_GRID, 32, 32, 2);
export const SHIELD_ROWS = Math.max(...SHIELD_SHAPE.map(([, y]) => y)) + 1;
export const SHIELD_COLS = Math.max(...SHIELD_SHAPE.map(([x]) => x)) + 1;
export const SHIELD_CENTER_X = (SHIELD_COLS * SHIELD_BLOCK_W) / 2;

// ─── GAMEPLAY SPEEDS ───

export const PLAYER_SPEED = 286;
export const PLAYER_BULLET_SPEED = 900;
export const UFO_SPEED = 60;
export const LIVES_ICON_SPACING = 30;

// ─── LAYOUT ───

// 844 is the canvas width at which layout constants were originally tuned (scale ≈ 3.77).
export const DESIGN_GAME_W = 844;

export function getLayout(gameW: number, gameH: number) {
  const r  = gameW / DESIGN_GAME_W;
  const g  = GUTTER * r;
  const eW = ENEMY_W * r;
  const eH = ENEMY_H * r;
  const sBW = SHIELD_BLOCK_W * r;
  const sBH = SHIELD_BLOCK_H * r;
  const sCX = SHIELD_CENTER_X * r;
  const sShadow = { x: SHIELD_SHADOW_OFFSET.x * r, y: SHIELD_SHADOW_OFFSET.y * r };
  const UI_Y_TOP = g;
  const UI_Y_BOT = gameH - g;
  const ENEMY_COLS = Math.floor((gameW - g * 4) / eW);
  const START_X = Math.floor((gameW - ENEMY_COLS * eW) / 2);
  const START_Y = g * 3;
  const SHIELD_ORIGIN_Y = gameH * 0.86 - SHIELD_ROWS * sBH - 47 * r;
  return {
    r,
    UI_Y_TOP, UI_Y_BOT, ENEMY_COLS, START_X, START_Y, SHIELD_ORIGIN_Y,
    ENEMY_W: eW, ENEMY_H: eH, GUTTER: g,
    SHIELD_BLOCK_W: sBW, SHIELD_BLOCK_H: sBH, SHIELD_CENTER_X: sCX,
    SHIELD_SHADOW_OFFSET: sShadow,
    LIVES_ICON_SPACING: LIVES_ICON_SPACING * r,
    PLAYER_SPEED: PLAYER_SPEED * r,
    PLAYER_BULLET_SPEED: PLAYER_BULLET_SPEED * r,
    UFO_SPEED: UFO_SPEED * r,
  };
}
