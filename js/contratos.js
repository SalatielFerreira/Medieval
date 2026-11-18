'use strict';
// Serviços, segunda parte:
//  • 🗡️ Encomendas (Fora da lei): mandar matar alguém ou roubar uma família, pagando a um bandido dos bandos da região
//    ou a um matador de aluguel das vilas. O serviço acontece no mês seguinte. Deu certo: a vítima morre (ou a família
//    perde parte da riqueza e metade do roubo vem para você). Deu errado: o contratado é preso ou morto — e a família da
//    vítima pode arrancar dele quem pagou (os leais calam; os gananciosos e os tímidos falam). Descoberto, a família vira
//    sua inimiga (guerra contra a sua família) e o reino põe a sua cabeça a prêmio.
//  • ⚔️ Ordens para as companhias de mercenários que você contratou: ficar de reserva (somam ao seu exército nas guerras),
//    escoltar você (o capitão segue você), guarnecer o seu reino (os homens reforçam a guarnição do castelo), caçar
//    bandidos (limpam os acampamentos perto de você) ou saquear um reino em guerra com você.
const CONTRACT_KINDS = { kill: { icon: '🗡️', name: 'Assassinato', verb: 'matar' }, rob: { icon: '💰', name: 'Roubo', verb: 'roubar' } };
const MERC_ORDERS = {
  reserva:  { icon: '⚔️', name: 'Reserva', desc: 'esperam a guerra: somam ao seu exército nas batalhas' },
  escolta:  { icon: '🛡️', name: 'Escolta', desc: 'o capitão segue você como capanga' },
  guarda:   { icon: '🏰', name: 'Guarnição', desc: 'os homens reforçam a guarnição do seu castelo' },
  caca:     { icon: '⛺', name: 'Caçar bandidos', desc: 'todo mês atacam o acampamento de bandidos mais perto de você' },
  saque:    { icon: '🔥', name: 'Saquear o inimigo', desc: 'todo mês saqueiam um reino em guerra com você (metade do saque é sua)' },
};

const Contracts = {
  S() { const u = G.urban || (G.urban = {}); return u.contracts || (u.contracts = { list: [], log: [], seq: 1 }); },
  log(t) { const L = this.S().log; L.unshift({ day: G.day, t }); if (L.length > 14) L.length = 14; },
  isKing(p) { return G.civs.some(c => c && !c.dead && c.rulerId === p.id); },
  importance(p) { return this.isKing(p) ? 4 : NOBLE_RANKS.includes(p.rank) ? 3 : (p.rank === 'knight' || Chiefdom.vilOf(p) >= 0) ? 2 : 1; },
  // quão difícil é chegar até a vítima (guardas, escolta)
  guard(p) { return [0, 0, 0.12, 0.22, 0.4][this.importance(p)]; },
  killCost(p) { return [0, 250, 700, 1600, 5000][this.importance(p)]; },
  robCost(f) { return Math.round(120 + Math.min(1500, (f.wealth || 0) * 0.08)); },
  busy() { return new Set(this.S().list.flatMap(c => [c.kind === 'kill' ? 'p' + c.tid : 'f' + c.tid, 'a' + c.aid])); },
  targets(kind) {
    const B = this.busy();
    if (kind === 'rob') return Object.values(G.fams || {}).filter(f => f && !f.player && !B.has('f' + f.id) && Families.members(f).length && (f.wealth || 0) > 60).sort((a, b) => (b.wealth || 0) - (a.wealth || 0)).slice(0, 30);
    return G.people.filter(p => p.alive && p.age >= 16 && p.met && !p.kin && p.spouse !== 'player' && !p.capanga && !(p.jail > G.day) && !B.has('p' + p.id))
      .sort((a, b) => this.importance(b) - this.importance(a) || (a.aff || 0) - (b.aff || 0)).slice(0, 40);
  },
  // quem aceita: bandidos dos acampamentos mais perto de você e matadores de aluguel das vilas
  agents() {
    const B = this.busy(), px = P.x / TILE, py = P.y / TILE, out = [];
    const ok = p => p && p.alive && !(p.jail > G.day) && !p.capanga && !p.kin && p.spouse !== 'player' && !p.hit && !B.has('a' + p.id) && p.age >= 18;
    if (typeof Bands !== 'undefined') World.camps.map((c, i) => ({ c, i, d: U.dist(px, py, c.x, c.y) })).filter(x => !x.c.cleared).sort((a, b) => a.d - b.d).slice(0, 3)
      .forEach(x => { for (const p of Bands.members('camp' + x.i)) if (ok(p)) out.push(p); });
    const hit = G.people.filter(p => ok(p) && !p.band && ['mercenary', 'hunter', 'wanderer', 'beggar', 'soldier'].includes(p.rank) && (p.job === undefined || p.job === null) && !People.isCourt(p) && !(G.spawned.get(p.id) && !G.spawned.get(p.id).dead))
      .map(p => ({ p, s: (p.rank === 'mercenary' ? 3 : 1) + (p.trait === 'ganancioso' ? 2 : 0) + ((TRAITS[p.trait] || {}).fights ? 1 : 0) + U.hash2(p.id, G.day, 5) * 2 })).sort((a, b) => b.s - a.s).slice(0, 4).map(x => x.p);
    return [...new Set([...out.slice(0, 6), ...hit])].slice(0, 10);
  },
  skill(p) { const st = typeof Progress !== 'undefined' && Progress.stats ? Progress.stats(p) || {} : {}; return U.clamp(((st.str || 40) - 40) / 200 + (p.band ? 0.08 : 0) + (p.rank === 'mercenary' ? 0.12 : 0) + ((TRAITS[p.trait] || {}).fights ? 0.05 : 0), -0.05, 0.3); },
  // se for pego, conta quem pagou?
  talks(p) { return p.trait === 'leal' ? 0.2 : p.trait === 'ganancioso' ? 0.7 : p.trait === 'timido' ? 0.65 : 0.45; },
  talkName(p) { const t = this.talks(p); return t < 0.3 ? 'cala a boca' : t > 0.6 ? 'fala fácil' : 'pode falar'; },
  chance(kind, t, a) { const g = kind === 'kill' ? this.guard(t) : Math.min(0.25, (t.wealth || 0) / 25000); return U.clamp((kind === 'kill' ? 0.5 : 0.6) + this.skill(a) - g, 0.05, 0.9); },
  cost(kind, t) { return kind === 'kill' ? this.killCost(t) : this.robCost(t); },
  target(kind, id) { return kind === 'kill' ? People.get(id) : Families.get(id); },
  tName(kind, t) { return kind === 'kill' ? People.full(t) : Families.name(t); },
  order(kind, tid, aid) {
    const t = this.target(kind, tid), a = People.get(aid);
    if (!CONTRACT_KINDS[kind] || !t || !a) { UI.msg('Escolha a vítima e quem vai fazer o serviço.', 'bad'); return false; }
    const B = this.busy(); if (B.has('a' + a.id)) { UI.msg(`${People.full(a)} já tem um serviço seu.`, 'bad'); return false; }
    const cost = this.cost(kind, t); if (P.gold < cost) { UI.msg(`O serviço custa ${cost.toLocaleString('pt-BR')} 🪙.`, 'bad'); return false; }
    P.gold -= cost; Sound.play('coin');
    const S = this.S(); S.list.push({ id: S.seq++, kind, tid, aid, day: G.day, cost, ch: this.chance(kind, t, a) });
    this.log(`${CONTRACT_KINDS[kind].icon} Você pagou ${cost.toLocaleString('pt-BR')} 🪙 a ${People.full(a)} para ${CONTRACT_KINDS[kind].verb} ${this.tName(kind, t)}.`);
    UI.msg(`${CONTRACT_KINDS[kind].icon} ${People.full(a)} pegou as moedas: "No mês que vem está feito."`, 'gold', true);
    return true;
  },
  monthTick() {
    const S = this.S(), left = [];
    for (const c of S.list) { if (c.day >= G.day) { left.push(c); continue; } try { this.resolve(c); } catch (e) { console.error(e); } }
    S.list = left;
  },
  resolve(c) {
    const t = this.target(c.kind, c.tid), a = People.get(c.aid);
    if (!t || (c.kind === 'kill' && !t.alive)) { if (a && a.alive) a.purse = People.purse(a) + Math.round(c.cost * 0.5); P.gold += Math.round(c.cost * 0.5); this.log(`↩️ O alvo sumiu antes do serviço: metade do dinheiro voltou.`); return; }
    if (!a || !a.alive || a.jail > G.day) { P.gold += c.cost; this.log(`↩️ ${a ? People.full(a) : 'O contratado'} não pôde fazer o serviço: o dinheiro voltou.`); return; }
    const name = this.tName(c.kind, t), fam = c.kind === 'kill' ? Families.of(t) : t;
    if (Math.random() < c.ch) {
      a.purse = People.purse(a) + Math.round(c.cost * 0.5);
      if (c.kind === 'kill') {
        People.die(t, 'assassinado por um matador de aluguel');
        const m = `🗡️ Serviço feito: ${name} foi encontrad${t.sex === 'f' ? 'a' : 'o'} morto${t.sex === 'f' ? 'a' : ''}. Ninguém sabe quem pagou.`;
        this.log(m); UI.msg(m, 'gold', true); Progress.diary(`🗡️ Mandou matar ${name}.`);
        if (t.home && t.home.type === 'village') Rumors.atV(t.home.idx, `${name} foi assassinad${t.sex === 'f' ? 'a' : 'o'}! Procuram quem fez isso.`);
      } else {
        const loss = Math.round((t.wealth || 0) * U.rnd(0.2, 0.35)); t.wealth = Math.max(0, (t.wealth || 0) - loss);
        const mine = Math.round(loss * 0.5); P.gold += mine;
        const m = `💰 Serviço feito: ${People.full(a)} roubou ${loss.toLocaleString('pt-BR')} 🪙 da ${name}. A sua parte: ${mine.toLocaleString('pt-BR')} 🪙.`;
        this.log(m); UI.msg(m, 'gold', true);
        if (typeof t.seat === 'number') Rumors.atV(t.seat, `Roubaram a ${name}: levaram ${loss} 🪙!`);
      }
      if (Math.random() < 0.08) this.expose(c, a, fam, 'gastou demais na taverna e se gabou do serviço');
      return;
    }
    // deu errado: preso ou morto — e pode contar quem pagou
    const ci = fam && fam.civ >= 0 ? fam.civ : Justice.civOf(a);
    const dies = c.kind === 'kill' && Math.random() < 0.35;
    if (dies) People.die(a, `morto tentando ${CONTRACT_KINDS[c.kind].verb} ${name}`);
    else if (ci >= 0) Justice.toJail(a, ci, `tentou ${CONTRACT_KINDS[c.kind].verb} ${name}`, 8);
    const m = `${CONTRACT_KINDS[c.kind].icon} O serviço contra ${name} deu errado: ${People.full(a)} ${dies ? 'morreu na tentativa' : 'foi pego e está preso'}.`;
    this.log(m); UI.msg(m, 'bad', true);
    if (Math.random() < (dies ? 0.25 : this.talks(a))) this.expose(c, a, fam, dies ? 'acharam com ele a bolsa das suas moedas' : 'arrancaram dele quem pagou');
  },
  // a família da vítima descobre que foi você
  expose(c, a, fam, how) {
    const name = this.tName(c.kind, this.target(c.kind, c.tid));
    const m = `🗣️ A ${fam && !fam.player ? Families.name(fam) : 'família da vítima'} descobriu (${how}): foi você quem mandou ${CONTRACT_KINDS[c.kind].verb} ${name}.`;
    this.log(m); UI.msg(m, 'bad', true); Progress.diary(m);
    if (fam && !fam.player) {
      for (const p of Families.members(fam)) p.aff = Math.max(-100, (p.aff || 0) - 60);
      fam.grudge = (fam.grudge || 0) + 100;
      const h = Families.head(fam) || Families.adults(fam)[0]; if (h) Court.npcWar(h);
    }
    const ci = fam && fam.civ >= 0 ? fam.civ : -1;
    if (ci >= 0) Crime.commit(ci, `mandar ${CONTRACT_KINDS[c.kind].verb} ${name}`, c.kind === 'kill' ? 400 : 180, null, null, true);
    const king = c.kind === 'kill' ? G.civs.find(k => k && k.rulerId === c.tid) : null; if (king) Game.addRelation(king.id, -60);
  },
  // ---------------------------------------------------------------- a página (Serviços → Fora da lei → Encomendas)
  page() {
    const esc = UI.esc.bind(UI), S = this.S(), sel = UI.sel, kind = CONTRACT_KINDS[sel.ctK] ? sel.ctK : 'kill';
    const T = this.targets(kind), A = this.agents(), t = T.find(x => x.id === sel.ctT) || null, a = A.find(x => x.id === sel.ctA) || null;
    // as listas viram páginas (◀ 1/5 ▶) para caber no quadro sem rolar
    const small = document.body.classList.contains('small'), PG = sel.ctPg || (sel.ctPg = { t: 0, a: 0 });
    const page = (L, k, n) => { const pages = Math.max(1, Math.ceil(L.length / n)); PG[k] = U.clamp(PG[k] || 0, 0, pages - 1); return { list: L.slice(PG[k] * n, PG[k] * n + n), nav: pages > 1 ? `<div class="ct-pg"><button data-act="ct" data-op="pg" data-k="${k}" data-d="-1" ${PG[k] ? '' : 'disabled'}>◀</button><span>${PG[k] + 1}/${pages}</span><button data-act="ct" data-op="pg" data-k="${k}" data-d="1" ${PG[k] < pages - 1 ? '' : 'disabled'}>▶</button></div>` : '' }; };
    // (no computador, as listas rolam por dentro em vez de virar páginas)
    const pT = page(T, 't', small ? 2 : 80), pA = page(A, 'a', small ? 2 : 80);
    const icon = p => this.isKing(p) ? '👑' : NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : Chiefdom.vilOf(p) >= 0 ? '🏘️' : p.sex === 'f' ? '👩' : '🧔';
    const tRows = pT.list.map(x => kind === 'kill'
      ? `<button class="ct-row ${t === x ? 'on' : ''}" data-act="ct" data-op="t" data-i="${x.id}"><span>${icon(x)}</span><span><b>${esc(People.full(x))}</b><small>${esc(People.title(x))} · ${esc(People.homeName(x))} · amizade ${Math.round(x.aff || 0)}</small></span><em>${this.killCost(x).toLocaleString('pt-BR')} 🪙</em></button>`
      : `<button class="ct-row ${t === x ? 'on' : ''}" data-act="ct" data-op="t" data-i="${x.id}"><span>🏠</span><span><b>${esc(Families.name(x))}</b><small>riqueza ${Math.round(x.wealth || 0).toLocaleString('pt-BR')} 🪙 · ${Families.members(x).length} membros</small></span><em>${this.robCost(x).toLocaleString('pt-BR')} 🪙</em></button>`).join('');
    const aRows = pA.list.map(x => `<button class="ct-row ${a === x ? 'on' : ''}" data-act="ct" data-op="a" data-i="${x.id}"><span>${x.band ? '🏴' : '🗡️'}</span><span><b>${esc(People.full(x))}</b><small>${x.band ? 'bandido' : esc(People.title(x))} · ${esc((TRAITS[x.trait] || {}).name || '')} · se pego, ${this.talkName(x)}</small></span><em>${t ? Math.round(this.chance(kind, t, x) * 100) + '%' : ''}</em></button>`).join('');
    const go = t && a ? `<div class="ct-go"><span>${CONTRACT_KINDS[kind].icon} <b>${esc(this.tName(kind, t))}</b> por <b>${esc(a.name)}</b> · chance ${Math.round(this.chance(kind, t, a) * 100)}% · ${this.cost(kind, t).toLocaleString('pt-BR')} 🪙</span><button class="danger" data-act="ct" data-op="go" ${P.gold >= this.cost(kind, t) ? '' : 'disabled'}>✍️ Encomendar</button></div>`
      : '<div class="ct-go muted">Escolha a vítima e quem vai fazer o serviço.</div>';
    const act = S.list.map(c => { const x = this.target(c.kind, c.tid), y = People.get(c.aid); return `<div class="ct-run"><span>${CONTRACT_KINDS[c.kind].icon}</span><span><b>${x ? esc(this.tName(c.kind, x)) : '?'}</b><small>${y ? esc(People.full(y)) : '?'} · no mês que vem · chance ${Math.round(c.ch * 100)}%</small></span></div>`; }).join('');
    return `<div class="ct">
      <div class="card ct-c"><div class="sec">1️⃣ O serviço</div><div class="act-row ct-k">${Object.entries(CONTRACT_KINDS).map(([k, d]) => `<button class="${k === kind ? 'on' : ''}" data-act="ct" data-op="k" data-k="${k}">${d.icon} ${d.name}</button>`).join('')}</div>
        <div class="ct-list${small ? '' : ' kscroll'}">${pT.nav}${tRows || `<p class="muted">${kind === 'kill' ? 'Converse com as pessoas para conhecê-las: só dá para mandar matar quem você conhece.' : 'Nenhuma família rica por perto.'}</p>`}</div></div>
      <div class="card ct-c"><div class="sec">2️⃣ Quem faz <span>bandidos e matadores de aluguel</span></div><div class="ct-list${small ? '' : ' kscroll'}">${pA.nav}${aRows || '<p class="muted">Ninguém aceita agora. Chegue perto de um acampamento de bandidos.</p>'}</div>${go}</div>
      <div class="card ct-c"><div class="sec">📜 Em andamento <span>${S.list.length}</span></div><div class="ct-list sm${small ? '' : ' kscroll'}">${act || '<p class="muted">Nenhum serviço encomendado.</p>'}</div>
        <div class="sec" style="margin-top:6px">📒 O que aconteceu</div><div class="ct-list sm${small ? '' : ' kscroll'}">${S.log.slice(0, small ? 2 : 20).map(l => `<div class="ct-log"><em>${Calendar.short(l.day)}</em> ${esc(l.t)}</div>`).join('') || '<p class="muted">Nada ainda.</p>'}</div>
        <small class="muted">Deu errado? O contratado é preso ou morto e pode contar quem pagou: a família vira sua inimiga e a sua cabeça vai a prêmio.</small></div></div>`;
  },
};

// ---------------------------------------------------------------- ordens dos mercenários
const MercOrders = {
  of(id) { const c = Mercs.co(id); return MERC_ORDERS[c.order] ? c.order : 'reserva'; },
  realm() { return G.civs.find(c => c.ruler === 'player' && c.id === G.mainRealm) || G.civs.find(c => c.ruler === 'player') || null; },
  enemies() { const mine = G.civs.filter(c => c.ruler === 'player').map(c => c.id); return G.civs.filter(c => c && !c.dead && c.ruler !== 'player' && (c.atWar || mine.some(m => Diplo.atWar(m, c.id)))); },
  why(id, o) {
    if (o === 'guarda' && !this.realm()) return 'só para quem tem um reino';
    if (o === 'saque' && !this.enemies().length) return 'você não está em guerra com ninguém';
    if (o === 'caca' && !World.camps.some(c => !c.cleared)) return 'não há acampamentos de bandidos';
    return null;
  },
  set(id, o) {
    const c = Mercs.co(id), d = Mercs.def(id); if (c.emp !== 'player' || !MERC_ORDERS[o]) return;
    const why = this.why(id, o); if (why) { UI.msg(`${d.icon} ${d.name}: ${why}.`, 'bad'); return; }
    this.undo(id); c.order = o;
    if (o === 'escolta') { const L = Mercs.leader(id); if (!L.capanga) { if (Game.allies().length >= Game.followerCap()) { UI.msg('Você já tem seguidores demais: o capitão espera no acampamento.', 'bad'); c.order = 'reserva'; return; } L.capanga = true; L.oldHome = L.home; L.mercEscort = id; Game.spawnCapanga(L); } }
    if (o === 'guarda') { const k = this.realm(); const n = Math.min(Mercs.power(id), Math.max(0, (typeof GARRISON_MAX !== 'undefined' ? GARRISON_MAX : 50) - k.garrison)); k.garrison += n; c.gar = { ci: k.id, n }; }
    Mercs.log(`${d.icon} ${d.name}: nova ordem — ${MERC_ORDERS[o].name}.`);
    UI.msg(`${d.icon} ${d.name}: ${MERC_ORDERS[o].icon} ${MERC_ORDERS[o].name} — ${MERC_ORDERS[o].desc}.`, 'gold');
  },
  // desfaz o efeito da ordem de antes
  undo(id) {
    const c = Mercs.co(id);
    if (c.gar) { const k = G.civs[c.gar.ci]; if (k) k.garrison = Math.max(0, k.garrison - c.gar.n); c.gar = null; }
    if (c.order === 'escolta') { const L = Mercs.leader(id); if (L.capanga && L.mercEscort === id) { L.capanga = false; L.mercEscort = null; for (const e of G.ents) if (e.npc === L) e.dead = true; G.spawned.delete(L.id); } }
    c.order = 'reserva';
  },
  monthTick() {
    for (const d of MERC_CO) {
      const c = Mercs.co(d.id);
      if (c.emp !== 'player') { if (c.order && c.order !== 'reserva') this.undo(d.id); continue; }
      const o = this.of(d.id), pw = Mercs.power(d.id);
      if (o === 'caca') {
        const px = P.x / TILE, py = P.y / TILE, x = World.camps.map((cp, i) => ({ cp, i, dd: U.dist(px, py, cp.x, cp.y) })).filter(q => !q.cp.cleared).sort((a, b) => a.dd - b.dd)[0];
        if (!x) continue;
        const lost = U.rint(0, 2); c.size = Math.max(3, c.size - lost);
        if (Math.random() < U.clamp(0.4 + pw / 40, 0.4, 0.9)) {
          x.cp.cleared = true; if (typeof Bands !== 'undefined') for (const p of Bands.members('camp' + x.i)) People.die(p, `morto pela ${d.name}`);
          const loot = U.rint(80, 260); P.gold += loot; Progress.add('camps');
          UI.msg(`${d.icon} ${d.name} destruiu um acampamento de bandidos${lost ? ` (perdeu ${lost} homens)` : ''} e trouxe ${loot} 🪙 de saque.`, 'gold', true);
        } else UI.msg(`${d.icon} ${d.name} atacou um acampamento de bandidos mas foi repelida${lost ? ` (perdeu ${lost} homens)` : ''}.`, 'bad');
      }
      if (o === 'saque') {
        const E = this.enemies(); if (!E.length) { this.undo(d.id); UI.msg(`${d.icon} A guerra acabou: ${d.name} voltou para a reserva.`); continue; }
        const k = U.pick(E), lost = U.rint(0, 2); c.size = Math.max(3, c.size - lost);
        if (Math.random() < U.clamp(0.45 + pw / 40 - (k.garrison || 0) / 120, 0.2, 0.9)) {
          const loot = Math.min(k.treasury || 0, Math.round(60 + pw * 12)); k.treasury -= loot; const mine = Math.round(loot / 2); P.gold += mine;
          k.happy = Math.max(0, (k.happy || 50) - 5); k.garrison = Math.max(0, (k.garrison || 0) - U.rint(0, 2));
          UI.msg(`${d.icon} ${d.name} saqueou as terras de ${CIV_DEFS[k.id].short}: ${loot} 🪙 (a sua metade: ${mine} 🪙)${lost ? `; perdeu ${lost} homens` : ''}.`, 'gold', true);
        } else UI.msg(`${d.icon} Os soldados de ${CIV_DEFS[k.id].short} expulsaram ${d.name}${lost ? ` (perdeu ${lost} homens)` : ''}.`, 'bad');
      }
      if (o === 'guarda' && c.gar) { const k = G.civs[c.gar.ci]; if (!k || k.ruler !== 'player') { c.gar = null; c.order = 'reserva'; } }
      if (o === 'escolta') { const L = Mercs.leader(d.id); if (!L.alive || !L.capanga) c.order = 'reserva'; }
    }
  },
  html(id) {
    const cur = this.of(id);
    return `<div class="sv-ord"><small title="${UI.esc(MERC_ORDERS[cur].desc)}">Ordem: <b>${MERC_ORDERS[cur].icon} ${MERC_ORDERS[cur].name}</b></small><span>${Object.entries(MERC_ORDERS).map(([k, o]) => { const why = this.why(id, k); return `<button class="${k === cur ? 'on' : ''}" data-act="mercOrd" data-k="${id}" data-o="${k}" ${why && k !== cur ? `disabled title="${UI.esc(why)}"` : `title="${UI.esc(o.desc)}"`}>${o.icon}</button>`; }).join('')}</span></div>`;
  },
};

{
  if (typeof SVX_GUIDE !== 'undefined') SVX_GUIDE.encomendas = { name: 'Encomendas', tip: 'Mande matar alguém ou roubar uma família, pagando a um bandido ou a um matador de aluguel.', when: 'Cuidado: se o contratado for pego, pode contar que foi você.' };
  // a aba Encomendas em Fora da lei (com ou sem bando)
  const sb0 = Services.subs.bind(Services);
  Services.subs = function (g, list) { if ((g === 'ol0' || g === 'ol1') && !list.some(x => x[0] === 'encomendas')) list = [...list, ['encomendas', '🗡️', 'Encomendas', Contracts.page()]]; return sb0(g, list); };
  // as ordens no cartão de cada companhia sua
  const mc0 = Services.mercs.bind(Services);
  Services.mercs = function () {
    let h = mc0();
    for (const d of Mercs.mine()) { const k = `data-act="mercOut" data-k="${d.id}"`, i = h.indexOf(k); if (i < 0) continue; const j = h.lastIndexOf('<div class="sv-ca">', i); if (j >= 0) h = h.slice(0, j) + MercOrders.html(d.id) + h.slice(j); }
    return h;
  };
  const dm0 = Mercs.dismiss.bind(Mercs);
  Mercs.dismiss = function (id) { try { MercOrders.undo(id); } catch (e) { console.error(e); } return dm0(id); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Contracts.monthTick(); MercOrders.monthTick(); } catch (e) { console.error(e); } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'mercOrd') { MercOrders.set(d.k, d.o); this.refresh(); return; }
    if (a !== 'ct') return a0(a, d);
    const S = this.sel;
    if (d.op === 'k') { S.ctK = d.k; S.ctT = null; (S.ctPg || (S.ctPg = {})).t = 0; }
    if (d.op === 'pg') { const P0 = S.ctPg || (S.ctPg = { t: 0, a: 0 }); P0[d.k] = (P0[d.k] || 0) + +d.d; }
    if (d.op === 't') S.ctT = +d.i;
    if (d.op === 'a') S.ctA = +d.i;
    if (d.op === 'go') { if (Contracts.order(CONTRACT_KINDS[S.ctK] ? S.ctK : 'kill', S.ctT, S.ctA)) { S.ctT = null; S.ctA = null; } }
    this.refresh();
  };
}
