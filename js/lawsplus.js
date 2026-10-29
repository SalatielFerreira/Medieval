'use strict';
// As leis do seu reino na rua:
//  • 👮 Guardas multando: com leis como o porte de armas, o toque de recolher, a caça real, os duelos ou o imposto do
//    vinho em vigor, os guardas pegam moradores em flagrante perto de você (com balões de fala) e a multa vai para o
//    tesouro. As multas do mês aparecem no resumo.
//  • 🕵️ Contrabandistas nos portos: nos portos dos seus reinos aparece contrabando — prenda (a carga vai para o
//    tesouro) ou faça vista grossa (o suborno vai para o seu bolso). Nos portos dos outros, compre contrabando barato
//    (com risco de multa).
//  • 🌑 Mercado negro: à noite, nas tavernas, alguém vende coisas raras e compra qualquer coisa sem perguntas (fecha nos
//    seus reinos com o toque de recolher).
//  • 🗝️ Espiões estrangeiros: reinos hostis plantam espiões nas suas vilas. Eles roubam do tesouro e espalham a
//    discórdia até alguém pegá-los: boatos dão pistas, um investigador (150 🪙) aponta o suspeito e você acusa na conversa.
const LAW_STREET = {
  armas:    { fine: 6,  guard: 'Alto! Porte de armas é proibido. Multa!', who: 'Mas é só uma faca de cozinha...' },
  recolher: { fine: 4,  guard: 'Toque de recolher! Para casa, e pague a multa.', who: 'Já estou indo, senhor guarda!', night: true },
  caca:     { fine: 8,  guard: 'Caçando nas terras do rei? Multa!', who: 'Era só um coelho...' },
  duelos:   { fine: 10, guard: 'Duelo é crime neste reino! Multa aos dois!', who: 'Ele me ofendeu primeiro!' },
  vinho:    { fine: 5,  guard: 'Vinho sem o selo do imposto? Multa!', who: 'Comprei de um mascate...' },
};
const BLACK_SELLS = ['gem', 'ruby', 'emerald', 'lucky_charm', 'amber_amulet', 'silver_brooch', 'spyglass', 'treasure_map', 'ancient_coin', 'steel_sword', 'crossbow'];
const SMUGGLE = ['spices', 'silk_cloth', 'wine', 'salt', 'amber', 'perfume', 'pearl'];

const LawsPlus = {
  S() { const u = G.urban || (G.urban = {}); return u.lawsx || (u.lawsx = { fines: 0, smug: {}, spies: [] }); },
  // ---------------------------------------------------------------- guardas multando
  t: 8,
  update(dt) {
    if (G.place || G.dungeon || !G.civs) return;
    this.t -= dt; if (this.t > 0) return; this.t = U.rnd(18, 32);
    const ci = typeof Clima !== 'undefined' ? Clima.here() : -1; if (ci < 0 || G.civs[ci].ruler !== 'player') return;
    const night = Routine.phase() !== 'day', laws = Object.keys(LAW_STREET).filter(k => Laws.has(k) && (!LAW_STREET[k].night || night)); if (!laws.length) return;
    const guard = G.ents.find(e => !e.dead && e.kind === 'guard' && e.civ === ci && U.dist(e.x, e.y, P.x, P.y) < 12 * TILE);
    const who = G.ents.find(e => !e.dead && e.kind === 'villager' && e.npc && !e.sleeping && !e.inRoom && e.npc.age >= 16 && !e.npc.capanga && U.dist(e.x, e.y, P.x, P.y) < 12 * TILE && (!guard || U.dist(e.x, e.y, guard.x, guard.y) < 9 * TILE));
    if (!guard || !who) return;
    const k = U.pick(laws), L = LAW_STREET[k], t = performance.now() / 1000;
    guard._law = { text: L.guard, until: t + 5 }; who._say = { text: L.who, until: t + 5.5 };
    guard.target = null; guard.wx = who.x; guard.wy = who.y;
    G.civs[ci].treasury += L.fine; this.S().fines += L.fine;
    if (who.npc) { who.npc.purse = Math.max(0, People.purse(who.npc) - L.fine); Mind.feel(who.npc, 'anger', 20); }
    Game.addText(who.x, who.y - 56, `−${L.fine} 🪙 multa`, '#ffd54a');
  },
  // ---------------------------------------------------------------- contrabando nos portos
  smugOf(s) { const S = this.S(), m = S.smug[s.okey]; return m && m.until >= G.day ? m : null; },
  catchSmug(s) {
    const m = this.smugOf(s), ci = Sea.civOfPort(s), c = G.civs[ci]; if (!m || !c) return;
    const ok = Math.random() < U.clamp(0.45 + (c.garrison || 0) / 60, 0.45, 0.92);
    delete this.S().smug[s.okey];
    if (ok) { c.treasury += m.value; c.happy = Math.min(100, (c.happy || 0) + 1); Laws.L().justice = (Laws.L().justice || 0) + 1; UI.msg(`🕵️ Os guardas prenderam os contrabandistas: ${m.value} 🪙 em mercadorias foram para o tesouro.`, 'gold', true); }
    else UI.msg('🕵️ Os contrabandistas fugiram pelo mar antes dos guardas chegarem.', 'bad');
  },
  bribe(s) {
    const m = this.smugOf(s); if (!m) return;
    delete this.S().smug[s.okey]; const g = Math.round(m.value * 0.4); P.gold += g;
    if (typeof Society !== 'undefined' && Society.rep) Society.rep('submundo', 2);
    UI.msg(`🤫 Vista grossa: os contrabandistas deixaram ${g} 🪙 no seu bolso.`, 'gold');
  },
  buySmug(s, k) {
    const ci = Sea.civOfPort(s), pr = Math.max(1, Math.round(Game.price(Math.max(0, ci), k).buy * 0.6));
    if (P.gold < pr * 5) { UI.msg('Ouro insuficiente.', 'bad'); return; }
    P.gold -= pr * 5; Inv.add(k, 5); Sound.play('coin');
    if (Math.random() < 0.25) Crime.commit(ci, 'contrabando', pr * 8, null, null, true); else UI.msg(`🤫 Você comprou 5 ${ITEMS[k].name} sem selo, por ${pr * 5} 🪙.`, 'gold');
  },
  portHtml(s) {
    const ci = Sea.civOfPort(s), mine = G.civs[ci] && G.civs[ci].ruler === 'player', m = this.smugOf(s), sid = s.id;
    if (mine && m) return `<div class="card lx-smug"><div class="sec">🕵️ Contrabando no porto</div><p class="dt-desc">Os guardas desconfiam de um barco que chegou de noite: ${m.what} sem selo, uns ${m.value} 🪙.</p>
      <div class="act-row"><button class="primary" data-act="lx" data-op="catch" data-s="${sid}">⛓️ Mandar prender</button><button data-act="lx" data-op="bribe" data-s="${sid}">🤫 Fazer vista grossa (${Math.round(m.value * 0.4)} 🪙)</button></div></div>`;
    if (mine) return '';
    const night = Routine.phase() !== 'day'; if (!night && Math.random() > 0.5) return '';
    const goods = SMUGGLE.filter(k => ITEMS[k]).slice(0, 4);
    return `<div class="card lx-smug"><div class="sec">🤫 Um marinheiro cochicha <span>contrabando: 40% mais barato, com risco de multa</span></div><div class="act-row">${goods.map(k => `<button data-act="lx" data-op="smug" data-s="${sid}" data-k="${k}">${UI.ii(k)} 5 ${ITEMS[k].name} — ${Math.round(Game.price(Math.max(0, ci), k).buy * 0.6) * 5} 🪙</button>`).join('')}</div></div>`;
  },
  // ---------------------------------------------------------------- mercado negro (tavernas, à noite)
  open() { const h = Game.hour(); return h >= 20 || h < 5; },
  blackHtml() {
    if (!this.open()) return '';
    const ci = Clima.here(); if (ci >= 0 && G.civs[ci].ruler === 'player' && Laws.has('recolher')) return '';
    const sells = BLACK_SELLS.filter(k => ITEMS[k]).slice(0, 8), mine = Object.keys(P.inv).filter(k => P.inv[k] > 0 && ITEMS[k] && !Object.values(P.equip).includes(k) && ITEMS[k].price >= 15).slice(0, 8);
    return `<div class="card lx-black"><div class="sec">🌑 Mercado negro <span>só à noite · sem perguntas</span></div>
      <div class="lx-cols"><div><small class="muted">Vende (caro)</small>${sells.map(k => `<button data-act="lx" data-op="bbuy" data-k="${k}" ${P.gold >= Math.round(ITEMS[k].price * 1.4) ? '' : 'disabled'}>${UI.ii(k)} ${ITEMS[k].name} — ${Math.round(ITEMS[k].price * 1.4)} 🪙</button>`).join('')}</div>
      <div><small class="muted">Compra qualquer coisa (barato)</small>${mine.length ? mine.map(k => `<button data-act="lx" data-op="bsell" data-k="${k}">${UI.ii(k)} ${ITEMS[k].name} — ${Math.round(ITEMS[k].price * 0.7)} 🪙</button>`).join('') : '<p class="muted">Nada de valor na mochila.</p>'}</div></div></div>`;
  },
  // ---------------------------------------------------------------- espiões
  spies() { const S = this.S(); S.spies = S.spies.filter(x => G.people[x.pid] && G.people[x.pid].alive); return S.spies; },
  spyOf(p) { return this.spies().find(x => x.pid === p.id) || null; },
  plant() {
    for (const c of G.civs.filter(x => x.ruler === 'player')) {
      const foes = G.civs.filter(o => o.id !== c.id && !o.dead && o.ruler !== 'player' && Diplo.rel(o.id, c.id) < 0);
      if (!foes.length || this.spies().some(x => x.civ === c.id) || Math.random() > 0.3) continue;
      const vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.free && x.v.civ === c.id); const t = U.pick(vs); if (!t) continue;
      const p = U.pick(People.residents(t.i).filter(q => q.age >= 18 && !q.kin && !q.capanga && !People.isCourt(q) && !q.shop)); if (!p) continue;
      const from = U.pick(foes).id;
      this.S().spies.push({ pid: p.id, from, civ: c.id, vi: t.i, day: G.day });
      Rumors.atV(t.i, `Tem alguém em ${t.v.name} fazendo perguntas demais sobre o castelo e o tesouro...`);
    }
  },
  monthTick() {
    const S = this.S();
    if (S.fines) { Game.note(`👮 Multas nas ruas do seu reino: +${S.fines} 🪙.`); S.fines = 0; }
    // contrabando: um caso por porto dos seus reinos, às vezes
    for (const s of Ports.list()) { const ci = Sea.civOfPort(s); if (G.civs[ci] && G.civs[ci].ruler === 'player' && !this.smugOf(s) && Math.random() < 0.35) { S.smug[s.okey] = { what: U.pick(SMUGGLE.filter(k => ITEMS[k]).map(k => ITEMS[k].name.toLowerCase())), value: U.rint(120, 420), until: G.day + 2 }; Game.note(`🕵️ Suspeita de contrabando no porto de ${CIV_DEFS[ci].short}.`); } }
    // espiões: roubam e espalham discórdia
    for (const x of this.spies()) {
      const c = G.civs[x.civ]; if (!c || c.ruler !== 'player') continue;
      const g = Math.min(Math.max(0, Math.round(c.treasury)), Math.round(c.treasury * 0.02) + 10); c.treasury -= g; c.happy = Math.max(0, (c.happy || 0) - 1);
      if (G.civs[x.from]) G.civs[x.from].treasury += g;
      if (Math.random() < 0.5) Rumors.atV(x.vi, `Somem papéis do castelo... e um forasteiro anda pela vila de ${World.villages[x.vi] ? World.villages[x.vi].name : '?'}.`);
    }
    this.plant();
  },
  // investigador: aponta o suspeito (70%)
  investigate(vi) {
    if (P.gold < 150) { UI.msg('O investigador cobra 150 🪙.', 'bad'); return; }
    P.gold -= 150;
    const x = this.spies().find(s => s.vi === vi);
    if (x && Math.random() < 0.7) { const p = G.people[x.pid]; x.known = true; UI.msg(`🗝️ O investigador aponta ${People.full(p)} como suspeito. Converse com ${p.sex === 'f' ? 'ela' : 'ele'} e acuse.`, 'gold', true); }
    else UI.msg(x ? '🗝️ O investigador não achou nada concreto... mas tem alguém escondendo algo.' : '🗝️ Nenhum sinal de espiões nesta vila.', x ? 'bad' : '');
  },
  accuse(p) {
    const x = this.spyOf(p);
    if (x) {
      this.S().spies = this.spies().filter(s => s !== x); p.jail = G.day + 12;
      Diplo.addRel(x.from, x.civ, -10); const ransom = Math.min(Math.max(0, Math.round(G.civs[x.from].treasury)), 250); G.civs[x.from].treasury -= ransom; G.civs[x.civ].treasury += ransom;
      Laws.L().justice = (Laws.L().justice || 0) + 2; Court.addFame(5);
      Diplo.chronicle(`🗝️ Um espião de ${Diplo.name(x.from)} foi preso em ${Diplo.name(x.civ)}.`, true);
      return { text: 'Como... como você descobriu?!', note: `🗝️ Espião de ${CIV_DEFS[x.from].short} preso! ${ransom ? `${CIV_DEFS[x.from].short} pagou ${ransom} 🪙 de resgate ao seu tesouro.` : ''}` };
    }
    People.addAff(p, -30); const c = G.civs.find(q => q.ruler === 'player' && q.id === (World.villages[p.home.idx] || {}).civ); if (c) c.happy = Math.max(0, c.happy - 2);
    return { text: 'Espião? Eu?! Moro aqui desde criança!', note: 'Acusação falsa: o povo não gostou nada.' };
  },
};

{
  // balão do guarda (os moradores já têm o deles)
  const cd0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    const r = cd0.call(this, ctx, cx, cy), L = this._law, t = performance.now() / 1000;
    if (L && t < L.until && !this.dead) {
      const x = Math.round(this.x - cx), y = Math.round(this.y - cy) - 48;
      ctx.font = '600 10px "Segoe UI", sans-serif'; const w = Math.min(240, ctx.measureText(L.text).width + 12);
      ctx.fillStyle = 'rgba(232,240,255,0.95)'; ctx.strokeStyle = 'rgba(30,40,80,0.7)'; ctx.lineWidth = 1;
      rrPath(ctx, x - w / 2, y - 17, w, 16, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1a2440'; ctx.textAlign = 'center'; ctx.fillText(L.text, x, y - 5.5); ctx.textAlign = 'left';
    }
    return r;
  };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); LawsPlus.update(dt); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); LawsPlus.monthTick(); };
  // porto e taverna
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showPort' && args && World.structs[args[0]]) body = LawsPlus.portHtml(World.structs[args[0]]) + body;
    if (fn === 'showTavern') body = body + LawsPlus.blackHtml();
    return op0(title, body, fn, args, sub);
  };
  // na conversa: acusar de espionagem (moradores dos seus reinos)
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    ac0(p, acts);
    const v = p.home && p.home.type === 'village' ? World.villages[p.home.idx] : null;
    if (v && !v.free && G.civs[v.civ] && G.civs[v.civ].ruler === 'player' && p.age >= 18 && !p.capanga && !p.kin && !(p.jail > G.day)) acts.push(['lxAccuse', '🗝️ Acusar de espionagem']);
  };
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    if (d && d.op === 'lxAccuse') { const p = People.get(+d.id); if (p) this.showTalk(p.id, LawsPlus.accuse(p)); return; }
    return ta0(d);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'lx') return a0(a, d);
    const s = World.structs[+d.s];
    switch (d.op) {
      case 'catch': LawsPlus.catchSmug(s); break;
      case 'bribe': LawsPlus.bribe(s); break;
      case 'smug': LawsPlus.buySmug(s, d.k); break;
      case 'bbuy': { const pr = Math.round(ITEMS[d.k].price * 1.4); if (P.gold >= pr) { P.gold -= pr; Inv.add(d.k, 1); Sound.play('coin'); } break; }
      case 'bsell': { if (Inv.count(d.k) > 0) { Inv.add(d.k, -1); P.gold += Math.round(ITEMS[d.k].price * 0.7); Sound.play('coin'); } break; }
      case 'spy': LawsPlus.investigate(+d.v); break;
    }
    UI.refresh();
  };
  // o painel do reino mostra os espiões suspeitos e o investigador
  const th0 = Board.threats.bind(Board);
  Board.threats = function (ci) { const out = th0(ci); const n = LawsPlus.spies().filter(x => x.civ === ci).length; if (n && G.civs[ci].ruler === 'player') out.push({ lvl: 2, ic: '🗝️', t: `Boatos de espiões estrangeiros (${n}) — contrate um investigador nas vilas pelo painel` }); return out; };
  const pg0 = Board.page.bind(Board);
  Board.page = function (ci) {
    const h = pg0(ci); if (ci === undefined) ci = UI.sel.rbCiv; if (ci === undefined || !G.civs[ci] || G.civs[ci].ruler !== 'player') return h;
    const vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.free && x.v.civ === ci);
    return h + `<div class="card"><div class="sec">🗝️ Investigar espiões <span>150 🪙 por vila · 70% de achar o suspeito</span></div><div class="act-row" style="flex-wrap:wrap">${vs.map(x => `<button data-act="lx" data-op="spy" data-v="${x.i}" ${P.gold >= 150 ? '' : 'disabled'}>🔎 ${UI.esc(x.v.name)}</button>`).join('')}</div></div>`;
  };
}
