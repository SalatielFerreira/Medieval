'use strict';
// Lavoura (arar, plantar, regar, colher), criação de animais, efeitos de comida e a taverna do jogador.

const Farm = {
  plots() { return G.plots || (G.plots = {}); },
  tillable(t) { return t === T.GRASS || t === T.FOREST || t === T.HILL || t === T.SAND; },
  seedList() { return Object.keys(P.inv).filter(k => ITEMS[k].seed); },
  // semente escolhida pelo jogador (ou a primeira da mochila)
  seed() { if (P.seed && Inv.count(P.seed) > 0) return P.seed; return this.seedList()[0] || null; },

  // usar enxada ou regador num tile; devolve verdadeiro se fez algo
  use(tool, tx, ty) {
    if (!World.inb(tx, ty)) return false;
    const i = World.idx(tx, ty), plots = this.plots(), p = plots[i], t = World.tiles[i];
    const px = (tx + 0.5) * TILE, py = (ty + 0.5) * TILE;
    if (tool === 'water') {
      if (t === T.WATER || t === T.DEEP) { P.water = 12; Game.addText(px, py - 10, 'Regador cheio!', '#9ad0ff'); Sound.play('splash'); return true; }
      if (!p) return false;
      if ((P.water || 0) <= 0) { UI.msg('O regador está vazio. Encha-o clicando na água.', 'bad'); return true; }
      P.water--; p.watered = true;
      Game.burst(px, py, '#6ab0ff', 8); Sound.play('splash', { vol: 0.5 });
      return true;
    }
    if (tool !== 'hoe') return false;
    if (p) {
      if (p.crop && p.stage >= CROPS[p.crop].days) return this.harvest(i);
      if (!p.crop) {
        if (Season.winter()) { UI.msg('❄️ A terra está congelada. Plante de novo na primavera.', 'bad'); return true; }
        const s = this.seed();
        if (!s) { UI.msg('Você não tem sementes. Compre no Armazém ou colha plantações.', 'bad'); return true; }
        Inv.add(s, -1); p.crop = ITEMS[s].seed; p.stage = 0; p.planted = G.day;
        Game.addText(px, py - 10, `Plantou ${CROPS[p.crop].name}`, '#9be37a'); Sound.play('pickup');
        Progress.add('planted');
        return true;
      }
      Game.addText(px, py - 10, `${CROPS[p.crop].name}: ${p.stage}/${CROPS[p.crop].days} (cresce a cada ${daysText(ECON_DAYS)})${p.watered ? ' · regado' : ''}`, '#ffe9a8');
      return true;
    }
    if (!this.tillable(t) || World.obj[i] || World.sgrid[i] >= 0 || G.dungeon) return false;
    plots[i] = { crop: null, stage: 0, watered: false };
    Game.burst(px, py, '#7a5230', 8); Sound.play('chop', { vol: 0.6 });
    return true;
  },
  harvest(i) {
    const p = this.plots()[i], c = CROPS[p.crop];
    const n = U.rint(c.yield[0], c.yield[1]), seeds = U.rint(1, 2);
    Inv.add(c.item, n); Inv.add(c.seed, seeds);
    const x = (i % WORLD_W + 0.5) * TILE, y = ((i / WORLD_W) | 0) * TILE;
    Game.addText(x, y, `+${n} ${ITEMS[c.item].name} · +${seeds} sementes`, '#ffe9a8');
    Sound.play('pickup'); Game.gainXp(3);
    Progress.add('harvested', n);
    p.crop = null; p.stage = 0; p.watered = false;
    return true;
  },
  // um dia passa para as plantações
  dayTick(rained) {
    const winter = Season.winter();
    for (const k in this.plots()) {
      const p = G.plots[k];
      if (!p.crop) continue;
      if (winter) { if (Math.random() < 0.5) { p.crop = null; p.stage = 0; } continue; }
      if ((p.watered || rained) && p.stage < CROPS[p.crop].days) p.stage++;
      p.watered = false;
    }
    if (winter && Object.values(G.plots).some(p => p.crop === null)) { /* algumas plantações morreram de frio */ }
  },
  draw(ctx, cx, cy, cw, ch) {
    const plots = this.plots(), t = G.realTime;
    for (const k in plots) {
      const i = +k, x = (i % WORLD_W) * TILE - cx, y = ((i / WORLD_W) | 0) * TILE - cy;
      if (x < -40 || y < -40 || x > cw + 40 || y > ch + 40) continue;
      const p = plots[k];
      ctx.fillStyle = p.watered ? '#4a3018' : '#6e4a28'; ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = p.watered ? '#3a2410' : '#5a3a1e'; for (let r = 6; r < TILE; r += 8) ctx.fillRect(x + 3, y + r, TILE - 6, 2);
      if (!p.crop) continue;
      const c = CROPS[p.crop], g = p.stage / c.days;
      const sway = Math.sin(t * 2 + i) * 1;
      for (const [ox, oy] of [[8, 9], [20, 9], [8, 23], [20, 23]]) {
        if (g < 0.34) { ctx.fillStyle = '#6ab04a'; ctx.fillRect(x + ox, y + oy - 3, 2, 4); }
        else if (g < 1) { ctx.fillStyle = '#4f9a36'; ctx.fillRect(x + ox - 1 + sway, y + oy - 8, 3, 9); ctx.fillRect(x + ox - 3, y + oy - 4, 7, 2); }
        else if (p.crop === 'carrot') { ctx.fillStyle = '#4f9a36'; ctx.fillRect(x + ox - 2 + sway, y + oy - 9, 5, 6); ctx.fillStyle = c.color; ctx.fillRect(x + ox - 1, y + oy - 3, 3, 4); }
        else if (p.crop === 'cabbage') { ctx.fillStyle = '#5a9a36'; ctx.beginPath(); ctx.arc(x + ox + 1, y + oy - 3, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(x + ox + 1, y + oy - 4, 3, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillStyle = '#7a9a3a'; ctx.fillRect(x + ox + sway, y + oy - 12, 2, 12); ctx.fillStyle = c.color; ctx.fillRect(x + ox - 1 + sway, y + oy - 15, 4, 6); }
      }
      if (g >= 1) { ctx.fillStyle = `rgba(255,230,120,${0.35 + Math.sin(t * 4 + i) * 0.2})`; ctx.fillRect(x + 13, y - 4, 6, 3); }
    }
  },

  // ------------------------------------------------------------ animais e colmeias
  cap(s) { return s.type === 'coop' ? { chicken: 6 } : s.type === 'pen' ? { cow: 3, sheep: 4 } : {}; },
  buyAnimal(s, kind) {
    const price = ANIMAL_PRICES[kind];
    s.animals = s.animals || {};
    if (P.gold < price || (s.animals[kind] || 0) >= (this.cap(s)[kind] || 0)) return;
    P.gold -= price; s.animals[kind] = (s.animals[kind] || 0) + 1;
    UI.msg(`Você comprou ${kind === 'chicken' ? 'uma galinha' : kind === 'cow' ? 'uma vaca' : 'uma ovelha'}!`, 'gold'); Sound.play('coin');
  },
  produce() {
    const winter = Season.winter();
    for (const s of World.structs) {
      if (s.owner !== 'player') continue;
      s.goods = s.goods || {};
      const a = s.animals || {}, add = (k, n) => { if (n > 0) s.goods[k] = (s.goods[k] || 0) + n; };
      if (s.type === 'coop') add('egg', winter ? Math.floor((a.chicken || 0) / 2) : (a.chicken || 0));
      if (s.type === 'pen') { add('milk', a.cow || 0); if (G.day % 2 === 0) add('wool', (a.sheep || 0) * 2); }
      if (s.type === 'beehive' && !winter) add('honey', 1);
    }
  },
  collect(s) {
    const g = s.goods || {}, got = [];
    for (const k in g) { if (g[k] > 0) { Inv.add(k, g[k]); got.push(`${g[k]} ${ITEMS[k].name}`); } }
    s.goods = {};
    UI.msg(got.length ? 'Você recolheu: ' + got.join(', ') + '.' : 'Ainda não há nada para recolher.', got.length ? 'gold' : '');
    if (got.length) Sound.play('pickup');
  },
  // os animais aparecem passeando perto da construção
  ambient() {
    for (const s of World.structs) {
      if (s.owner !== 'player' || !s.animals) continue;
      if (U.dist(P.x / TILE, P.y / TILE, s.x, s.y) > 26) continue;
      for (const kind in s.animals) {
        const tag = `pet${s.id}${kind}`;
        const have = G.ents.filter(e => e.tag === tag && !e.dead).length;
        for (let k = have; k < s.animals[kind]; k++) {
          const sp = freeSpotNear((s.x + s.w / 2) * TILE, (s.y + s.h + 1) * TILE, 2 * TILE);
          Game.spawn(kind, sp.x, sp.y, { leash: kind === 'chicken' ? 2.5 : 3.5, tag });
        }
      }
    }
  },

  // ------------------------------------------------------------ efeitos de comida e bebida
  addBuff(k) {
    const b = BUFFS[k];
    P.buffs = P.buffs || {};
    P.buffs[k] = G.realTime + b.dur;
    UI.msg(`${b.icon} ${b.name}: ${b.desc} por ${Math.round(b.dur / 60)} min.`, 'gold');
  },
  has(k) { return P.buffs && P.buffs[k] > G.realTime; },
  active() { return Object.keys(P.buffs || {}).filter(k => this.has(k)); },

  // ------------------------------------------------------------ taverna do jogador
  tavernTick() {
    for (const s of World.structs) {
      if (s.owner !== 'player' || s.type !== 'ptavern') continue;
      s.stock = s.stock || {}; s.till = s.till || 0;
      const civ = World.terr[World.idx(s.x, s.y)];
      let left = (civ >= 0 ? 8 : 4) + Biz.workerCount(s) * BIZ_TYPES.ptavern.sales, sold = 0, earned = 0;
      for (const k of Object.keys(s.stock).sort((a, b) => ITEMS[b].price - ITEMS[a].price)) {
        while (left > 0 && s.stock[k] > 0) {
          s.stock[k]--; left--; sold++;
          earned += Math.round(ITEMS[k].price * (ITEMS[k].buff ? 1.5 : 1.2));
        }
        if (s.stock[k] <= 0) delete s.stock[k];
      }
      s.till += earned;
      if (sold) {
        if (civ >= 0) Game.addRelation(civ, 1);
        Game.note(`🍺 Sua taverna vendeu ${sold} itens e lucrou ${earned} 🪙.`);
        Progress.add('tavernGold', earned);
      }
    }
  },
};
