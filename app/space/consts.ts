type RGB = [number, number, number];

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
  COLOR_FRAME: RGB;
  COLOR_HI_SCORE: RGB;
  COLOR_SHADOW: RGB;
  COLOR_SHIELD: RGB;
  COLOR_UFO: RGB;
  DIALOG_BG: RGB;
  DIALOG_FG: RGB;
  DIALOG_BTN_YES_BG: RGB;
  DIALOG_BTN_YES_FG: RGB;
  DIALOG_BTN_NO_BG: RGB;
  DIALOG_BTN_NO_FG: RGB;
  COLOR_TOUCH_BTN_BG: string;
  COLOR_TOUCH_BTN_BORDER: string;
  COLOR_TOUCH_BTN_TEXT: string;
  SPLAT_COLORS: RGB[];
}

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

  bandw: {
    HAS_SHADOW: true,
    COLOR_CANVAS_BG:        [18, 16, 14] as RGB,
    COLOR_H1:               [225, 222, 215] as RGB,
    COLOR_PLAYER:           [252, 250, 244] as RGB,
    COLOR_PLAYER_ACTIVE:    [255, 255, 255] as RGB,
    COLOR_PLAYER_BULLET:    [252, 250, 244] as RGB,
    COLOR_GAMEOVER_HEADING: [225, 222, 215] as RGB,
    COLOR_UI_FONT:          [175, 172, 165] as RGB,
    COLOR_LIVES:            [175, 172, 165] as RGB,
    COLOR_ACCENT:           [252, 250, 244] as RGB,
    COLOR_DIM:              [65, 63, 60] as RGB,
    COLOR_ENEMY:            [100, 98, 93] as RGB,
    COLOR_ENEMY_ROWS: [
      [85, 83, 80],
      [115, 113, 108],
      [145, 143, 137],
      [175, 172, 165],
      [205, 202, 195],
    ] as RGB[],
    COLOR_ENEMY_BULLET:     [195, 192, 186] as RGB,
    COLOR_EXPLOSION:        [140, 138, 132] as RGB,
    COLOR_FRAME:            [55, 53, 50] as RGB,
    COLOR_HI_SCORE:         [225, 222, 215] as RGB,
    COLOR_SHADOW:           [8, 8, 6] as RGB,
    COLOR_SHIELD:           [75, 73, 70] as RGB,
    COLOR_UFO:              [235, 233, 228] as RGB,
    DIALOG_BG:              [10, 10, 8] as RGB,
    DIALOG_FG:              [210, 208, 202] as RGB,
    DIALOG_BTN_YES_BG:      [225, 222, 215] as RGB,
    DIALOG_BTN_YES_FG:      [10, 10, 8] as RGB,
    DIALOG_BTN_NO_BG:       [35, 33, 30] as RGB,
    DIALOG_BTN_NO_FG:       [175, 172, 165] as RGB,
    COLOR_TOUCH_BTN_BG:     'rgba(200,198,192,0.08)',
    COLOR_TOUCH_BTN_BORDER: 'rgba(200,198,192,0.35)',
    COLOR_TOUCH_BTN_TEXT:   'rgba(200,198,192,0.7)',
    SPLAT_COLORS: SPLAT_VIVID,
  },

  beige: {
    HAS_SHADOW: true,
    COLOR_CANVAS_BG:        [23, 21, 20] as RGB,
    COLOR_H1:               [230, 217, 206] as RGB,
    COLOR_PLAYER:           [255, 244, 232] as RGB,
    COLOR_PLAYER_ACTIVE:    [255, 246, 234] as RGB,
    COLOR_PLAYER_BULLET:    [255, 244, 232] as RGB,
    COLOR_GAMEOVER_HEADING: [230, 217, 206] as RGB,
    COLOR_UI_FONT:          [182, 169, 155] as RGB,
    COLOR_LIVES:            [182, 169, 155] as RGB,
    COLOR_ACCENT:           [255, 244, 232] as RGB,
    COLOR_DIM:              [75, 60, 49] as RGB,
    COLOR_ENEMY:            [111, 96, 80] as RGB,
    COLOR_ENEMY_ROWS: [
      [95, 80, 67],
      [125, 111, 95],
      [155, 141, 124],
      [182, 169, 155],
      [214, 200, 179],
    ] as RGB[],
    COLOR_ENEMY_BULLET:     [205, 190, 172] as RGB,
    COLOR_EXPLOSION:        [151, 136, 119] as RGB,
    COLOR_FRAME:            [55, 53, 50] as RGB,    // unchanged
    COLOR_HI_SCORE:         [230, 217, 206] as RGB,
    COLOR_SHADOW:           [8, 8, 6] as RGB,       // unchanged
    COLOR_SHIELD:           [85, 71, 57] as RGB,
    COLOR_UFO:              [242, 230, 211] as RGB,
    DIALOG_BG:              [16, 7, 7] as RGB,
    DIALOG_FG:              [217, 203, 189] as RGB,
    DIALOG_BTN_YES_BG:      [230, 217, 206] as RGB,
    DIALOG_BTN_YES_FG:      [16, 7, 7] as RGB,
    DIALOG_BTN_NO_BG:       [43, 31, 25] as RGB,
    DIALOG_BTN_NO_FG:       [182, 169, 155] as RGB,
    COLOR_TOUCH_BTN_BG:     'rgba(213,193,168,0.08)',
    COLOR_TOUCH_BTN_BORDER: 'rgba(213,193,168,0.35)',
    COLOR_TOUCH_BTN_TEXT:   'rgba(213,193,168,0.7)',
    SPLAT_COLORS: SPLAT_VIVID,                      // unchanged
  },

} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const ACTIVE_THEME: ThemeName = 'bandw';

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
  COLOR_TOUCH_BTN_BG,
  COLOR_TOUCH_BTN_BORDER,
  COLOR_TOUCH_BTN_TEXT,
  SPLAT_COLORS,
} = t;

export const NUM_COLORS_IN_SPLAT = 5;
export const ENEMY_SPEED_INCREASE_PER_LEVEL = 0.18;
export const NUM_SHIELDS = 4;
export const UI_FONT_SIZE = 16;
export const DIALOG_QUESTION = "Would you like to enable sound?";
