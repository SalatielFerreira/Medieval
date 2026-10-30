'use strict';
// Estradas dos prédios do castelo: a arena, a catedral, o cemitério, o banco e a prisão de cada reino ganham uma estrada
// em volta (como os imóveis das vilas), ligada à estrada mais próxima; o porto ganha só uma estrada da porta até a
// estrada principal. As estradas ficam gravadas como as das vilas (Urban.E().roads); um prédio novo perto do castelo
// (um banco fundado depois, por exemplo) ganha a dele na virada do mês.
const CROAD_RING = ['arena', 'cathedral', 'cemetery', 'bank', 'prison'];
const CROAD_TYPES = CROAD_RING.concat(['port']);

const CastleRoads = {
  S() { const u = G.urban || (G.urban = {}); return u.croads || (u.croads = {}); },
  key(s) { return s.type + '@' + s.x + ',' + s.y; },
  free(k) { const id = World.sgrid[k]; return !(id >= 0 && World.structs[id] && !World.structs[id].removed); },
  carve(i, j) {
    if (!World.inb(i, j)) return false; const k = World.idx(i, j);
    if (!this.free(k) || !ROAD_GROUND.includes(World.tiles[k])) return false;
    World.tiles[k] = T.ROAD; World.obj[k] = 0; Urban.E().roads[k] = T.ROAD; return true;
  },
  // o caminho mais curto (pela terra) de um conjunto de pontos até a estrada mais próxima que não seja deles
  link(starts, skip) {
    const W = WORLD_W, prev = new Map(), q = [];
    for (const k of starts) { prev.set(k, -1); q.push(k); }
    let found = -1;
    for (let h = 0; h < q.length && q.length < 4000; h++) {
      const k = q[h], x = k % W, y = (k / W) | 0;
      if (World.tiles[k] === T.ROAD && !skip.has(k)) { found = k; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (!World.inb(nx, ny)) continue;
        const n = World.idx(nx, ny); if (prev.has(n) || !this.free(n)) continue;
        const t = World.tiles[n]; if (t !== T.ROAD && !ROAD_GROUND.includes(t)) continue;
        prev.set(n, k); q.push(n);
      }
    }
    if (found < 0) return 0;
    let n = 0; for (let k = found; k >= 0; k = prev.get(k)) { if (World.tiles[k] !== T.ROAD && this.carve(k % W, (k / W) | 0)) n++; }
    return n;
  },
  build(s) {
    const ring = new Set(), W = WORLD_W;
    if (CROAD_RING.includes(s.type)) {
      for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) {
        if (j !== s.y - 1 && j !== s.y + s.h && i !== s.x - 1 && i !== s.x + s.w) continue;
        if (this.carve(i, j) || (World.inb(i, j) && World.tiles[World.idx(i, j)] === T.ROAD)) ring.add(World.idx(i, j));
      }
      if (ring.size) this.link([...ring], ring);
    } else {
      // o porto: só a estrada da porta (o lado virado para o castelo, em terra) até a estrada principal
      // um ponto de terra livre em volta (a 1 passo; se não houver, a 2), do lado mais perto do castelo
      const cp = World.capitals[s.owner], land = (i, j) => World.inb(i, j) && (ROAD_GROUND.includes(World.tiles[World.idx(i, j)]) || World.tiles[World.idx(i, j)] === T.ROAD) && this.free(World.idx(i, j));
      let door = null;
      for (let d = 1; d <= 2 && !door; d++) {
        const c = []; for (let j = s.y - d; j <= s.y + s.h - 1 + d; j++) for (let i = s.x - d; i <= s.x + s.w - 1 + d; i++) if ((j === s.y - d || j === s.y + s.h - 1 + d || i === s.x - d || i === s.x + s.w - 1 + d) && land(i, j)) c.push([i, j]);
        if (cp) c.sort((a, b) => U.dist(a[0], a[1], cp.x, cp.y) - U.dist(b[0], b[1], cp.x, cp.y)); door = c[0] || null;
      }
      if (door) { this.carve(door[0], door[1]); const k = World.idx(door[0], door[1]); this.link([k], new Set([k])); }
    }
    World.touchArea(s.x - 30, s.y - 30, s.w + 60, s.h + 60);
  },
  // os prédios de cada castelo que ainda não têm a estrada
  ensure() {
    const S = this.S(); let n = 0;
    for (const s of World.structs) {
      if (!s || s.removed || s.hidden || !CROAD_TYPES.includes(s.type) || typeof s.owner !== 'number' || S[this.key(s)]) continue;
      const cp = World.capitals[s.owner]; if (!cp || (s.type !== 'port' && U.dist(s.x, s.y, cp.x, cp.y) > 40)) continue; // (o porto pode ficar longe do castelo)
      this.build(s); S[this.key(s)] = 1; n++;
    }
    if (n) { World.chunks = new Map(); if (World.mini) World.buildMinimap(); }
    return n;
  },
};

{
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') { try { CastleRoads.ensure(); } catch (e) { console.error(e); } } return r; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') { try { CastleRoads.ensure(); } catch (e) { console.error(e); } } return r; };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { CastleRoads.ensure(); } catch (e) { console.error(e); } };
}
