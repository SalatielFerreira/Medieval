'use strict';
// A corte: títulos de nobreza para o herói, conselho real (tesoureiro, general, espião-mor e diplomata),
// conspirações, casamentos arranjados e rivalidades entre as famílias.

const NOBLE_TITLES = [
  { k: 'knight', m: 'Cavaleiro', f: 'Dama',     icon: '🛡️', rel: 25, serv: 8,  fee: 0,    lvl: 3,  caps: 2, stipend: 0,  tax: 2, perks: '+2 capangas · 5% de desconto nas lojas do reino' },
  { k: 'baron',  m: 'Barão',     f: 'Baronesa', icon: '🏰', rel: 45, serv: 25, fee: 400,  lvl: 5,  caps: 4, stipend: 15, tax: 2, perks: '+4 capangas · direito de fundar vilas · 15 🪙 por dia do rei' },
  { k: 'count',  m: 'Conde',     f: 'Condessa', icon: '⚜️', rel: 60, serv: 50, fee: 900,  lvl: 8,  caps: 6, stipend: 30, tax: 3, perks: '+6 capangas · vilas pagam 3 🪙 por morador · 30 🪙 por dia' },
  { k: 'marquis', m: 'Marquês',  f: 'Marquesa', icon: '🎖️', rel: 68, serv: 70, fee: 1300, lvl: 10, caps: 7, stipend: 42, tax: 3, perks: '+7 capangas · vilas pagam 3 🪙 por morador · 42 🪙 por dia' },
  { k: 'duke',   m: 'Duque',     f: 'Duquesa',  icon: '👑', rel: 75, serv: 90, fee: 1800, lvl: 12, caps: 8, stipend: 55, tax: 4, perks: '+8 capangas · vilas pagam 4 🪙 · 55 🪙 por dia · pode reivindicar o trono com relação 60 e 800 🪙' },
];
// títulos civis: o herói ganha sozinho quando cumpre o feito (não dependem de rei)
const CIVIL_TITLES = [
  { id: 'assassino',    icon: '🗡️', m: 'Assassino',    f: 'Assassina',     req: 'Derrote 30 bandidos',                          t: s => (s.kill_bandit || 0) >= 30 },
  { id: 'conquistador', icon: '🚩', m: 'Conquistador', f: 'Conquistadora', req: 'Conquiste uma vila ou um castelo',             t: s => (s.villagesTaken || 0) + (s.castlesTaken || 0) >= 1 },
  { id: 'campeao',      icon: '🏆', m: 'Campeão',      f: 'Campeã',        req: 'Vença 5 lutas na arena ou o Grande Torneio',  t: s => (s.duelsWon || 0) >= 5 || (s.tourneys || 0) >= 1 },
  { id: 'guerreiro',    icon: '⚔️', m: 'Guerreiro',    f: 'Guerreira',     req: 'Derrote 100 inimigos em combate',              t: s => Court.kills(s) >= 100 },
  { id: 'heroi',        icon: '🦸', m: 'Herói',        f: 'Heroína',       req: 'Resgate 3 pessoas e tenha 150 de fama',        t: s => (s.rescues || 0) >= 3 && Court.fame() >= 150 },
];
const COUNCIL = {
  treasurer: { m: 'Tesoureiro', f: 'Tesoureira', icon: '💰', desc: 'Cada ponto de competência rende +3% de impostos. Um tesoureiro corrupto rouba o tesouro.' },
  general:   { m: 'General', f: 'Generala', icon: '⚔️', desc: 'Recruta soldados para a guarnição e reforça a defesa contra ataques.' },
  spy:       { m: 'Espião-mor', f: 'Espiã-mor', icon: '🕵️', desc: 'Descobre corruptos e conspirações (quanto mais competente, mais rápido).' },
  diplomat:  { m: 'Diplomata', f: 'Diplomata', icon: '📜', desc: 'Melhora as relações com os outros reinos todo dia.' },
};

const Court = {
  // ------------------------------------------------------------ títulos do herói
  T() { return G.title || (G.title = { lvl: -1, civ: -1 }); },
  title() { const t = this.T(); return t.lvl >= 0 ? NOBLE_TITLES[t.lvl] : null; },
  titleName(lvl, civ) {
    const t = NOBLE_TITLES[lvl === undefined ? this.T().lvl : lvl];
    if (!t) return '';
    return `${P.sex === 'f' ? t.f : t.m} de ${CIV_DEFS[civ === undefined ? this.T().civ : civ].short}`;
  },
  service(ci) { return Math.round((G.service || {})[ci] || 0); },
  addService(ci, n) { if (ci < 0 || ci === undefined) return; G.service = G.service || {}; G.service[ci] = (G.service[ci] || 0) + n; },
  fame() { return Math.round(G.fame || 0); },
  addFame(n) { G.fame = (G.fame || 0) + n; },
  // inimigos derrotados (sem contar animais de caça)
  kills(s) { return Object.keys(s).filter(k => k.startsWith('kill_') && !['kill_deer', 'kill_boar', 'kill_rabbit', 'kill_chicken'].includes(k)).reduce((a, k) => a + s[k], 0); },
  civil() { return G.civilTitles || (G.civilTitles = {}); },
  hasCivil(id) { return !!this.civil()[id]; },
  civilName(t) { return P.sex === 'f' ? t.f : t.m; },
  // confere os feitos e entrega os títulos civis conquistados
  checkCivil(s) {
    for (const t of CIVIL_TITLES) {
      if (this.hasCivil(t.id)) continue;
      let ok = false; try { ok = t.t(s); } catch (e) { ok = false; }
      if (!ok) continue;
      this.civil()[t.id] = G.day;
      UI.banner(`${t.icon} ${this.civilName(t)}!`);
      UI.msg(`${t.icon} Novo título civil: ${this.civilName(t)}.`, 'gold', true);
      Sound.play('levelup');
      Progress.diary(`${t.icon} Ganhou o título civil ${this.civilName(t)}.`);
    }
  },
  // o que falta para o próximo título neste reino
  nextReq(ci) {
    const t = this.T(), lvl = t.civ === ci ? t.lvl + 1 : 0, nt = NOBLE_TITLES[lvl];
    if (!nt) return null;
    const c = G.civs[ci], serv = this.service(ci) + Math.floor(this.fame() / 5);
    return { lvl, t: nt, checks: [
      [`Relação ${nt.rel}+`, Math.round(c.relation) >= nt.rel, Math.round(c.relation)],
      [`Serviços prestados ${nt.serv}+`, serv >= nt.serv, serv],
      [`Nível ${nt.lvl}+`, P.level >= nt.lvl, P.level],
      [nt.fee ? `Taxa de ${nt.fee} 🪙` : 'Sem taxa', P.gold >= nt.fee, P.gold],
      ['Em paz com o reino', !c.atWar, c.atWar ? 'em guerra' : 'ok'],
    ] };
  },
  requestTitle(ci) {
    const r = this.nextReq(ci);
    if (!r || !r.checks.every(x => x[1])) { UI.msg('Você ainda não cumpre as exigências para este título.', 'bad'); return false; }
    const t = this.T();
    if (t.civ >= 0 && t.civ !== ci && t.lvl >= 0) {
      Dialog.confirm({ icon: '⚜️', title: 'Jurar lealdade', text: `Jurar lealdade a ${CIV_DEFS[ci].short}? Você perde o título de ${this.titleName()}.`, ok: 'Jurar lealdade', danger: true },
        () => { this.grantTitle(ci, r); UI.refresh(); });
      return false;
    }
    return this.grantTitle(ci, r);
  },
  grantTitle(ci, r) {
    const t = this.T();
    P.gold -= r.t.fee; G.civs[ci].treasury += r.t.fee;
    t.lvl = r.lvl; t.civ = ci;
    const name = this.titleName();
    UI.banner(`${r.t.icon} ${G.name}, ${name}!`);
    UI.msg(`${G.civs[ci].rulerName} concede a você o título de ${name}. ${r.t.perks}.`, 'gold', true);
    Progress.diary(`${r.t.icon} Recebeu o título de ${name}.`);
    Diplo.chronicle(`${r.t.icon} ${G.name} ${G.surname} foi nomead${P.sex === 'f' ? 'a' : 'o'} ${name}.`);
    Game.addRelation(ci, 5);
    return true;
  },
  loseTitle(why) {
    const t = this.T();
    if (t.lvl < 0) return;
    UI.msg(`Você perdeu o título de ${this.titleName()} — ${why}.`, 'bad');
    Progress.diary(`💔 Perdeu o título de ${this.titleName()} (${why}).`);
    t.lvl = -1; t.civ = -1;
  },
  capBonus() { const t = this.title(); return t ? t.caps : 0; },
  villageTax() { const t = this.title(); return t ? t.tax : 2; },
  canFound() { return this.hasCivil('conquistador'); },
  discount(ci) { const t = this.T(); return t.lvl >= 0 && t.civ === ci ? 0.05 + t.lvl * 0.02 : 0; },
  stipendTick() {
    const t = this.title();
    if (!t || !t.stipend) return;
    const c = G.civs[this.T().civ];
    if (c.ruler === 'player') return;
    const g = Math.min(t.stipend, Math.max(0, c.treasury - 50));
    if (g > 0) { c.treasury -= g; P.gold += g; Game.note(`${t.icon} Renda do seu título: +${g} 🪙 de ${CIV_DEFS[this.T().civ].short}.`); }
  },

  // ------------------------------------------------------------ conselho real
  // atributos de quem pode servir na corte (criados na primeira vez)
  traits(p) {
    if (p.comp === undefined) {
      const base = { knight: 6, merchant: 6, priest: 6, innkeeper: 5, smith: 4, mason: 4, lumber: 4, hunter: 4, mercenary: 5, heir: 6, consort: 5 }[p.rank] || 3;
      p.comp = U.clamp(base + U.rint(-2, 3) + (p.age > 40 ? 1 : 0), 1, 10);
      p.corrupt = Math.random() < (p.trait === 'ganancioso' ? 0.55 : p.trait === 'leal' ? 0.05 : 0.18);
    }
    return p;
  },
  council(ci) { const c = G.civs[ci]; return c.council || (c.council = { treasurer: null, general: null, spy: null, diplomat: null }); },
  member(ci, seat) { const id = this.council(ci)[seat]; const p = id !== null && id !== undefined ? G.people[id] : null; return p && p.alive ? p : null; },
  seatOf(p) { return p.council ? p.council.seat : null; },
  candidates(ci) {
    return G.people.filter(p => p.alive && p.age >= 20 && !p.capanga && (p.job === undefined || p.job === null) && !p.council && p.rank !== 'ruler' &&
      (Families.civOf(p) === ci || p.home.type === 'player')).map(p => this.traits(p))
      .sort((a, b) => b.comp - a.comp || b.aff - a.aff).slice(0, 8);
  },
  appoint(ci, seat, p) {
    const old = this.member(ci, seat);
    if (old) old.council = null;
    this.traits(p);
    this.council(ci)[seat] = p.id; p.council = { civ: ci, seat };
    People.addAff(p, 30);
    const f = Families.of(p); if (f) { f.loyalty = Math.min(100, f.loyalty + 12); f.favor = (f.favor || 0) + 8; }
    UI.msg(`${COUNCIL[seat].icon} ${People.full(p)} agora é ${p.sex === 'f' ? COUNCIL[seat].f : COUNCIL[seat].m} de ${CIV_DEFS[ci].short}.`, 'gold');
  },
  dismiss(ci, seat) {
    const p = this.member(ci, seat);
    if (!p) return;
    p.council = null; this.council(ci)[seat] = null;
    People.addAff(p, -20);
    const f = Families.of(p); if (f) f.loyalty = Math.max(0, f.loyalty - 8);
    UI.msg(`${p.name} foi afastad${p.sex === 'f' ? 'a' : 'o'} do conselho.`);
  },
  // um dia no conselho de cada reino do jogador
  dayTick() {
    G.plotsC = G.plotsC || [];
    for (const c of G.civs) {
      if (c.ruler !== 'player') continue;
      const ci = c.id, fc = Game.civForecast(c);
      for (const seat in COUNCIL) {
        const p = this.member(ci, seat);
        if (!p) {
          const id = this.council(ci)[seat];
          if (id !== null && id !== undefined && G.people[id]) UI.msg(`${COUNCIL[seat].icon} ${People.full(G.people[id])} morreu. O cargo de ${COUNCIL[seat].m} está vago.`, 'bad');
          this.council(ci)[seat] = null; continue;
        }
        // reinos rivais tentam subornar os conselheiros
        if (Math.random() < 0.05) {
          p.aff -= U.rnd(8, 22);
          const spyM = this.member(ci, 'spy');
          if (spyM && spyM !== p && Math.random() < 0.6) UI.msg(`🕵️ ${spyM.name} avisa: ${p.name} (${COUNCIL[seat].m}) aceitou presentes de ${Diplo.name(U.pick(G.civs.filter(o => o.id !== ci)).id)}. Converse e dê presentes para recuperar a lealdade (${Math.round(p.aff)}).`, 'bad');
        }
        // lealdade (amizade) muda com a felicidade do povo e a família
        const f = Families.of(p);
        p.aff = U.clamp(p.aff + (c.happy - 50) / 40 + (f ? (f.loyalty - 50) / 60 : 0) + U.rnd(-1.5, 1.5) - (p.corrupt ? 0.8 : 0) - (p.trait === 'orgulhoso' || p.trait === 'ganancioso' ? 0.4 : 0), -100, 100);
        if (seat === 'treasurer') {
          c.treasury += Math.round(fc.income * p.comp * 0.03);
          if (p.corrupt) { const st = Math.round(fc.income * U.rnd(0.1, 0.25)) + 3; c.treasury = Math.max(0, c.treasury - st); c.stolen = (c.stolen || 0) + st; if (f) f.wealth += st; }
        }
        if (seat === 'general' && c.garrison < Game.maxGarrison(c) && p.comp >= 4 && c.treasury >= 25 && Math.random() < 0.5 + p.comp * 0.04) { c.garrison++; c.treasury -= 25; }
        if (seat === 'diplomat') for (const o of G.civs) if (o.id !== ci) Diplo.addRel(ci, o.id, p.comp * 0.12);
        // conspiração
        if (p.aff < -5 && !G.plotsC.some(x => !x.done && x.pid === p.id) && Math.random() < 0.12) {
          G.plotsC.push({ id: G.day * 10 + Object.keys(COUNCIL).indexOf(seat), civ: ci, pid: p.id, seat, day: G.day, ripe: G.day + U.rint(4, 7) * ECON_DAYS, found: false, done: false });
        }
      }
      // o espião-mor investiga
      const spy = this.member(ci, 'spy'), chance = spy ? 0.08 + spy.comp * 0.06 : 0.03;
      for (const seat in COUNCIL) {
        const p = this.member(ci, seat);
        if (p && p.corrupt && !p.exposed && p !== spy && Math.random() < chance) { p.exposed = true; UI.msg(`🕵️ ${spy ? spy.name + ' descobriu' : 'Rumores dizem'} que ${p.name} (${COUNCIL[seat].m}) é corrupt${p.sex === 'f' ? 'a' : 'o'}! (${c.stolen || 0} 🪙 desviados)`, 'bad'); }
      }
      for (const pl of G.plotsC.filter(x => !x.done && x.civ === ci)) {
        const p = G.people[pl.pid];
        if (!p || !p.alive) { pl.done = true; continue; }
        if (!pl.found && Math.random() < chance) { pl.found = true; UI.banner('🕵️ Conspiração descoberta!'); UI.msg(`${spy ? spy.name : 'Um informante'} descobriu que ${People.full(p)} conspira contra você! Decida o destino del${p.sex === 'f' ? 'a' : 'e'} em Reino → Conselho.`, 'bad'); }
        if (!pl.found && G.day >= pl.ripe) this.strike(pl, p);
      }
    }
  },
  // a conspiração não descoberta acontece
  strike(pl, p) {
    pl.done = true;
    const c = G.civs[pl.civ];
    p.council = null; this.council(pl.civ)[pl.seat] = null;
    if (pl.seat === 'treasurer') {
      const st = Math.floor(c.treasury * 0.4);
      c.treasury -= st; p.home = { type: 'wild' };
      UI.banner('💰 O tesoureiro fugiu!'); UI.msg(`${People.full(p)} fugiu com ${st} 🪙 do tesouro de ${CIV_DEFS[pl.civ].short}!`, 'bad');
    } else if (pl.seat === 'general') {
      const lost = Math.floor(c.garrison / 2); c.garrison -= lost;
      const f = Families.of(p);
      UI.banner('⚔️ Golpe militar!'); UI.msg(`${People.full(p)} levou ${lost} soldados e se rebelou contra você!`, 'bad');
      if (f && !f.player && !Families.activeRevoltOf(f)) { f.loyalty = 0; f.wealth = Math.max(f.wealth, 400); Families.startRevolt(f); const r = Families.activeRevoltOf(f); if (r) r.str += lost; }
    } else if (pl.seat === 'diplomat') {
      const others = G.civs.filter(o => o.id !== pl.civ && o.ruler !== 'player' && !Diplo.atWar(pl.civ, o.id));
      const o = others.length ? U.pick(others) : null;
      UI.banner('📜 Traição na diplomacia!');
      if (o) { Diplo.addRel(pl.civ, o.id, -60); Diplo.declareWar(o.id, pl.civ, `intrigas de ${People.full(p)}`); }
      UI.msg(`${People.full(p)} vendeu segredos e provocou uma guerra contra ${CIV_DEFS[pl.civ].short}!`, 'bad');
    } else {
      UI.banner('🗡️ Atentado!'); UI.msg(`${People.full(p)} contratou assassinos para matar você!`, 'bad');
      G.assassins = (G.assassins || 0) + 3;
    }
    Diplo.chronicle(`🗡️ Intriga na corte de ${CIV_DEFS[pl.civ].short}: ${People.full(p)} traiu o soberano.`, true);
  },
  judge(plId, verdict) {
    const pl = (G.plotsC || []).find(x => x.id === plId), p = pl && G.people[pl.pid];
    if (!pl || !p) return;
    pl.done = true;
    const f = Families.of(p), c = G.civs[pl.civ];
    if (verdict === 'pardon') {
      People.addAff(p, 35);
      if (Math.random() < 0.3) { pl.done = false; pl.found = false; pl.ripe = G.day + U.rint(5, 9) * ECON_DAYS; }
      UI.msg(`Você perdoou ${p.name}. ${p.sex === 'f' ? 'Ela' : 'Ele'} jura lealdade... desta vez.`, 'gold');
    } else if (verdict === 'exile') {
      p.council = null; this.council(pl.civ)[pl.seat] = null; p.home = { type: 'wild' }; People.addAff(p, -60);
      if (f) f.loyalty = Math.max(0, f.loyalty - 20);
      UI.msg(`${People.full(p)} foi banid${p.sex === 'f' ? 'a' : 'o'} do reino.`);
    } else {
      p.council = null; this.council(pl.civ)[pl.seat] = null;
      People.die(p, 'executado por traição');
      if (f) f.loyalty = Math.max(0, f.loyalty - 40);
      c.happy = Math.max(0, c.happy - 4);
      UI.msg(`${People.full(p)} foi executad${p.sex === 'f' ? 'a' : 'o'}. A família dele está furiosa.`, 'bad');
    }
  },
  plotsOf(ci) { return (G.plotsC || []).filter(x => !x.done && x.found && x.civ === ci); },

  // ------------------------------------------------------------ casamentos arranjados para os filhos
  marriageable(child) {
    const sex = child.sex === 'm' ? 'f' : 'm';
    const free = p => p.alive && p.sex === sex && p.age >= 16 && p.age <= 40 && p.spouse === null && !p.kin && !p.dating && !p.capanga && p.id !== child.id;
    const out = [];
    const mine = G.civs.find(c => c.ruler === 'player');
    // herdeiros de outros reinos (para reis e duques)
    if (mine || this.T().lvl >= 4) for (const p of G.people) if (free(p) && p.rank === 'heir' && (!mine || p.civ !== mine.id)) out.push({ p, kind: 'royal' });
    // filhos das famílias mais poderosas
    const top = Families.ranking().filter(x => !x.f.player).slice(0, 14).map(x => x.f.id);
    for (const p of G.people) if (free(p) && p.rank !== 'heir' && top.includes(p.fam) && p.rank !== 'ruler' && p.rank !== 'consort') out.push({ p, kind: 'family' });
    return out.slice(0, 12);
  },
  arrange(child, p) {
    if (P.gold < 150) { UI.msg('O casamento custa 150 🪙 (dote e festa).', 'bad'); return false; }
    P.gold -= 150;
    const f = Families.of(p), royal = p.rank === 'heir', civ = Families.civOf(p);
    People.marry(child, p);
    if (child.sex === 'm') { p.home = { type: 'player' }; p.aff = Math.max(p.aff, 40); }
    else child.home = p.home;
    if (royal && civ >= 0) {
      Game.addRelation(civ, 30);
      const mine = G.civs.find(c => c.ruler === 'player');
      if (mine) { Diplo.addRel(mine.id, civ, 30); if (!Diplo.atWar(mine.id, civ)) Diplo.ally(mine.id, civ); }
    }
    if (f) { f.loyalty = Math.min(100, f.loyalty + 35); f.favor = (f.favor || 0) + 25; if (f.rival === G.playerFam) f.rival = null; this.endFeud(f); }
    const where = royal ? `${People.title(p)} de ${CIV_DEFS[civ].short}` : `da ${f ? Families.name(f) : 'família'}`;
    UI.banner(`💒 Casamento: ${child.name} e ${p.name}`);
    UI.msg(`${child.name} casou-se com ${People.full(p)}, ${where}.${royal ? ' Os reinos selam uma aliança!' : ' A família agora é leal a você.'}`, 'gold');
    Progress.diary(`💒 Casamento arranjado: ${child.name} e ${People.full(p)} (${where}).`);
    Diplo.chronicle(`💒 ${child.name} ${child.surname} e ${People.full(p)} se casaram${royal ? ' — uma aliança real' : ''}.`, true);
    return true;
  },

  // ------------------------------------------------------------ rivalidades entre famílias
  rivalTick() {
    const top = Families.ranking().filter(x => !x.f.player).slice(0, 30).map(x => x.f);
    for (const f of top) {
      if (f.rival && Families.get(f.rival)) continue;
      const cands = top.filter(o => o !== f && o.civ === f.civ && !o.rival && !(f.allies || []).includes(o.id) && !this.linked(f, o));
      if (cands.length && Math.random() < 0.25) {
        const o = U.pick(cands); f.rival = o.id; o.rival = f.id;
        Diplo.chronicle(`😠 A ${Families.name(f)} e a ${Families.name(o)} se tornaram rivais em ${Diplo.name(f.civ)}.`);
      }
    }
  },
  // ------------------------------------------------------------ alianças e inimizades da sua casa
  ALLY_COST: 250,
  isAlly(f) { return !!f && (Families.ensurePlayer().allies || []).includes(f.id); },
  isEnemy(f) { return !!f && (Families.ensurePlayer().enemies || []).includes(f.id); },
  // alguém de uma casa inimiga, que você pode enfrentar (crianças, parentes e capangas ficam de fora)
  enemyPerson(p) { return !!p && p.alive && p.age >= 14 && !p.kin && p.spouse !== 'player' && !p.capanga && this.isEnemy(Families.of(p)); },
  // pode tratar de aliança ou inimizade com esta casa?
  canDeal(f) { return !!f && !f.player; },
  allyWith(f) {
    const pf = Families.ensurePlayer();
    if (this.isEnemy(f)) return { text: 'Aliança? Depois de tudo o que você fez à nossa casa?', note: 'Faça as pazes primeiro.' };
    if (this.isAlly(f)) return { text: 'Nossas casas já são aliadas.', note: '' };
    if (P.gold < this.ALLY_COST) return { text: 'Uma aliança se sela com presentes à altura.', note: `Você precisa de ${this.ALLY_COST} 🪙.` };
    P.gold -= this.ALLY_COST;
    pf.allies = [...new Set([...(pf.allies || []), f.id])]; f.allies = [...new Set([...(f.allies || []), pf.id])];
    if (f.rival === pf.id) f.rival = null;
    f.loyalty = Math.min(100, (f.loyalty || 50) + 10);
    UI.banner(`🤝 Aliança com a ${Families.name(f)}`);
    Diplo.chronicle(`🤝 A ${Families.name(pf)} e a ${Families.name(f)} selaram uma aliança.`, true);
    Progress.diary(`🤝 Aliança com a ${Families.name(f)}.`);
    return { text: 'Que nossas casas prosperem juntas!', note: `Agora a ${Families.name(f)} é aliada da sua casa.` };
  },
  unally(f) {
    const pf = Families.ensurePlayer();
    pf.allies = (pf.allies || []).filter(id => id !== f.id); f.allies = (f.allies || []).filter(id => id !== pf.id);
    for (const p of Families.members(f)) People.addAff(p, -10);
    Diplo.chronicle(`💔 A ${Families.name(pf)} desfez a aliança com a ${Families.name(f)}.`, true);
    return { text: 'Então é assim que termina... Não esqueceremos.', note: `A aliança com a ${Families.name(f)} acabou.` };
  },
  declareEnemy(f) {
    const pf = Families.ensurePlayer();
    pf.allies = (pf.allies || []).filter(id => id !== f.id); f.allies = (f.allies || []).filter(id => id !== pf.id);
    pf.enemies = [...new Set([...(pf.enemies || []), f.id])];
    for (const p of Families.members(f)) People.addAff(p, -25);
    UI.banner(`😠 A ${Families.name(f)} agora é sua inimiga`);
    Diplo.chronicle(`😠 A ${Families.name(pf)} declarou a ${Families.name(f)} inimiga.`, true);
    Progress.diary(`😠 Declarou a ${Families.name(f)} inimiga.`);
    return { text: 'Que seja! A partir de hoje, nossas casas são inimigas.', note: 'Os adultos dessa casa podem ser enfrentados até a morte. Peça paz para voltar ao normal.' };
  },
  // fim da inimizade: ninguém daquela casa continua brigando com você
  endFeud(f) {
    const pf = Families.ensurePlayer();
    if (!(pf.enemies || []).includes(f.id)) return false;
    pf.enemies = pf.enemies.filter(id => id !== f.id);
    for (const e of G.ents) if (e.npc && e.npc.fam === f.id && e.angry) { e.angry = false; e.target = null; }
    return true;
  },
  // a paz só é aceita se a sua casa for mais influente que a inimiga
  canPeace(f) { return Families.influence(Families.ensurePlayer()) > Families.influence(f); },
  peace(f) {
    if (!this.isEnemy(f)) return { text: 'Não estamos em guerra com você.', note: '' };
    if (!this.canPeace(f)) return { text: 'Paz? Com uma casa mais fraca que a nossa? Nunca!', note: `Sua casa precisa ser mais influente que a ${Families.name(f)} (⭐ ${Families.influence(Families.ensurePlayer())} contra ⭐ ${Families.influence(f)}).` };
    this.endFeud(f);
    for (const p of Families.members(f)) if (p.aff < -10) p.aff = -10;
    UI.banner(`🕊️ Paz com a ${Families.name(f)}`);
    Diplo.chronicle(`🕊️ A ${Families.name(Families.ensurePlayer())} e a ${Families.name(f)} fizeram as pazes.`, true);
    return { text: 'Está bem. Que haja paz entre nossas casas.', note: `A inimizade com a ${Families.name(f)} acabou.` };
  },

  // famílias ligadas por casamento (alguém nasceu numa e vive na outra)
  linked(a, b) {
    return G.people.some(p => p.alive && p.maidenFam !== undefined && ((p.fam === a.id && p.maidenFam === b.id) || (p.fam === b.id && p.maidenFam === a.id)));
  },
  relationsOf(f) {
    const out = [];
    for (const o of Object.values(G.fams)) {
      if (o === f || !Families.members(o).length && !o.player) continue;
      let kind = null;
      if (f.rival === o.id || o.rival === f.id || (f.enemies || []).includes(o.id) || (o.enemies || []).includes(f.id)) kind = 'rival';
      else if (this.linked(f, o)) kind = 'kin';
      else if ((f.allies || []).includes(o.id) || (o.allies || []).includes(f.id)) kind = 'ally';
      if (kind) out.push({ f: o, kind });
    }
    return out;
  },
};
