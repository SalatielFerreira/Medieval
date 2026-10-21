'use strict';
// Portão da vila: o governador instala o portão na passagem da estrada pela muralha (as laterais da passagem são fechadas
// com trechos de muralha). Com ele a vila:
//  • cobra pedágio das caravanas que passam (caravana que passa aquece o comércio; pedágio caro faz a caravana
//    reclamar ou dar meia-volta);
//  • cobra entrada dos forasteiros e revista as cargas (contrabando apreendido vira multa; ladrões são barrados);
//  • fecha sozinho quando há inimigos por perto (bandidos, feras, soldados inimigos) e, com o toque de recolher, à
//    noite — fechado, ninguém atravessa;
//  • tem um porteiro (responsável) que dá voz de prisão a quem é procurado no reino;
//  • segura parte dos saques e das tomadas da vila;
//  • anota tudo no livro do portão.

Object.assign(RANKS, { gatekeeper: { m: 'Porteiro', f: 'Porteira', fighter: true, order: 6 } });
RANK_LOOK.gatekeeper = '#5a5a4a';
CIV_STRUCTS.vgate = { name: 'Portão da Vila', w: 1, h: 1, blocks: false };
CIVIC.vgate = { name: 'Portão', icon: '🚪', w: 1, h: 1, cost: { stone: 12, wood: 10, iron_bar: 2 }, chief: true, gate: true,
  desc: 'Fica na estrada, na linha da muralha (as laterais da passagem são fechadas com muralha). Cobra pedágio das caravanas e entrada dos forasteiros, revista cargas, fecha sozinho diante de inimigos e à noite (toque de recolher) e tem um porteiro que prende os procurados.' };
SHOP_KEEPER.vgate = 'gatekeeper';
if (People.PURSE) People.PURSE.gatekeeper = [120, 300];

const GATE_TOLLS = [0, 5, 10, 20, 40], GATE_FEES = [0, 2, 5];
const Gate = {
  R: 16, // raio da muralha das vilas (o anel do Towns.build)
  key(s) { return s.x + ',' + s.y; },
  peek(s) { const E = Urban.E(); return (E.gates || {})[this.key(s)] || null; },
  data(s) {
    const E = Urban.E(); E.gates = E.gates || {};
    return E.gates[this.key(s)] || (E.gates[this.key(s)] = { toll: 10, fee: 2, search: true, curfew: false, auto: true, manual: null, log: [], earned: 0, month: 0, cars: 0 });
  },
  list() { return World.structs.filter(s => s.type === 'vgate' && !s.removed && !s.hidden); },
  village(s) { return World.villages[s.village] || null; },
  mine(s) { const v = this.village(s); return !!v && v.lord === 'player'; },
  log(s, text) { const d = this.data(s); d.log.unshift({ day: G.day, text }); if (d.log.length > 14) d.log.length = 14; },
  ring(x, y, v) { return Math.max(Math.abs(x - v.x), Math.abs(y - v.y) * 1.25 | 0); },
  vertical(s, v) { return Math.abs(s.x - v.x) >= Math.abs(s.y - v.y) * 1.25; }, // a muralha corre de norte a sul (lado leste ou oeste)

  // ---------------------------------------------------------------- instalar
  placeErr(tx, ty) {
    if (!World.inb(tx, ty)) return 'Fora do mapa';
    const i = World.idx(tx, ty);
    if (World.tiles[i] !== T.ROAD) return 'O portão fica sobre a estrada, na passagem da muralha';
    if (World.blocker(i)) return 'Já há uma construção aqui';
    if (P.x + P.r > tx * TILE && P.x - P.r < (tx + 1) * TILE && P.y > ty * TILE && P.y - P.r < (ty + 1) * TILE) return 'Você está no caminho';
    const vi = Urban.villageNear(tx, ty, this.R + 3);
    const v = World.villages[vi];
    if (!v) return 'O portão fica na muralha de uma vila';
    if (v.lord !== 'player') return `Só o governador de ${v.name} pode instalar o portão`;
    const r = this.ring(tx, ty, v);
    if (r < this.R - 2 || r > this.R + 2) return `Ponha o portão na linha da muralha de ${v.name}, onde a estrada atravessa`;
    return null;
  },
  // fecha as laterais da passagem com trechos de muralha (até encontrar a muralha que já existe)
  fillWalls(s) {
    const v = this.village(s); if (!v) return 0;
    const vert = this.vertical(s, v); let n = 0;
    for (const dir of [-1, 1]) for (let k = 1; k <= 3; k++) {
      const x = vert ? s.x : s.x + dir * k, y = vert ? s.y + dir * k : s.y;
      if (!World.inb(x, y)) break;
      const i = World.idx(x, y), b = World.blocker(i);
      if (b) break; // chegou na muralha (ou numa construção)
      const t = World.tiles[i];
      if (t === T.ROAD || t === T.BRIDGE || !TINFO[t].walk || World.isWater(t)) break;
      World.obj[i] = 0; World.freeHidden(i);
      Urban.addCivic('vwall', x, y, s.village); n++;
    }
    return n;
  },

  // ---------------------------------------------------------------- aberto ou fechado
  closedNow(s, d) {
    if (d.manual === 'open') return false;
    if (d.manual === 'closed') return true;
    if (d.alarm > G.realTime) return true;
    if (d.curfew && Routine.phase() === 'night') return true;
    return false;
  },
  apply(s) {
    const d = this.peek(s); if (!d) { s.blocks = false; return; }
    const closed = this.closedNow(s, d), passing = (s.passUntil || 0) > G.realTime;
    s.gateClosed = closed; s.blocks = closed && !passing;
  },
  hostileNear(s) {
    const v = this.village(s), cx = (s.x + 0.5) * TILE, cy = (s.y + 0.5) * TILE;
    for (const e of G.ents) {
      if (e.dead || U.dist(e.x, e.y, cx, cy) > 9 * TILE) continue;
      if (e.kind === 'bandit' || (e.tag && e.tag.startsWith('raid')) || ['wolf', 'bear', 'croc', 'boar'].includes(e.kind)) return e;
      if (e.kind === 'guard' && v && e.civ !== undefined && e.civ >= 0 && e.civ !== v.civ && Diplo.atWar(e.civ, v.civ)) return e;
    }
    return null;
  },
  name(e) { return e.kind === 'bandit' ? 'bandidos' : ['wolf', 'bear', 'croc', 'boar'].includes(e.kind) ? 'feras' : 'soldados inimigos'; },
  // a cada meio segundo: alarme, caravanas passando, procurados no portão
  t: 0,
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    if (G.dungeon || G.place) return;
    for (const s of this.list()) {
      if (U.dist(s.x, s.y, P.x / TILE, P.y / TILE) > 45) continue;
      const d = this.peek(s); if (!d) { this.apply(s); continue; }
      if (d.auto) {
        const h = this.hostileNear(s);
        if (h) { if (!(d.alarm > G.realTime)) { this.log(s, `🔒 Fechado: ${this.name(h)} à vista.`); if (this.mine(s)) UI.msg(`🔒 O portão de ${this.village(s).name} foi fechado: ${this.name(h)} à vista!`, 'bad'); } d.alarm = G.realTime + 10; }
      }
      // caravana chegando: o porteiro abre
      if (G.ents.some(e => !e.dead && e.kind === 'caravan' && U.dist(e.x, e.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE) < 3.5 * TILE) && !(d.alarm > G.realTime)) s.passUntil = G.realTime + 2;
      // procurado passando pelo portão: o porteiro dá voz de prisão
      const v = this.village(s), k = Shops.keeper(s);
      if (v && k && U.dist(P.x, P.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE) < 1.8 * TILE && typeof Crime !== 'undefined' && Crime.wanted(v.civ) && !Crime.hunting(v.civ) && (Crime.askT || 0) < G.realTime) {
        Crime.askT = G.realTime + 40; this.log(s, `⚖️ O porteiro reconheceu ${G.name}, procurado no reino.`); UI.showArrest(v.civ);
      }
      this.apply(s);
    }
  },

  // ---------------------------------------------------------------- caravanas
  // a caravana atravessa o portão: paga o pedágio (se for alto demais, reclama ou dá meia-volta)
  caravanPass(c, s) {
    const d = this.data(s), v = this.village(s); if (!v) return;
    c.gates = c.gates || {}; if (c.gates[s.id]) return; c.gates[s.id] = 1;
    const mine = this.mine(s), tol = U.rint(10, 40) * (c.from === v.civ ? 1.4 : 1);
    if (d.toll > tol * 1.5) {
      this.log(s, `🐫↩️ Caravana de ${CIV_DEFS[c.from].short} deu meia-volta: pedágio de ${d.toll} 🪙 é caro demais.`);
      v.prosper = Math.max(0, v.prosper - 0.5); Game.addRelation(c.from, -2);
      c.done = true; for (const e of G.ents) if (e.carId === c.id || e.tag === 'carg' + c.id) e.dead = true;
      return;
    }
    let got = d.toll, line = `🐫 Caravana de ${CIV_DEFS[c.from].short} passou${d.toll ? ` e pagou ${d.toll} 🪙` : ''}.`;
    if (d.toll > tol) { line += ' (reclamou do preço)'; Game.addRelation(c.from, -1); }
    else v.prosper = Math.min(PROSPER_MAX, v.prosper + 0.25); // comércio que passa aquece a vila
    if (d.search && Shops.keeper(s) && Math.random() < 0.15) { const f = U.rint(40, 90); got += f; line += ` Na revista, contrabando apreendido: multa de ${f} 🪙.`; }
    d.cars++;
    if (mine && got) { P.gold += got; d.earned += got; d.month += got; }
    this.log(s, line);
  },

  // ---------------------------------------------------------------- todo mês
  monthTick() {
    for (const s of this.list()) {
      const d = this.peek(s), v = this.village(s); if (!d || !v) continue;
      const mine = this.mine(s), k = Shops.keeper(s);
      // forasteiros que entraram (e a taxa de entrada)
      const visitors = 3 + Math.round(People.residents(s.village).length / 5) + U.rint(0, 4);
      let got = 0;
      if (d.fee > 0) { got += visitors * d.fee; v.prosper = Math.max(0, v.prosper - d.fee * 0.15); }
      const parts = [`🚶 Entraram ${visitors} forasteiros${d.fee ? ` (${visitors * d.fee} 🪙 de entrada)` : ''} e ${d.cars} caravanas.`];
      // revista: ladrões barrados e contrabando de viajantes
      if (d.search && k && Math.random() < 0.3) { const f = U.rint(20, 50); got += f; parts.push(`🦹 O porteiro barrou um ladrão de fora (multa de ${f} 🪙).`); if (typeof Rumors !== 'undefined') Rumors.atV(s.village, `O porteiro de ${v.name} barrou um ladrão na entrada da vila.`); }
      // o salário do porteiro (pago pelo governador)
      if (mine && k) { const wage = Gate.WAGE || 5; got -= wage; parts.push(`🪖 Soldo d${k.sex === 'f' ? 'a porteira' : 'o porteiro'}: ${wage} 🪙.`); }
      if (mine) { P.gold = Math.max(0, P.gold + got); d.earned += Math.max(0, got); }
      for (const t of parts) this.log(s, t);
      d.lastMonth = d.month + got; d.month = 0; d.cars = 0;
    }
  },
  // com portão e porteiro, o saque e a tomada da vila nem sempre dão certo
  guarded(vi) { return this.list().some(s => s.village === vi && Shops.keeper(s) && (this.peek(s) || {}).auto !== false); },

  // ---------------------------------------------------------------- janela
  open(sid) {
    const s = World.structs[sid]; if (!s || s.removed) return;
    const d = this.data(s), v = this.village(s), mine = this.mine(s), k = Shops.keeper(s);
    const closed = this.closedNow(s, d);
    const why = d.manual === 'closed' ? 'fechado por ordem sua' : d.manual === 'open' ? 'aberto por ordem sua' : d.alarm > G.realTime ? 'fechado: inimigos à vista' : d.curfew && Routine.phase() === 'night' ? 'fechado: toque de recolher' : 'aberto';
    const opt = (k2, val, lab, cur) => `<button data-act="gate" data-s="${s.id}" data-k="${k2}" data-v="${val}" class="${cur ? 'primary' : ''}" ${mine ? '' : 'disabled'}>${lab}</button>`;
    const tog = (k2, lab, desc) => `<div class="card"><div class="sec">${lab} <small class="${d[k2] ? 'ok' : 'muted'}">${d[k2] ? 'ligado' : 'desligado'}</small></div><p class="dt-desc">${desc}</p>${mine ? `<div class="act-row">${opt(k2, d[k2] ? 0 : 1, d[k2] ? 'Desligar' : 'Ligar', false)}</div>` : ''}</div>`;
    UI.open(`🚪 Portão de ${v ? v.name : 'vila'}`, `
      <div class="card"><p class="dt-desc"><b>${closed ? '🔒' : '🔓'} ${why[0].toUpperCase() + why.slice(1)}</b> · ${k ? `${People.title(k)}: <b>${UI.esc(People.full(k))}</b>` : 'sem porteiro agora'} · rendeu ${d.earned} 🪙 no total${d.lastMonth !== undefined ? ` (${d.lastMonth} 🪙 no mês passado)` : ''}</p>
        <div class="act-row">${mine ? `${opt('manual', 'open', '🔓 Manter aberto', d.manual === 'open')}${opt('manual', 'closed', '🔒 Manter fechado', d.manual === 'closed')}${opt('manual', 'auto', '⚙️ Automático', !d.manual)}` : ''}
          ${k ? `<button data-act="tk" data-op="open" data-id="${k.id}">💬 Falar com ${UI.esc(k.name)}</button>` : ''}
          ${!mine && closed ? `<button data-act="gate" data-s="${s.id}" data-k="pass" data-v="1">🙋 Pedir passagem</button>` : ''}</div></div>
      <div class="kgrid two">
        <div class="card"><div class="sec">🐫 Pedágio das caravanas: ${d.toll} 🪙</div><p class="dt-desc">Cada caravana que atravessa paga. Caravana que passa aquece o comércio da vila; pedágio caro faz caravanas reclamarem (a relação cai) ou darem meia-volta.</p>
          <div class="act-row">${GATE_TOLLS.map(t => opt('toll', t, t + ' 🪙', d.toll === t)).join('')}</div></div>
        <div class="card"><div class="sec">🚶 Entrada dos forasteiros: ${d.fee} 🪙</div><p class="dt-desc">Cobrada de quem vem de fora, todo mês. Taxa alta afasta visitantes e esfria a vila.</p>
          <div class="act-row">${GATE_FEES.map(t => opt('fee', t, t + ' 🪙', d.fee === t)).join('')}</div></div>
        ${tog('search', '🔍 Revistar as cargas', 'O porteiro revista caravanas e viajantes: apreende contrabando (multa) e barra ladrões de fora.')}
        ${tog('auto', '🛡️ Fechar diante de inimigos', 'Bandidos, feras ou soldados inimigos por perto: o portão fecha e ninguém atravessa. Com o porteiro, a vila resiste melhor aos saques e às tentativas de tomada.')}
        ${tog('curfew', '🌙 Toque de recolher', 'O portão fica fechado à noite (as caravanas ainda passam com o porteiro).')}
      </div>
      <h3>📖 Livro do portão</h3>${d.log.length ? `<ul class="glog">${d.log.map(l => `<li><small class="muted">dia ${l.day}</small> ${UI.esc(l.text)}</li>`).join('')}</ul>` : '<p class="muted">Nada anotado ainda.</p>'}`, 'showGate', [sid], mine ? 'Pedágio, fiscalização e defesa' : 'Portão de outra vila');
  },
  act(dd) {
    const s = World.structs[+dd.s]; if (!s) return;
    const d = this.data(s), v = this.village(s);
    if (dd.k === 'pass') {
      if (typeof Crime !== 'undefined' && v && Crime.wanted(v.civ)) { this.log(s, `⚖️ ${G.name} pediu passagem e foi reconhecido: procurado.`); UI.showArrest(v.civ); return; }
      if (v && G.civs[v.civ] && G.civs[v.civ].atWar) { UI.msg('🚪 "Inimigos do reino não passam!"', 'bad'); return; }
      if (d.fee && P.gold < d.fee) { UI.msg(`🚪 A entrada custa ${d.fee} 🪙.`, 'bad'); return; }
      if (d.fee) P.gold -= d.fee;
      s.passUntil = G.realTime + 5; this.apply(s); this.log(s, `🚶 ${G.name} pediu passagem${d.fee ? ` e pagou ${d.fee} 🪙` : ''}.`);
      UI.close(); UI.msg('🚪 O porteiro abre o portão para você passar.'); return;
    }
    if (!this.mine(s)) return;
    if (dd.k === 'manual') d.manual = dd.v === 'auto' ? null : dd.v;
    else if (dd.k === 'toll' || dd.k === 'fee') d[dd.k] = +dd.v;
    else d[dd.k] = dd.v === '1';
    this.apply(s); this.open(s.id);
  },
};

// ------------------------------------------------------------------ desenho: portão de madeira com ferragens entre dois pilares
function drawVillageGate(ctx, s, X, Y, time) {
  const v = World.villages[s.village], vert = v ? Gate.vertical(s, v) : false, d = Gate.peek(s);
  const closed = s.gateClosed && !((s.passUntil || 0) > G.realTime);
  const stone = '#9a958c', dark = '#6f6a62', wood = '#7a4a22', iron = '#3a3a40';
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), w, h); };
  const col = v && G.civs[v.civ] ? Game.civColor(v.civ) : '#a83030';
  if (vert) {
    // muralha de norte a sul: uma torrezinha de entrada, com a passagem (leste–oeste) no meio
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X + 3, Y + 34, 26, 5);
    R(4, -22, 24, 16, stone); R(4, -22, 24, 3, dark); for (let k = 4; k < 28; k += 6) R(k, -27, 4, 5, stone);
    R(4, 28, 24, 10, stone); R(4, 28, 24, 2, dark); R(4, -6, 3, 34, dark); R(25, -6, 3, 34, dark);
    if (closed) { R(7, -6, 18, 34, wood); for (let y = -1; y < 28; y += 6) R(7, y, 18, 1, '#5a3418'); R(7, 2, 18, 2, iron); R(7, 18, 18, 2, iron); R(14, 9, 4, 4, '#c8a040'); }
    else { R(7, -6, 18, 34, 'rgba(25,18,10,0.45)'); R(7, -6, 3, 34, wood); R(22, -6, 3, 34, wood); R(7, 2, 3, 2, iron); R(22, 2, 3, 2, iron); }
    R(19, -38, 2, 12, '#5a3a1e'); R(21, -38, 9, 6, col);
  } else {
    // muralha de leste a oeste: pilares dos lados, arco com as folhas do portão
    R(-6, -14, 10, 44, stone); R(28, -14, 10, 44, stone); R(-6, -14, 10, 3, dark); R(28, -14, 10, 3, dark);
    for (const x of [-6, -1, 28, 33]) R(x, -19, 4, 5, stone);
    R(4, -10, 24, 6, stone); R(4, -10, 24, 2, dark);
    if (closed) { R(4, -4, 24, 34, wood); for (let x = 8; x < 28; x += 5) R(x, -4, 1, 34, '#5a3418'); R(4, 4, 24, 2, iron); R(4, 20, 24, 2, iron); R(15, 10, 2, 8, iron); R(13, 12, 6, 3, '#c8a040'); }
    else { R(4, -4, 4, 34, wood); R(24, -4, 4, 34, wood); R(4, 4, 4, 2, iron); R(24, 4, 4, 2, iron); }
    R(15, -26, 2, 16, '#5a3a1e'); R(17, -26, 9, 6, col);
  }
  // a torre de vigia fica no trecho de muro colado ao portão (à esquerda ou em cima); sem muro ali, vai junto do portão
  const side = vert ? Gate.towerWall(s, true) : Gate.towerWall(s, false);
  if (!side) drawGateTower(ctx, s, vert ? X : X - 2 * TILE, vert ? Y - 2 * TILE : Y, time);
}
// torre de vigia com o porteiro lá em cima (X, Y = canto do bloco da torre)
function drawGateTower(ctx, s, X, Y, time) {
  const v = World.villages[s.village], d = Gate.peek(s);
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), w, h); };
  const col = v && G.civs[v.civ] ? Game.civColor(v.civ) : '#a83030';
  const tx = 16, ty = 32, top = ty - 46, ts = '#b8b0a2', tdk = '#5a544c';
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(X + tx - 14, Y + ty - 2, 28, 6);
  R(tx - 13, top, 26, ty - top, tdk); R(tx - 12, top + 1, 24, ty - top - 1, ts);
  for (let k = top + 7; k < ty; k += 8) R(tx - 12, k, 24, 1, '#9a9284');
  for (let k = top + 11; k < ty; k += 16) R(tx - 4, k, 1, 8, '#9a9284');
  R(tx - 2, top + 12, 4, 8, '#2a2a3a'); R(tx - 4, ty - 14, 8, 14, '#3a2410'); // seteira e porta
  R(tx - 16, top - 4, 32, 5, '#7a4a22'); R(tx - 16, top - 4, 32, 1, '#a8743e');
  for (let k = tx - 16; k <= tx + 14; k += 5) R(k, top - 12, 2, 8, '#6b4423'); R(tx - 16, top - 13, 32, 2, '#8b5f38');
  R(tx + 12, top - 34, 2, 30, '#5a3a1e'); R(tx + 14, top - 34, 9, 6, col);
  const k = typeof Work === 'undefined' || ((s._kpT || 0) > G.realTime - 2 && s._kp === undefined) ? null : Work.keeperFast(s);
  if (k) {
    const lk = People.look(k), dir = d && d.alarm > G.realTime ? (P.x < X + G.cam.x ? -1 : 1) : (Math.sin(time * 0.4 + s.id) > 0 ? 1 : -1);
    drawHuman(ctx, X + tx, Y + top - 4, Object.assign(lk, { dir, scale: 0.85, helmet: lk.helmet || '#9aa0a8', weapon: lk.weapon || '#cfd6dd', wlen: lk.wlen || 16 }));
  }
  if (d && d.alarm > G.realTime && Math.sin(time * 10) > 0) { ctx.fillStyle = 'rgba(255,60,40,0.85)'; ctx.font = '12px sans-serif'; ctx.fillText('⚠️', X + tx - 6, Y + top - 40); }
}

{
  // instalar: sobre a estrada, na linha da muralha (só o governador)
  const pe0 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) { if (def && def.gate && !s) return Gate.placeErr(tx, ty); return pe0(def, tx, ty, s, civic); };
  const ac0 = Urban.addCivic.bind(Urban);
  Urban.addCivic = function (type, tx, ty, vi, quiet) {
    const r = ac0(type, tx, ty, vi, quiet);
    if (type === 'vgate' && !quiet) {
      const s = World.structs[World.sgrid[World.idx(tx, ty)]];
      if (s) { Gate.data(s); const n = Gate.fillWalls(s); Gate.log(s, '🚪 Portão instalado.'); if (n) UI.msg(`🧱 ${n} trecho${n > 1 ? 's' : ''} de muralha fecha${n > 1 ? 'm' : ''} as laterais da passagem.`); }
    }
    return r;
  };
  // mudar de lugar leva as regras e o livro do portão
  const rl0 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) {
    const old = s.type === 'vgate' ? Gate.key(s) : null;
    const r = rl0(s, nx, ny, quiet);
    if (old) { const E = Urban.E(); if (E.gates && E.gates[old]) { E.gates[Gate.key(s)] = E.gates[old]; delete E.gates[old]; } }
    return r;
  };
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) {
    if (s.type === 'vgate') { drawVillageGate(ctx, s, X, Y, time); return; }
    const r = ds0(ctx, s, X, Y, time);
    if (Gate.wallPiece(s) && !s.hidden && !s.removed) { const g = Gate.towerGate(s); if (g) drawGateTower(ctx, g, X, Y, time); }
    return r;
  };
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s.type === 'vgate') return `Portão — ${Gate.mine(s) ? 'pedágio, fiscalização e defesa' : (s.gateClosed ? 'pedir passagem' : 'ver o portão')}`; return il0(s); };
  const ci0 = Content2.interact.bind(Content2);
  Content2.interact = function (s) { if (s && s.type === 'vgate') { Gate.open(s.id); return true; } return ci0(s); };
  UI.showGate = function (sid) { Gate.open(sid); };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'gate') { Gate.act(d); return; } return act0(a, d); };
  // o porteiro fica no portão (não entra em lugar nenhum)
  const st0 = Routine.staysIn.bind(Routine);
  Routine.staysIn = function (e, s, ph) { if (s && s.type === 'vgate') return e.npc.shop === s.okey; return st0(e, s, ph); }; // o porteiro fica na torre
  // a cada quadro (o War.update roda sempre)
  const wu0 = War.update.bind(War);
  War.update = function (dt) { Gate.update(dt); return wu0(dt); };
  // caravanas que atravessam o portão
  const cu0 = Caravans.update.bind(Caravans);
  Caravans.update = function (dt) {
    const before = new Map(Caravans.list().map(c => [c, Math.floor(c.pos)]));
    cu0(dt);
    const gates = Gate.list(); if (!gates.length) return;
    for (const c of Caravans.list()) {
      if (c.done || c.owner === 'player') continue;
      const a = before.has(c) ? before.get(c) : Math.floor(c.pos), b = Math.min(c.path.length - 1, Math.floor(c.pos));
      for (let k = Math.max(0, a); k <= b; k++) { const sid = World.sgrid[c.path[k]]; if (sid >= 0 && World.structs[sid].type === 'vgate' && !World.structs[sid].removed) Gate.caravanPass(c, World.structs[sid]); if (c.done) break; }
    }
  };
  // todo mês: entradas, revistas e salário; e a defesa nos saques
  const td0 = Towns.dayTick.bind(Towns);
  Towns.dayTick = function (...a) {
    const ruin = World.villages.map(v => v.ruin);
    const r = td0(...a);
    World.villages.forEach((v, vi) => {
      if (v.ruin > ruin[vi] && Gate.guarded(vi) && Math.random() < 0.5) {
        v.ruin = ruin[vi];
        const s = Gate.list().find(x => x.village === vi); if (s) Gate.log(s, `🛡️ O portão fechado segurou o saque de ${v.raid ? Diplo.name(v.raid.by) : 'inimigos'}.`);
        if (v.lord === 'player') UI.msg(`🛡️ O portão de ${v.name} segurou o ataque!`, 'gold');
      }
    });
    Gate.monthTick();
    return r;
  };
  const cv0 = Diplo.captureVillage.bind(Diplo);
  Diplo.captureVillage = function (v, winner, quiet) {
    const vi = World.villages.indexOf(v);
    if (!quiet && Gate.guarded(vi) && Math.random() < 0.4) {
      const s = Gate.list().find(x => x.village === vi); if (s) Gate.log(s, `🛡️ ${Diplo.name(winner)} tentou tomar a vila, mas a muralha e o portão resistiram.`);
      if (v.lord === 'player') UI.msg(`🛡️ ${Diplo.name(winner)} tentou tomar ${v.name}, mas o portão resistiu!`, 'gold', true);
      return;
    }
    return cv0(v, winner, quiet);
  };
}

// ------------------------------------------------------------------ muros em qualquer direção e quantos o governador quiser
// O portão se ajusta à muralha em que está: muro à esquerda e à direita → muralha horizontal; muro em cima e embaixo →
// muralha vertical. Serve para qualquer muro (a muralha da vila, trechos novos do governador, o seu muro de pedra ou madeira).
// O governador ergue muralha em qualquer lugar da vila (e um pouco além dela), clicando e arrastando como nas estradas.
const GATE_REACH = VILLAGE_R + 10; // até onde a vila pode ter muralha e portão (a partir do centro)
Object.assign(Gate, {
  isWall(x, y) { return World.wallAt(x, y); },
  // eixo da muralha numa passagem: 'h' (muros à esquerda/direita), 'v' (em cima/embaixo) ou null
  axis(x, y) {
    const near = (dx, dy) => { for (let k = 1; k <= 4; k++) { const nx = x + dx * k, ny = y + dy * k; if (!World.inb(nx, ny)) return 0; if (this.isWall(nx, ny)) return k; const t = World.tile(nx, ny); if (!TINFO[t].walk || World.isWater(t)) return 0; } return 0; };
    const l = near(-1, 0), r = near(1, 0), u = near(0, -1), d = near(0, 1);
    const h = (l ? 1 : 0) + (r ? 1 : 0), v = (u ? 1 : 0) + (d ? 1 : 0);
    if (!h && !v) return null;
    return h > v ? 'h' : v > h ? 'v' : (Math.min(l || 9, r || 9) <= Math.min(u || 9, d || 9) ? 'h' : 'v');
  },
  vertical(s) { if (!s._axis) s._axis = this.axis(s.x, s.y) || 'h'; return s._axis === 'v'; },
  placeErr(tx, ty) {
    if (!World.inb(tx, ty)) return 'Fora do mapa';
    const i = World.idx(tx, ty);
    // vale estrada ou chão firme; em cima de um trecho de muro, o portão toma o lugar dele (abre uma passagem)
    const t = World.tiles[i], b = World.blocker(i);
    if (t === T.BRIDGE || !TINFO[t].walk || World.isWater(t)) return 'Terreno inválido';
    if (b && !this.wallPiece(b)) return 'Já há uma construção aqui';
    if (!b && World.obj[i]) return 'Remova árvores/rochas primeiro';
    if (P.x + P.r > tx * TILE && P.x - P.r < (tx + 1) * TILE && P.y > ty * TILE && P.y - P.r < (ty + 1) * TILE) return 'Você está no caminho';
    const v = World.villages[Urban.villageNear(tx, ty, GATE_REACH)];
    if (!v) return 'O portão fica na muralha de uma vila';
    if (v.lord !== 'player') return `Só o governador de ${v.name} pode instalar o portão`;
    if (!this.axis(tx, ty)) return 'Ponha o portão na linha de um muro (com muro dos lados, a até 4 blocos) ou em cima de um trecho dele';
    return null;
  },
  // muro onde fica a torre do portão: um bloco de muro entre os dois — à esquerda (muralha horizontal) ou em cima (vertical)
  towerWall(g, vert) { const b = World.blocker(World.idx(vert ? g.x : g.x - 2, vert ? g.y - 2 : g.y)); return this.wallPiece(b) ? b : null; },
  towerGate(w) {
    for (const [dx, dy, v] of [[2, 0, false], [0, 2, true]]) { const g = World.blocker(World.idx(w.x + dx, w.y + dy)); if (g && g.type === 'vgate' && this.vertical(g) === v) return g; }
    return null;
  },
  wallPiece(s) { return !!s && ['vwall', 'wall_stone', 'wall_wood'].includes(s.type); },
  // o trecho de muro que dá lugar ao portão sai (e fica anotado no jogo salvo)
  clearFor(tx, ty) {
    const b = World.blocker(World.idx(tx, ty)); if (!this.wallPiece(b)) return;
    if (b.owner !== 'player') Urban.record('remove', b, b.x, b.y);
    World.removeStruct(b);
  },
  fillWalls(s) {
    const vert = this.vertical(s); let n = 0;
    for (const dir of [-1, 1]) for (let k = 1; k <= 4; k++) {
      const x = vert ? s.x : s.x + dir * k, y = vert ? s.y + dir * k : s.y;
      if (!World.inb(x, y)) break;
      const i = World.idx(x, y);
      if (World.blocker(i)) break;
      const t = World.tiles[i];
      if (t === T.ROAD || t === T.BRIDGE || !TINFO[t].walk || World.isWater(t)) break;
      World.obj[i] = 0; World.freeHidden(i);
      Urban.addCivic('vwall', x, y, s.village); n++;
    }
    return n;
  },
  // erguer um trecho de muralha (clique ou arrasto)
  wallErr(tx, ty) {
    if (!World.inb(tx, ty)) return 'Fora do mapa';
    const i = World.idx(tx, ty), t = World.tiles[i];
    if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE || World.isWater(t)) return 'Terreno inválido';
    if (t === T.ROAD) return 'Não construa sobre a estrada (na estrada vai o portão)';
    if (World.obj[i]) return 'Remova árvores/rochas primeiro';
    if (World.blocker(i)) return 'Já há uma construção aqui';
    if (P.x + P.r > tx * TILE && P.x - P.r < (tx + 1) * TILE && P.y > ty * TILE && P.y - P.r < (ty + 1) * TILE) return 'Você está no caminho';
    const v = World.villages[Urban.villageNear(tx, ty, GATE_REACH)];
    if (!v) return 'A muralha fica numa vila sua (ou logo em volta dela)';
    if (v.lord !== 'player') return `Só o governador de ${v.name} pode erguer a muralha`;
    return null;
  },
  buildWall(tx, ty, quiet) {
    const err = this.wallErr(tx, ty);
    if (err) { if (!quiet) Urban.warn(err); return false; }
    if (!Inv.has(CIVIC.vwall.cost)) { Urban.warn('Faltam materiais: 1 Pedra por trecho'); return false; }
    Inv.pay(CIVIC.vwall.cost);
    Urban.addCivic('vwall', tx, ty, Urban.villageNear(tx, ty, GATE_REACH)); // anota no jogo salvo e libera lugares reservados
    World.touchArea(tx - 1, ty - 1, 3, 3);
    Game.burst((tx + 0.5) * TILE, (ty + 0.6) * TILE, '#9a958c', 4);
    return true;
  },
});
{
  CIVIC.vwall.desc = 'Trecho de muralha de pedra (1 pedra). Só o governador ergue a muralha da vila: em qualquer lugar dela e logo em volta, quantos trechos quiser — clique e arraste. Ela se emenda nos outros muros.';
  // a regra da muralha (e do portão) vale até GATE_REACH, e só para o governador
  const pe1 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) { if (def && def.chief && !def.gate && !s) return Gate.wallErr(tx, ty); return pe1(def, tx, ty, s, civic); };
  // clicar e arrastar ergue a muralha bloco a bloco
  const ck0 = Urban.click.bind(Urban);
  Urban.click = function () {
    if (this.mode === 'c:vwall') { this.drag = true; this.last = null; const t = this.mouseTile(); Gate.buildWall(t.x, t.y, false); this.last = t; return; }
    if (this.mode === 'c:vgate') {
      const t = this.mouseTile(), err = Gate.placeErr(t.x, t.y), d = CIVIC.vgate;
      if (err) { this.warn(err); return; }
      if (!Inv.has(d.cost)) { this.warn('Faltam materiais para o Portão.'); return; }
      Inv.pay(d.cost);
      const vi = this.villageNear(t.x, t.y, GATE_REACH);
      Gate.clearFor(t.x, t.y);
      this.addCivic('vgate', t.x, t.y, vi);
      Game.burst((t.x + 0.5) * TILE, (t.y + 0.5) * TILE, '#c9a978', 14); Sound.play('build');
      UI.msg(`🚪 Portão instalado em ${World.villages[vi].name}. Clique nele para o pedágio, a revista e a defesa.`, 'gold');
      Progress.add('built'); this.stop(); return;
    }
    return ck0();
  };
  const up0 = Urban.update.bind(Urban);
  Urban.update = function () {
    if (this.mode === 'c:vwall' && this.drag) {
      const t = this.mouseTile(), from = this.last || t;
      if (this.last && t.x === this.last.x && t.y === this.last.y) return;
      const n = Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y));
      for (let k = 1; k <= n; k++) { const x = Math.round(from.x + (t.x - from.x) * k / n), y = Math.round(from.y + (t.y - from.y) * k / n); if (!Gate.buildWall(x, y, true) && !Inv.has(CIVIC.vwall.cost)) break; }
      this.last = t; return;
    }
    return up0();
  };
  const pr0 = Urban.prompt.bind(Urban);
  Urban.prompt = function () { if (this.mode === 'c:vwall') return '🧱 <b>Muralha</b> — clique e arraste · 1 pedra por trecho · só o governador da vila · botão direito/Esc encerra'; return pr0(); };
}

// ------------------------------------------------------------------ demolir e mudar de lugar qualquer muralha sua
// O governador demole e muda de lugar as muralhas e os portões da vila dele, dentro e fora dela; os seus muros de pedra e de
// madeira valem em qualquer lugar. No modo Demolir, um clique num trecho de muro derruba na hora e arrastar derruba vários.
{
  const chiefOf = s => { const v = World.villages[s.village]; return !!v && v.lord === 'player'; };
  const mv0 = Urban.movable.bind(Urban);
  Urban.movable = function (s) { if (s && (s.type === 'vwall' || s.type === 'vgate') && chiefOf(s)) return null; return mv0(s); };
  const pe2 = Urban.placeErr.bind(Urban);
  Urban.placeErr = function (def, tx, ty, s, civic) {
    if (s && s.type === 'vwall' && chiefOf(s)) { const b = World.blocker(World.idx(tx, ty)); if (b && b !== s) return 'Já há uma construção aqui'; return b === s ? null : Gate.wallErr(tx, ty); }
    if (s && s.type === 'vgate' && chiefOf(s)) { const b = World.blocker(World.idx(tx, ty)); if (b && b !== s) return 'Já há uma construção aqui'; return Gate.placeErr(tx, ty); }
    return pe2(def, tx, ty, s, civic);
  };
  const rl1 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) { const r = rl1(s, nx, ny, quiet); if (s.type === 'vgate') { delete s._axis; Gate.apply(s); } return r; };
  // demolir muros: na hora e arrastando
  const knock = s => { if (!Gate.wallPiece(s) || Urban.movable(s)) return false; Urban.doDemolish(s); return true; };
  const ck1 = Urban.click.bind(Urban);
  Urban.click = function () {
    if (this.mode === 'u:demolish') { const t = this.mouseTile(), s = this.structAt(t.x, t.y); if (Gate.wallPiece(s) && !this.movable(s)) { knock(s); this.drag = true; this.last = t; return; } }
    return ck1();
  };
  const up1 = Urban.update.bind(Urban);
  Urban.update = function () {
    if (this.mode === 'u:demolish' && this.drag) {
      const t = this.mouseTile(), from = this.last || t;
      if (!this.last || t.x !== this.last.x || t.y !== this.last.y) {
        const n = Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y));
        for (let k = 1; k <= n; k++) { const x = Math.round(from.x + (t.x - from.x) * k / n), y = Math.round(from.y + (t.y - from.y) * k / n); knock(this.structAt(x, y)); }
        this.last = t;
      }
      return;
    }
    return up1();
  };
  const pr1 = Urban.prompt.bind(Urban);
  Urban.prompt = function () { if (this.mode === 'u:demolish') return '💥 <b>Demolir</b> — clique numa construção · muros: clique ou arraste para derrubar na hora · botão direito/Esc encerra'; return pr1(); };
}

// ------------------------------------------------------------------ o porteiro é um soldado contratado pelo governador
// Ninguém assume o portão sozinho: o governador escolhe um morador e o contrata como soldado porteiro (alistamento de
// 40 🪙 e soldo de 8 🪙 por mês). Ele recebe elmo, cota de malha e espada. Sem porteiro, o portão não revista, não
// prende procurados e não segura os saques.
{
  Shops.noAuto = new Set(['vgate']);
  RANKS.gatekeeper.m = 'Soldado Porteiro'; RANKS.gatekeeper.f = 'Soldada Porteira';
  const HIRE = 40, WAGE = 8;
  Gate.HIRE = HIRE; Gate.WAGE = WAGE;
  const op0 = People.openVacancies.bind(People);
  People.openVacancies = function () { return op0().filter(o => !(World.structs[o.sid] && World.structs[o.sid].type === 'vgate')); };
  Gate.candidates = function (s) {
    return People.residents(s.village).filter(p => People.commoner(p) && !p.shop && !p.job && !p.capanga && p.age >= 18 && p.age <= 50)
      .sort((a, b) => (b.str || 0) - (a.str || 0) || b.aff - a.aff).slice(0, 5);
  };
  Gate.hire = function (s, p) {
    if (!this.mine(s) || Shops.keeper(s) || !p || !People.commoner(p)) return;
    if (P.gold < HIRE) { UI.msg(`O alistamento custa ${HIRE} 🪙.`, 'bad'); return; }
    P.gold -= HIRE; p.rank = 'gatekeeper'; p.shop = s.okey; p.met = true;
    p.equip = Object.assign({}, p.equip || {}, ITEMS.iron_helm ? { head: 'iron_helm' } : {}, ITEMS.chainmail ? { torso: 'chainmail' } : {}, ITEMS.iron_sword ? { weapon: 'iron_sword' } : {});
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
    this.log(s, `🪖 ${People.full(p)} foi contratad${p.sex === 'f' ? 'a' : 'o'} como ${RANKS.gatekeeper[p.sex].toLowerCase()} (${HIRE} 🪙 de alistamento, ${WAGE} 🪙 por mês).`);
    UI.msg(`🪖 ${People.full(p)} agora guarda o portão de ${this.village(s).name}.`, 'gold'); Sound.play('coin');
  };
  Gate.fire = function (s) {
    const k = Shops.keeper(s); if (!k || !this.mine(s)) return;
    k.shop = null; k.rank = 'peasant'; k.equip = Object.assign({}, k.equip || {}, { head: null, torso: null, weapon: null });
    const e = G.spawned.get(k.id); if (e) { e.dead = true; G.spawned.delete(k.id); }
    People.addAff(k, -5);
    this.log(s, `${People.full(k)} foi dispensad${k.sex === 'f' ? 'a' : 'o'} do portão.`);
  };
  // a janela do portão: contratar ou dispensar o porteiro
  const open0 = Gate.open.bind(Gate);
  Gate.open = function (sid) {
    open0(sid);
    const s = World.structs[sid], pb = UI.panel && UI.panel.querySelector('.pb'); if (!s || !pb || !this.mine(s)) return;
    const k = Shops.keeper(s), div = document.createElement('div'); div.className = 'card'; div.style.marginTop = '10px';
    if (k) div.innerHTML = `<div class="sec">🪖 ${People.title(k)}: ${UI.esc(People.full(k))}</div><p class="dt-desc">Soldo de ${WAGE} 🪙 por mês, pago por você. Fica de guarda no portão, abre para quem pede passagem, revista as cargas e prende os procurados.</p><div class="act-row"><button data-act="gate" data-s="${s.id}" data-k="fire" data-v="1">Dispensar</button></div>`;
    else {
      const c = this.candidates(s);
      div.innerHTML = `<div class="sec">🪖 Contratar um soldado porteiro</div><p class="dt-desc">Sem porteiro, o portão não revista, não prende procurados e não segura os saques. Alistamento de ${HIRE} 🪙 e soldo de ${WAGE} 🪙 por mês; o contratado recebe elmo, cota de malha e espada.</p>
        ${c.length ? `<div class="act-row">${c.map(p => `<button data-act="gate" data-s="${s.id}" data-k="hire" data-v="${p.id}" ${P.gold >= HIRE ? '' : 'disabled'}>${UI.esc(People.full(p))} · ${p.age} anos${p.str ? ` · força ${p.str}` : ''}</button>`).join('')}</div>` : '<p class="muted">Ninguém disponível na vila agora (só camponeses adultos, sem emprego).</p>'}`;
    }
    pb.insertBefore(div, pb.children[1] || null);
  };
  const act1 = Gate.act.bind(Gate);
  Gate.act = function (dd) {
    const s = World.structs[+dd.s]; if (!s) return;
    if (dd.k === 'hire') { this.hire(s, G.people[+dd.v]); this.open(s.id); return; }
    if (dd.k === 'fire') { this.fire(s); this.open(s.id); return; }
    return act1(dd);
  };
}
