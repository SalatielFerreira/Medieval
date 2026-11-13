'use strict';
// Quem vem atacar você nasce do lado de fora dos muros. Se você está num lugar cercado por inteiro de muralha, com
// portão (a vila com portão, a sua base murada...), assassinos, caçadores de recompensa, bandidos, rebeldes, piratas
// e quem tem rancor de você aparecem diante do portão, do lado de fora — e precisam entrar pelo portão.
const Muros = {
  MAX: 45, // até que distância procura a muralha (em blocos)
  isGate(s) { return !!s && !s.removed && (s.type === 'vgate' || /gate/.test(s.type) || !!(typeof CIVIC !== 'undefined' && CIVIC[s.type] && CIVIC[s.type].gate)); },
  _c: null,
  // o recinto murado onde o herói está: os blocos de dentro e os portões da volta; null quando o lugar é aberto
  region() {
    if (G.place || G.dungeon || !World.tiles) return null;
    const px = Math.floor(P.x / TILE), py = Math.floor((P.y - 6) / TILE), now = G.realTime || 0;
    // sem portão por perto não há recinto fechado: nem procura (antes varria a região a cada pessoa que surgia)
    if (!this._gt || now - this._gt > 2 || now < this._gt) { this._gt = now; this._gates = World.structs.filter(s => s && !s.removed && this.isGate(s)); }
    if (!this._gates.some(g => Math.abs(g.x - px) <= this.MAX && Math.abs(g.y - py) <= this.MAX)) return null;
    if (this._c && this._c.x === px && this._c.y === py && now - this._c.t < 3 && this._c.v === World.structs.length) return this._c.r;
    const W = WORLD_W, M = this.MAX, seen = new Map(), q = [[px, py]], gates = new Set();
    let open = false;
    seen.set(py * W + px, 1);
    for (let h = 0; h < q.length && !open; h++) {
      const [x, y] = q[h];
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx, ny = y + dy;
        if (Math.abs(nx - px) > M || Math.abs(ny - py) > M) { open = true; break; }
        const k = ny * W + nx; if (seen.has(k) || !World.inb(nx, ny)) continue;
        const sid = World.sgrid[k], s = sid >= 0 ? World.structs[sid] : null;
        if (this.isGate(s)) { gates.add(s); continue; }           // o portão faz parte da muralha (mesmo aberto)
        if (World.blocked(nx, ny)) continue;
        seen.set(k, 1); q.push([nx, ny]);
      }
    }
    const r = open || !gates.size ? null : { cells: seen, gates: [...gates], cx: px, cy: py };
    this._c = { x: px, y: py, t: now, v: World.structs.length, r };
    return r;
  },
  inside(R, x, y) { return !!R && R.cells.has(Math.floor((y - 6) / TILE) * WORLD_W + Math.floor(x / TILE)); },
  // um lugar livre do lado de fora: diante de um portão (o mais perto do ponto pedido) ou, sem jeito, além da muralha
  outside(R, x, y) {
    const ok = s => s && !this.inside(R, s.x, s.y) && !World.blockedAt(s.x, s.y, 9);
    const gs = R.gates.slice().sort((a, b) => U.dist(a.x, a.y, x / TILE, y / TILE) - U.dist(b.x, b.y, x / TILE, y / TILE));
    for (const g of gs) {
      const dx = g.x - R.cx, dy = g.y - R.cy, d = Math.hypot(dx, dy) || 1;
      for (const k of [6, 8, 10, 4]) { const s = freeSpotNear((g.x + 0.5 + dx / d * k) * TILE, (g.y + 0.5 + dy / d * k) * TILE, 2 * TILE); if (ok(s)) return s; }
    }
    const a0 = Math.atan2(y - P.y, x - P.x);
    for (let r = 8; r <= this.MAX + 8; r += 3) for (let k = 0; k < 16; k++) {
      const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8, s = { x: P.x + Math.cos(a) * r * TILE, y: P.y + Math.sin(a) * r * TILE };
      if (World.inb(Math.floor(s.x / TILE), Math.floor(s.y / TILE)) && ok(s)) return s;
    }
    return null;
  },
  // quem é "gente que vem atacar"
  attacker(e) {
    if (!e || e.dead || e.faction === 'player' || e.kind === 'ally') return false;
    if (e.tag === 'assassin' || e.hitman) return true;
    if (['bandit', 'rebel', 'pirate'].includes(e.kind)) return true;
    const p = e.npc; return !!(p && !p.capanga && (p.hit || p.hostile || p.band));
  },
  // põe do lado de fora quem nasceu dentro
  fix(e) {
    if (!this.attacker(e)) return false;
    const R = this.region(); if (!R || !this.inside(R, e.x, e.y)) return false;
    const s = this.outside(R, e.x, e.y); if (!s) return false;
    e.x = s.x; e.y = s.y; if (e.home) { e.home.x = s.x; e.home.y = s.y; }
    e.leash = Math.max(e.leash || 0, 40 * TILE);
    return true;
  },
};

{
  const sp0 = Game.spawn.bind(Game);
  Game.spawn = function (...a) { const e = sp0(...a); try { Muros.fix(e); } catch (err) { console.error(err); } return e; };
}
