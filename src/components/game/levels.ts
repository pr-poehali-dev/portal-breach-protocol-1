// 214 level definitions for Portal: Breach Protocol
// Each level has: room size, platforms, buttons, cubes, portallable walls, exit position

export interface LevelDef {
  id: number;
  name: string;
  roomW: number;
  roomH: number;
  roomD: number;
  platforms: { x: number; y: number; z: number; w: number; d: number }[];
  exitPos: { x: number; z: number };
  playerStart: { x: number; z: number };
  hint: string;
  // extra wall panels for portal placement
  extraPanels: { x: number; y: number; z: number; nx: number; ny: number; nz: number; pw: number; ph: number }[];
}

function level(
  id: number, name: string,
  roomW: number, roomH: number, roomD: number,
  platforms: { x: number; y: number; z: number; w: number; d: number }[],
  exitPos: { x: number; z: number },
  playerStart: { x: number; z: number },
  hint: string,
  extraPanels: { x: number; y: number; z: number; nx: number; ny: number; nz: number; pw: number; ph: number }[] = []
): LevelDef {
  return { id, name, roomW, roomH, roomD, platforms, exitPos, playerStart, hint, extraPanels };
}

// Generate 214 levels procedurally
export const LEVELS: LevelDef[] = [];

const HINTS = [
  'Создай портал на белой стене и пройди через него',
  'Используй платформу, чтобы добраться до выхода',
  'Стреляй ЛКМ — синий портал, ПКМ — оранжевый',
  'Высота не проблема, если есть два портала',
  'Помни о сохранении импульса при телепортации',
  'Посмотри на угол — иногда портал нужен на потолке',
  'Белые панели — единственные поверхности для порталов',
  'Прыгни через портал под углом — вылетишь с той же скоростью',
  'Кнопка открывает дверь — найди способ на неё встать',
  'Высокий прыжок + портал на полу = бесконечное ускорение',
];

// Level 1-30: Tutorial — simple rooms, one platform
for (let i = 1; i <= 30; i++) {
  const w = 12 + i * 0.5;
  const d = 14 + i * 0.4;
  const h = 5 + Math.floor(i / 5);
  const plats = i > 5 ? [{ x: 0, y: 1.5 + (i % 3), z: -d / 4, w: 3 + i * 0.1, d: 3 }] : [];
  LEVELS.push(level(i, `Камера ${i.toString().padStart(2, '0')}`, w, h, d, plats,
    { x: 0, z: -d / 2 + 1.5 }, { x: 0, z: d / 2 - 2 },
    HINTS[i % HINTS.length]
  ));
}

// Level 31-80: Intermediate — multi-platform, elevated exits
for (let i = 31; i <= 80; i++) {
  const idx = i - 30;
  const w = 16 + idx * 0.3;
  const d = 18 + idx * 0.3;
  const h = 7 + Math.floor(idx / 8);
  const baseY = 1 + (idx % 4);
  const plats = [
    { x: -(w / 4), y: baseY, z: 0, w: 4, d: 3 },
    { x: w / 4, y: baseY + 1.5, z: -d / 5, w: 3, d: 3 },
    { x: 0, y: baseY + 3, z: -d / 3, w: 5, d: 2.5 },
  ];
  const panels = [
    { x: -w / 2 + 0.15, y: h / 2, z: 0, nx: 1, ny: 0, nz: 0, pw: 8, ph: h - 1 },
    { x: w / 2 - 0.15, y: h / 2, z: 0, nx: -1, ny: 0, nz: 0, pw: 8, ph: h - 1 },
  ];
  LEVELS.push(level(i, `Камера ${i.toString().padStart(2, '0')}`, w, h, d, plats,
    { x: 0, z: -d / 2 + 1.5 }, { x: 0, z: d / 2 - 2 },
    HINTS[idx % HINTS.length], panels
  ));
}

// Level 81-150: Advanced — complex geometry
for (let i = 81; i <= 150; i++) {
  const idx = i - 80;
  const w = 20 + idx * 0.2;
  const d = 22 + idx * 0.2;
  const h = 9 + Math.floor(idx / 10);
  const plats = [
    { x: -(w / 3), y: 2, z: d / 4, w: 5, d: 3 },
    { x: 0, y: 4, z: 0, w: 3, d: 3 },
    { x: w / 3, y: 3, z: -d / 4, w: 5, d: 3 },
    { x: 0, y: 6, z: -d / 3.5, w: 4, d: 2 },
  ];
  const panels = [
    { x: -w / 2 + 0.15, y: h / 2, z: -d / 4, nx: 1, ny: 0, nz: 0, pw: 10, ph: h - 2 },
    { x: w / 2 - 0.15, y: h / 2, z: d / 4, nx: -1, ny: 0, nz: 0, pw: 10, ph: h - 2 },
    { x: 0, y: h - 0.15, z: 0, nx: 0, ny: -1, nz: 0, pw: w - 2, ph: d - 2 },
  ];
  LEVELS.push(level(i, `Камера ${i.toString().padStart(2, '0')}`, w, h, d, plats,
    { x: idx % 3 === 0 ? -4 : 4, z: -d / 2 + 1.5 }, { x: 0, z: d / 2 - 2 },
    HINTS[idx % HINTS.length], panels
  ));
}

// Level 151-214: Expert — massive rooms
for (let i = 151; i <= 214; i++) {
  const idx = i - 150;
  const w = 26 + idx * 0.15;
  const d = 28 + idx * 0.15;
  const h = 12 + Math.floor(idx / 8);
  const plats = [
    { x: -(w / 3), y: 2 + idx * 0.05, z: d / 3, w: 4, d: 3 },
    { x: w / 4, y: 4 + idx * 0.04, z: d / 5, w: 3, d: 3 },
    { x: -(w / 5), y: 6, z: 0, w: 5, d: 2 },
    { x: w / 3, y: 7, z: -d / 5, w: 4, d: 3 },
    { x: 0, y: 9, z: -d / 3, w: 6, d: 2.5 },
  ];
  const panels = [
    { x: -w / 2 + 0.15, y: h / 2, z: 0, nx: 1, ny: 0, nz: 0, pw: 12, ph: h - 2 },
    { x: w / 2 - 0.15, y: h / 2, z: 0, nx: -1, ny: 0, nz: 0, pw: 12, ph: h - 2 },
    { x: 0, y: h - 0.15, z: 0, nx: 0, ny: -1, nz: 0, pw: w - 2, ph: d - 2 },
    { x: 0, y: h / 2, z: -d / 2 + 0.15, nx: 0, ny: 0, nz: 1, pw: w - 2, ph: h - 2 },
  ];
  LEVELS.push(level(i, `Камера ${i.toString().padStart(2, '0')}`, w, h, d, plats,
    { x: idx % 2 === 0 ? -5 : 5, z: -d / 2 + 1.5 }, { x: 0, z: d / 2 - 2 },
    HINTS[idx % HINTS.length], panels
  ));
}
