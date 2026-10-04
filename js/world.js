'use strict';
// Mundo: geração procedural, colisão, recursos e desenho de terreno/construções.

const T = { DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, FOREST: 4, HILL: 5, MOUNT: 6, SNOW: 7, ROAD: 8, BRIDGE: 9, CFLOOR: 10, CWALL: 11 };
const TINFO = [
  { name: 'Mar Profundo', walk: false, speed: 0,    c: '#1d4e89' },
  { name: 'Água Rasa',    walk: true,  speed: 0.45, c: '#3a7bc8' },
  { name: 'Areia',        walk: true,  speed: 0.9,  c: '#d9c58b' },
  { name: 'Campo',        walk: true,  speed: 1,    c: '#5d9e3f' },
  { name: 'Floresta',     walk: true,  speed: 0.9,  c: '#3f7a2e' },
  { name: 'Colinas',      walk: true,  speed: 0.85, c: '#8a8a5c' },
  { name: 'Montanha',     walk: false, speed: 0,    c: '#6b6b6b' },
  { name: 'Neve',         walk: true,  speed: 0.8,  c: '#e3eaf0' },
  { name: 'Estrada',      walk: true,  speed: 1.25, c: '#a8885a' },
  { name: 'Ponte',        walk: true,  speed: 1.2,  c: '#8b5a2b' },
  { name: 'Chão de Caverna', walk: true, speed: 0.95, c: '#3d362e' },
  { name: 'Rocha da Caverna', walk: false, speed: 0, c: '#1c1815' },
];
// cores da estação: mistura a cor base do terreno com o tom da estação
function mixHex(a, b, t) { const x = U.hexRgb(a), y = U.hexRgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

// min: nível de ferramenta exigido (0 = mãos, 1 = pedra, 2 = bronze, 3 = ferro, 4 = aço)
// altitude a partir da qual o terreno vira montanha. Versão 2 do terreno = metade das montanhas da versão 1 (0.735).
// Jogos salvos antigos continuam usando o corte antigo, para o mundo deles não mudar.
// Versão 3: mesmo continente, com uma faixa larga de mar aberto em volta (mapa maior, para navegar) e portos.
const TERRAIN_CUTS = { 1: 0.735, 2: 0.7626, 3: 0.7626 };
const TERRAIN_V = 3, MOUNT_CUT = TERRAIN_CUTS[TERRAIN_V];

const OBJ = [null,
  /* 1 */ { name: 'Carvalho',          tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 6,  drops: { wood: [3, 5] },                     regrow: 240,  pc: '#3d7a2a' },
  /* 2 */ { name: 'Pinheiro',          tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 6,  drops: { wood: [2, 4], resin: [0, 2] },     regrow: 240,  pc: '#2d5e3a' },
  /* 3 */ { name: 'Rocha',                         blocks: true,  tool: 'pick', min: 0, hp: 8,  drops: { stone: [3, 5] },                    regrow: 400,  pc: '#9a9a9a' },
  /* 4 */ { name: 'Veio de Ferro',                 blocks: true,  tool: 'pick', min: 2, hp: 10, drops: { iron_ore: [2, 4], stone: [0, 1] },  regrow: 600,  pc: '#c27a45' },
  /* 5 */ { name: 'Veio de Ouro',                  blocks: true,  tool: 'pick', min: 3, hp: 12, drops: { gold_ore: [1, 3] },                 regrow: 900,  pc: '#f2c94c' },
  /* 6 */ { name: 'Arbusto de Frutas',             blocks: false, tool: null,   min: 0, hp: 1,  drops: { berries: [2, 4] },                  regrow: 180,  pc: '#5a3c8c' },
  /* 7 */ { name: 'Bétula',            tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 4,  drops: { wood: [2, 3] },                     regrow: 200,  pc: '#9cc06a' },
  /* 8 */ { name: 'Teixo',             tree: true, blocks: true,  tool: 'axe',  min: 1, hp: 8,  drops: { wood: [1, 2], yew_wood: [2, 3] },  regrow: 400,  pc: '#244f2a' },
  /* 9 */ { name: 'Macieira',          tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 5,  drops: { wood: [1, 2], apple: [2, 4] },     regrow: 260,  pc: '#4f8f30' },
  /* 10 */{ name: 'Carvalho Ancião',   tree: true, blocks: true,  tool: 'axe',  min: 3, hp: 16, drops: { hardwood: [4, 6], wood: [3, 5] },  regrow: 1200, pc: '#2a5a24' },
  /* 11 */{ name: 'Coqueiro',          tree: true, blocks: true,  tool: 'axe',  min: 0, hp: 5,  drops: { wood: [1, 2], coconut: [1, 3] },   regrow: 300,  pc: '#5a9a3a' },
  /* 12 */{ name: 'Veio de Carvão',                blocks: true,  tool: 'pick', min: 1, hp: 8,  drops: { coal: [2, 4], stone: [0, 1] },      regrow: 500,  pc: '#2a2a2a' },
  /* 13 */{ name: 'Veio de Cobre',                 blocks: true,  tool: 'pick', min: 1, hp: 9,  drops: { copper_ore: [2, 4] },               regrow: 500,  pc: '#c8743a' },
  /* 14 */{ name: 'Veio de Estanho',               blocks: true,  tool: 'pick', min: 1, hp: 9,  drops: { tin_ore: [2, 3] },                  regrow: 500,  pc: '#b8c4cc' },
  /* 15 */{ name: 'Veio de Prata',                 blocks: true,  tool: 'pick', min: 3, hp: 12, drops: { silver_ore: [1, 3] },               regrow: 900,  pc: '#e8eef5' },
  /* 16 */{ name: 'Cristais de Gema',              blocks: true,  tool: 'pick', min: 4, hp: 14, drops: { gem: [1, 2] },                      regrow: 1500, pc: '#b06cff' },
  /* 17 */{ name: 'Depósito de Argila',            blocks: false, tool: null,   min: 0, hp: 2,  drops: { clay: [2, 4] },                     regrow: 300,  pc: '#b5653a' },
  /* 18 */{ name: 'Linho',                         blocks: false, tool: null,   min: 0, hp: 1,  drops: { fiber: [2, 3] },                    regrow: 150,  pc: '#6a8fd0' },
  /* 19 */{ name: 'Erva Medicinal',                blocks: false, tool: null,   min: 0, hp: 1,  drops: { herb: [1, 2] },                     regrow: 200,  pc: '#7ac070' },
];
// tudo que se coleta no mapa (árvores, arbustos, linho, ervas, argila, rochas e minérios) só volta 1 ano (do calendário) depois
for (const o of OBJ) if (o) o.regrow = YEAR_DAYS * DAY_LEN;

const CH = 16; // tiles por chunk
const HALF = TILE / 2; // resolução interna (pixel art 2x)

const World = {
  idx(x, y) { return y * WORLD_W + x; },
  inb(x, y) { return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H; },
  tile(x, y) { return this.inb(x, y) ? this.tiles[y * WORLD_W + x] : T.DEEP; },

  // ---------------------------------------------------------------- geração
  generate(seed) {
    const N = WORLD_W * WORLD_H;
    const rng = U.mulberry32(seed);
    this.seed = seed;
    this.tiles = new Uint8Array(N);
    this.obj = new Uint8Array(N);
    this.objHp = new Uint8Array(N);
    this.terr = new Int8Array(N).fill(-1);
    this.sgrid = new Int16Array(N).fill(-1);
    this.elev = new Float32Array(N);
    this.structs = []; this.regrow = []; this.chunks = new Map(); this.shakes = new Map();
    this.villages = []; this.capitals = []; this.camps = [];

    const nE = U.makeNoise(seed), nM = U.makeNoise(seed ^ 0x5bd1), nD = U.makeNoise(seed ^ 0x2c3a);

    // elevação bruta: continente que ocupa quase todo o mapa, caindo para o mar só nas bordas
    const PAD = WORLD_PAD, IN = WORLD_W - PAD * 2;
    for (let y = 0; y < WORLD_H; y++) for (let x = 0; x < WORLD_W; x++) {
      const nx = (x - PAD) / IN - 0.5, ny = (y - PAD) / IN - 0.5;
      const d = Math.sqrt(nx * nx + ny * ny) * 2 * 0.55 + Math.max(Math.abs(nx), Math.abs(ny)) * 2 * 0.45;
      this.elev[y * WORLD_W + x] = (U.fbm(nE, (x - PAD) / 24, (y - PAD) / 24, 5) - 0.5) * 1.25 + 0.56 - Math.pow(d, 6) * 0.8;
    }
    // nível do mar por percentil (medido só no quadrado do continente): garante ~74% de terra ali
    const inner = []; for (let y = PAD; y < WORLD_H - PAD; y++) for (let x = PAD; x < WORLD_W - PAD; x++) inner.push(this.elev[y * WORLD_W + x]);
    const sorted = Float32Array.from(inner).sort(), NI = sorted.length;
    const pc = p => sorted[Math.floor(NI * p)];
    const knots = [[sorted[0] - 1e-6, 0], [pc(0.2), 0.27], [pc(0.26), 0.33], [pc(0.29), 0.36], [pc(0.8), 0.635], [pc(0.91), 0.735], [sorted[NI - 1] + 1e-6, 0.9]];
    const remap = v => {
      for (let k = 1; k < knots.length; k++) if (v <= knots[k][0]) {
        const [a, ea] = knots[k - 1], [b, eb] = knots[k];
        return ea + (v - a) / (b - a) * (eb - ea);
      }
      return 0.9;
    };
    for (let i = 0; i < N; i++) this.elev[i] = Math.max(0, remap(this.elev[i]));
    // ilhas no mar aberto, longe de qualquer costa: só alcançáveis de barco
    const openSea = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++)
        if (!this.inb(x, y) || this.elev[this.idx(x, y)] >= 0.29) return false;
      return true;
    };
    this.islands = [];
    for (const r of [7, 6, 6, 5, 5, 5, 4, 4]) {
      let best = null, bd = -1;
      for (let y = 4; y < WORLD_H - 4; y += 2) for (let x = 4; x < WORLD_W - 4; x += 2) {
        if (!openSea(x, y, r + 2)) continue;
        const md = this.islands.reduce((m, o) => Math.min(m, U.dist(x, y, o.x, o.y)), 999);
        if (md > bd) { bd = md; best = { x, y, r }; }
      }
      if (best && bd > 45) this.islands.push(best);
    }
    const islandBump = (x, y) => {
      let best = 0;
      for (const is of this.islands) {
        const dd = U.dist(x, y, is.x, is.y);
        if (dd > is.r + 3) continue;
        best = Math.max(best, 1 - dd / is.r + (U.hash2(x >> 1, y >> 1, seed + 99) - 0.5) * 0.5);
      }
      return best;
    };
    for (let y = 0; y < WORLD_H; y++) for (let x = 0; x < WORLD_W; x++) {
      const i = y * WORLD_W + x;
      let e = this.elev[i];
      const bump = islandBump(x, y);
      if (bump > 0) e = Math.max(e, 0.3 + bump * 0.42);
      this.elev[i] = e;
      const m = U.fbm(nM, x / 18, y / 18, 4);
      const north = y + (U.fbm(nD, x / 15, y / 15, 3) - 0.5) * 30 < WORLD_H * 0.24;
      let t;
      if (e < 0.27) t = T.DEEP;
      else if (e < 0.33) t = T.WATER;
      else if (e < 0.36) t = north ? T.SNOW : T.SAND;
      else if (e < 0.635) t = north ? T.SNOW : (m > 0.53 ? T.FOREST : T.GRASS);
      else if (e < (this.mountCut || MOUNT_CUT)) t = north ? T.SNOW : T.HILL;
      else t = T.MOUNT;
      this.tiles[i] = t;
    }

    if (this.onProgress) this.onProgress(0.2, 'Erguendo montanhas e cavando rios');
    // rios
    for (let r = 0; r < 18; r++) {
      let sx = 0, sy = 0, ok = false;
      for (let k = 0; k < 400 && !ok; k++) {
        sx = Math.floor(rng() * WORLD_W); sy = Math.floor(rng() * WORLD_H);
        const e = this.elev[this.idx(sx, sy)];
        ok = e > 0.64 && e < 0.73;
      }
      if (!ok) continue;
      const seen = new Set();
      let x = sx, y = sy;
      for (let s = 0; s < 520; s++) {
        const i = this.idx(x, y);
        if (this.tiles[i] === T.DEEP) break;
        this.tiles[i] = T.WATER; seen.add(i);
        if (this.elev[i] < 0.33 && s > 2) break;
        let best = null, be = 1e9;
        for (const [dx, dy] of DIRS4) {
          const nx = x + dx, ny = y + dy;
          if (!this.inb(nx, ny)) continue;
          const ni = this.idx(nx, ny);
          if (seen.has(ni)) continue;
          const ev = this.elev[ni] + rng() * 0.02;
          if (ev < be) { be = ev; best = [nx, ny]; }
        }
        if (!best) break;
        [x, y] = best;
      }
    }

    if (this.onProgress) this.onProgress(0.35, 'Plantando florestas e escondendo minérios');
    // recursos
    for (let y = 0; y < WORLD_H; y++) for (let x = 0; x < WORLD_W; x++) {
      const i = this.idx(x, y), h = U.hash2(x, y, seed + 7), h2 = U.hash2(x, y, seed + 13), t = this.tiles[i], e = this.elev[i];
      const wet = DIRS4.some(([dx, dy]) => this.tile(x + dx, y + dy) === T.WATER);
      // tabela [limite, objeto]: o primeiro limite maior que h vence
      const pickFrom = table => { for (const [lim, id] of table) if (h < lim) return id; return 0; };
      let o = 0;
      if (t === T.GRASS) {
        o = pickFrom([[0.035, 1], [0.05, 7], [0.058, 9], [0.078, 6], [0.1, 18], [0.11, 3]]);
        if (!o && wet && h2 < 0.15) o = 17;
      } else if (t === T.FOREST) {
        o = pickFrom([[0.3, 1], [0.38, 7], [0.41, 8], [0.416, 10], [0.45, 6], [0.475, 19], [0.485, 3]]);
      } else if (t === T.HILL) {
        o = pickFrom([[0.09, 3], [0.12, 12], [0.145, 13], [0.168, 14], [0.198, 4], [0.208, e > 0.67 ? 5 : 0], [0.218, e > 0.68 ? 15 : 0], [0.223, e > 0.69 ? 16 : 0], [0.24, 2]]);
      } else if (t === T.SNOW) {
        o = pickFrom([[0.15, 2], [0.19, 3], [0.21, 4], [0.225, 12], [0.233, e > 0.6 ? 15 : 0], [0.238, e > 0.62 ? 16 : 0]]);
      } else if (t === T.SAND) {
        o = pickFrom([[wet ? 0.07 : 0.03, 11], [0.04, 3]]);
        if (!o && wet && h2 < 0.12) o = 17;
      }
      if (o) { this.obj[i] = o; this.objHp[i] = OBJ[o].hp; }
    }

    // riquezas das ilhas
    for (const is of this.islands) {
      const loot = [10, 15, 15, 5, 5, 16, 13, 14];
      let k = 0;
      for (let tries = 0; tries < 200 && k < loot.length; tries++) {
        const x = is.x + Math.round((rng() - 0.5) * is.r * 1.6), y = is.y + Math.round((rng() - 0.5) * is.r * 1.6);
        if (!this.inb(x, y)) continue;
        const t = this.tile(x, y), i = this.idx(x, y);
        if (t === T.DEEP || t === T.WATER || t === T.MOUNT || this.obj[i]) continue;
        this.obj[i] = loot[k]; this.objHp[i] = OBJ[loot[k]].hp; k++;
      }
    }

    // ponto inicial: campo perto do centro
    let start = null, sd = 1e9;
    for (let y = 8; y < WORLD_H - 8; y++) for (let x = 8; x < WORLD_W - 8; x++) {
      if (this.tiles[this.idx(x, y)] !== T.GRASS) continue;
      let d = U.dist(x, y, WORLD_W / 2, WORLD_H / 2);
      if (d >= sd || !this.areaOk(x - 2, y - 2, 6, 7)) continue;
      // prefere começar perto de água (para pescar e navegar)
      let water = false;
      for (let j = y - 9; j <= y + 9 && !water; j++) for (let k = x - 9; k <= x + 9; k++) if (this.tile(k, j) === T.WATER) { water = true; break; }
      if (!water) d += 30;
      if (d < sd) { sd = d; start = { x, y }; }
    }
    if (!start) return false;
    this.start = start;

    // alcançabilidade a partir do início
    const reach = new Uint8Array(N);
    const q = [this.idx(start.x, start.y)]; reach[q[0]] = 1;
    while (q.length) {
      const c = q.pop(), cx = c % WORLD_W, cy = (c / WORLD_W) | 0;
      for (const [dx, dy] of DIRS4) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.inb(nx, ny)) continue;
        const ni = this.idx(nx, ny);
        if (reach[ni] || !TINFO[this.tiles[ni]].walk) continue;
        reach[ni] = 1; q.push(ni);
      }
    }

    if (this.onProgress) this.onProgress(0.5, 'Fundando os sete reinos');
    // capitais: amostragem de pontos bem distantes entre si
    const NC = CIV_DEFS.length;
    const cands = [];
    for (let k = 0; k < 14000; k++) {
      const x = 8 + Math.floor(rng() * (WORLD_W - 16)), y = 8 + Math.floor(rng() * (WORLD_H - 16));
      if (reach[this.idx(x, y)] && this.areaOk(x - 4, y - 4, 9, 10)) cands.push({ x, y });
    }
    if (cands.length < 20) return false;
    const chosen = [start], caps = [];
    for (let k = 0; k < NC; k++) {
      let best = null, bd = -1;
      for (const c of cands) {
        let md = 1e9;
        for (const o of chosen) md = Math.min(md, U.dist(c.x, c.y, o.x, o.y));
        if (md > bd) { bd = md; best = c; }
      }
      if (bd < 20) return false;
      caps.push(best); chosen.push(best);
    }

    // identidade de cada civilização conforme o terreno ao redor
    const around = (c, types) => {
      let n = 0;
      for (let y = c.y - 14; y <= c.y + 14; y++) for (let x = c.x - 14; x <= c.x + 14; x++)
        if (types.includes(this.tile(x, y))) n++;
      return n;
    };
    const left = caps.slice();
    const take = fn => { let bi = 0; for (let i = 1; i < left.length; i++) if (fn(left[i]) > fn(left[bi])) bi = i; return left.splice(bi, 1)[0]; };
    this.capitals[2] = take(c => -c.y);                           // Nordheim: mais ao norte
    this.capitals[3] = take(c => around(c, [T.FOREST]));          // Elvaren: florestas
    this.capitals[4] = take(c => around(c, [T.HILL, T.MOUNT]));   // Mordrak: colinas
    this.capitals[1] = take(c => around(c, [T.HILL, T.SAND]));    // Karthum
    this.capitals[6] = take(c => around(c, [T.HILL]));            // Valtaris: colinas suaves
    this.capitals[5] = take(c => around(c, [T.SAND, T.WATER]));   // Brennor: costa
    this.capitals[0] = left[0];                                   // Valdória

    // territórios
    for (let y = 0; y < WORLD_H; y++) for (let x = 0; x < WORLD_W; x++) {
      const i = this.idx(x, y);
      if (this.tiles[i] === T.DEEP) continue;
      if (U.dist(x, y, start.x, start.y) < 24) continue;
      let bc = -1, bd = 62;
      for (let c = 0; c < NC; c++) {
        const d = U.dist(x, y, this.capitals[c].x, this.capitals[c].y);
        if (d < bd) { bd = d; bc = c; }
      }
      this.terr[i] = bc;
    }

    // castelos
    for (let c = 0; c < NC; c++) {
      const cp = this.capitals[c];
      const s = this.addStruct('castle', cp.x - 3, cp.y - 3, 7, 7, c);
      cp.door = { x: cp.x, y: cp.y + 4 };
      cp.struct = s;
    }

    // vilas: 3 por reino, bem espaçadas
    let vn = Math.floor(rng() * VILLAGE_NAMES.length);
    for (let c = 0; c < NC; c++) {
      const cp = this.capitals[c];
      let made = 0;
      for (let tries = 0; tries < 4000 && made < 3; tries++) {
        const a = rng() * Math.PI * 2, r = 16 + rng() * (tries < 2000 ? 22 : 34);
        const vx = Math.round(cp.x + Math.cos(a) * r), vy = Math.round(cp.y + Math.sin(a) * r);
        if (!this.inb(vx, vy) || this.terr[this.idx(vx, vy)] !== c) continue;
        if (!this.areaOk(vx - 7, vy - 5, 15, 12) || !this.areaFree(vx - 8, vy - 6, 17, 14)) continue;
        if (this.villages.some(v => U.dist(v.x, v.y, vx, vy) < 24)) continue;
        const vi = this.villages.length;
        const v = { civ: c, x: vx, y: vy, name: VILLAGE_NAMES[vn++ % VILLAGE_NAMES.length] };
        // praça no centro (vx, vy-1); casas e lojas espalhadas em volta
        v.store = this.addStruct('store', vx - 7, vy - 4, 3, 2, c, { village: vi });
        v.tavern = this.addStruct('tavern', vx + 5, vy - 4, 3, 2, c, { village: vi });
        this.addStruct('vhouse', vx - 1, vy - 5, 2, 2, c, { village: vi });
        v.smith = this.addStruct('smith', vx - 7, vy + 1, 2, 2, c, { village: vi });
        v.lumber = this.addStruct('lumber', vx - 3, vy + 2, 2, 2, c, { village: vi });
        v.quarry = this.addStruct('quarry', vx + 2, vy + 2, 2, 2, c, { village: vi });
        this.addStruct('vhouse', vx + 6, vy + 1, 2, 2, c, { village: vi });
        this.addStruct('field', vx - 7, vy + 5, 3, 2, c);
        this.addStruct('vhouse', vx - 1, vy + 5, 2, 2, c, { village: vi });
        this.addStruct('field', vx + 5, vy + 5, 3, 2, c);
        this.villages.push(v); made++;
      }
    }

    // cabana inicial
    for (let y = start.y - 3; y <= start.y + 5; y++) for (let x = start.x - 3; x <= start.x + 4; x++)
      if (this.inb(x, y)) this.obj[this.idx(x, y)] = 0;
    this.startCabin = this.addStruct('cabin', start.x, start.y, 2, 2, 'player');
    this.start.door = { x: start.x, y: start.y + 2 };

    if (this.onProgress) this.onProgress(0.68, 'Abrindo estradas entre as vilas');
    // estradas
    const pairs = new Set();
    const road = (a, b) => { const p = this.findPath(a.x, a.y, b.x, b.y); if (p) this.carveRoad(p); };
    for (const v of this.villages) road({ x: v.x, y: v.y - 1 }, this.capitals[v.civ].door);
    for (let c = 0; c < NC; c++) {
      const others = CIV_DEFS.map((_, i) => i).filter(o => o !== c)
        .sort((a, b) => U.dist(this.capitals[c].x, this.capitals[c].y, this.capitals[a].x, this.capitals[a].y) -
                        U.dist(this.capitals[c].x, this.capitals[c].y, this.capitals[b].x, this.capitals[b].y));
      for (const o of others.slice(0, 2)) {
        const key = Math.min(c, o) + '-' + Math.max(c, o);
        if (pairs.has(key)) continue;
        pairs.add(key);
        road(this.capitals[c].door, this.capitals[o].door);
      }
    }
    let nc = 0;
    for (let c = 1; c < NC; c++) if (U.dist(start.x, start.y, this.capitals[c].x, this.capitals[c].y) < U.dist(start.x, start.y, this.capitals[nc].x, this.capitals[nc].y)) nc = c;
    road(this.start.door, this.capitals[nc].door);

    // acampamentos de bandidos
    for (let tries = 0; tries < 8000 && this.camps.length < 14; tries++) {
      const x = 4 + Math.floor(rng() * (WORLD_W - 8)), y = 4 + Math.floor(rng() * (WORLD_H - 8));
      if (!reach[this.idx(x, y)]) continue;
      if (U.dist(x, y, start.x, start.y) < 28) continue;
      if (this.capitals.some(c => U.dist(x, y, c.x, c.y) < 22)) continue;
      if (this.villages.some(v => U.dist(x, y, v.x, v.y) < 16)) continue;
      if (this.camps.some(c => U.dist(x, y, c.x, c.y) < 30)) continue;
      if (!this.areaOk(x - 1, y - 1, 5, 5) || !this.areaFree(x - 1, y - 1, 5, 5)) continue;
      const s = this.addStruct('camp', x, y, 3, 3, 'bandit', { cleared: false, left: 4, respawnDay: 0 });
      this.camps.push(s);
    }

    if (this.onProgress) this.onProgress(0.9, 'Escavando cavernas e masmorras');
    Dungeon.placeCaves(this, rng, reach);
    this.buildMinimap();
    return true;
  },

  areaOk(x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const t = this.tile(i, j);
      if (!this.inb(i, j) || t === T.DEEP || t === T.WATER || t === T.MOUNT) return false;
    }
    return true;
  },
  areaFree(x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
      if (this.inb(i, j) && this.sgrid[this.idx(i, j)] >= 0) return false;
    return true;
  },

  // tira uma construção do mapa (o número dela continua reservado)
  removeStruct(s) {
    s.hidden = true; s.blocks = false; s.removed = true;
    for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { const k = this.idx(i, j); if (this.sgrid[k] === s.id) this.sgrid[k] = -1; }
    this.chunks.clear();
  },
  addStruct(type, x, y, w, h, owner, extra) {
    const info = BUILDINGS[type] && owner === 'player' ? BUILDINGS[type] : CIV_STRUCTS[type];
    // okey: tipo e posição de origem, iguais em todo carregamento (usado para guardar obras de chefes e reis)
    const s = Object.assign({ id: this.structs.length, okey: type + '@' + x + ',' + y, type, x, y, w, h, owner, blocks: info.blocks }, extra || {});
    this.structs.push(s);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const k = this.idx(i, j);
      this.sgrid[k] = s.id; this.obj[k] = 0;
    }
    return s;
  },

  findPath(sx, sy, ex, ey) {
    const N = WORLD_W * WORLD_H;
    const g = new Float32Array(N).fill(Infinity);
    const from = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const COST = [Infinity, 6, 1.5, 1, 2.2, 2.5, 25, 1.8, 0.4, 0.5, 1, Infinity];
    const s = this.idx(sx, sy), e = this.idx(ex, ey);
    const heap = new MinHeap();
    g[s] = 0; heap.push(s, 0);
    while (heap.size) {
      const cur = heap.pop();
      if (cur === e) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % WORLD_W, cy = (cur / WORLD_W) | 0;
      for (const [dx, dy] of DIRS4) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.inb(nx, ny)) continue;
        const ni = this.idx(nx, ny);
        if (closed[ni]) continue;
        let c = COST[this.tiles[ni]];
        if (!isFinite(c)) continue;
        const sid = this.sgrid[ni];
        if (sid >= 0 && ni !== e) { if (this.structs[sid].blocks) continue; c += 2; }
        const ng = g[cur] + c;
        if (ng < g[ni]) {
          g[ni] = ng; from[ni] = cur;
          heap.push(ni, ng + (Math.abs(nx - ex) + Math.abs(ny - ey)) * 0.5);
        }
      }
    }
    if (from[e] < 0) return null;
    const path = [];
    for (let c = e; c !== -1; c = from[c]) path.push(c);
    return path;
  },
  carveRoad(path) {
    for (const i of path) {
      if (this.sgrid[i] >= 0) continue;
      const t = this.tiles[i];
      this.tiles[i] = (t === T.WATER || t === T.BRIDGE) ? T.BRIDGE : T.ROAD;
      this.obj[i] = 0;
    }
  },

  // ---------------------------------------------------------------- consultas
  isWater(t) { return t === T.WATER || t === T.DEEP || t === T.BRIDGE; },
  // sail = verdadeiro quando se navega de barco: só a água é passável
  blocked(tx, ty, sail) {
    if (!this.inb(tx, ty)) return true;
    const i = this.idx(tx, ty);
    const s = this.sgrid[i];
    if (s >= 0 && this.structs[s].blocks) return true;
    if (sail) return !this.isWater(this.tiles[i]);
    if (!TINFO[this.tiles[i]].walk) return true;
    const o = this.obj[i];
    return !!(o && OBJ[o].blocks);
  },
  blockedAt(px, py, r, sail) {
    const y0 = py - r, y1 = py - 1;
    return this.blocked(Math.floor((px - r) / TILE), Math.floor(y0 / TILE), sail) ||
           this.blocked(Math.floor((px + r) / TILE), Math.floor(y0 / TILE), sail) ||
           this.blocked(Math.floor((px - r) / TILE), Math.floor(y1 / TILE), sail) ||
           this.blocked(Math.floor((px + r) / TILE), Math.floor(y1 / TILE), sail);
  },
  speedAt(px, py) {
    const t = this.tile(Math.floor(px / TILE), Math.floor((py - 2) / TILE));
    if (t === T.WATER && this.season === 3) return 0.9; // gelo
    return TINFO[t].speed || 1;
  },
  terrAt(px, py) {
    const x = Math.floor(px / TILE), y = Math.floor(py / TILE);
    return this.inb(x, y) ? this.terr[this.idx(x, y)] : -1;
  },

  removeObj(i) {
    const t = this.obj[i];
    if (!t) return;
    this.obj[i] = 0;
    this.regrow.push({ i, t, time: OBJ[t].regrow });
  },
  updateRegrow(dt, px, py) {
    for (let k = this.regrow.length - 1; k >= 0; k--) {
      const r = this.regrow[k];
      r.time -= dt;
      if (r.time > 0) continue;
      const tt = this.tiles[r.i];
      if (this.sgrid[r.i] >= 0 || tt === T.ROAD || tt === T.BRIDGE) { this.regrow.splice(k, 1); continue; }
      const x = r.i % WORLD_W, y = (r.i / WORLD_W) | 0;
      if (U.dist((x + 0.5) * TILE, (y + 0.5) * TILE, px, py) < TILE * 3) { r.time = 10; continue; }
      this.obj[r.i] = r.t; this.objHp[r.i] = OBJ[r.t].hp;
      this.regrow.splice(k, 1);
    }
  },
  shake(i) { this.shakes.set(i, 0.2); },

  // ---------------------------------------------------------------- minimapa
  buildMinimap() {
    const c = document.createElement('canvas');
    c.width = WORLD_W; c.height = WORLD_H;
    const g = c.getContext('2d');
    const img = g.createImageData(WORLD_W, WORLD_H);
    for (let i = 0; i < WORLD_W * WORLD_H; i++) {
      const [r, gg, b] = this.miniColor(i);
      img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    this.mini = c;
  },
  miniColor(i) {
    let [r, gg, b] = U.hexRgb(TINFO[this.tiles[i]].c);
    if (this.obj[i] && OBJ[this.obj[i]].tree) { r *= 0.75; gg *= 0.8; b *= 0.75; }
    const t = this.terr[i];
    if (t >= 0 && this.tiles[i] !== T.WATER && this.tiles[i] !== T.DEEP) {
      const cr = U.hexRgb(CIV_DEFS[t].color);
      r = r * 0.7 + cr[0] * 0.3; gg = gg * 0.7 + cr[1] * 0.3; b = b * 0.7 + cr[2] * 0.3;
    }
    return [Math.round(r), Math.round(gg), Math.round(b)];
  },
  // repinta um único ponto do minimapa (ao abrir ou remover uma estrada)
  miniPixel(i) {
    if (!this.mini) return;
    const [r, g, b] = this.miniColor(i);
    const cx = this.mini.getContext('2d');
    cx.fillStyle = `rgb(${r},${g},${b})`; cx.fillRect(i % WORLD_W, (i / WORLD_W) | 0, 1, 1);
  },
  // metade das montanhas vira colina (as mais baixas). Roda depois da geração, então castelos, vilas e cavernas
  // continuam no mesmo lugar e os jogos salvos antigos também ficam com menos montanhas.
  thinMountains() {
    const N = WORLD_W * WORLD_H, el = [];
    for (let i = 0; i < N; i++) if (this.tiles[i] === T.MOUNT) el.push(this.elev[i]);
    this.mountStats = { before: el.length, after: el.length };
    if (el.length < 2) return;
    el.sort((a, b) => a - b);
    const cut = el[Math.floor(el.length / 2)];
    const hillOres = e => [[0.09, 3], [0.12, 12], [0.145, 13], [0.168, 14], [0.198, 4], [0.208, e > 0.67 ? 5 : 0], [0.218, e > 0.68 ? 15 : 0], [0.223, e > 0.69 ? 16 : 0], [0.24, 2]];
    const snowOres = e => [[0.15, 2], [0.19, 3], [0.21, 4], [0.225, 12], [0.233, e > 0.6 ? 15 : 0], [0.238, e > 0.62 ? 16 : 0]];
    const change = [];
    for (let i = 0; i < N; i++) if (this.tiles[i] === T.MOUNT && this.elev[i] < cut && this.sgrid[i] < 0) change.push(i);
    for (const i of change) {
      const x = i % WORLD_W, y = (i / WORLD_W) | 0;
      // no norte gelado vira neve; no resto, colina
      let snow = 0, other = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = this.tile(x + dx, y + dy); if (t === T.SNOW) snow++; else if (t === T.HILL || t === T.GRASS || t === T.FOREST) other++; }
      const t = snow > other ? T.SNOW : T.HILL;
      this.tiles[i] = t;
      if (!this.obj[i]) {
        const h = U.hash2(x, y, this.seed + 7), e = this.elev[i];
        let o = 0;
        for (const [lim, id] of (t === T.SNOW ? snowOres : hillOres)(e)) if (h < lim) { o = id; break; }
        if (o) { this.obj[i] = o; this.objHp[i] = OBJ[o].hp; }
      }
    }
    this.mountStats.after = el.length - change.length;
    this.chunks = new Map();
  },
  // troca o terreno de um bloco (estradas) e redesenha o pedaço do mapa
  setTile(i, t) {
    this.tiles[i] = t;
    if (t === T.ROAD || t === T.BRIDGE) this.obj[i] = 0;
    const x = i % WORLD_W, y = (i / WORLD_W) | 0;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) this.chunks.delete(Math.floor((x + dx) / CH) + ',' + Math.floor((y + dy) / CH));
    this.miniPixel(i);
  },

  // ---------------------------------------------------------------- desenho do terreno
  getChunk(cx, cy) {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (c) { this.chunks.delete(key); this.chunks.set(key, c); return c; }
    if (this.chunks.size > 220) this.chunks.delete(this.chunks.keys().next().value);
    c = document.createElement('canvas');
    c.width = c.height = CH * HALF;
    const g = c.getContext('2d');
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const x = cx * CH + tx, y = cy * CH + ty;
      this.paintTile(g, x, y, tx * HALF, ty * HALF);
    }
    this.chunks.set(key, c);
    return c;
  },
  paintTile(g, x, y, px, py) {
    const t = this.tile(x, y);
    const r = U.mulberry32(((x * 73856093) ^ (y * 19349663) ^ this.seed) >>> 0);
    let base = TINFO[t].c;
    const sn = this.season, land = t === T.GRASS || t === T.FOREST || t === T.HILL;
    if (sn === 0 && land) base = mixHex(base, '#6ec04a', 0.25);
    if (sn === 2 && land) base = mixHex(base, t === T.HILL ? '#9a7a4a' : '#b08a3a', 0.38);
    if (sn === 3 && (land || t === T.SAND)) base = mixHex(base, '#e6edf2', 0.78);
    if (sn === 3 && t === T.WATER) base = '#b9d8ea';
    g.fillStyle = U.shade(base, (r() - 0.5) * 0.05);
    g.fillRect(px, py, HALF, HALF);
    const dot = (col, n, w = 1, h = 1) => { g.fillStyle = col; for (let k = 0; k < n; k++) g.fillRect(px + Math.floor(r() * (HALF - w + 1)), py + Math.floor(r() * (HALF - h + 1)), w, h); };
    switch (t) {
      case T.GRASS:
        dot(U.shade(base, -0.08), 5, 1, 2); dot(U.shade(base, 0.07), 3);
        if (r() < 0.06) dot(r() < 0.5 ? '#f4e36b' : '#f5f5f5', 1);
        break;
      case T.FOREST: dot(U.shade(base, -0.07), 7, 1, 2); dot(U.shade(base, 0.05), 3); break;
      case T.SAND: dot(U.shade(base, -0.08), 4); dot(U.shade(base, 0.06), 3); break;
      case T.WATER: if (sn === 3) { dot('#ffffff', 2, 4, 1); dot('#9ac0d8', 2, 3, 1); } else dot(U.shade(base, 0.1), 2, 3, 1); break;
      case T.DEEP: dot(U.shade(base, -0.05), 2, 4, 1); dot(U.shade(base, 0.06), 1, 3, 1); break;
      case T.HILL: dot(U.shade(base, -0.1), 2, 4, 1); dot(U.shade(base, 0.08), 3, 2, 1); break;
      case T.MOUNT: {
        g.fillStyle = U.shade(base, -0.08); g.fillRect(px, py + 10, HALF, 6);
        g.fillStyle = U.shade(base, 0.1);
        g.beginPath(); g.moveTo(px + 1, py + 14); g.lineTo(px + 8, py + 2); g.lineTo(px + 15, py + 14); g.fill();
        g.fillStyle = U.shade(base, -0.12);
        g.beginPath(); g.moveTo(px + 8, py + 2); g.lineTo(px + 15, py + 14); g.lineTo(px + 9, py + 14); g.fill();
        if (this.elev[this.idx(x, y)] > 0.74 || sn === 3) { g.fillStyle = '#f4f7f9'; g.beginPath(); g.moveTo(px + 5, py + 7); g.lineTo(px + 8, py + 2); g.lineTo(px + 11, py + 7); g.fill(); }
        break;
      }
      case T.SNOW: dot('#c9d6e2', 4); dot('#ffffff', 3); break;
      case T.CFLOOR: dot(U.shade(base, -0.06), 5); dot(U.shade(base, 0.06), 3); if (r() < 0.05) dot('#6a5a48', 1, 2, 1); break;
      case T.CWALL:
        dot(U.shade(base, 0.06), 4, 2, 1); dot('#0e0c0a', 3);
        if (this.tile(x, y + 1) === T.CFLOOR) { g.fillStyle = '#2e2822'; g.fillRect(px, py + 11, HALF, 5); g.fillStyle = '#4a4036'; g.fillRect(px, py + 11, HALF, 1); }
        break;
      case T.ROAD: dot(U.shade(base, -0.12), 4); dot(U.shade(base, 0.08), 3); break;
      case T.BRIDGE:
        g.fillStyle = U.shade(base, -0.15);
        for (let k = 0; k < HALF; k += 4) g.fillRect(px + k, py, 1, HALF);
        g.fillStyle = '#5a3a1a'; g.fillRect(px, py, HALF, 1); g.fillRect(px, py + HALF - 1, HALF, 1);
        break;
    }
    // espuma nas margens
    if ((t === T.WATER && sn !== 3) || t === T.DEEP) {
      g.fillStyle = 'rgba(220,240,255,0.55)';
      const land = n => n !== T.WATER && n !== T.DEEP && n !== T.BRIDGE;
      if (land(this.tile(x, y - 1))) g.fillRect(px, py, HALF, 1);
      if (land(this.tile(x, y + 1))) g.fillRect(px, py + HALF - 1, HALF, 1);
      if (land(this.tile(x - 1, y))) g.fillRect(px, py, 1, HALF);
      if (land(this.tile(x + 1, y))) g.fillRect(px + HALF - 1, py, 1, HALF);
    }
    // fronteiras dos territórios
    const tr = this.inb(x, y) ? this.terr[this.idx(x, y)] : -1;
    if (tr >= 0 && TINFO[t].walk && t !== T.CFLOOR) {
      g.fillStyle = U.rgba(CIV_DEFS[tr].color, 0.8);
      const other = (nx, ny) => this.inb(nx, ny) && this.terr[this.idx(nx, ny)] !== tr && this.tiles[this.idx(nx, ny)] !== T.DEEP;
      if (other(x, y - 1)) { g.fillRect(px + 1, py, 5, 1); g.fillRect(px + 9, py, 5, 1); }
      if (other(x, y + 1)) { g.fillRect(px + 1, py + HALF - 1, 5, 1); g.fillRect(px + 9, py + HALF - 1, 5, 1); }
      if (other(x - 1, y)) { g.fillRect(px, py + 1, 1, 5); g.fillRect(px, py + 9, 1, 5); }
      if (other(x + 1, y)) { g.fillRect(px + HALF - 1, py + 1, 1, 5); g.fillRect(px + HALF - 1, py + 9, 1, 5); }
    }
  },

  // ---------------------------------------------------------------- sprites dos recursos
  sprites: null,
  makeSprites() {
    const mk = (fn, w = 24, h = 32) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; };
    const circ = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    const shadow = g => { g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(12, 30, 8, 2.5, 0, 0, Math.PI * 2); g.fill(); };
    const S = [];
    S[1] = ['#2f7d32', '#3a8a3a', '#2b6e2b'].map(col => mk(g => {
      shadow(g);
      g.fillStyle = '#5b3a1e'; g.fillRect(10, 18, 4, 12); g.fillStyle = '#3f2814'; g.fillRect(12, 18, 2, 12);
      circ(g, 12, 13, 8, U.shade(col, -0.08)); circ(g, 7, 16, 5, U.shade(col, -0.1)); circ(g, 17, 16, 5, U.shade(col, -0.1));
      circ(g, 12, 11, 7, col); circ(g, 9, 9, 3, U.shade(col, 0.1));
    }));
    S[2] = ['#2d5e3a', '#335f40', '#28533a'].map(col => mk(g => {
      shadow(g);
      g.fillStyle = '#4a2f18'; g.fillRect(11, 24, 3, 6);
      for (let k = 0; k < 3; k++) {
        const y = 24 - k * 6, w = 10 - k * 2.5;
        g.fillStyle = U.shade(col, -0.05 + k * 0.04);
        g.beginPath(); g.moveTo(12 - w, y); g.lineTo(12, y - 10); g.lineTo(12 + w, y); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(12 - w + 2, y - 1, 3, 1);
      }
    }));
    const rock = (spots) => mk(g => {
      shadow(g);
      g.fillStyle = '#6e6e6e'; g.beginPath(); g.moveTo(3, 30); g.lineTo(5, 21); g.lineTo(11, 17); g.lineTo(18, 19); g.lineTo(21, 30); g.fill();
      g.fillStyle = '#9b9b9b'; g.beginPath(); g.moveTo(5, 22); g.lineTo(11, 17); g.lineTo(18, 19); g.lineTo(15, 23); g.lineTo(8, 24); g.fill();
      g.fillStyle = '#545454'; g.fillRect(13, 25, 6, 1);
      if (spots) { g.fillStyle = spots; [[8, 25], [14, 21], [11, 27], [17, 26], [7, 21]].forEach(([x, y]) => g.fillRect(x, y, 2, 2)); }
    });
    S[3] = [rock(null)]; S[4] = [rock('#d0763a')]; S[5] = [rock('#ffd84a')];
    S[6] = ['#5a3c8c', '#b2283a'].map(col => mk(g => {
      shadow(g);
      circ(g, 12, 25, 6, '#3f7d2a'); circ(g, 8, 26, 4, '#356b23'); circ(g, 16, 26, 4, '#356b23');
      g.fillStyle = col; [[9, 23], [13, 22], [15, 26], [10, 27], [12, 25]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    }));
    // bétula: tronco branco com manchas e copa clara
    S[7] = ['#8fbf5a', '#a3c96a'].map(col => mk(g => {
      shadow(g);
      g.fillStyle = '#ecebe2'; g.fillRect(10, 15, 4, 15);
      g.fillStyle = '#2a2a2a'; g.fillRect(10, 18, 2, 1); g.fillRect(12, 22, 2, 1); g.fillRect(10, 26, 2, 1);
      circ(g, 12, 12, 7, U.shade(col, -0.1)); circ(g, 8, 14, 4, U.shade(col, -0.06)); circ(g, 16, 14, 4, U.shade(col, -0.06));
      circ(g, 12, 10, 5, col); g.fillStyle = '#e8f0a0'; g.fillRect(9, 8, 2, 2); g.fillRect(14, 11, 2, 2);
    }));
    // teixo: copa escura e densa, tronco avermelhado
    S[8] = [mk(g => {
      shadow(g);
      g.fillStyle = '#7a3a22'; g.fillRect(10, 20, 4, 10);
      g.fillStyle = '#1f4524'; g.beginPath(); g.ellipse(12, 15, 9, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a5a2e'; g.beginPath(); g.ellipse(11, 12, 6, 8, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c0283a'; [[8, 16], [15, 12], [13, 20], [10, 9]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    })];
    // macieira
    S[9] = [mk(g => {
      shadow(g);
      g.fillStyle = '#6b4423'; g.fillRect(10, 18, 4, 12);
      circ(g, 12, 13, 8, '#3f7f2a'); circ(g, 7, 15, 5, '#3a7526'); circ(g, 17, 15, 5, '#3a7526'); circ(g, 12, 10, 6, '#4f8f30');
      g.fillStyle = '#e0302a'; [[8, 12], [14, 9], [16, 15], [11, 16], [6, 16], [12, 6]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    })];
    // carvalho ancião: maior, com musgo
    S[10] = [mk(g => {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(16, 38, 13, 3.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a2e16'; g.fillRect(12, 22, 8, 16); g.fillRect(9, 34, 14, 4);
      g.fillStyle = '#3a2410'; g.fillRect(16, 22, 3, 16);
      g.fillStyle = '#6a8a3a'; g.fillRect(12, 26, 2, 4);
      circ(g, 16, 16, 12, '#1f4a1c'); circ(g, 7, 20, 7, '#1f4a1c'); circ(g, 25, 20, 7, '#1f4a1c');
      circ(g, 15, 13, 9, '#2a5a24'); circ(g, 11, 10, 4, '#3a6e2e'); circ(g, 21, 15, 4, '#346a2a');
      g.fillStyle = '#c9e07a'; [[10, 9], [20, 13], [14, 18], [6, 19]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    }, 32, 40)];
    // coqueiro
    S[11] = [mk(g => {
      shadow(g);
      g.fillStyle = '#8a6a3a';
      for (let k = 0; k < 8; k++) g.fillRect(11 + Math.round(Math.sin(k * 0.35) * 2), 29 - k * 2.4, 3, 3);
      g.fillStyle = '#6a4a26'; for (let k = 0; k < 8; k++) g.fillRect(11 + Math.round(Math.sin(k * 0.35) * 2), 30 - k * 2.4, 3, 1);
      g.strokeStyle = '#4f9a36'; g.lineWidth = 2.5; g.lineCap = 'round';
      for (const [dx, dy] of [[-9, 3], [9, 4], [-6, -4], [6, -5], [0, -7]]) { g.beginPath(); g.moveTo(13, 10); g.quadraticCurveTo(13 + dx * 0.6, 6 + dy * 0.4, 13 + dx, 10 + dy); g.stroke(); }
      circ(g, 12, 12, 1.8, '#6b4a22'); circ(g, 15, 12, 1.8, '#6b4a22');
    })];
    S[12] = [rock('#1a1a1a')]; S[13] = [rock('#3fae8a')]; S[14] = [rock('#c8d4dc')]; S[15] = [rock('#f4f8ff')];
    // gemas: cristais roxos e azuis
    S[16] = [mk(g => {
      shadow(g);
      g.fillStyle = '#6e6e6e'; g.beginPath(); g.moveTo(3, 30); g.lineTo(6, 23); g.lineTo(18, 22); g.lineTo(21, 30); g.fill();
      const cr = (x, h, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 2.5, 27); g.lineTo(x, 27 - h); g.lineTo(x + 2.5, 27); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - 1, 27 - h + 3, 1, h - 5); };
      cr(8, 10, '#a05cf0'); cr(12, 14, '#c07cff'); cr(16, 9, '#4ec0f0');
    })];
    // argila: monte baixo e liso
    S[17] = [mk(g => {
      g.fillStyle = '#8a4a26'; g.beginPath(); g.ellipse(12, 28, 9, 3.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b5653a'; g.beginPath(); g.ellipse(12, 27, 8, 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d08454'; g.fillRect(8, 26, 4, 1); g.fillRect(13, 27, 3, 1);
    })];
    // linho: tufos altos com flores azuis
    S[18] = [mk(g => {
      g.strokeStyle = '#5a8f3a'; g.lineWidth = 1;
      for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(7 + k * 2, 30); g.lineTo(6 + k * 2.4, 20 + (k % 3) * 2); g.stroke(); }
      g.fillStyle = '#6a8fd0'; [[6, 19], [10, 21], [13, 19], [17, 22], [8, 23]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    })];
    // erva medicinal
    S[19] = [mk(g => {
      circ(g, 12, 27, 4, '#4f9a3a'); circ(g, 9, 28, 3, '#468c32'); circ(g, 15, 28, 3, '#468c32');
      g.fillStyle = '#f2f2f2'; [[10, 24], [13, 23], [15, 26]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
      g.fillStyle = '#ffd84a'; g.fillRect(13, 23, 1, 1);
    })];
    const sn = this.season;
    if (sn === 2 || sn === 3) for (const k of [1, 2, 6, 7, 8, 9, 10, 11]) S[k] = S[k].map(c => this.seasonize(c, sn, k));
    if (sn === 0) for (const k of [1, 7, 9]) S[k] = S[k].map(c => this.seasonize(c, sn, k));
    this.sprites = S;
  },
  // pinta folhas de laranja no outono, flores na primavera e neve no inverno
  seasonize(src, sn, kind) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width;
    const autumn = [[200, 112, 42], [216, 150, 40], [168, 72, 40], [190, 90, 30]];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a < 200 || gg < r + 8 || gg < b) continue; // só as folhas verdes
      const px = (i / 4) % w, py = Math.floor(i / 4 / w);
      if (sn === 2 && kind !== 2) { const p = autumn[(px * 7 + py * 3) % 4]; const l = gg / 160; d[i] = p[0] * l; d[i + 1] = p[1] * l; d[i + 2] = p[2] * l; }
      if (sn === 3) {
        const above = py > 0 ? d[i - w * 4 + 3] : 0;
        if (above < 100 || (py > 1 && d[i - w * 8 + 3] < 100)) { d[i] = 240; d[i + 1] = 246; d[i + 2] = 250; }
        else if (kind !== 2) { const m = (r + gg + b) / 3; d[i] = m * 0.75 + 30; d[i + 1] = m * 0.8 + 30; d[i + 2] = m * 0.75 + 30; }
      }
      if (sn === 0) {
        const h = U.hash2(px, py, kind * 31 + 7);
        if (kind === 9 && h < 0.07) { d[i] = 255; d[i + 1] = 205; d[i + 2] = 225; }       // flores de macieira
        else if (kind === 7 && h < 0.05) { d[i] = 236; d[i + 1] = 214; d[i + 2] = 96; }   // amentilhos da bétula
        else if (kind === 1 && h < 0.04) { d[i] = 150; d[i + 1] = 214; d[i + 2] = 96; }   // brotos claros do carvalho
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  },
  drawObj(ctx, i, sx, sy) {
    if (!this.sprites) this.makeSprites();
    const t = this.obj[i];
    const vars = this.sprites[t];
    const v = vars[i % vars.length];
    let ox = 0;
    const sh = this.shakes.get(i);
    if (sh > 0) ox = Math.sin(sh * 60) * 2;
    const w = v.width * 2, h = v.height * 2;
    ctx.drawImage(v, sx + 16 - w / 2 + ox, sy + 32 - h, w, h);
  },

  // ---------------------------------------------------------------- construções
  // é muro (de qualquer tipo) nesta casa?
  wallAt(x, y) {
    if (!this.inb(x, y)) return false;
    const id = this.sgrid[this.idx(x, y)], o = id >= 0 && this.structs[id];
    return !!o && !o.removed && (o.type === 'wall_wood' || o.type === 'wall_stone');
  },
  // muro que se liga aos vizinhos: cada lado com muro ganha um "braço" até a borda; onde um muro horizontal
  // encontra um vertical (canto de 90°, T ou cruz) nasce uma torrezinha
  drawWall(ctx, s, X, Y, stone) {
    const has = s.x !== undefined, n = has && this.wallAt(s.x, s.y - 1), so = has && this.wallAt(s.x, s.y + 1), w = has && this.wallAt(s.x - 1, s.y), e = has && this.wallAt(s.x + 1, s.y);
    const vert = n || so, hor = w || e || !vert;
    const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    const L = hor ? (w || !e ? 0 : 10) : 10, Rt = hor ? (e || !w ? 32 : 22) : 22; // trecho horizontal (de L a Rt)
    const T = n ? 0 : 6, B = so ? 32 : 26; // trecho vertical (de T a B)
    if (!stone) {
      // paliçada: estacas lado a lado (horizontal) ou empilhadas (vertical)
      if (vert) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X + 25, Y + T, 3, B - T);
        for (let y = T; y < B; y += 6) R(7, y, 18, 5, (y / 6) % 2 ? '#7a5230' : '#8b5f38');
        R(7, T, 2, B - T, '#5a3a1e'); R(23, T, 2, B - T, '#5a3a1e');
        if (!n) { ctx.fillStyle = '#6b4420'; ctx.beginPath(); ctx.moveTo(X + 7, Y + T); ctx.lineTo(X + 16, Y + T - 6); ctx.lineTo(X + 25, Y + T); ctx.fill(); }
      }
      if (hor) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X + L, Y + 28, Rt - L, 4);
        for (let x = L; x < Rt; x += 7) {
          const ww = Math.min(6, Rt - x);
          R(x, 4, ww, 26, (x / 7 | 0) % 2 ? '#7a5230' : '#8b5f38');
          ctx.fillStyle = '#6b4420'; ctx.beginPath(); ctx.moveTo(X + x, Y + 4); ctx.lineTo(X + x + ww / 2, Y - 2); ctx.lineTo(X + x + ww, Y + 4); ctx.fill();
        }
        R(L, 14, Rt - L, 3, '#5a3a1e');
      }
    } else {
      // muro de pedra: face com fiadas de pedra e ameias no alto
      const face = (x, y, ww, hh) => { R(x, y, ww, hh, '#8b8d93'); for (let k = y + 8; k < y + hh; k += 8) R(x, k, ww, 1, '#6e7076'); R(x, y + hh - 3, ww, 3, '#5f6167'); };
      if (vert) { face(8, T, 16, B - T); R(8, T, 2, B - T, '#a5a7ad'); R(22, T, 2, B - T, '#6e7076'); if (!n) { R(8, T - 4, 6, 4, '#a5a7ad'); R(18, T - 4, 6, 4, '#a5a7ad'); } }
      if (hor) { face(L, 6, Rt - L, 24); R(L, 6, Rt - L, 3, '#a5a7ad'); for (let x = L; x < Rt; x += 8) R(x, 1, Math.min(5, Rt - x), 5, '#a5a7ad'); }
    }
    if (vert && (w || e)) this.drawWallTower(ctx, X, Y, stone);
  },
  // torrezinha na emenda dos muros
  drawWallTower(ctx, X, Y, stone) {
    const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 5, Y + 28, 24, 5);
    if (stone) {
      R(5, -8, 22, 38, '#8b8d93'); R(5, -8, 3, 38, '#a5a7ad'); R(24, -8, 3, 38, '#6e7076');
      for (let k = 0; k < 30; k += 8) R(5, k, 22, 1, '#6e7076');
      for (let x = 4; x < 28; x += 6) R(x, -14, 4, 6, '#a5a7ad');
      R(14, 6, 4, 8, '#2a2622');
    } else {
      R(6, -6, 20, 36, '#7a5230'); for (let k = -6; k < 30; k += 6) R(6, k, 20, 1, '#5a3a1e');
      R(6, -6, 2, 36, '#8b5f38'); R(24, -6, 2, 36, '#5a3a1e');
      ctx.fillStyle = '#8a3a22'; ctx.beginPath(); ctx.moveTo(X + 3, Y - 6); ctx.lineTo(X + 16, Y - 22); ctx.lineTo(X + 29, Y - 6); ctx.fill();
      ctx.fillStyle = '#6a2a18'; ctx.fillRect(X + 3, Y - 7, 26, 2);
      R(14, 6, 4, 7, '#2a1a0e');
    }
  },
  drawStruct(ctx, s, X, Y, time) {
    const w = s.w * TILE, h = s.h * TILE;
    const civ = typeof s.owner === 'number' ? s.owner : -1;
    const ruledByPlayer = civ >= 0 && G.civs[civ] && G.civs[civ].ruler === 'player';
    const ccol = civ >= 0 ? Game.civColor(civ) : PLAYER_COLOR;
    const roofCol = civ >= 0 ? (ruledByPlayer && !Heraldry.customColor(civ) ? '#a8791a' : CIV_DEFS[civ].roof) : '#8a5a1a';
    // bandeira do reino num mastro (castelos e arenas)
    const banner = (fx, fy, bw) => { if (civ < 0) { flag(fx, fy, ccol); return; } R(fx, fy - 20, 2, 20, '#3a2a1a'); Heraldry.drawFlag(ctx, X + fx + 2, Y + fy - 20, bw || 15, (bw || 15) * 0.66, civ, time); };
    const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    const shadow = () => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 4, 8); };
    const roof = (x, y, ww, hh, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(X + x - 3, Y + y + hh); ctx.lineTo(X + x + 6, Y + y); ctx.lineTo(X + x + ww - 6, Y + y); ctx.lineTo(X + x + ww + 3, Y + y + hh); ctx.fill();
      ctx.fillStyle = U.shade(col, -0.12);
      for (let k = y + 5; k < y + hh; k += 5) ctx.fillRect(X + x, Y + k, ww, 1);
    };
    const flame = (fx, fy, sc) => {
      const f = Math.sin(time * 18 + fx) * 1.5;
      ctx.fillStyle = '#ff7b1c'; ctx.beginPath(); ctx.moveTo(X + fx - 5 * sc, Y + fy); ctx.lineTo(X + fx + f, Y + fy - 13 * sc); ctx.lineTo(X + fx + 5 * sc, Y + fy); ctx.fill();
      ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.moveTo(X + fx - 2.5 * sc, Y + fy); ctx.lineTo(X + fx - f * 0.5, Y + fy - 7 * sc); ctx.lineTo(X + fx + 2.5 * sc, Y + fy); ctx.fill();
    };
    const flag = (fx, fy, col) => {
      R(fx, fy - 18, 2, 18, '#3a2a1a');
      const wv = Math.sin(time * 4 + fx) * 2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + fx + 2, Y + fy - 18); ctx.lineTo(X + fx + 14, Y + fy - 15 + wv); ctx.lineTo(X + fx + 2, Y + fy - 10); ctx.fill();
    };
    const house = (wallCol, rc) => {
      shadow();
      R(6, 24, w - 12, h - 28, wallCol); R(6, h - 8, w - 12, 4, U.shade(wallCol, -0.15));
      R(w / 2 - 5, h - 22, 10, 18, '#5a3a1e'); R(w / 2 + 2, h - 14, 2, 2, '#d4b14a');
      R(12, 32, 8, 8, '#2a2a3a'); R(w - 20, 32, 8, 8, '#2a2a3a');
      if (G.darkness > 0.2 && ((s.type !== 'vhouse' && s.type !== 'tavern') || Routine.lit(s))) { const f = 0.85 + Math.sin(time * 3 + s.id) * 0.15; R(13, 33, 6, 6, U.rgba('#ffd36b', f)); R(w - 19, 33, 6, 6, U.rgba('#ffd36b', f)); }
      roof(4, 2, w - 8, 24, rc);
    };

    switch (s.type) {
      case 'port': {
        // cais de madeira que entra na água, armazém, guindaste e bandeira do reino
        for (let k = 0; k < 3; k++) { R(18 + k * 30, h - 8, 22, 70, '#7a5230'); for (let j = h - 6; j < h + 60; j += 7) R(18 + k * 30, j, 22, 2, '#5a3a1e'); R(18 + k * 30, h + 58, 3, 10, '#4a2e16'); R(37 + k * 30, h + 58, 3, 10, '#4a2e16'); }
        shadow();
        R(8, 26, 70, 46, '#a07a4a'); R(8, 26, 70, 6, '#7a5a30'); for (let k = 34; k < 72; k += 9) R(8, k, 70, 1, '#7a5a30');
        roof(4, 4, 78, 24, roofCol); R(36, 50, 14, 22, '#4a2e16'); R(16, 40, 10, 8, '#2a1a0e'); R(60, 40, 10, 8, '#2a1a0e');
        R(96, 10, 5, h - 14, '#5a3a1e'); R(96, 10, 26, 4, '#5a3a1e'); R(118, 14, 1, 26, '#c9b48a'); R(113, 40, 10, 8, '#8a6a3a');
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f2e6c8'; ctx.fillText('⚓', X + 43, Y + 46); ctx.textAlign = 'left';
        banner(84, 8);
        break;
      }
      case 'pcastle': case 'castle': {
        shadow();
        const stone = '#8b8d93', dark = '#5f6167';
        R(10, 34, w - 20, h - 44, '#9c8f74');                        // pátio
        R(10, 26, w - 20, 12, stone); R(10, 36, w - 20, 4, dark);     // muralha norte
        R(10, 26, 12, h - 36, stone); R(w - 22, 26, 12, h - 36, stone);
        R(10, h - 26, w - 20, 16, stone); R(10, h - 12, w - 20, 4, dark); // muralha sul
        for (let k = 12; k < w - 12; k += 10) { R(k, 21, 6, 5, stone); R(k, h - 31, 6, 5, stone); }
        // torre de menagem
        const kx = w / 2 - 38;
        R(kx, 40, 76, 70, '#9a9ca2'); R(kx, 104, 76, 6, dark);
        R(kx + 30, 80, 16, 30, '#4a3220');
        R(kx + 10, 58, 8, 12, '#2a2a3a'); R(kx + 58, 58, 8, 12, '#2a2a3a');
        roof(kx, 14, 76, 30, roofCol);
        banner(w / 2 - 1, 16, 20);
        // torres
        for (const [tx, ty] of [[4, 18], [w - 32, 18], [4, h - 48], [w - 32, h - 48]]) {
          R(tx, ty + 10, 28, 34, '#7f8187'); R(tx, ty + 40, 28, 4, dark);
          R(tx + 11, ty + 22, 6, 8, '#2a2a3a');
          ctx.fillStyle = roofCol; ctx.beginPath(); ctx.moveTo(X + tx - 2, Y + ty + 12); ctx.lineTo(X + tx + 14, Y + ty - 10); ctx.lineTo(X + tx + 30, Y + ty + 12); ctx.fill();
          banner(tx + 13, ty - 8);
        }
        // portão
        R(w / 2 - 16, h - 30, 32, 26, '#2d2014');
        ctx.fillStyle = '#6b5a3a'; for (let k = 0; k < 4; k++) ctx.fillRect(X + w / 2 - 14 + k * 8, Y + h - 30, 2, 26);
        R(w / 2 - 16, h - 18, 32, 2, '#6b5a3a');
        if (s.gateBroken) {
          // portão arrombado: buraco escuro, tábuas e pedras pelo chão
          R(w / 2 - 18, h - 32, 36, 28, '#120c06');
          ctx.fillStyle = '#6b5a3a'; ctx.save(); ctx.translate(X + w / 2 - 8, Y + h - 6); ctx.rotate(0.5); ctx.fillRect(-12, -2, 24, 4); ctx.restore();
          ctx.save(); ctx.translate(X + w / 2 + 10, Y + h - 4); ctx.rotate(-0.3); ctx.fillRect(-10, -2, 20, 4); ctx.restore();
          for (const [ox, oy] of [[-24, -2], [20, 0], [-6, 2], [28, -6]]) R(w / 2 + ox, h + oy - 4, 6, 4, '#7d7f86');
        }
        // tochas
        flame(w / 2 - 22, h - 20, 0.6); flame(w / 2 + 22, h - 20, 0.6);
        // brasão do reino sobre o portão
        if (civ >= 0) Heraldry.drawArms(ctx, X + w / 2, Y + h - 42, 18, civ);
        break;
      }
      case 'vhouse':
        if (s.ruined) {
          shadow();
          R(6, 30, w - 12, h - 34, '#7a6a52'); R(10, 26, 14, 8, '#6a5a42'); R(w - 22, 34, 12, 6, '#5a4a36');
          ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(X + 6, Y + 30); ctx.lineTo(X + 20, Y + 14); ctx.lineTo(X + 30, Y + 30); ctx.fill();
          R(w / 2 - 5, h - 20, 10, 16, '#1a120a'); R(8, h - 8, 10, 4, '#8a8a8a'); R(w - 18, h - 6, 8, 3, '#6a6a6a');
        } else house('#d8c39a', roofCol);
        break;
      case 'well': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 3, Y + 26, 26, 5);
        R(5, 14, 22, 14, '#8b8d93'); R(5, 14, 22, 3, '#a5a7ad'); R(9, 17, 14, 4, '#2a4a6a');
        R(5, 0, 3, 16, '#6b4423'); R(24, 0, 3, 16, '#6b4423'); R(3, -2, 26, 4, roofCol);
        break;
      }
      case 'vwall': {
        R(0, 6, 32, 24, '#7d7f86'); R(0, 4, 32, 4, '#9a9ca2'); R(0, 26, 32, 4, '#5f6167');
        for (let k = 0; k < 32; k += 11) R(k, 0, 6, 5, '#8b8d93');
        break;
      }
      case 'oven': {
        shadow();
        R(4, 10, w - 8, 20, '#9a6a4a'); R(4, 10, w - 8, 3, '#b07a5a');
        for (let k = 14; k < 30; k += 5) R(4, k, w - 8, 1, '#7a4a32');
        ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(X + w / 2, Y + 26, 9, Math.PI, 0); ctx.fill();
        ctx.fillStyle = U.rgba('#ff7a1c', 0.6 + Math.sin(time * 8) * 0.2); ctx.beginPath(); ctx.arc(X + w / 2, Y + 27, 6, Math.PI, 0); ctx.fill();
        R(w - 14, -4, 8, 14, '#7a4a32');
        break;
      }
      case 'brewery': {
        shadow();
        R(4, 22, w - 8, h - 26, '#8a6a42'); roof(2, 6, w - 4, 18, '#5a3a1e');
        for (const bx of [10, 34]) { R(bx, h - 22, 16, 18, '#7a4a22'); R(bx, h - 18, 16, 2, '#4a2a12'); R(bx, h - 9, 16, 2, '#4a2a12'); }
        break;
      }
      case 'coop': {
        shadow();
        R(6, 26, w - 12, h - 30, '#b08a5a'); roof(4, 10, w - 8, 18, '#8a3a2a');
        R(w / 2 - 6, h - 16, 12, 12, '#3a2410'); R(w / 2 - 2, h - 26, 4, 4, '#3a2410');
        for (let k = 8; k < w - 6; k += 6) R(k, h - 6, 2, 4, '#e8d8a0');
        break;
      }
      case 'pen': {
        R(2, 2, w - 4, h - 4, '#7a9a4a');
        for (let k = 4; k < w; k += 9) R(k, h - 30, 3, 26, '#7a5230');
        ctx.strokeStyle = '#8b5f38'; ctx.lineWidth = 3; ctx.strokeRect(X + 3, Y + 3, w - 6, h - 6);
        R(w - 26, h - 22, 20, 12, '#d8b84a'); R(w - 26, h - 22, 20, 2, '#b8983a');
        break;
      }
      case 'beehive': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 6, Y + 26, 20, 4);
        R(14, 16, 4, 12, '#6b4423');
        ctx.fillStyle = '#d8a83a'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 12, 10, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8882a'; for (let k = 6; k < 20; k += 4) ctx.fillRect(X + 7, Y + k, 18, 1);
        ctx.fillStyle = '#2a1a0a'; ctx.fillRect(X + 14, Y + 15, 4, 3);
        const bz = time * 6;
        ctx.fillStyle = '#ffd34a'; for (let k = 0; k < 3; k++) ctx.fillRect(X + 16 + Math.cos(bz + k * 2) * 12, Y + 8 + Math.sin(bz * 1.3 + k) * 8, 2, 2);
        break;
      }
      case 'ptavern': {
        house('#c9a978', '#a8791a');
        R(w - 26, 30, 18, 12, '#5a3a1e'); R(w - 24, 32, 14, 8, '#ffd54a');
        ctx.font = '9px sans-serif'; ctx.fillText('🍺', X + w - 23, Y + 40);
        flag(w / 2 - 1, 4, PLAYER_COLOR);
        break;
      }
      case 'house': house('#efe6d2', '#b07d22'); break;
      case 'manor': {
        house('#a8553a', '#5a3a2a');
        for (let k = 30; k < h - 8; k += 6) R(6, k, w - 12, 1, '#8a4430');
        for (let k = 30, o = 0; k < h - 8; k += 6, o ^= 1) for (let j = 10 + o * 6; j < w - 8; j += 12) R(j, k, 1, 6, '#8a4430');
        R(w / 2 - 6, h - 24, 12, 20, '#3e2612'); R(w / 2 - 8, h - 26, 16, 3, '#d9c39a');
        R(w - 22, 0, 8, 16, '#6b4a3a'); flag(w / 2 - 1, 4, PLAYER_COLOR);
        break;
      }
      case 'tavern': {
        house('#c9a978', '#7b3b22');
        R(w - 26, 30, 18, 12, '#5a3a1e'); R(w - 24, 32, 14, 8, '#d9b25a');
        ctx.font = '9px sans-serif'; ctx.fillText('🍺', X + w - 23, Y + 40);
        break;
      }
      case 'fforge': case 'biz_smithy': case 'smith': {
        shadow();
        R(4, 18, w - 8, h - 22, '#6f7177'); R(4, h - 8, w - 8, 4, '#4f5156');
        for (let k = 22; k < h - 8; k += 7) R(4, k, w - 8, 1, '#5d5f64');
        roof(2, 4, w - 4, 18, '#3a3a40');
        R(w - 16, -2, 8, 14, '#55575c');
        const gl = 0.7 + Math.sin(time * 9 + s.id) * 0.2;
        R(10, 32, 16, 14, '#2a1a10'); R(12, 35, 12, 11, U.rgba('#ff7a1c', gl));
        R(34, 48, 18, 5, '#2e2e32'); R(38, 53, 10, 8, '#2e2e32');
        R(36, 26, 14, 12, '#5a3a1e'); ctx.font = '10px sans-serif'; ctx.fillText('⚒️', X + 37, Y + 36);
        break;
      }
      case 'biz_lumber': case 'lumber': {
        shadow();
        R(6, 26, w - 12, h - 30, '#8a5a30'); for (let k = 28; k < h - 6; k += 5) R(6, k, w - 12, 1, '#6a4220');
        roof(4, 8, w - 8, 20, '#5a3a1e');
        for (let k = 0; k < 3; k++) { ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.arc(X + 14 + k * 9, Y + h - 8, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d9b07a'; ctx.beginPath(); ctx.arc(X + 14 + k * 9, Y + h - 8, 2, 0, Math.PI * 2); ctx.fill(); }
        R(w - 22, 34, 14, 10, '#5a3a1e'); ctx.font = '10px sans-serif'; ctx.fillText('🪓', X + w - 21, Y + 43);
        break;
      }
      case 'biz_quarry': case 'quarry': {
        shadow();
        R(6, 26, w - 12, h - 30, '#9a9488'); for (let k = 28; k < h - 6; k += 6) R(6, k, w - 12, 1, '#7a7468');
        roof(4, 8, w - 8, 20, '#6a6458');
        R(8, h - 14, 12, 10, '#b0aaa0'); R(22, h - 12, 10, 8, '#8f8a80'); R(12, h - 22, 9, 8, '#a5a095');
        R(w - 22, 34, 14, 10, '#5a3a1e'); ctx.font = '10px sans-serif'; ctx.fillText('⛏️', X + w - 21, Y + 43);
        break;
      }
      case 'fshop': case 'biz_shop': case 'store': {
        shadow();
        R(8, 30, w - 16, 26, '#8b5a2b'); R(8, 52, w - 16, 4, '#5e3c1c');
        R(10, 16, 3, 40, '#5e3c1c'); R(w - 13, 16, 3, 40, '#5e3c1c');
        for (let k = 0; k < 6; k++) R(4 + k * ((w - 8) / 6), 8, Math.ceil((w - 8) / 6), 14, k % 2 ? '#f2efe6' : ccol);
        R(4, 22, w - 8, 3, 'rgba(0,0,0,0.25)');
        const goods = ['#e2b23a', '#c24b3a', '#6aa84f', '#b07d4a', '#e6e6e6'];
        for (let k = 0; k < 5; k++) { R(16 + k * 14, 28, 10, 6, goods[k]); }
        R(w / 2 - 10, 58, 9, 6, '#7a5230'); R(w / 2 + 4, 58, 9, 6, '#7a5230');
        break;
      }
      case 'ffarm': case 'biz_farm': case 'field': case 'farm': {
        R(2, 2, w - 4, h - 4, '#6e4f2e');
        for (let k = 6; k < h - 4; k += 6) {
          R(4, k, w - 8, 2, '#5a3f22');
          for (let j = 6; j < w - 6; j += 5) {
            const sway = Math.sin(time * 2 + j * 0.3 + k) * 1;
            R(j + sway, k - 4, 2, 4, '#d8b84a');
          }
        }
        if (s.type === 'farm' || s.type === 'biz_farm' || s.type === 'ffarm') {
          ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, w - 2, h - 2);
          for (let k = 0; k < w; k += 16) R(k, -2, 3, 6, '#7a5230');
        }
        break;
      }
      case 'camp': {
        if (!s.cleared) {
          for (const [tx, ty, col] of [[4, 22, '#7b5e3b'], [52, 30, '#6a5034']]) {
            ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + tx, Y + ty + 24); ctx.lineTo(X + tx + 18, Y + ty); ctx.lineTo(X + tx + 36, Y + ty + 24); ctx.fill();
            R(tx + 14, ty + 12, 8, 12, '#2a1d10');
          }
          R(40, 70, 12, 4, '#4a3a2a'); flame(46, 70, 0.9);
          R(14, 66, 12, 10, '#6b4a2a'); R(16, 68, 8, 1, '#3a2a18');
          flag(84, 30, '#2a2a2a');
        } else {
          R(40, 68, 14, 6, '#5a5a5a');
          ctx.fillStyle = '#5e4a32'; ctx.beginPath(); ctx.moveTo(X + 8, Y + 48); ctx.lineTo(X + 20, Y + 36); ctx.lineTo(X + 30, Y + 48); ctx.fill();
        }
        break;
      }
      case 'cabin': {
        shadow();
        R(6, 24, w - 12, h - 28, '#7a4f2a');
        for (let k = 26; k < h - 4; k += 5) R(6, k, w - 12, 1, '#5a3618');
        R(w / 2 - 5, h - 22, 10, 18, '#3e2612');
        R(12, 32, 8, 7, G.darkness > 0.2 ? '#ffd36b' : '#2a2a3a');
        R(w - 18, 4, 7, 14, '#6b6b6b');
        roof(4, 4, w - 8, 22, '#4a2e16');
        break;
      }
      case 'campfire': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 26, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; R(14 + Math.cos(a) * 10, 22 + Math.sin(a) * 4, 4, 3, '#7d7d7d'); }
        R(8, 22, 16, 3, '#5a3618'); flame(16, 24, 1);
        break;
      }
      case 'workbench': {
        shadow();
        R(4, 12, w - 8, 10, '#a06a35'); R(4, 20, w - 8, 3, '#6b4420');
        R(6, 22, 4, 8, '#6b4420'); R(w - 10, 22, 4, 8, '#6b4420');
        R(14, 8, 14, 4, '#9a9a9a'); R(36, 6, 3, 8, '#6b4420'); R(33, 5, 9, 3, '#7d7d7d');
        break;
      }
      case 'forge': {
        shadow();
        R(4, 18, w - 8, h - 22, '#77797f'); R(4, h - 8, w - 8, 4, '#55575c');
        for (let k = 22; k < h - 8; k += 7) R(4, k, w - 8, 1, '#63656a');
        R(w - 20, 0, 12, 20, '#5d5f64');
        const glow = 0.7 + Math.sin(time * 9) * 0.2;
        R(14, 34, 22, 16, '#2a1a10'); R(16, 38, 18, 12, U.rgba('#ff7a1c', glow));
        R(40, 44, 16, 6, '#3a3a3e'); R(44, 50, 8, 8, '#3a3a3e');
        break;
      }
      case 'barracks': {
        shadow();
        R(6, 30, w - 12, h - 34, '#8f8a80'); R(6, h - 8, w - 12, 4, '#66625a');
        for (let k = 0; k < 3; k++) R(16 + k * 26, 44, 10, 10, '#2a2a3a');
        R(w / 2 - 6, h - 24, 12, 20, '#4a3220');
        roof(4, 6, w - 8, 28, '#a8791a');
        flag(w / 2 - 1, 8, PLAYER_COLOR);
        break;
      }
      case 'wall_wood': case 'wall_stone': this.drawWall(ctx, s, X, Y, s.type === 'wall_stone'); break;
      case 'chest': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 3, Y + 26, 26, 5);
        R(4, 12, 24, 16, '#8b5a2b'); R(4, 10, 24, 6, '#a06a35'); R(4, 16, 24, 2, '#5a3a1e');
        R(4, 12, 2, 16, '#c9a050'); R(26, 12, 2, 16, '#c9a050'); R(14, 15, 4, 5, '#ffd54a');
        break;
      }
      case 'tchest': {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X + 2, Y + 26, 28, 5);
        R(3, 12, 26, 16, s.opened ? '#5a3a1e' : '#7a3a1e'); R(3, 9, 26, 6, s.opened ? '#4a2a12' : '#a0482a');
        R(3, 12, 26, 2, '#ffd54a'); R(3, 22, 26, 2, '#ffd54a'); R(14, 14, 4, 6, '#ffe9a8');
        if (!s.opened) { const gl = 0.4 + Math.sin(time * 4) * 0.25; ctx.fillStyle = `rgba(255,220,100,${gl})`; ctx.fillRect(X + 6, Y + 4, 2, 2); ctx.fillRect(X + 24, Y + 6, 2, 2); }
        break;
      }
      case 'vbuild': {
        // casa em obras: alicerce, paredes subindo, andaime e telhado no fim
        const pr = s.progress || 0;
        shadow();
        R(4, h - 12, w - 8, 8, '#7a6a52'); R(4, h - 12, w - 8, 2, '#9a8a72');
        const top = h - 12 - Math.round(34 * Math.min(1, pr * 1.5));
        if (top < h - 12) { R(8, top, w - 16, h - 12 - top, '#d8c39a'); for (let k = top + 5; k < h - 12; k += 6) R(8, k, w - 16, 1, 'rgba(0,0,0,0.12)'); }
        for (const px of [5, w / 2 - 2, w - 9]) R(px, h - 52, 4, 42, '#6b4423');
        R(3, h - 52, w - 6, 3, '#7a5230'); R(3, h - 32, w - 6, 2, '#7a5230');
        if (pr > 0.66) { const k = Math.min(1, (pr - 0.66) / 0.34); roof(4, 26 - 24 * k, w - 8, 24 * k, roofCol); }
        ctx.font = '12px sans-serif'; ctx.fillText('🔨', X + w - 18, Y + 10);
        R(6, h - 3, w - 12, 3, 'rgba(0,0,0,0.5)'); R(6, h - 3, Math.round((w - 12) * pr), 3, '#ffd54a');
        break;
      }
      case 'cave': {
        ctx.fillStyle = '#3a3530'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 22, 18, 14, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 26, 11, 13, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(X + 5, Y + 26, 22, 6);
        R(2, 20, 4, 12, '#6b6b6b'); R(26, 18, 4, 14, '#5a5a5a');
        if (s.theme === 'dragon') { ctx.fillStyle = 'rgba(255,90,40,0.5)'; ctx.fillRect(X + 10, Y + 24, 12, 3); }
        break;
      }
      case 'cave_exit': {
        const gl = ctx.createRadialGradient(X + 16, Y + 16, 2, X + 16, Y + 16, 30);
        gl.addColorStop(0, 'rgba(255,230,170,0.55)'); gl.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = gl; ctx.fillRect(X - 14, Y - 14, 60, 60);
        R(10, 4, 3, 26, '#6b4a2a'); R(19, 4, 3, 26, '#6b4a2a'); for (let k = 8; k < 30; k += 6) R(10, k, 12, 2, '#8b6a3a');
        break;
      }
      case 'stable': {
        shadow();
        R(4, 22, w - 8, h - 26, '#8a5a30'); for (let k = 26; k < h - 4; k += 6) R(4, k, w - 8, 1, '#6a4220');
        roof(2, 4, w - 4, 20, '#6b3a1e');
        R(w / 2 - 12, h - 26, 24, 22, '#3a2410'); R(w / 2 - 12, h - 26, 24, 2, '#c9a050');
        R(8, h - 12, 14, 6, '#d9b25a'); R(w - 22, h - 12, 14, 6, '#d9b25a');
        break;
      }
      case 'fmill': case 'biz_mill': {
        shadow();
        R(14, 22, w - 28, h - 26, '#d8c39a'); R(14, h - 8, w - 28, 4, '#b8a37a');
        ctx.fillStyle = '#7b3b22'; ctx.beginPath(); ctx.moveTo(X + 10, Y + 24); ctx.lineTo(X + w / 2, Y + 6); ctx.lineTo(X + w - 10, Y + 24); ctx.fill();
        R(w / 2 - 4, h - 18, 8, 14, '#5a3a1e');
        const a0 = time * 1.2 + s.id;
        ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) {
          const a = a0 + k * Math.PI / 2, ex = X + w / 2 + Math.cos(a) * 26, ey = Y + 14 + Math.sin(a) * 26;
          ctx.beginPath(); ctx.moveTo(X + w / 2, Y + 14); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.fillStyle = 'rgba(240,232,210,0.9)'; ctx.save(); ctx.translate(X + w / 2, Y + 14); ctx.rotate(a); ctx.fillRect(8, 1, 17, 6); ctx.restore();
        }
        R(w / 2 - 2, 12, 4, 4, '#3a2a1a');
        break;
      }
      case 'fvine': {
        R(2, 2, w - 4, h - 4, '#6a5a2e');
        for (let k = 8; k < h - 4; k += 12) {
          R(4, k, w - 8, 2, '#7a5230');
          for (let j = 8; j < w - 6; j += 9) { R(j, k - 9, 2, 10, '#5a3a1e'); R(j - 3, k - 8, 8, 5, '#4f8a36'); ctx.fillStyle = '#6a2a6a'; ctx.beginPath(); ctx.arc(X + j + 1, Y + k - 3, 2.5, 0, Math.PI * 2); ctx.fill(); }
        }
        break;
      }
      case 'biz_mine': {
        shadow();
        R(2, 10, w - 4, h - 12, '#7a7468'); R(2, 10, w - 4, 4, '#9a9488');
        R(10, 22, w - 20, h - 24, '#1a1410'); R(8, 18, 4, h - 20, '#6b4423'); R(w - 12, 18, 4, h - 20, '#6b4423'); R(6, 16, w - 12, 5, '#6b4423');
        R(w - 18, h - 10, 12, 6, '#3a3a3a'); R(w - 17, h - 13, 10, 3, '#2a2a2a');
        for (const [ox, c] of [[w - 15, '#c87a3a'], [w - 11, '#9aa0a8']]) R(ox, h - 15, 3, 3, c);
        break;
      }
      case 'chapel': case 'cathedral': {
        const big = s.type === 'cathedral';
        shadow();
        R(6, 26, w - 12, h - 30, '#e6dfcc'); R(6, h - 8, w - 12, 4, '#c8bfa8');
        ctx.fillStyle = big ? '#5a5a6a' : '#7b3b22'; ctx.beginPath(); ctx.moveTo(X + 2, Y + 28); ctx.lineTo(X + w / 2, Y + 8); ctx.lineTo(X + w - 2, Y + 28); ctx.fill();
        const tx = big ? w / 2 - 9 : w - 18;
        R(tx, -18, 14, 34, '#ddd5c0'); ctx.fillStyle = big ? '#5a5a6a' : '#7b3b22'; ctx.beginPath(); ctx.moveTo(X + tx - 2, Y - 16); ctx.lineTo(X + tx + 7, Y - 34); ctx.lineTo(X + tx + 16, Y - 16); ctx.fill();
        R(tx + 6, -44, 2, 12, '#d4b14a'); R(tx + 3, -40, 8, 2, '#d4b14a');
        R(w / 2 - 6, h - 22, 12, 18, '#5a3a1e'); ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 22, 6, Math.PI, 0); ctx.fill();
        const glow = G.darkness > 0.2 ? '#ffd36b' : '#6a8ab0';
        R(12, 34, 6, 10, glow); R(w - 18, 34, 6, 10, glow);
        if (big) { ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X + w / 2, Y + 40, 7, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'shrine': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 6, Y + h - 10, w - 12, 6);
        R(8, h - 18, w - 16, 12, '#a5a7ad'); R(8, h - 18, w - 16, 3, '#c5c7cd');
        R(w / 2 - 5, 8, 10, h - 26, '#c5c7cd'); R(w / 2 - 14, 18, 28, 6, '#c5c7cd');
        const vis = G.shrines && G.shrines[s.shrine];
        ctx.fillStyle = U.rgba(vis ? '#9ad65a' : '#ffd36b', 0.5 + Math.sin(time * 3) * 0.3);
        ctx.beginPath(); ctx.arc(X + w / 2, Y + 4, 5, 0, Math.PI * 2); ctx.fill();
        flame(w / 2 - 14, h - 18, 0.4); flame(w / 2 + 14, h - 18, 0.4);
        break;
      }
      case 'arena': {
        R(2, 6, w - 4, h - 8, '#c9b07a');
        ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; ctx.strokeRect(X + 4, Y + 8, w - 8, h - 12);
        for (let k = 8; k < w - 6; k += 12) { R(k, 2, 4, 10, '#7a5230'); R(k, h - 8, 4, 8, '#7a5230'); }
        for (let k = 0; k < 5; k++) R(10 + k * ((w - 30) / 4), -2, 10, 6, ['#8e1f2a', '#f2efe6', '#2a4a8a', '#f2efe6', '#8e1f2a'][k]);
        R(w / 2 - 2, 10, 4, h - 18, 'rgba(255,255,255,0.35)');
        banner(10, 4); banner(w - 14, 4);
        break;
      }
    }
    // bandeira da família dona do empreendimento (ou do jogador)
    if (s.fam !== undefined && FAMILY_BIZ[s.type]) { const f = Families.get(s.fam); if (f) flag(w - 6, 6, f.color); }
    else if (s.owner === 'player' && BIZ_TYPES[s.type] && s.type !== 'ptavern') flag(w - 6, 6, PLAYER_COLOR);
  },
};
