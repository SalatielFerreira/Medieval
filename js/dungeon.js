'use strict';
// Cavernas e masmorras: entradas no mundo, interior gerado, monstros, chefes e tesouros.

const CAVE_NAMES = ['Gruta dos Ecos', 'Mina Abandonada', 'Covil da Aranha', 'Catacumbas Antigas', 'Toca do Troll', 'Abismo Gelado',
  'Caverna Cristalina', 'Fenda Sombria', 'Galerias do Rei Morto', 'Poço sem Fundo', 'Gruta Úmida', 'Salão dos Ossos'];
const CAVE_THEMES = {
  troll:        { boss: 'troll',        mobs: ['bat', 'spider', 'skeleton'], loot: 'troll_club' },
  skel_king:    { boss: 'skel_king',    mobs: ['skeleton', 'skeleton', 'bat'], loot: 'ancient_blade' },
  spider_queen: { boss: 'spider_queen', mobs: ['spider', 'spider', 'bat'], loot: 'silk_hood' },
  dragon:       { boss: 'dragon',       mobs: ['skeleton', 'bat', 'spider'], loot: 'crystal_crown' },
};
const CW = 70, CHH = 48, CX0 = 120, CY0 = 130; // área usada dentro da grade do mundo

const Dungeon = {
  stash: null,

  // chamado ao final da geração do mundo (também roda no worker)
  placeCaves(world, rng, reach) {
    world.caves = [];
    const near = (x, y) => world.capitals.some(c => U.dist(x, y, c.x, c.y) < 20) || world.villages.some(v => U.dist(x, y, v.x, v.y) < 16);
    const bosses = ['troll', 'skel_king', 'spider_queen'];
    for (let tries = 0; tries < 20000 && world.caves.length < 12; tries++) {
      const x = 4 + Math.floor(rng() * (WORLD_W - 8)), y = 4 + Math.floor(rng() * (WORLD_H - 8));
      const i = world.idx(x, y), t = world.tiles[i];
      if (!reach[i] || (t !== T.HILL && t !== T.SNOW) || world.sgrid[i] >= 0 || world.obj[i]) continue;
      let mount = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (world.tile(x + dx, y + dy) === T.MOUNT) mount = true;
      if (!mount || near(x, y) || world.caves.some(c => U.dist(x, y, c.x, c.y) < 34)) continue;
      const n = world.caves.length;
      world.caves.push(world.addStruct('cave', x, y, 1, 1, 'wild', { cave: n, theme: bosses[n % 3], cname: CAVE_NAMES[n % CAVE_NAMES.length] }));
    }
    // masmorras do dragão nas maiores ilhas
    world.islands.slice(0, 3).forEach((is, k) => {
      for (let r = 0; r < is.r; r++) for (let a = 0; a < 16; a++) {
        const x = Math.round(is.x + Math.cos(a / 16 * Math.PI * 2) * r), y = Math.round(is.y + Math.sin(a / 16 * Math.PI * 2) * r);
        if (!world.inb(x, y)) continue;
        const i = world.idx(x, y), t = world.tiles[i];
        if (t === T.DEEP || t === T.WATER || t === T.MOUNT || world.sgrid[i] >= 0) continue;
        const n = world.caves.length;
        world.obj[i] = 0;
        world.caves.push(world.addStruct('cave', x, y, 1, 1, 'wild', { cave: n, theme: 'dragon', cname: ['Covil do Dragão', 'Ninho das Escamas', 'Forja do Dragão'][k] }));
        r = 99; break;
      }
    });
  },

  state(idx) {
    if (!G.dungeons[idx]) G.dungeons[idx] = { cleared: false, opened: [] };
    return G.dungeons[idx];
  },

  // ------------------------------------------------------------ entrar e sair
  enter(cave) {
    if (G.dungeon) return;
    Urban.stop();
    if (P.mounted) { P.mounted = false; }
    if (G.siege) Game.endSiege('Você entrou na caverna e o cerco foi abandonado.');
    if (G.duel) Arena.lose('saiu da arena');
    const W = World;
    this.stash = {
      tiles: W.tiles, obj: W.obj, objHp: W.objHp, terr: W.terr, sgrid: W.sgrid, elev: W.elev, structs: W.structs, regrow: W.regrow,
      mini: W.mini, villages: W.villages, capitals: W.capitals, camps: W.camps, islands: W.islands, caves: W.caves, start: W.start, startCabin: W.startCabin,
      ents: G.ents.filter(e => e.kind !== 'ally'), px: P.x, py: P.y, ping: G.ping, cave,
    };
    for (const e of this.stash.ents) if (e.npc) G.spawned.delete(e.npc.id);
    this.stash.ents = this.stash.ents.filter(e => !e.npc);
    const st = this.state(cave.cave), th = CAVE_THEMES[cave.theme];
    const rng = U.mulberry32(WORLD_SEED + cave.cave * 977 + 13);
    const N = WORLD_W * WORLD_H;
    W.tiles = new Uint8Array(N).fill(T.CWALL); W.obj = new Uint8Array(N); W.objHp = new Uint8Array(N);
    W.terr = new Int8Array(N).fill(-1); W.sgrid = new Int16Array(N).fill(-1); W.elev = new Float32Array(N);
    W.structs = []; W.regrow = []; W.chunks = new Map(); W.villages = []; W.capitals = []; W.camps = []; W.islands = []; W.caves = [];
    // autômato celular para salões e túneis naturais
    let g = new Uint8Array(CW * CHH);
    for (let i = 0; i < g.length; i++) g[i] = rng() < 0.47 ? 1 : 0;
    const at = (a, x, y) => (x < 0 || y < 0 || x >= CW || y >= CHH) ? 1 : a[y * CW + x];
    for (let it = 0; it < 5; it++) {
      const n2 = new Uint8Array(g.length);
      for (let y = 0; y < CHH; y++) for (let x = 0; x < CW; x++) {
        let w = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) w += at(g, x + dx, y + dy);
        n2[y * CW + x] = w >= 5 || (it < 2 && w <= 1) ? 1 : 0;
      }
      g = n2;
    }
    // corredor central garante ligação da entrada até o fundo
    let yy = Math.floor(CHH / 2);
    for (let x = 2; x < CW - 2; x++) {
      yy = U.clamp(yy + (rng() < 0.3 ? (rng() < 0.5 ? -1 : 1) : 0), 4, CHH - 5);
      for (let d = -1; d <= 1; d++) g[(yy + d) * CW + x] = 0;
    }
    for (let y = 0; y < CHH; y++) for (let x = 0; x < CW; x++) if (!g[y * CW + x] && x > 0 && y > 0 && x < CW - 1 && y < CHH - 1) W.tiles[W.idx(CX0 + x, CY0 + y)] = T.CFLOOR;
    // entrada: piso mais à esquerda perto do meio
    let ent = null;
    for (let x = 1; x < CW && !ent; x++) for (let d = 0; d < CHH / 2 && !ent; d++) for (const s of [1, -1]) {
      const y = Math.floor(CHH / 2) + d * s;
      if (W.tile(CX0 + x, CY0 + y) === T.CFLOOR && W.tile(CX0 + x, CY0 + y + 1) === T.CFLOOR) { ent = { x: CX0 + x, y: CY0 + y }; break; }
    }
    // distâncias a partir da entrada (BFS) e só a parte alcançável fica aberta
    const dist = new Int32Array(N).fill(-1), q = [W.idx(ent.x, ent.y)];
    dist[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], cx = c % WORLD_W, cy = (c / WORLD_W) | 0;
      for (const [dx, dy] of DIRS4) { const ni = W.idx(cx + dx, cy + dy); if (dist[ni] < 0 && W.tiles[ni] === T.CFLOOR) { dist[ni] = dist[c] + 1; q.push(ni); } }
    }
    for (let i = 0; i < N; i++) if (W.tiles[i] === T.CFLOOR && dist[i] < 0) W.tiles[i] = T.CWALL;
    const floor = q.slice();
    const far = floor.reduce((b, i) => dist[i] > dist[b] ? i : b, floor[0]);
    W.addStruct('cave_exit', ent.x, ent.y, 1, 1, 'wild', {});
    // minérios nas paredes
    for (const i of floor) {
      if (dist[i] < 6) continue;
      const x = i % WORLD_W, y = (i / WORLD_W) | 0;
      if (!DIRS4.some(([dx, dy]) => W.tile(x + dx, y + dy) === T.CWALL)) continue;
      const r = rng(), rich = cave.theme === 'dragon' ? 2 : 1;
      const o = r < 0.06 ? 12 : r < 0.1 ? 4 : r < 0.12 * rich ? 15 : r < 0.135 * rich ? 5 : r < 0.145 * rich ? 16 : 0;
      if (o) { W.obj[i] = o; W.objHp[i] = OBJ[o].hp; }
    }
    // baús de tesouro nos pontos mais afastados
    const spots = floor.filter(i => dist[i] > 14 && !W.obj[i]).sort(() => rng() - 0.5);
    const chests = [];
    for (const i of spots) {
      if (chests.length >= 4) break;
      if (chests.some(j => U.dist(i % WORLD_W, (i / WORLD_W) | 0, j % WORLD_W, (j / WORLD_W) | 0) < 10)) continue;
      chests.push(i);
    }
    chests.forEach((i, k) => W.addStruct('tchest', i % WORLD_W, (i / WORLD_W) | 0, 1, 1, 'wild', { tid: k, opened: st.opened.includes(k) }));
    W.buildMinimap();
    // monstros espalhados (menos se a caverna já foi limpa)
    G.ents = G.ents.filter(e => e.kind === 'ally');
    const mobN = st.cleared ? 5 : 16;
    const mobSpots = floor.filter(i => dist[i] > 9).sort(() => rng() - 0.5).slice(0, mobN);
    for (const i of mobSpots) {
      const kind = U.pick(th.mobs);
      Game.spawn(kind, (i % WORLD_W + 0.5) * TILE, (((i / WORLD_W) | 0) + 0.8) * TILE, { leash: 8, archer: kind === 'skeleton' && Math.random() < 0.35 });
    }
    if (!st.cleared) Game.spawn(th.boss, (far % WORLD_W + 0.5) * TILE, (((far / WORLD_W) | 0) + 0.8) * TILE, { leash: 14 });
    G.dungeon = { idx: cave.cave, name: cave.cname, theme: cave.theme };
    P.x = (ent.x + 0.5) * TILE; P.y = (ent.y + 1.8) * TILE; P.sailing = false; P.fishing = null;
    if (World.blockedAt(P.x, P.y, 8)) P.y = (ent.y + 0.9) * TILE;
    for (const a of G.ents) if (a.kind === 'ally') { const s = freeSpotNear(P.x, P.y, 40); a.x = s.x; a.y = s.y; a.target = null; }
    G.ping = null;
    UI.banner('🕯️ ' + cave.cname);
    UI.msg(st.cleared ? 'Esta caverna já foi limpa, mas ainda há criaturas e minérios.' : `Algo terrível habita o fundo desta caverna... (${CREATURES[th.boss].name})`, st.cleared ? '' : 'bad');
    Sound.play('chest');
  },
  exit(toHome) {
    if (!G.dungeon || !this.stash) return;
    const S = this.stash, W = World;
    Object.assign(W, { tiles: S.tiles, obj: S.obj, objHp: S.objHp, terr: S.terr, sgrid: S.sgrid, elev: S.elev, structs: S.structs, regrow: S.regrow,
      mini: S.mini, villages: S.villages, capitals: S.capitals, camps: S.camps, islands: S.islands, caves: S.caves, start: S.start, startCabin: S.startCabin });
    W.chunks = new Map();
    const allies = G.ents.filter(e => e.kind === 'ally' && !e.dead);
    G.ents = S.ents.concat(allies);
    G.ping = S.ping;
    if (toHome) { P.x = G.spawn.x; P.y = G.spawn.y; }
    else { P.x = (S.cave.x + 0.5) * TILE; P.y = (S.cave.y + 1.9) * TILE; if (World.blockedAt(P.x, P.y, 8)) { const s = freeSpotNear(P.x, P.y, 60); P.x = s.x; P.y = s.y; } }
    for (const a of allies) { const s = freeSpotNear(P.x, P.y, 50); a.x = s.x; a.y = s.y; a.target = null; }
    G.dungeon = null; this.stash = null;
    UI.msg('Você saiu da caverna.');
  },

  // ------------------------------------------------------------ tesouros e chefes
  openChest(s) {
    if (s.opened) { UI.msg('O baú está vazio.'); return; }
    s.opened = true; Progress.add("chests");
    const st = this.state(G.dungeon.idx);
    st.opened.push(s.tid);
    const gold = U.rint(60, 200) * (G.dungeon.theme === 'dragon' ? 2 : 1);
    P.gold += gold;
    const pool = [['gem', 1, 2], ['silver_bar', 1, 3], ['gold_bar', 1, 2], ['steel_bar', 1, 3], ['ancient_coin', 2, 5], ['iron_arrow', 10, 25], ['herbal_salve', 1, 3], ['spider_silk', 2, 4]];
    const got = [`${gold} 🪙`];
    for (let k = U.rint(2, 3); k > 0; k--) {
      const [it, a, b] = U.pick(pool), n = U.rint(a, b);
      Inv.add(it, n); got.push(`${n} ${ITEMS[it].name}`);
    }
    if (Math.random() < 0.12) { const it = U.pick(['ancient_blade', 'troll_club', 'crystal_crown', 'silk_hood']); Inv.add(it, 1); got.push('✨ ' + ITEMS[it].name); }
    Sound.play('chest'); Sound.play('coin');
    UI.banner('💰 Tesouro encontrado!');
    UI.msg('Você encontrou: ' + got.join(', ') + '.', 'gold');
  },
  onBossKill(e) {
    if (!G.dungeon) return;
    const st = this.state(G.dungeon.idx), th = CAVE_THEMES[G.dungeon.theme];
    st.cleared = true;
    Inv.add(th.loot, 1);
    UI.banner(`⚔️ ${e.def.name} foi derrotado!`);
    UI.msg(`Você venceu ${e.def.name} e conquistou: ${ITEMS[th.loot].name}! A caverna está livre.`, 'gold');
    if (typeof Diplo !== 'undefined') Diplo.chronicle(`⚔️ ${G.name} derrotou ${e.def.name} em ${G.dungeon.name}.`);
  },
};

// ------------------------------------------------------------------ desenho dos monstros
function drawSpider(ctx, x, y, s, anim, hurt, col) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hurt ? '#ff8080' : '#1a1418'; ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) {
    const w = Math.sin(anim * 14 + k) * 2;
    ctx.beginPath(); ctx.moveTo(sd * 4, -8); ctx.lineTo(sd * (10 + k * 2), -14 + k * 3 + w); ctx.lineTo(sd * (14 + k * 2), -2 + k); ctx.stroke();
  }
  ctx.fillStyle = hurt ? '#ff8080' : col; ctx.beginPath(); ctx.ellipse(0, -10, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -18, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff3030'; for (const ex of [-3, -1, 1, 3]) ctx.fillRect(ex - 0.5, -20, 1.5, 1.5);
  ctx.restore();
}
function drawBat(ctx, x, y, anim, hurt) {
  const f = Math.sin(anim * 22) * 6;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - 22 + Math.sin(anim * 4) * 3));
  ctx.fillStyle = hurt ? '#ff8080' : '#2a2030';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -4 - f); ctx.lineTo(-7, 2); ctx.lineTo(-4, 1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -4 - f); ctx.lineTo(7, 2); ctx.lineTo(4, 1); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5050'; ctx.fillRect(-2, -2, 1.5, 1.5); ctx.fillRect(1, -2, 1.5, 1.5);
  ctx.restore();
}
function drawDragon(ctx, x, y, dir, anim, hurt) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir * 1.6, 1.6);
  const body = hurt ? '#ff8080' : '#a8282a', dark = '#6a1414', wing = Math.sin(anim * 3) * 6;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-30, -48 - wing); ctx.lineTo(-22, -26); ctx.lineTo(-34, -30 - wing); ctx.lineTo(-10, -18); ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-36, -10, -40, -24); ctx.lineTo(-36, -12); ctx.quadraticCurveTo(-26, -4, -14, -8); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -16, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
  for (const lx of [-12, -4, 6, 13]) ctx.fillRect(lx, -8, 4, 8);
  ctx.beginPath(); ctx.moveTo(12, -22); ctx.quadraticCurveTo(22, -40, 30, -36); ctx.lineTo(36, -30); ctx.lineTo(24, -26); ctx.lineTo(16, -14); ctx.fill();
  ctx.fillStyle = '#ffd34a'; ctx.fillRect(29, -35, 2, 2);
  ctx.fillStyle = '#e8d8b0'; ctx.fillRect(27, -40, 2, 5); ctx.fillRect(31, -41, 2, 5);
  ctx.fillStyle = dark; for (let k = -14; k < 12; k += 5) { ctx.beginPath(); ctx.moveTo(k, -26); ctx.lineTo(k + 2, -31); ctx.lineTo(k + 4, -26); ctx.fill(); }
  if (Math.sin(anim * 1.3) > 0.85) { ctx.fillStyle = 'rgba(255,140,40,0.85)'; ctx.beginPath(); ctx.moveTo(36, -32); ctx.lineTo(60, -38); ctx.lineTo(58, -24); ctx.fill(); }
  ctx.restore();
}
