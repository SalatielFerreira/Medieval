'use strict';
// Famílias (casas): sobrenomes, riqueza, empreendimentos, influência, chefes de vila, revoltas contra a coroa
// e vilas fundadas com o nome da família. Também os empreendimentos do jogador, com funcionários contratados.

const FAMILY_BIZ = {
  fmill:  { name: 'Moinho',  icon: '🌬️', w: 2, h: 2, income: 9,  ranks: ['peasant'] },
  fshop:  { name: 'Empório', icon: '🧺', w: 3, h: 2, income: 12, ranks: ['merchant', 'innkeeper'] },
  fforge: { name: 'Oficina', icon: '⚒️', w: 2, h: 2, income: 10, ranks: ['smith', 'mason'] },
  ffarm:  { name: 'Quinta',  icon: '🌾', w: 3, h: 2, income: 7,  ranks: ['peasant', 'hunter'] },
  fvine:  { name: 'Vinhedo', icon: '🍇', w: 3, h: 2, income: 8,  ranks: ['innkeeper', 'lumber'] },
};
// quanto cada ofício rende por dia para a família
const RANK_INCOME = { knight: 7, merchant: 12, smith: 10, lumber: 8, mason: 8, innkeeper: 10, hunter: 6, mercenary: 5, peasant: 3, wanderer: 1 };
const NOBLE_RANKS = ['ruler', 'consort', 'heir'];
const SHOP_RANKS = ['merchant', 'smith', 'lumber', 'mason', 'innkeeper'];
const FOUND_COST = { gold: 10000 };
const MAX_FOUNDED = 12;
// limite suave da população: acima disso nascem cada vez menos crianças
const POP_SOFT = 600, POP_HARD = 850;

const Families = {
  F() { return G.fams || (G.fams = {}); },
  get(id) { return id === undefined || id === null ? null : this.F()[id]; },
  of(p) { return p ? this.get(p.fam) : null; },
  usedSurnames() { const u = new Set(); for (const k in this.F()) u.add(this.F()[k].surname); return u; },
  // sobrenome ainda não usado por outra família (se acabarem, repete)
  newSurname() {
    const used = this.usedSurnames(), free = SURNAMES.filter(s => !used.has(s));
    return U.pick(free.length ? free : SURNAMES);
  },
  create(surname, o = {}) {
    G.famSeq = (G.famSeq || 0) + 1;
    const f = Object.assign({ id: G.famSeq, surname, civ: -1, seat: null, wealth: Math.round(40 + Math.pow(Math.random(), 2) * 500), loyalty: U.rint(45, 80), ambition: Math.random() < 0.15 ? U.rint(-34, -20) : U.rint(-10, 6), biz: [], founded: null,
      noble: false, player: false, color: `hsl(${U.rint(0, 359)}, 55%, 42%)`, since: G.day || 1 }, o);
    this.F()[f.id] = f;
    return f;
  },
  members(f, all) { return G.people.filter(p => p.fam === f.id && (all || p.alive)); },
  adults(f) { return this.members(f).filter(p => p.age >= 16); },
  name(f) { return f.player ? `Casa ${f.surname} (sua)` : `Casa ${f.surname}`; },
  // chefe: o adulto mais velho com ofício, ou o mais velho
  head(f) {
    if (f.player) return null;
    const a = this.adults(f);
    if (!a.length) return this.members(f)[0] || null;
    return a.sort((x, y) => (NOBLE_RANKS.indexOf(x.rank) < 0) - (NOBLE_RANKS.indexOf(y.rank) < 0) || (x.rank === 'ruler' ? -1 : 0) || y.age - x.age)[0];
  },
  influence(f) {
    if (f.player) return Math.round(P.gold / 20 + this.members(f).length * 4 + World.structs.filter(s => s.owner === 'player' && BIZ_TYPES[s.type]).length * 15 +
      G.civs.filter(c => c.ruler === 'player').length * 80 + World.villages.filter(v => v.lord === 'player').length * 40 + 20);
    return Math.round(f.wealth / 20 + this.members(f).length * 4 + f.biz.length * 15 + (f.noble ? 60 : 0) + (f.founded !== null ? 40 : 0) +
      World.villages.filter(v => v.chief !== undefined && this.of(G.people[v.chief]) === f).length * 20);
  },
  // famílias ordenadas por influência (opcionalmente só de um reino)
  ranking(civ) {
    return Object.values(this.F()).filter(f => (civ === undefined || f.civ === civ) && (f.player || this.members(f).length))
      .map(f => ({ f, inf: this.influence(f) })).sort((a, b) => b.inf - a.inf);
  },
  seatName(f) {
    if (f.player) return 'Sua casa';
    if (f.seat === null) return 'Sem morada fixa';
    if (f.seat === 'castle') return 'Castelo de ' + CIV_DEFS[f.civ].short;
    return World.villages[f.seat] ? World.villages[f.seat].name : '?';
  },
  // pessoas que vivem em cada reino (pela morada)
  civOf(p) {
    if (p.home.type === 'village' && World.villages[p.home.idx]) return World.villages[p.home.idx].civ;
    if (p.home.type === 'castle') return p.home.civ;
    return p.civ;
  },
  civPeople(ci) { return G.people.filter(p => p.alive && this.civOf(p) === ci && !p.capanga && p.home.type !== 'player'); },

  // ------------------------------------------------------------ criação inicial (após People.generate)
  init() {
    G.revolts = G.revolts || [];
    G.founded = G.founded || [];
    for (const p of G.people) this.attach(p);
    this.refresh();
  },
  // garante que a pessoa pertence a uma família
  attach(p) {
    if (p.fam !== undefined && this.get(p.fam)) return;
    const key = p.surname + '|' + (p.home.type === 'village' ? 'v' + p.home.idx : p.home.type === 'castle' ? 'c' + p.home.civ : p.home.type);
    let f = Object.values(this.F()).find(x => x.key === key && !x.player);
    if (!f) f = this.create(p.surname, { key, civ: this.civOf(p), seat: p.home.type === 'village' ? p.home.idx : p.home.type === 'castle' ? 'castle' : null, noble: NOBLE_RANKS.includes(p.rank) });
    p.fam = f.id;
  },
  // nova família para uma pessoa recém-criada (sobrenome único)
  forNew(o) {
    const surname = o.surname || this.newSurname();
    const home = o.home || { type: 'wild' };
    const f = this.create(surname, { civ: o.civ !== undefined ? o.civ : -1, seat: home.type === 'village' ? home.idx : home.type === 'castle' ? 'castle' : null, noble: NOBLE_RANKS.includes(o.rank) });
    return f;
  },
  ensurePlayer() {
    let f = G.playerFam !== undefined ? this.get(G.playerFam) : null;
    if (!f) { f = this.create(G.surname, { player: true, color: PLAYER_COLOR, wealth: 0, loyalty: 100 }); G.playerFam = f.id; }
    f.surname = G.surname;
    return f;
  },
  // casamento: a esposa assume o sobrenome e a casa do marido (rainhas reinantes e a heroína mantêm o próprio nome)
  wed(a, b) {
    const h = a.sex === 'm' ? a : b, w = h === a ? b : a;
    const keepHers = w.rank === 'ruler';
    const from = keepHers ? h : w, to = keepHers ? w : h;
    if (from.fam !== to.fam || from.surname !== to.surname) {
      if (from === w && !w.maiden) w.maiden = w.surname;
      if (from === w && from.fam !== to.fam) w.maidenFam = from.fam; // a casa de onde ela veio
      from.surname = to.surname; from.fam = to.fam;
    }
  },

  // ------------------------------------------------------------ um dia passa
  dayTick() {
    if (G.dungeon) return; // as vilas só existem fora das cavernas
    G.aliveCount = G.people.filter(p => p.alive).length;
    this.retire();
    this.refresh();
    const fams = Object.values(this.F());
    for (const f of fams) {
      if (f.player) continue;
      const mem = this.members(f);
      if (!mem.length) continue;
      // renda dos ofícios e empreendimentos, menos o sustento
      let inc = mem.reduce((s, p) => s + (RANK_INCOME[p.rank] || 0), 0) + f.biz.reduce((s, b) => s + FAMILY_BIZ[b.type].income, 0) + (f.noble ? 10 : 0);
      if (Season.winter()) inc *= 0.8;
      f.wealth = Math.max(0, Math.round(f.wealth + inc - mem.length * 0.6 + U.rnd(-2, 3)));
      // lealdade à coroa
      const c = G.civs[f.civ];
      if (c && !f.noble) {
        const target = 50 + (c.happy - 50) * 0.6 - c.tax * 90 + (f.favor || 0) + (f.ambition || 0);
        f.loyalty = U.clamp(f.loyalty + (target - f.loyalty) * 0.15 + U.rnd(-4, 4), 0, 100);
        f.favor = (f.favor || 0) * 0.96;
      }
      if (this.canFound(f) && G.day - (G.lastFound || -99) >= 3 * ECON_DAYS && Math.random() < 0.15) { if (this.found(f)) G.lastFound = G.day; }
      else if (typeof f.seat === 'number' && f.biz.length < 2 && f.wealth >= 300 + f.biz.length * 200 && this.bizIn(f.seat) < 4 && Math.random() < 0.2) this.buildBiz(f);
      if (c && !f.noble && f.loyalty < 20 && f.wealth >= 300 && this.adults(f).length >= 2 && G.day > 8 * ECON_DAYS && G.day - (G.lastRevolt || -999) >= 10 * ECON_DAYS &&
        !G.revolts.some(r => !r.done && r.civ === f.civ) && Math.random() < 0.2) { this.startRevolt(f); G.lastRevolt = G.day; }
    }
    this.crownTick();
    for (const r of G.revolts) if (!r.done) this.revoltDay(r);
    G.revolts = G.revolts.filter(r => !r.done || G.day - r.day < 12 * ECON_DAYS);
    // impostos das vilas do jogador
    const mine = World.villages.filter(v => v.lord === 'player');
    if (mine.length) {
      let g = 0;
      mine.forEach(v => { g += People.residents(World.villages.indexOf(v)).length * Court.villageTax(); });
      if (g) { P.gold += g; Game.note(`🏘️ Suas vilas pagaram ${g} 🪙 de impostos.`); }
    }
  },
  // famílias sem ninguém vivo saem da lista (e seus empreendimentos fecham)
  retire() {
    for (const f of Object.values(this.F())) {
      if (f.player || this.members(f).length) continue;
      for (const s of World.structs) if (s.fam === f.id && FAMILY_BIZ[s.type] && !s.hidden) World.removeStruct(s);
      for (const v of World.villages) if (v.lordFam === f.id) v.lordFam = undefined;
      if (f.founded !== null && G.founded) for (const sp of G.founded) if (sp.lordFam === f.id) sp.lordFam = undefined;
      delete this.F()[f.id];
    }
  },
  // chefes de vila e sedes das famílias
  refresh() {
    World.villages.forEach((v, vi) => {
      if (v.lord === 'player') { v.chief = 'player'; return; }
      const res = People.residents(vi).filter(p => p.age >= 18);
      const byFam = {};
      for (const p of res) if (p.fam !== undefined) (byFam[p.fam] = byFam[p.fam] || []).push(p);
      let best = null, bi = -1;
      for (const k in byFam) {
        const f = this.get(+k); if (!f) continue;
        const inf = this.influence(f) + (v.lordFam === f.id ? 1000 : 0);
        if (inf > bi) { bi = inf; best = f; }
      }
      const h = best && byFam[best.id].sort((a, b) => b.age - a.age)[0];
      v.chief = h ? h.id : undefined;
    });
  },
  chiefOf(v) { return v.chief === 'player' ? 'player' : v.chief !== undefined ? G.people[v.chief] : null; },
  isChief(p) { return World.villages.some(v => v.chief === p.id); },

  // ------------------------------------------------------------ empreendimentos das famílias
  buildBiz(f) {
    const v = World.villages[f.seat]; if (!v) return;
    const ranks = this.members(f).map(p => p.rank);
    const types = Object.keys(FAMILY_BIZ).filter(t => FAMILY_BIZ[t].ranks.some(r => ranks.includes(r)) && !f.biz.some(b => b.type === t));
    const type = types.length ? U.pick(types) : U.pick(Object.keys(FAMILY_BIZ).filter(t => !f.biz.some(b => b.type === t)));
    if (!type) return;
    const d = FAMILY_BIZ[type], vi = f.seat;
    for (let r = 9; r <= 15; r++) for (let k = 0; k < 28; k++) {
      const a = k / 28 * Math.PI * 2 + f.id;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, d.w + 2, d.h + 2) || !World.areaFree(x - 1, y - 1, d.w + 2, d.h + 2) || Towns.onRoad(x, y, d.w, d.h)) continue;
      World.addStruct(type, x, y, d.w, d.h, v.civ, { village: vi, fam: f.id });
      f.biz.push({ type, x, y });
      f.wealth -= 200 + f.biz.length * 40;
      World.chunks.clear();
      const known = U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 50;
      Diplo.chronicle(`🏗️ A ${this.name(f)} abriu ${d.name === 'Quinta' ? 'uma' : 'um'} ${d.name} em ${v.name}.`, known);
      return;
    }
  },
  bizIn(vi) { return World.structs.filter(s => s.fam !== undefined && FAMILY_BIZ[s.type] && s.village === vi).length; },
  bizName(s) {
    const f = this.get(s.fam), d = FAMILY_BIZ[s.type];
    return `${d.icon} ${d.name} da família ${f ? f.surname : '?'}`;
  },

  // ------------------------------------------------------------ vilas novas com o nome da família
  canFound(f) {
    if (f.founded !== null || f.noble || f.wealth < 700 || this.adults(f).length < 3 || G.founded.length >= MAX_FOUNDED) return false;
    if (f.seat === null || f.seat === 'castle') return false;
    const res = People.residents(f.seat).length;
    return res >= this.vcap(World.villages[f.seat]) - 4 || f.wealth >= 1100;
  },
  vcap(v) { return 18 + (v.level || 1) * 6; },
  // procura um lugar livre dentro do território
  site(civ, nx, ny) {
    for (let tries = 0; tries < 2500; tries++) {
      const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 30;
      const vx = Math.round(nx + Math.cos(a) * r), vy = Math.round(ny + Math.sin(a) * r);
      if (this.siteOk(vx, vy, civ) === true) return { x: vx, y: vy };
    }
    return null;
  },
  siteOk(vx, vy, civ) {
    if (!World.inb(vx - 9, vy - 7) || !World.inb(vx + 9, vy + 7)) return 'Muito perto da borda do mapa.';
    if (civ !== undefined && civ >= 0 && World.terr[World.idx(vx, vy)] !== civ) return 'Fora do território.';
    if (!World.areaOk(vx - 7, vy - 5, 15, 12)) return 'O terreno aqui não serve (água, montanha).';
    if (!World.areaFree(vx - 8, vy - 6, 17, 14)) return 'Já há construções neste lugar.';
    if (World.villages.some(v => U.dist(v.x, v.y, vx, vy) < 22)) return 'Muito perto de outra vila.';
    if (World.capitals.some(c => U.dist(c.x, c.y, vx, vy) < 15)) return 'Muito perto de um castelo.';
    if (World.camps.some(c => U.dist(c.x, c.y, vx, vy) < 10)) return 'Muito perto de um acampamento de bandidos.';
    return true;
  },
  // constrói a vila (também usado para recriá-la ao carregar o jogo)
  makeVillage(spec) {
    const { x: vx, y: vy, civ } = spec, vi = World.villages.length;
    // free: vila livre (fundada pelo herói), fora de qualquer reino; civ fica só como referência interna
    const v = { civ, free: !!spec.free, x: vx, y: vy, name: spec.name, founded: true, lord: spec.lord, lordFam: spec.lordFam, foundedDay: spec.day,
      extra: { houses: [], walls: [], well: null }, prosper: 6, level: 1, ruin: 0 };
    for (let y = vy - 5; y < vy + 7; y++) for (let x = vx - 7; x < vx + 8; x++) if (World.inb(x, y)) World.obj[World.idx(x, y)] = 0;
    const add = (t, x, y, w, h) => World.addStruct(t, x, y, w, h, civ, { village: vi, fvillage: true });
    v.store = add('store', vx - 7, vy - 4, 3, 2);
    v.tavern = add('tavern', vx + 5, vy - 4, 3, 2);
    add('vhouse', vx - 1, vy - 5, 2, 2); add('vhouse', vx + 6, vy + 1, 2, 2); add('vhouse', vx - 1, vy + 5, 2, 2); add('vhouse', vx - 7, vy + 1, 2, 2);
    add('well', vx + 3, vy - 1, 1, 1);
    v.chapel = add('chapel', vx + 2, vy + 2, 2, 2);
    add('field', vx - 7, vy + 5, 3, 2); add('field', vx + 5, vy + 5, 3, 2);
    World.villages.push(v);
    // estrada até a vila ou castelo mais próximo
    if (spec.road) World.carveRoad(spec.road);
    else {
      const others = [...World.villages.filter(o => o !== v).map(o => ({ x: o.x, y: o.y - 1 })), ...World.capitals.map(c => c.door)]
        .sort((a, b) => U.dist(a.x, a.y, vx, vy) - U.dist(b.x, b.y, vx, vy));
      const path = others.length ? World.findPath(vx, vy - 1, others[0].x, others[0].y) : null;
      if (path) { World.carveRoad(path); spec.road = path; }
    }
    World.chunks.clear();
    World.buildMinimap();
    return v;
  },
  // rei NPC: quando uma vila do reino chega ao tamanho máximo (nível 3 e cheia), a coroa funda uma vila nova perto
  // e famílias da vila lotada se mudam para lá (uma vez a cada 6 meses por reino; custa 300 do tesouro)
  crownTick() {
    for (const c of G.civs) {
      if (c.ruler === 'player' || c.treasury < 300 || G.day - (c.lastCrownFound || -999) < 6 * ECON_DAYS) continue;
      if (G.founded.filter(x => x.crown && x.civ === c.id).length >= 4) continue;
      const full = World.villages.map((v, i) => ({ v, i })).find(x => x.v.civ === c.id && !x.v.free && !x.v.ruin && x.v.level >= 3 && People.residents(x.i).length >= this.vcap(x.v) - 2);
      if (!full) continue;
      if (this.crownFound(c, full.v)) c.lastCrownFound = G.day;
    }
  },
  crownFound(c, from) {
    const spot = this.site(c.id, from.x, from.y);
    if (!spot) return false;
    const used = new Set(World.villages.map(v => v.name));
    const name = VILLAGE_NAMES.find(n => !used.has(n)) || ('Nova ' + from.name);
    const spec = { name, x: spot.x, y: spot.y, civ: c.id, day: G.day, crown: true };
    const v = this.makeVillage(spec);
    G.founded.push(spec);
    c.treasury -= 300;
    const vi = World.villages.indexOf(v);
    for (const rank of ['merchant', 'innkeeper']) People.create({ age: U.rint(24, 45), rank, civ: c.id, home: { type: 'village', idx: vi } });
    this.settle(v, vi, 4);
    Towns.init(); Towns.show(v); this.refresh();
    const known = U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 70;
    Diplo.chronicle(`🏘️ ${c.rulerName} fundou ${v.name}, em ${Diplo.name(c.id)}, porque ${from.name} já não cabia mais gente.`, known);
    if (known) UI.msg(`🏘️ ${c.rulerName} fundou a vila de ${v.name} aqui perto.`, 'gold');
    return v;
  },
  // uma família funda a "Vila <Sobrenome>"
  found(f) {
    const seat = World.villages[f.seat];
    const spot = this.site(seat.civ, seat.x, seat.y);
    if (!spot) return false;
    const spec = { name: 'Vila ' + f.surname, x: spot.x, y: spot.y, civ: seat.civ, lordFam: f.id, day: G.day };
    const v = this.makeVillage(spec);
    G.founded.push(spec);
    const vi = World.villages.indexOf(v);
    f.founded = vi; f.seat = vi; f.wealth -= 500;
    // a família inteira se muda, e algumas famílias de vilas cheias vão junto
    for (const p of this.members(f)) if (p.home.type === 'village' && !p.capanga && !p.job) p.home = { type: 'village', idx: vi };
    this.settle(v, vi, 2);
    Towns.init(); Towns.show(v);
    this.refresh();
    const known = U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 70 || G.civs[v.civ].ruler === 'player';
    Diplo.chronicle(`🏘️ A ${this.name(f)} fundou a ${v.name}, em ${Diplo.name(v.civ)}.`, known);
    if (known) UI.msg(`🏘️ A ${this.name(f)} fundou a ${v.name}!`, 'gold');
    return true;
  },
  // novos moradores para uma vila: famílias que saem de vilas cheias (ou recém-chegadas)
  settle(v, vi, n) {
    for (let k = 0; k < n; k++) {
      const crowded = World.villages.map((o, i) => ({ o, i, res: People.residents(i) })).filter(x => x.i !== vi && x.o.civ === v.civ && x.res.length > this.vcap(x.o) - 4)
        .sort((a, b) => b.res.length - a.res.length)[0];
      const mover = crowded && crowded.res.find(p => p.age >= 18 && p.age < 40 && !SHOP_RANKS.includes(p.rank) && !p.kin && !p.job && !this.isChief(p));
      if (mover) {
        const fam = this.members(this.of(mover)).filter(p => p.home.type === 'village' && p.home.idx === crowded.i && (p === mover || p.spouse === mover.id || p.parents.includes(mover.id)));
        for (const p of fam) p.home = { type: 'village', idx: vi };
      } else {
        const a = People.create({ age: U.rint(20, 40), rank: 'peasant', civ: v.civ, home: { type: 'village', idx: vi } });
        const b = People.create({ sex: a.sex === 'm' ? 'f' : 'm', age: U.clamp(a.age + U.rint(-5, 5), 18, 60), rank: 'peasant', civ: v.civ, home: { type: 'village', idx: vi } });
        People.marry(a, b);
        for (let c = U.rint(0, 2); c > 0; c--) People.child(a, b, { age: U.rint(1, 12) });
      }
    }
  },
  // o jogador funda a vila com o nome da sua família
  playerSite() {
    const vx = Math.floor(P.x / TILE), vy = Math.floor(P.y / TILE) - 2;
    if (G.dungeon) return { ok: 'Não dá para fundar vilas dentro de cavernas.' };
    if (P.sailing) return { ok: 'Desembarque primeiro.' };
    const r = this.siteOk(vx, vy);
    let civ = World.terr[World.idx(vx, vy)];
    if (civ < 0) civ = World.capitals.map((c, i) => ({ i, d: U.dist(c.x, c.y, vx, vy) })).sort((a, b) => a.d - b.d)[0].i;
    return { ok: r, x: vx, y: vy, civ };
  },
  playerFound() {
    const s = this.playerSite();
    if (s.ok !== true) { UI.msg('Não dá para fundar aqui: ' + s.ok, 'bad'); return false; }
    if (!Inv.has(FOUND_COST)) { UI.msg('Faltam recursos para fundar a vila.', 'bad'); return false; }
    Inv.pay(FOUND_COST);
    const spec = { name: 'Vila ' + G.surname, x: s.x, y: s.y, civ: s.civ, lord: 'player', day: G.day, free: true };
    const v = this.makeVillage(spec);
    G.founded.push(spec);
    const vi = World.villages.indexOf(v);
    // colonos: um comerciante, um taverneiro e algumas famílias
    for (const rank of ['merchant', 'innkeeper']) {
      const a = People.create({ age: U.rint(24, 45), rank, civ: s.civ, home: { type: 'village', idx: vi }, aff: 25 });
      const b = People.create({ sex: a.sex === 'm' ? 'f' : 'm', age: U.clamp(a.age + U.rint(-5, 5), 18, 60), rank: 'peasant', civ: s.civ, home: { type: 'village', idx: vi }, aff: 20 });
      People.marry(a, b);
    }
    this.settle(v, vi, 3);
    Towns.init(); Towns.show(v); this.refresh();
    P.y += 2 * TILE;
    Diplo.chronicle(`🏘️ ${G.name} ${G.surname} fundou a ${v.name}, uma vila livre que não pertence a reino nenhum.`, true);
    UI.banner(`🏘️ ${v.name} foi fundada!`);
    UI.msg(`Você é o senhor da ${v.name}. Os moradores pagam 2 🪙 por pessoa todo mês, e a vila cresce com o tempo.`, 'gold', true);
    Progress.diary(`🏘️ Fundou a ${v.name}.`);
    Progress.add('villages');
    return true;
  },
  // ao carregar: recria vilas fundadas e empreendimentos das famílias
  restore() {
    for (const spec of G.founded || []) {
      const v = this.makeVillage(spec);
      Towns.init(); Towns.show(v);
    }
    for (const f of Object.values(this.F())) for (const b of f.biz || []) {
      const d = FAMILY_BIZ[b.type], vi = f.seat !== null && f.seat !== 'castle' ? f.seat : 0, v = World.villages[vi];
      World.addStruct(b.type, b.x, b.y, d.w, d.h, v ? v.civ : 0, { village: vi, fam: f.id });
    }
  },

  // ------------------------------------------------------------ revoltas das famílias contra a coroa
  startRevolt(f) {
    const c = G.civs[f.civ];
    const r = { id: G.day * 100 + f.id % 100, fam: f.id, civ: f.civ, day: G.day, str: this.adults(f).length * 3 + Math.min(20, Math.floor(f.wealth / 100)) + f.biz.length * 2 + 4, days: 0, side: null, done: false };
    f.wealth -= 200;
    G.revolts.push(r);
    const mine = c.ruler === 'player';
    Diplo.chronicle(`🔥 A ${this.name(f)} declarou guerra à coroa de ${Diplo.name(f.civ)}!`, true);
    UI.banner(`🔥 Revolta da ${this.name(f)}!`);
    UI.msg(mine ? `A ${this.name(f)} se revoltou contra você em ${CIV_DEFS[f.civ].short}! Vá até ${this.seatName(f)} e derrote os rebeldes, ou perderá o trono.`
      : `A ${this.name(f)} quer tomar o trono de ${CIV_DEFS[f.civ].short}. Fale com um membro da família (ou veja em Portfólio → Grandes Casas) para escolher um lado.`, 'bad');
  },
  revolt(id) { return (G.revolts || []).find(r => r.id === id); },
  activeRevoltOf(f) { return (G.revolts || []).find(r => !r.done && r.fam === f.id); },
  revoltDay(r) {
    const c = G.civs[r.civ], f = this.get(r.fam);
    if (!f || !this.adults(f).length) { this.endRevolt(r, false); return; }
    r.days++;
    const crown = c.garrison * 1.5 + 4 + (r.side === 'crown' ? 4 + Game.allies().length : 0);
    const reb = r.str + (r.side === 'rebel' ? 4 + Game.allies().length : 0);
    r.str = Math.max(0, r.str - Math.round(U.rnd(1, 3) * crown / (crown + reb) * 2));
    c.garrison = Math.max(0, c.garrison - Math.round(U.rnd(0, 2.5) * reb / (crown + reb) * 2));
    c.happy = Math.max(0, c.happy - 3);
    if (r.str <= 0) this.endRevolt(r, false);
    else if (c.garrison <= 0 || (r.days >= 6 && reb > crown)) this.endRevolt(r, true);
    else if (r.days >= 6) this.endRevolt(r, false);
  },
  endRevolt(r, rebelsWin) {
    r.done = true; r.won = rebelsWin;
    for (const e of G.ents) if (e.tag === 'reb' + r.id || e.tag === 'crw' + r.id) e.dead = true;
    const c = G.civs[r.civ], f = this.get(r.fam), wasMine = c.ruler === 'player';
    if (rebelsWin && f) {
      const h = this.head(f);
      const old = c.rulerId !== null && c.rulerId !== undefined ? G.people[c.rulerId] : null;
      if (old && old.alive) {
        const of = this.of(old);
        for (const p of G.people) if (p.alive && p.home.type === 'castle' && p.home.civ === r.civ && NOBLE_RANKS.includes(p.rank)) { p.rank = 'wanderer'; p.home = { type: 'wild' }; }
        if (of) { of.noble = false; of.seat = null; }
      }
      h.rank = 'ruler'; h.home = { type: 'castle', civ: r.civ }; h.civ = r.civ;
      if (h.spouse !== null && G.people[h.spouse] && G.people[h.spouse].alive) { const s = G.people[h.spouse]; s.rank = 'consort'; s.home = h.home; s.civ = r.civ; }
      for (const id of h.children) { const k = G.people[id]; if (k && k.alive && !k.kin) { k.rank = 'heir'; k.home = h.home; k.civ = r.civ; } }
      f.noble = true; f.seat = 'castle'; f.loyalty = 90;
      Heraldry.apply(); c.ruler = 'npc'; c.rulerId = h.id; c.rulerName = People.title(h) + ' ' + h.name; c.garrison = Math.max(4, Math.round(r.str / 2)); c.happy = Math.max(c.happy, 45); c.rebel = 0;
      Diplo.chronicle(`👑 A ${this.name(f)} tomou o trono de ${Diplo.name(r.civ)}! ${c.rulerName} ${f.surname} inicia uma nova dinastia.`, true);
      UI.banner(`👑 Nova dinastia em ${CIV_DEFS[r.civ].short}: Casa ${f.surname}`);
      if (wasMine) { c.relation = -60; UI.msg(`Você perdeu o trono de ${CIV_DEFS[r.civ].name} para a ${this.name(f)}!`, 'bad'); Progress.diary(`🔥 Perdeu o trono de ${CIV_DEFS[r.civ].short} para a Casa ${f.surname}.`); }
      else if (r.side === 'rebel') { const g = 250; P.gold += g; c.relation = 70; Game.gainXp(80); UI.msg(`A nova dinastia agradece seu apoio: ${g} 🪙 e relação 70 com ${CIV_DEFS[r.civ].short}.`, 'gold', true); Progress.diary(`🔥 Ajudou a Casa ${f.surname} a tomar o trono de ${CIV_DEFS[r.civ].short}.`); }
      else if (r.side === 'crown') { c.relation = -40; UI.msg(`Você lutou pela coroa derrotada. A Casa ${f.surname} não esquecerá (−40 de relação).`, 'bad'); }
    } else if (f) {
      f.wealth = 0; f.loyalty = 55; f.favor = 0;
      const h = this.head(f);
      if (h && Math.random() < 0.5) People.die(h, 'executado pela coroa');
      Diplo.chronicle(`⚔️ A coroa de ${Diplo.name(r.civ)} esmagou a revolta da ${this.name(f)}.`, true);
      if (r.side === 'crown' || wasMine) { const g = wasMine ? 0 : 150; if (!wasMine) Court.addService(r.civ, 12); P.gold += g; if (!wasMine) Game.addRelation(r.civ, 20); Game.gainXp(60); UI.msg(wasMine ? `Você esmagou a revolta da ${this.name(f)}! Seu trono está seguro.` : `A coroa vence e agradece: ${g} 🪙 e +20 de relação.`, 'gold', true); }
      else if (r.side === 'rebel') { Game.addRelation(r.civ, -30); UI.msg(`A revolta que você apoiou fracassou. ${CIV_DEFS[r.civ].short} está furioso (−30).`, 'bad'); }
    }
  },
  // o jogador escolhe um lado
  joinRevolt(r, side) {
    r.side = side;
    const f = this.get(r.fam);
    if (side === 'rebel') { Game.addRelation(r.civ, -25); UI.msg(`Você apoia a revolta da ${this.name(f)}. Os guardas de ${CIV_DEFS[r.civ].short} perto da vila vão atacar você.`, 'gold'); }
    else UI.msg(`Você defende a coroa de ${CIV_DEFS[r.civ].short}. Os rebeldes da ${this.name(f)} são seus inimigos.`, 'gold');
  },
  // quem briga com os rebeldes (chamado por hostile)
  rebelHostile(a, b) {
    const reb = a.faction === 'rebel' ? a : b, o = reb === a ? b : a;
    if (o.faction === 'rebel') return false;
    const r = this.revolt(reb.revolt);
    if (!r || r.done) return false;
    if (o.kind === 'guard' && o.civ === r.civ) return true;
    if (o === P || fac(o) === 'player') return r.side === 'crown' || G.civs[r.civ].ruler === 'player' || !!reb.angry;
    return false;
  },
  // rebeldes e guardas da coroa aparecem perto da vila em revolta
  update(dt) {
    this.t = (this.t || 0) - dt;
    if (this.t > 0 || G.dungeon) return;
    this.t = 1;
    for (const r of G.revolts || []) {
      if (r.done) continue;
      const f = this.get(r.fam), v = f && typeof f.seat === 'number' ? World.villages[f.seat] : null;
      if (!v || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) > 32) continue;
      Game.ensureGroup('reb' + r.id, Math.min(6, Math.ceil(r.str / 2)), () => {
        const s = freeSpotNear((v.x + U.rnd(-4, 4)) * TILE, (v.y + U.rnd(-3, 3)) * TILE, 3 * TILE);
        const e = Game.spawn('rebel', s.x, s.y, { civ: r.civ, leash: 14, tag: 'reb' + r.id, archer: Math.random() < 0.25 });
        e.revolt = r.id; e.famColor = f.color; e.aggroOv = 12;
        return e;
      });
      const c = G.civs[r.civ];
      if (c.garrison > 0) Game.ensureGroup('crw' + r.id, Math.min(5, c.garrison), () => {
        const a = Math.random() * Math.PI * 2;
        const s = freeSpotNear((v.x + Math.cos(a) * 11) * TILE, (v.y + Math.sin(a) * 8) * TILE, 3 * TILE);
        const e = Game.spawn('guard', s.x, s.y, { civ: r.civ, leash: 16, tag: 'crw' + r.id });
        e.home = { x: v.x * TILE, y: v.y * TILE }; e.aggroOv = 12;
        return e;
      });
    }
  },
  rebelKilled(e) { const r = this.revolt(e.revolt); if (r && !r.done) { r.str = Math.max(0, r.str - 1); if (r.str <= 0) this.endRevolt(r, false); } },

  // ------------------------------------------------------------ o passar dos anos: casamentos e mudanças
  yearTick() {
    // solteiros se casam (de preferência na mesma vila)
    const singles = G.people.filter(p => p.alive && p.age >= 17 && p.age <= 50 && p.spouse === null && !p.kin && !p.capanga && !p.dating && p.home.type === 'village');
    const women = singles.filter(p => p.sex === 'f');
    for (const m of singles.filter(p => p.sex === 'm')) {
      if (Math.random() > 0.55) continue;
      const cands = women.filter(w => w.spouse === null && w.fam !== m.fam && Math.abs(w.age - m.age) < 14 && !m.parents.includes(w.id) && !w.parents.includes(m.id));
      if (!cands.length) continue;
      const civ = this.civOf(m);
      const w = cands.find(x => x.home.idx === m.home.idx) || cands.find(x => this.civOf(x) === civ);
      if (!w) continue;
      People.marry(m, w);
      w.home = { type: 'village', idx: m.home.idx };
      if (w.met || m.met) UI.msg(`💍 ${m.name} e ${w.name} se casaram. Ela agora é ${w.name} ${w.surname}.`);
    }
    // vilas cheias mandam jovens casais para vilas com espaço
    World.villages.forEach((v, vi) => {
      const res = People.residents(vi);
      if (res.length <= this.vcap(v)) return;
      const dest = World.villages.map((o, i) => ({ o, i, n: People.residents(i).length })).filter(x => x.i !== vi && x.o.civ === v.civ && x.n < this.vcap(x.o) - 3).sort((a, b) => a.n - b.n)[0];
      if (!dest) return;
      const mover = res.find(p => p.age >= 18 && p.age < 35 && !SHOP_RANKS.includes(p.rank) && !p.kin && !p.job && !this.isChief(p) && p.spouse !== null);
      if (!mover) return;
      for (const p of res.filter(q => q === mover || q.id === mover.spouse || (q.parents.includes(mover.id) && q.age < 16))) p.home = { type: 'village', idx: dest.i };
    });
  },
  // nascimentos ficam mais raros em vilas lotadas
  birthFactor(p) {
    const alive = G.aliveCount || G.people.filter(q => q.alive).length;
    const global = alive > POP_HARD ? 0.05 : alive > POP_SOFT ? 0.6 - (alive - POP_SOFT) / (POP_HARD - POP_SOFT) * 0.5 : 1;
    if (p.home.type !== 'village') return global;
    const v = World.villages[p.home.idx];
    if (!v) return 1;
    const n = People.residents(p.home.idx).length, cap = this.vcap(v);
    return global * (n > cap * 1.3 ? 0.25 : n > cap ? 0.6 : 1);
  },
};

// ====================================================================== empreendimentos do jogador
const BIZ_TYPES = {
  biz_farm:   { skill: 'peasant',   slots: 4, wage: 3, out: { wheat: 4, barley: 1 }, season: true },
  biz_mill:   { skill: 'peasant',   slots: 2, wage: 3, out: { bread: 3 } },
  biz_lumber: { skill: 'lumber',    slots: 3, wage: 4, out: { wood: 6, hardwood: 1 } },
  biz_quarry: { skill: 'mason',     slots: 3, wage: 4, out: { stone: 6, clay: 2 } },
  biz_mine:   { skill: 'mason',     slots: 3, wage: 5, out: { coal: 2, iron_ore: 2, copper_ore: 1, tin_ore: 1 } },
  biz_smithy: { skill: 'smith',     slots: 2, wage: 6, out: { iron_bar: 1, bronze_bar: 1 } },
  biz_shop:   { skill: 'merchant',  slots: 3, wage: 4, gold: 9 },
  ptavern:    { skill: 'innkeeper', slots: 2, wage: 4, sales: 3 },
};
const Biz = {
  list() { return World.structs.filter(s => s.owner === 'player' && BIZ_TYPES[s.type]); },
  workers(s) { return (s.workers || []).map(id => G.people[id]).filter(p => p && p.alive && p.job === s.id); },
  workerCount(s) { return this.workers(s).length; },
  skilled(p, s) { return p.rank === BIZ_TYPES[s.type].skill; },
  wage(p, s) { return BIZ_TYPES[s.type].wage + (this.skilled(p, s) ? 2 : 0); },
  name(s) { return BUILDINGS[s.type].name; },
  // estimativa do que um dia de trabalho produz
  forecast(s) {
    const d = BIZ_TYPES[s.type], ws = this.workers(s);
    const k = ws.reduce((a, p) => a + (this.skilled(p, s) ? 1.5 : 1), 0) * (d.season && Season.winter() ? 0.5 : 1);
    const out = {};
    if (d.out) for (const it in d.out) out[it] = Math.round(d.out[it] * k);
    const gold = d.gold ? Math.round(d.gold * k * (World.terr[World.idx(s.x, s.y)] >= 0 ? 1.5 : 1)) : 0;
    return { out, gold, wages: ws.reduce((a, p) => a + this.wage(p, s), 0), k };
  },
  can(p) {
    if (!p.alive || !People.isAdult(p)) return 'É jovem demais para trabalhar.';
    if (NOBLE_RANKS.includes(p.rank)) return 'Nobres não trabalham para os outros!';
    if (p.capanga) return 'Já é seu capanga.';
    if (p.job !== undefined && p.job !== null) return 'Já trabalha para você.';
    if (SHOP_RANKS.includes(p.rank)) return 'Já tenho meu próprio ofício para cuidar.';
    if (p.aff < 0) return 'Trabalhar para você? Nunca.';
    return true;
  },
  hire(p, s) {
    const ok = this.can(p);
    if (ok !== true) { UI.msg(ok, 'bad'); return false; }
    if (this.workerCount(s) >= BIZ_TYPES[s.type].slots) { UI.msg('Não há vagas neste empreendimento.', 'bad'); return false; }
    if (P.gold < 15) { UI.msg('Você precisa de 15 🪙 para o adiantamento do contrato.', 'bad'); return false; }
    P.gold -= 15;
    s.workers = (s.workers || []).filter(id => G.people[id] && G.people[id].alive && G.people[id].job === s.id);
    s.workers.push(p.id); p.job = s.id; p.met = true;
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
    UI.msg(`💼 ${People.full(p)} agora trabalha no seu ${this.name(s)} (${this.wage(p, s)} 🪙 por mês).`, 'gold');
    Progress.add('hired');
    return true;
  },
  fire(p) {
    const s = World.structs[p.job];
    if (s) s.workers = (s.workers || []).filter(id => id !== p.id);
    p.job = null;
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
    People.addAff(p, -8);
    UI.msg(`${p.name} foi dispensad${p.sex === 'm' ? 'o' : 'a'} e voltou para casa.`);
  },
  // gente disponível para contratar (vilas próximas)
  candidates(s) {
    return G.people.filter(p => p.home.type === 'village' && this.can(p) === true)
      .map(p => { const v = World.villages[p.home.idx]; return { p, d: v ? U.dist(v.x, v.y, s.x, s.y) : 999 }; })
      .sort((a, b) => (this.skilled(b.p, s) - this.skilled(a.p, s)) || a.d - b.d).slice(0, 6);
  },
  dayTick() {
    let wages = 0, gold = 0, paid = 0, made = {}, quit = [];
    for (const s of this.list()) {
      s.workers = (s.workers || []).filter(id => G.people[id] && G.people[id].alive && G.people[id].job === s.id);
      const ws = this.workers(s);
      if (!ws.length) continue;
      const fc = this.forecast(s);
      if (P.gold >= fc.wages) { P.gold -= fc.wages; wages += fc.wages; for (const p of ws) People.addAff(p, 1); }
      else { for (const p of ws) { People.addAff(p, -15); if (p.aff < -10) { quit.push(p); } } continue; }
      if (s.type === 'ptavern') continue; // a taverna vende com Farm.tavernTick
      s.goods = s.goods || {};
      for (const it in fc.out) if (fc.out[it] > 0) { s.goods[it] = (s.goods[it] || 0) + fc.out[it]; made[it] = (made[it] || 0) + fc.out[it]; }
      if (fc.gold) { s.till = (s.till || 0) + fc.gold; gold += fc.gold; }
      if (s.autosell) {
        for (const it in s.goods) gold += Math.round(ITEMS[it].price * 0.6 * s.goods[it]);
        paid += this.cashOut(s);
      }
    }
    for (const p of quit) { this.fire(p); UI.msg(`😠 ${p.name} se demitiu por falta de pagamento.`, 'bad'); }
    const parts = Object.entries(made).map(([k, n]) => `${n} ${ITEMS[k].name}`);
    if (paid) Sound.play('coin');
    if (wages || parts.length || gold) Game.note(`💼 Empreendimentos: ${parts.length ? parts.join(', ') : 'sem produção'}${paid ? ` · +${paid} 🪙 vendidos e recebidos` : ''}${gold - paid > 0 ? ` · +${gold - paid} 🪙 no caixa` : ''} · salários −${wages} 🪙.`, 'gold');
  },
  // vende o que está guardado (60% do preço) e passa o caixa inteiro para o seu ouro; devolve quanto você recebeu
  cashOut(s) {
    let g = s.till || 0;
    for (const it in s.goods || {}) g += Math.round(ITEMS[it].price * 0.6 * s.goods[it]);
    s.goods = {}; s.till = 0; P.gold += g;
    return g;
  },
  collect(s) {
    const got = [];
    for (const k in s.goods || {}) if (s.goods[k] > 0) { Inv.add(k, s.goods[k]); got.push(`${s.goods[k]} ${ITEMS[k].name}`); }
    s.goods = {};
    if (s.till > 0) { P.gold += s.till; got.push(`${s.till} 🪙`); s.till = 0; Sound.play('coin'); }
    UI.msg(got.length ? 'Você recolheu: ' + got.join(', ') + '.' : 'Ainda não há nada para recolher.', got.length ? 'gold' : '');
  },
  // os funcionários aparecem trabalhando perto do empreendimento
  ambient(spawnNpc) {
    for (const s of this.list()) {
      if (U.dist(P.x / TILE, P.y / TILE, s.x, s.y) > 28) continue;
      for (const p of this.workers(s)) if (!G.spawned.has(p.id)) spawnNpc(p, (s.x + s.w / 2) * TILE, (s.y + s.h + 0.9) * TILE, 2.5, -1);
    }
  },
};

// ================================================================ fundar o próprio reino
// Da vila livre (fundada pelo jogador) nasce um reino: quando ela chega ao nível 3, o castelo
// (Construção → Moradia) cria um reino novo de verdade: entra na lista dos reinos, com castelo, guarnição,
// território em volta e diplomacia. Só um reino fundado por vez: se ele for tomado, dá para fundar outro.
const REALM_GOLD = 3000;
const BASE_CIVS = CIV_DEFS.length;
const Realm = {
  list() { return G.realms || (G.realms = []); },
  active() { return this.list().find(r => G.civs[r.ci] && G.civs[r.ci].ruler === 'player') || null; },
  // a vila livre do jogador mais perto deste ponto
  villageFor(cx, cy) {
    let best = null, bd = 24;
    World.villages.forEach((v, i) => { if (!v.free || v.lord !== 'player') return; const d = Math.max(Math.abs(cx - v.x), Math.abs(cy - v.y)); if (d < bd) { bd = d; best = i; } });
    return best;
  },
  siteErr(tx, ty) {
    const a = this.active();
    if (a) return `Você já tem um reino fundado (${CIV_DEFS[a.ci].name}). Só depois que ele cair dá para fundar outro`;
    const cx = tx + 3, cy = ty + 3, vi = this.villageFor(cx, cy);
    if (vi === null) return 'O castelo precisa ficar perto da sua vila livre (funde uma em Portfólio → Vilas e guardas)';
    const v = World.villages[vi];
    if ((v.level || 1) < 3) return `${v.name} ainda precisa crescer até o nível 3 para virar um reino`;
    if (World.capitals.some(c => U.dist(c.x, c.y, cx, cy) < 30)) return 'Muito perto do castelo de outro reino';
    return null;
  },
  // as duas listas de reinos voltam a ter só os 7 do começo (antes de um jogo novo ou de carregar)
  reset() { CIV_DEFS.length = BASE_CIVS; CIV_BASE.length = BASE_CIVS; if (World.capitals) World.capitals.length = Math.min(World.capitals.length, BASE_CIVS); },
  // acrescenta o reino nas listas (também usado ao carregar)
  build(r) {
    const ci = r.ci;
    CIV_DEFS[ci] = Object.assign({}, r.def); CIV_BASE[ci] = Object.assign({}, r.base);
    const cp = World.capitals[ci] = { x: r.x + 3, y: r.y + 3 };
    const st = World.addStruct('castle', r.x, r.y, 7, 7, ci);
    cp.door = { x: cp.x, y: cp.y + 4 }; cp.struct = st;
    // território: tudo num raio de 20 que não esteja mais perto do castelo de outro reino
    for (let y = cp.y - 20; y <= cp.y + 20; y++) for (let x = cp.x - 20; x <= cp.x + 20; x++) {
      if (!World.inb(x, y) || U.dist(x, y, cp.x, cp.y) > 20) continue;
      const i = World.idx(x, y); if (World.tiles[i] === T.DEEP) continue;
      const d = U.dist(x, y, cp.x, cp.y);
      if (World.capitals.some((c, j) => j !== ci && c && U.dist(x, y, c.x, c.y) < d + 4)) continue;
      World.terr[i] = ci;
    }
    World.chunks = new Map(); if (World.mini) World.buildMinimap();
  },
  found(tx, ty) {
    const cx = tx + 3, cy = ty + 3, vi = this.villageFor(cx, cy), v = World.villages[vi], ci = CIV_DEFS.length;
    const name = 'Reino ' + G.surname, short = G.surname;
    const r = { ci, x: tx, y: ty, vi, day: G.day,
      def: { name, short, ruler: 'Rei ' + G.name, color: '#a8791a', roof: '#a8791a', title: ['Rei', 'Rainha'], rname: G.name, rsex: P.sex, prod: { wheat: 26, wood: 14, stone: 10, iron_ore: 4 }, desc: 'O reino que você fundou a partir da sua vila.', founded: true },
      base: { name, short, color: '#a8791a', roof: '#a8791a', flag: 'quarters', metal: '#f2c45a', division: 'chief', charge: '♜' } };
    this.list().push(r);
    this.build(r);
    G.civs[ci] = { id: ci, ruler: 'npc', rulerName: G.name, pop: 40 + People.residents(vi).length, treasury: 300, garrison: 6, tax: 0.1, happy: 65, relation: 100, atWar: false, rebel: 0, festival: 0,
      stock: { wheat: 40, wood: 30, stone: 20, iron_ore: 5 }, invest: { farms: 0, sawmill: 0, quarry: 0, mines: 0, housing: 0, walls: 0 }, founded: true };
    // diplomacia: os outros reinos olham o reino novo com desconfiança
    const rel = Diplo.D().rel; for (const row of rel) row.push(0); rel.push(rel.map(() => 0)); rel[ci].push(0);
    for (let o = 0; o < ci; o++) rel[o][ci] = rel[ci][o] = U.rint(-20, 10);
    // a vila livre passa a ser do reino (e quem mora nela também)
    v.free = false; v.civ = ci;
    const spec = (G.founded || []).find(x => x.x === v.x && x.y === v.y); if (spec) { spec.free = false; spec.civ = ci; }
    for (const p of People.residents(vi)) p.civ = ci;
    Towns.syncOwners(); // casas, lojas e muralhas passam a ter as cores do reino novo
    Game.becomeRuler(ci, `O castelo está de pé.`);
    Diplo.chronicle(`👑 ${G.name} ${G.surname} ergueu um castelo em ${v.name} e fundou o ${name}.`, true);
    UI.banner(`👑 ${name}!`);
    Progress.diary(`👑 Fundou o ${name}.`);
    return ci;
  },
  // ao carregar: refaz os reinos fundados (na mesma ordem em que nasceram)
  restore() {
    for (const r of this.list().slice().sort((a, b) => a.ci - b.ci)) if (r.ci >= BASE_CIVS) this.build(r);
    if (this.list().length) Heraldry.apply();
  },
};
