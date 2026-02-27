import kaplay from "kaplay";
import { COLORS } from "./consts";

export function initGame(canvas: HTMLCanvasElement): () => void {
  const k = kaplay({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    crisp: true,
  });

  const themeKeys = Object.keys(COLORS) as (keyof typeof COLORS)[];
  const theme = COLORS[themeKeys[Math.floor(Math.random() * themeKeys.length)]];
  const bgColor = () => k.color(...theme.background);
  const fgColor = () => k.color(...theme.foreground);
  const font = "'Monaspace Krypton', 'Ringside Extra Wide', 'Monaspace Neon', monospace";

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

  const shuffled = [...theme.colors].sort(() => Math.random() - 0.5);
  const [colorA, colorB, colorC, colorD, colorE, colorF, colorG] = shuffled.map(
    ([r, g, b]) => `rgb(${r},${g},${b})`
  );
  const [rgbA, rgbB, rgbC, rgbD] = shuffled as [number, number, number][];

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
  ].map((v) => (v ? "#32ff03" : null));
  k.loadSprite("player", makeSpriteDataURL(playerPixels, 17, 8, 4));

  const enemyAF0 = [
    0,0,0,1,1,1,1,1,0,0,0,
    0,1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,1,1,0,1,1,
    1,1,1,1,1,1,1,1,1,1,1,
    0,0,1,1,0,0,0,1,1,0,0,
    0,1,0,1,0,0,0,1,0,1,0,
    0,0,1,0,0,0,0,0,1,0,0,
  ].map(v => v ? colorA : null);
  const enemyAF1 = [
    0,0,0,1,1,1,1,1,0,0,0,
    0,1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,1,1,0,1,1,
    1,1,1,1,1,1,1,1,1,1,1,
    0,1,1,0,0,0,0,0,1,1,0,
    1,0,0,1,0,0,0,1,0,0,1,
    0,1,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? colorA : null);
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
  ].map(v => v ? colorB : null);
  const enemyBF1 = [
    0,0,1,0,0,0,0,0,1,0,0,
    1,0,0,1,0,0,0,1,0,0,1,
    1,0,1,1,1,1,1,1,1,0,1,
    1,1,1,0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,1,1,0,
    0,0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? colorB : null);
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
  ].map(v => v ? colorC : null);
  const enemyCF1 = [
    0,0,0,0,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,0,0,
    0,1,1,0,1,1,1,1,0,1,1,0,
    0,1,1,1,1,1,1,1,1,1,1,0,
    0,0,0,1,0,0,0,0,1,0,0,0,
    0,0,1,0,1,0,0,1,0,1,0,0,
    0,1,0,0,0,0,0,0,0,0,1,0,
  ].map(v => v ? colorC : null);
  k.loadSprite("enemyC", makeSpritesheetDataURL([enemyCF0, enemyCF1], 12, 8, 4), { sliceX: 2 });

  const ufoPixels = [
    0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ].map((v) => (v ? colorD : null));
  k.loadSprite("ufo", makeSpriteDataURL(ufoPixels, 16, 7, 4));

  const bulletPixels = [1,1,1,1,1,1,1,1,1,1,1,1].map((v) => (v ? "#ff0000" : null));
  k.loadSprite("bullet", makeSpriteDataURL(bulletPixels, 4, 8, 2));

  const enemyBulletPixels = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) =>
    v ? "#FFFF00" : null,
  );
  k.loadSprite("enemyBullet", makeSpriteDataURL(enemyBulletPixels, 4, 8, 2));

  const explPixels = [
    0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1,
    0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  ].map((v) => (v ? "#FFFFFF" : null));
  k.loadSprite("explosion", makeSpriteDataURL(explPixels, 8, 8, 4));

  const shieldBlock = Array(48)
    .fill(1)
    .map(() => "#32ff03");
  k.loadSprite("shield", makeSpriteDataURL(shieldBlock, 8, 6, 2));

  // ─── AUDIO ───

  const AudioContextCtor: typeof AudioContext = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
  const audioCtx = new AudioContextCtor();

  function playBeep(freq = 440, dur = 0.05, type: OscillatorType = "square", vol = 0.15) {
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

  // ─── SCENES ───

  k.scene("title", () => {
    const W = k.width();
    const H = k.height();
    k.add([k.rect(W, H), bgColor(), k.pos(0, 0), k.fixed(), k.z(-10)]);

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
      k.pos(W / 2, H * 0.21),
      k.anchor("center"),
    ]);
    k.add([
      k.text("INVADERS", {
        size: 52,
        font,
      }),
      k.color(0, 255, 65),
      k.pos(W / 2, H * 0.29),
      k.anchor("center"),
    ]);

    const scoreTable = [
      { sprite: "ufo",    label: "= ?", color: rgbD },
      { sprite: "enemyC", label: "= 30 POINTS", color: rgbC },
      { sprite: "enemyB", label: "= 20 POINTS", color: rgbB },
      { sprite: "enemyA", label: "= 10 POINTS", color: rgbA },
    ];

    scoreTable.forEach((row, i) => {
      k.add([k.sprite(row.sprite), k.pos(W / 2 - 60, H * 0.46 + i * 44), k.scale(0.7), k.anchor("center")]);
      k.add([
        k.text(row.label, { size: 14, font }),
        k.color(...row.color),
        k.pos(W / 2 - 20, H * 0.46 + i * 44),
        k.anchor("left"),
      ]);
    });

    const blink = k.add([
      k.text("< PRESS SPACE TO PLAY >", { size: 14, font }),
      k.color(255, 255, 255),
      k.opacity(1),
      k.pos(W / 2, H * 0.82),
      k.anchor("center"),
    ]);

    let blinkTimer = 0;
    k.onUpdate(() => {
      blinkTimer += k.dt();
      blink.opacity = Math.sin(blinkTimer * 4) > 0 ? 1 : 0;
    });

    k.onKeyPress("space", () => k.go("game"));
  });

  k.scene("game", (data: Record<string, number> = {}) => {
    const GAME_W = k.width();
    const GAME_H = k.height();
    const ENEMY_ROWS = 5;
    const ENEMY_W = 60;
    const ENEMY_H = 60;
    const GUTTER = 60;
    const ENEMY_COLS = Math.floor((GAME_W - GUTTER * 2) / ENEMY_W);
    const START_X = Math.floor((GAME_W - ENEMY_COLS * ENEMY_W) / 2);
    const START_Y = 90;

    let score = data.score || 0;
    let lives = data.lives !== undefined ? data.lives : 3;
    let level = data.level || 1;
    let hiScore = data.hiScore || 0;

    let enemies: ReturnType<typeof k.add>[] = [];
    let shields: ReturnType<typeof k.add>[] = [];
    let ufoObj: ReturnType<typeof k.add> | null = null;
    let playerObj: ReturnType<typeof k.add> | null = null;
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

    k.add([k.rect(GAME_W, GAME_H), bgColor(), k.pos(0, 0), k.fixed(), k.z(-10)]);

    const scoreTxt = k.add([
      k.text(`SCORE  ${String(score).padStart(4, "0")}`, { size: 18, font }),
      fgColor(),
      k.pos(24, 30),
      k.fixed(), k.z(10),
    ]);
    const hiTxt = k.add([
      k.text(`HI  ${String(Math.max(hiScore, score)).padStart(4, "0")}`, { size: 18, font }),
      fgColor(),
      k.pos(GAME_W / 2, 30),
      k.anchor("top"),
      k.fixed(), k.z(10),
    ]);
    const livesTxt = k.add([
      k.text(`LIVES ${lives}`, { size: 18, font }),
      fgColor(),
      k.pos(GAME_W - 24, 30),
      k.anchor("topright"),
      k.fixed(), k.z(10),
    ]);

    // function renderLives() {
    //   k.get("lifeIcon").forEach((o: ReturnType<typeof k.add>) => o.destroy());
    //   for (let i = 0; i < lives; i++) {
    //     k.add([
    //       k.sprite("player"),
    //       k.scale(0.65),
    //       k.pos(GAME_W - 126 + i * 36, 48),
    //       k.fixed(), k.z(10),
    //       "lifeIcon",
    //     ]);
    //   }
    // }
    // renderLives();

    // k.add([k.rect(GAME_W, 2), k.color(0, 255, 65), k.pos(0, GAME_H - 36), k.fixed(), k.z(5)]);
    // k.add([
    //   k.text(`LEVEL ${level}`, { size: 12, font }),
    //   k.color(0, 255, 65),
    //   k.pos(GAME_W / 2, GAME_H - 24),
    //   k.anchor("top"),
    //   k.fixed(), k.z(10),
    // ]);

    const rowConfig = [
      { sprite: "enemyC", pts: 30 },
      { sprite: "enemyB", pts: 20 },
      { sprite: "enemyB", pts: 20 },
      { sprite: "enemyA", pts: 10 },
      { sprite: "enemyA", pts: 10 },
    ];

    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        const cfg = rowConfig[row];
        const e = k.add([
          k.sprite(cfg.sprite),
          k.pos(START_X + col * ENEMY_W, START_Y + row * ENEMY_H + (level - 1) * 10),
          k.area(),
          "enemy",
          { row, col, pts: cfg.pts, alive: true },
        ]);
        enemies.push(e);
      }
    }

    const NUM_SHIELDS = 5;
    const shieldPositions = Array.from({ length: NUM_SHIELDS }, (_, i) =>
      Math.round(GAME_W * (i + 1) / (NUM_SHIELDS + 1))
    );
    const shieldShape: [number, number][] = [
      [0,0],[1,0],[2,0],[3,0],[4,0],
      [0,1],[1,1],[2,1],[3,1],[4,1],
      [0,2],[1,2],[2,2],[3,2],[4,2],
      [0,3],[4,3],
      [0,4],[4,4],
    ];
    shieldPositions.forEach(sx => {
      shieldShape.forEach(([bx, by]) => {
        const s = k.add([
          k.rect(8, 6),
          k.color(50, 255, 3),
          k.pos(sx - 20 + bx * 8, GAME_H * 0.95 - 95 + by * 7),
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
        k.pos(GAME_W / 2, GAME_H - 58),
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
        k.rect(3, 12),
        k.color(0, 255, 65),
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
      playerObj!.pos.x = Math.max(22, playerObj!.pos.x - 286 * k.dt());
    });
    k.onKeyDown("right", () => {
      if (gameOver || playerDead) return;
      playerObj!.pos.x = Math.min(GAME_W - 22, playerObj!.pos.x + 286 * k.dt());
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

        let hitWall = false;
        aliveEnemies.forEach(e => {
          e.frame = enemyFrame;
          const nextX = e.pos.x + (enemyDir * 12);
          if (nextX < START_X || nextX > GAME_W - START_X - ENEMY_W) hitWall = true;
        });

        if (hitWall) {
          enemyDir *= -1;
          aliveEnemies.forEach(e => { e.pos.y += 10; });
          aliveEnemies.forEach(e => {
            if (e.pos.y > GAME_H - 90) {
              gameOver = true;
              k.go("gameover", { score, hiScore: Math.max(hiScore, score) });
            }
          });
        } else {
          aliveEnemies.forEach(e => { e.pos.x += enemyDir * 12; });
        }
      }

      if (aliveEnemies.length > 0 && Math.random() < aliensBulletChance) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        k.add([
          k.rect(3, 10),
          k.color(255, 64, 129),
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
          k.pos(startX, 100),
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
      scoreTxt.text = `SCORE  ${String(score).padStart(4, "0")}`;
      hiTxt.text = `HI  ${String(hiScore).padStart(4, "0")}`;
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
      scoreTxt.text = `SCORE  ${String(score).padStart(4, "0")}`;
      hiTxt.text = `HI  ${String(hiScore).padStart(4, "0")}`;
      playBeep(880, 0.2, "sawtooth", 0.15);
      explode(k.vec2(ufo.pos.x, ufo.pos.y));
      const floatTxt = k.add([
        k.text(`+${pts}`, { size: 14, font }),
        k.color(255, 23, 68),
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
      livesTxt.text = `LIVES  ${lives}`;
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
      livesTxt.text = `LIVES  ${lives}`;
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

    k.add([k.rect(W, H), bgColor(), k.pos(0, 0), k.fixed(), k.z(-10)]);
    k.add([
      k.text("GAME OVER", { size: 48, font }),
      k.color(255, 23, 68),
      k.pos(W / 2, H * 0.29),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`SCORE    ${String(score).padStart(5, "0")}`, { size: 18, font }),
      k.color(255, 255, 255),
      k.pos(W / 2, H * 0.46),
      k.anchor("center"),
    ]);
    k.add([
      k.text(`HI SCORE ${String(hiScore).padStart(5, "0")}`, { size: 18, font }),
      k.color(255, 235, 59),
      k.pos(W / 2, H * 0.53),
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

  k.go("title");

  return () => k.quit();
}
