'use strict';
// Justiça, prisões e bandidos com quem se conversa.
//  • Bandidos: os dos acampamentos (calmos) aceitam conversa. Dá para ficar amigo, encomendar um assalto a uma família
//    (o bando ataca no mês seguinte; se pegarem o bandido, ele pode contar quem pagou), chamar um deles para o seu lado
//    (vira capanga) ou tirá-lo da vida do crime com dinheiro e amizade (volta a morar numa vila).
//  • Prisões: cada prisão tem 4 celas de 4 presos. Os reis prendem gente de verdade (ladrões, bandidos pegos, quem deve,
//    quem arruma briga) e soltam quando a pena acaba. Quando lota, o rei da IA solta alguém ou condena à morte (um rei de
//    mão pesada condena; um clemente solta).
//  • Você, rei: na conversa, manda prender ou condena à morte qualquer um do seu reino, e declara procurado qualquer um do
//    jogo. Se um procurado pisar no seu reino, os guardas o pegam e ele vai para a sua prisão; você decide (Reinado →
//    ⛓️ Prisão e justiça) se ele continua preso, se sai ou se morre. Com a prisão lotada, é preciso soltar ou condenar
//    alguém antes de prender outro (quem os guardas pegarem espera na fila).
// Estado em G.urban.justice = { jail: { reino: [{ pid, since, until, why, wait }] }, wanted: { pid: [reinos] }, heists: [] }.
const JAIL_CELLS = 4, JAIL_PER_CELL = 4, JAIL_CAP = JAIL_CELLS * JAIL_PER_CELL;

const Justice = {
  S() { const u = G.urban || (G.urban = {}); const J = u.justice || (u.justice = { jail: {}, wanted: {}, heists: [], queue: {} }); J.queue = J.queue || {}; return J; },
  jail(ci) { const S = this.S(); return S.jail[ci] || (S.jail[ci] = []); },
  full(ci) { return this.jail(ci).length >= JAIL_CAP; },
  // o reino de uma pessoa (onde ela mora)
  civOf(p) {
    if (!p || !p.home) return -1;
    if (p.home.type === 'village') { const v = World.villages[p.home.idx]; return v && !v.free ? v.civ : -1; }
    if (p.home.type === 'castle') return p.home.civ;
    return p.civ >= 0 ? p.civ : -1;
  },
  mine(ci) { return ci >= 0 && G.civs[ci] && G.civs[ci].ruler === 'player'; },
  myRealm() { return G.civs.filter(c => c.ruler === 'player').map(c => c.id); },
  // pode ser preso/condenado por você?
  subject(p) { const ci = this.civOf(p); return this.mine(ci) ? ci : -1; },
  jailedIn(p) { for (const [ci, L] of Object.entries(this.S().jail)) if (L.some(x => x.pid === p.id)) return +ci; return -1; },
  // ---------------------------------------------------------------- prender, soltar, condenar
  arrest(p, ci, why, months, quiet) {
    if (!p || !p.alive || !G.civs[ci]) return false;
    if (this.jailedIn(p) >= 0) return true;
    if (this.full(ci)) {
      if (this.mine(ci)) { const Q = this.S().queue[ci] || (this.S().queue[ci] = []); if (!Q.some(x => x.pid === p.id)) Q.push({ pid: p.id, why, day: G.day }); if (!quiet) UI.msg(`⛓️ A prisão de ${CIV_DEFS[ci].short} está lotada: ${People.full(p)} espera na fila. Solte alguém ou condene à morte (Reinado → Prisão e justiça).`, 'bad', true); return false; }
      this.npcMakeRoom(ci); if (this.full(ci)) return false;
    }
    const until = months ? G.day + months : 0;
    this.jail(ci).push({ pid: p.id, since: G.day, until, why: why || 'ordem do rei' });
    p.jail = until || G.day + 9999;
    if (p.capanga) { p.capanga = false; }
    if (p.band) { const B = typeof Bands !== 'undefined' ? Bands.S().bands[p.band] : null; if (B) Bands.S().bands[p.band] = B.filter(id => id !== p.id); }
    const e = G.spawned.get(p.id); if (e && !e.dead && !e.placeNpc) { e.dead = true; G.spawned.delete(p.id); }
    if (p.home && p.home.type === 'village') Rumors.atV(p.home.idx, `${People.full(p)} foi levad${p.sex === 'f' ? 'a' : 'o'} para a prisão de ${CIV_DEFS[ci].short} (${why || 'ordem do rei'}).`);
    return true;
  },
  release(p, ci, quiet) {
    const L = this.jail(ci), i = L.findIndex(x => x.pid === p.id); if (i < 0) return;
    L.splice(i, 1); p.jail = 0; if (p.band && typeof Bands !== 'undefined') { p.band = null; p.rank = p.rank === 'bandit' ? 'peasant' : p.rank; this.home(p); }
    if (!quiet) UI.msg(`🔓 ${People.full(p)} saiu da prisão de ${CIV_DEFS[ci].short}.`, 'gold');
    this.fillQueue(ci);
  },
  execute(p, ci, byPlayer) {
    const j = this.jailedIn(p); if (j >= 0) { const L = this.jail(j), i = L.findIndex(x => x.pid === p.id); if (i >= 0) L.splice(i, 1); }
    const e = G.spawned.get(p.id); if (e && !e.dead) { e.dead = true; G.spawned.delete(p.id); }
    People.die(p, byPlayer ? 'executado por sua ordem' : `executado por ordem do rei de ${CIV_DEFS[ci].short}`);
    if (byPlayer) {
      const f = Families.of(p); if (f) for (const m of Families.members(f)) if (m !== p && m.alive) m.aff = Math.max(-100, (m.aff || 0) - 50);
      if (G.civs[ci]) G.civs[ci].happy = Math.max(0, (G.civs[ci].happy || 0) - 2);
      UI.msg(`☠️ ${People.full(p)} foi executad${p.sex === 'f' ? 'a' : 'o'} por sua ordem. A família não vai esquecer.`, 'bad', true);
      Diplo.chronicle(`☠️ ${People.full(p)} foi executad${p.sex === 'f' ? 'a' : 'o'} por ordem de ${G.name}, em ${CIV_DEFS[ci].short}.`, true);
    } else Diplo.chronicle(`☠️ ${People.full(p)} foi executad${p.sex === 'f' ? 'a' : 'o'} por ordem do rei de ${CIV_DEFS[ci].short}.`);
    this.fillQueue(ci);
  },
  // quem esperava na fila entra quando abre vaga
  fillQueue(ci) { const Q = this.S().queue[ci]; while (Q && Q.length && !this.full(ci)) { const x = Q.shift(), p = G.people[x.pid]; if (p && p.alive) this.arrest(p, ci, x.why, 0, true); } },
  // a vila para onde volta quem sai do bando
  home(p) {
    let vi = p.bandFrom !== undefined && World.villages[p.bandFrom] && !World.villages[p.bandFrom].ruin ? p.bandFrom : -1;
    if (vi < 0) { let bd = 1e9; World.villages.forEach((v, i) => { if (!v || v.ruin) return; const d = U.dist(v.x, v.y, P.x / TILE, P.y / TILE); if (d < bd) { bd = d; vi = i; } }); }
    if (vi >= 0) { p.home = { type: 'village', idx: vi }; p.civ = World.villages[vi].free ? -1 : World.villages[vi].civ; }
    p.hostile = false; p.band = null; if (p.rank === 'bandit') p.rank = 'peasant';
  },
  // o rei da IA abre vaga: o de mão pesada condena o pior; o clemente solta quem está há mais tempo
  npcMakeRoom(ci) {
    const L = this.jail(ci); if (!L.length) return;
    const k = G.civs[ci] && G.civs[ci].rulerId != null ? G.people[G.civs[ci].rulerId] : null, harsh = (k && typeof PRISON_HARSH !== 'undefined' && PRISON_HARSH[k.trait]) || 1;
    const x = L.slice().sort((a, b) => a.since - b.since)[0], p = G.people[x.pid];
    if (!p) { L.splice(L.indexOf(x), 1); return; }
    if (harsh > 1.15 || /bando|assalto|roubo/.test(x.why || '') && Math.random() < 0.4) this.execute(p, ci, false); else this.release(p, ci, true);
  },
  // ---------------------------------------------------------------- procurados
  wanted(p) { return this.S().wanted[p.id] || []; },
  declare(p, ci) {
    if (!this.mine(ci)) return;
    const W = this.S().wanted, L = W[p.id] || (W[p.id] = []); if (!L.includes(ci)) L.push(ci);
    UI.msg(`📜 ${People.full(p)} agora é procurad${p.sex === 'f' ? 'a' : 'o'} em ${CIV_DEFS[ci].short}. Se pisar no seu reino, os guardas pegam.`, 'gold');
    if (p.home && p.home.type === 'village') Rumors.atV(p.home.idx, `O rei de ${CIV_DEFS[ci].short} pôs a cabeça de ${People.full(p)} a prêmio.`);
  },
  undeclare(pid, ci) { const W = this.S().wanted; if (!W[pid]) return; W[pid] = W[pid].filter(x => x !== ci); if (!W[pid].length) delete W[pid]; },
  // onde a pessoa está este mês (a vila onde mora, a vila para onde viajou ou o acampamento do bando)
  whereCiv(p) {
    if (p.trip && World.villages[p.trip.vi] && !World.villages[p.trip.vi].free) return World.villages[p.trip.vi].civ;
    if (p.band && p.band.startsWith('camp') && World.camps[+p.band.slice(4)]) { const c = World.camps[+p.band.slice(4)]; return World.terr[World.idx(c.x, c.y)]; }
    return this.civOf(p);
  },
  // ---------------------------------------------------------------- assaltos encomendados
  heistCost(f) { return Math.round(60 + Math.min(600, (f.wealth || 0) * 0.06)); },
  heist(p, fid) {
    const f = Families.get(fid); if (!f || !p || !p.band) return;
    const cost = this.heistCost(f);
    if ((p.aff || 0) < 10) { UI.msg(`${People.full(p)}: "Não faço serviço para quem não conheço."`, 'bad'); return; }
    if (P.gold < cost) { UI.msg(`O serviço custa ${cost} 🪙.`, 'bad'); return; }
    P.gold -= cost; Sound.play('coin');
    this.S().heists.push({ pid: p.id, fid, day: G.day, band: p.band });
    UI.msg(`🗡️ ${People.full(p)} pegou as moedas: "No mês que vem a ${Families.name(f)} vai sentir falta de umas coisas."`, 'gold', true);
  },
  heistTick() {
    const S = this.S(), left = [];
    for (const h of S.heists) {
      if (h.day >= G.day) { left.push(h); continue; }
      const f = Families.get(h.fid), p = G.people[h.pid]; if (!f) continue;
      const n = typeof Bands !== 'undefined' ? Bands.members(h.band).length : 3, ok = Math.random() < 0.45 + Math.min(0.35, n * 0.07);
      if (ok) {
        const loss = Math.round((f.wealth || 0) * U.rnd(0.2, 0.35)); f.wealth = Math.max(0, (f.wealth || 0) - loss); if (p) p.purse = People.purse(p) + Math.round(loss * 0.3);
        UI.msg(`🗡️ O bando de ${p ? People.full(p) : 'bandidos'} assaltou a ${Families.name(f)}: levou ${loss.toLocaleString('pt-BR')} 🪙.`, 'gold', true);
        if (typeof f.seat === 'number') Rumors.atV(f.seat, `Bandidos assaltaram a ${Families.name(f)} e levaram ${loss} 🪙!`);
      } else UI.msg(`🗡️ O assalto à ${Families.name(f)} deu errado: os guardas espantaram o bando.`, 'bad');
      // pegaram o bandido? ele pode contar quem pagou
      if (p && p.alive && Math.random() < (ok ? 0.2 : 0.5)) {
        const ci = f.civ >= 0 ? f.civ : this.civOf(p);
        if (ci >= 0) { this.arrest(p, ci, 'assalto à ' + Families.name(f), 6, true); UI.msg(`⛓️ ${People.full(p)} foi pego pelos guardas de ${CIV_DEFS[ci].short}.`, 'bad'); }
        if (Math.random() < 0.4 && ci >= 0) { Crime.commit(ci, `encomendar um assalto à ${Families.name(f)}`, 200, null, null, true); for (const m of Families.members(f)) m.aff = Math.max(-100, (m.aff || 0) - 30); }
      }
    }
    S.heists = left;
  },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const S = this.S();
    this.heistTick();
    // quem tinha pena com prazo sai
    for (const [ci, L] of Object.entries(S.jail)) for (const x of L.slice()) { const p = G.people[x.pid]; if (!p || !p.alive) { L.splice(L.indexOf(x), 1); continue; } if (x.until && x.until <= G.day) this.release(p, +ci, !this.mine(+ci)); }
    // os presos que outras partes do jogo mandaram para a cadeia (dívida, espionagem, complô...) ocupam vaga
    for (const p of G.people) if (p.alive && p.jail > G.day && this.jailedIn(p) < 0) { const ci = this.civOf(p); if (ci >= 0) { if (!this.arrest(p, ci, 'condenado pelo tribunal', p.jail - G.day, true) && !this.mine(ci)) p.jail = 0; } }
    // os reis da IA prendem gente: ladrões, bandidos pegos, quem arruma briga
    for (const c of G.civs) {
      if (c.dead || c.ruler === 'player' || Math.random() > 0.5) continue;
      const cand = G.people.filter(p => p.alive && p.age >= 16 && !p.capanga && !p.kin && p.spouse !== 'player' && !(p.jail > G.day) && this.whereCiv(p) === c.id && !(c.rulerId === p.id) && ((p.stole || 0) > 0 || p.band || (p.hostile && !p.hit)));
      const p = cand.length ? U.pick(cand) : null; if (!p) continue;
      const why = p.band ? 'bando de salteadores' : p.stole ? 'roubo' : 'arruaça';
      this.arrest(p, c.id, why, p.band ? 0 : U.rint(2, 6), true);
      if (this.full(c.id)) this.npcMakeRoom(c.id);
      // os bandidos sem prazo: o rei decide logo
      const L = this.jail(c.id), x = L.find(q => !q.until && q.pid !== undefined && G.day - q.since >= 2); if (x) { const q = G.people[x.pid]; if (q) { const k = c.rulerId != null ? G.people[c.rulerId] : null; if (k && typeof PRISON_HARSH !== 'undefined' && (PRISON_HARSH[k.trait] || 1) > 1.15) this.execute(q, c.id, false); else x.until = G.day + U.rint(3, 8); } }
    }
    // procurados: se pisarem no seu reino, os guardas pegam
    for (const [pid, L] of Object.entries(S.wanted)) {
      const p = G.people[+pid]; if (!p || !p.alive) { delete S.wanted[pid]; continue; }
      if (this.jailedIn(p) >= 0) continue;
      const ci = this.whereCiv(p);
      if (L.includes(ci) && this.mine(ci) && Math.random() < 0.6) {
        if (this.arrest(p, ci, 'procurado pela coroa', 0, true)) {
          this.S().pending = (this.S().pending || 0) + 1;
          UI.banner('⛓️ Um procurado foi preso'); UI.msg(`⛓️ Os guardas de ${CIV_DEFS[ci].short} pegaram ${People.full(p)}, procurad${p.sex === 'f' ? 'a' : 'o'} pela coroa. Decida em Reinado → Prisão e justiça: continua preso ou é condenado à morte.`, 'gold', true);
        }
      }
    }
    // bandidos calmos conversam: o bando não é hostil o tempo todo (só quando atacado)
    for (const p of G.people) if (p.alive && p.band && p.hostile && !p.hit) p.hostile = false;
  },
  // ---------------------------------------------------------------- a aba do Reinado
  page() {
    const esc = UI.esc.bind(UI), S = this.S(), cs = this.myRealm();
    const cells = ci => { const L = this.jail(ci); return `<div class="ju-cells">${Array.from({ length: JAIL_CELLS }, (_, c) => `<div class="ju-cell"><div class="ju-ch">⛓️ Cela ${c + 1}</div>${Array.from({ length: JAIL_PER_CELL }, (_, k) => { const x = L[c * JAIL_PER_CELL + k], p = x && G.people[x.pid];
      return p ? `<div class="ju-pr ${x.until ? '' : 'wait'}"><b>${esc(People.full(p))}</b><small>${esc(People.title(p))} · ${esc(x.why)} · ${x.until ? `sai em ${Math.max(0, x.until - G.day)} ${x.until - G.day === 1 ? 'mês' : 'meses'}` : 'você decide'}</small>
        <span><button data-act="ju" data-op="free" data-p="${p.id}" data-c="${ci}">🔓 Soltar</button>${x.until ? '' : `<button data-act="ju" data-op="keep" data-p="${p.id}" data-c="${ci}">⏳ 6 meses</button>`}<button class="danger" data-act="ju" data-op="kill" data-p="${p.id}" data-c="${ci}">☠️ Morte</button></span></div>` : '<div class="ju-pr empty">vazio</div>'; }).join('')}</div>`).join('')}</div>`; };
    const Q = cs.flatMap(ci => (S.queue[ci] || []).map(x => ({ ...x, ci })));
    const W = Object.entries(S.wanted).filter(([, L]) => L.some(ci => cs.includes(ci))).map(([pid]) => G.people[+pid]).filter(Boolean);
    const met = G.people.filter(p => p.alive && p.met && p.age >= 16 && !p.capanga && !p.kin && !this.wanted(p).some(ci => cs.includes(ci))).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 300);
    return cs.map(ci => `<div class="card ju-prison"><div class="sec">⛓️ Prisão de ${CIV_DEFS[ci].short} <span>${this.jail(ci).length}/${JAIL_CAP} presos${this.full(ci) ? ' · <b class="bad">lotada</b>' : ''}</span></div>${cells(ci)}</div>`).join('')
      + (Q.length ? `<div class="card ju-queue"><div class="sec">⏳ Esperando vaga <span>${Q.length}</span></div>${Q.map(x => { const p = G.people[x.pid]; return p ? `<div class="ju-row"><b>${esc(People.full(p))}</b><small>${esc(x.why)} · ${CIV_DEFS[x.ci].short}</small></div>` : ''; }).join('')}<small class="muted">Solte alguém ou condene à morte para abrir vaga.</small></div>` : '')
      + `<div class="card ju-wanted"><div class="sec">📜 Procurados pela coroa <span>${W.length}</span></div>${W.map(p => `<div class="ju-row"><b>${esc(People.full(p))}</b><small>${esc(People.title(p))} · ${esc(People.homeName(p))}</small><span>${cs.filter(ci => this.wanted(p).includes(ci)).map(ci => `<button data-act="ju" data-op="unwant" data-p="${p.id}" data-c="${ci}">Retirar (${CIV_DEFS[ci].short})</button>`).join('')}</span></div>`).join('') || '<small class="muted">Ninguém procurado.</small>'}
        <div class="act-row ju-decl"><select id="juWho">${met.map(p => `<option value="${p.id}">${esc(People.full(p))} — ${esc(People.title(p))}</option>`).join('')}</select><button data-act="ju" data-op="want" data-c="${cs[0]}" ${met.length ? '' : 'disabled'}>📜 Declarar procurado</button></div>
        <small class="muted">Qualquer pessoa que você conheça. Se ela pisar no seu reino, os guardas pegam. Na conversa também dá para prender, condenar e declarar procurado.</small></div>`;
  },
};

{
  // bandidos dos acampamentos (calmos) aceitam conversa; os outros (emboscada, exército, bravos) não
  const tk0 = Game.talkable.bind(Game);
  Game.talkable = function (e) { if (e && e.kind === 'bandit' && e.npc && e.npc.band && typeof Bands !== 'undefined' && Bands.calm(e)) return !e.dead; return tk0(e); };
  // matar um bandido não é crime (eles não são mais "hostis" o tempo todo)
  const die0 = People.die.bind(People);
  People.die = function (p, cause, ...a) { if (p && p.band && cause === 'morto por você') { const h = p.hostile; p.hostile = true; try { return die0(p, cause, ...a); } finally { p.hostile = h; } } return die0(p, cause, ...a); };
  if (typeof Bands !== 'undefined') {
    const sp0 = Game.spawn.bind(Game);
    Game.spawn = function (kind, x, y, o) { const e = sp0(kind, x, y, o); if (e && kind === 'bandit' && e.npc && e.npc.band && !e.npc.hit) e.npc.hostile = false; return e; };
  }
  // na conversa
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    ac0(p, acts);
    if (p.band && !p.capanga) {
      acts.push(['jbHeist', '🗡️ Encomendar um assalto'], ['jbRecruit', `🤝 Chamar para o seu lado (120 🪙)`], ['jbRedeem', `🕊️ Tirar da vida do crime (200 🪙)`]);
    }
    if (p.age >= 16 && !p.capanga && !p.kin && p.spouse !== 'player' && Justice.myRealm().length) {
      const ci = Justice.subject(p), jailed = Justice.jailedIn(p) >= 0;
      if (ci >= 0 && !jailed && !G.civs.some(c => c.rulerId === p.id)) acts.push(['jbArrest', '⛓️ Mandar prender'], ['jbKill', '☠️ Condenar à morte']);
      if (!Justice.wanted(p).some(c => Justice.mine(c))) acts.push(['jbWant', '📜 Declarar procurado']);
    }
  };
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const op = d && d.op, p = op && /^jb/.test(op) ? People.get(+d.id) : null;
    if (!p) return ta0(d);
    if (op === 'jbHeist') { Justice.heistWin(p); return; }
    if (op === 'jbRecruit') {
      if ((p.aff || 0) < 25) { this.showTalk(p.id, { text: 'Largar o bando por você? Mal te conheço.', note: 'Precisa de amizade 25+.' }); return; }
      if (Game.allies().length >= Game.followerCap()) { this.showTalk(p.id, { text: 'Você já tem gente demais.', note: 'Limite de seguidores atingido.' }); return; }
      if (P.gold < 120) { this.showTalk(p.id, { text: 'Cento e vinte moedas e eu vou.', note: 'Ouro insuficiente.' }); return; }
      P.gold -= 120; const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
      if (typeof Bands !== 'undefined' && Bands.S().bands[p.band]) Bands.S().bands[p.band] = Bands.S().bands[p.band].filter(id => id !== p.id);
      p.band = null; p.hostile = false; p.capanga = true; p.oldHome = { type: 'wild' }; Game.spawnCapanga(p);
      this.showTalk(p.id, { text: 'O bando vai sentir a minha falta. Vamos.', note: `${People.full(p)} largou o bando e agora segue você.` }); return;
    }
    if (op === 'jbRedeem') {
      if ((p.aff || 0) < 35) { this.showTalk(p.id, { text: 'Vida honesta? Ninguém me daria trabalho.', note: 'Precisa de amizade 35+ (converse e dê presentes).' }); return; }
      if (P.gold < 200) { this.showTalk(p.id, { text: 'Sem dinheiro para recomeçar, não dá.', note: 'Custa 200 🪙.' }); return; }
      P.gold -= 200; const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
      if (typeof Bands !== 'undefined' && Bands.S().bands[p.band]) Bands.S().bands[p.band] = Bands.S().bands[p.band].filter(id => id !== p.id);
      Justice.home(p); p.aff = Math.min(100, (p.aff || 0) + 15); Court.addFame(2);
      if (p.home.type === 'village') Rumors.atV(p.home.idx, `${People.full(p)} largou o bando e voltou para a vila graças a ${G.name}.`);
      UI.msg(`🕊️ ${People.full(p)} largou a vida do crime e foi morar em ${People.homeName(p)} (+2 de fama).`, 'gold', true);
      UI.close(); return;
    }
    if (op === 'jbArrest') { const ci = Justice.subject(p); if (ci >= 0 && Justice.arrest(p, ci, 'ordem do rei')) { UI.msg(`⛓️ Os guardas levaram ${People.full(p)} para a prisão de ${CIV_DEFS[ci].short}.`, 'gold'); UI.close(); } else this.showTalk(p.id, { text: 'Os guardas não têm onde pôr.', note: 'A prisão está lotada: solte alguém ou condene à morte (Reinado → Prisão e justiça).' }); return; }
    if (op === 'jbKill') { const ci = Justice.subject(p); Dialog.confirm({ icon: '☠️', title: `Condenar ${People.full(p)} à morte`, danger: true, ok: 'Condenar', text: 'A família nunca vai perdoar e o povo fica com medo.' }, () => { Justice.execute(p, ci, true); UI.close(); }); return; }
    if (op === 'jbWant') { Justice.declare(p, Justice.myRealm()[0]); this.showTalk(p.id, { text: 'O que é isso?! Eu não fiz nada!', note: 'Declarado procurado no seu reino.' }); return; }
    return ta0(d);
  };
  // escolher a família do assalto
  Justice.heistWin = function (p) {
    const fams = Object.values(G.fams || {}).filter(f => !f.player && Families.members(f).length && f.wealth > 50).sort((a, b) => b.wealth - a.wealth).slice(0, 7);
    UI.open('🗡️ Encomendar um assalto', `<div class="card"><div class="sec">${UI.esc(People.full(p))}, do bando <span>amizade ${Math.round(p.aff || 0)} (precisa de 10)</span></div>
      <p class="dt-desc">O bando ataca no mês que vem e leva parte do que a família tem. Se pegarem o bandido, ele pode contar quem pagou — e aí você é procurado e a família vira sua inimiga.</p>
      ${fams.map(f => `<div class="crow"><span class="ri">🏛️</span><span><b>${UI.esc(Families.name(f))}</b><small>${f.civ >= 0 ? CIV_DEFS[f.civ].short : 'sem reino'} · ${Math.round(f.wealth).toLocaleString('pt-BR')} 🪙 de riqueza</small></span>
        <span class="act-row"><button class="danger" data-act="ju" data-op="heist" data-p="${p.id}" data-f="${f.id}" ${P.gold >= Justice.heistCost(f) && (p.aff || 0) >= 10 ? '' : 'disabled'}>Encomendar — ${Justice.heistCost(f)} 🪙</button></span></div>`).join('') || '<p class="muted">Nenhuma família com o que roubar.</p>'}</div>
      <div class="act-row"><button data-act="tk" data-op="open" data-id="${p.id}">◀ Voltar à conversa</button></div>`, 'showHeist', [p.id], 'Escolha a família');
  };
  UI.showHeist = function (pid) { const p = G.people[pid]; if (p) Justice.heistWin(p); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'ju') return a0(a, d);
    const p = d.p !== undefined ? G.people[+d.p] : null, ci = +d.c;
    switch (d.op) {
      case 'heist': Justice.heist(p, +d.f); break;
      case 'free': if (p) Justice.release(p, ci); break;
      case 'keep': { const x = p && Justice.jail(ci).find(q => q.pid === p.id); if (x) { x.until = G.day + 6; p.jail = x.until; } break; }
      case 'kill': if (p) { Dialog.confirm({ icon: '☠️', title: `Condenar ${People.full(p)} à morte`, danger: true, ok: 'Condenar', text: 'A família nunca vai perdoar e o povo fica com medo.' }, () => { Justice.execute(p, ci, true); UI.refresh(); }); return; } break;
      case 'unwant': if (p) Justice.undeclare(p.id, ci); break;
      case 'want': { const el = document.getElementById('juWho'), q = el && G.people[+el.value]; if (q) Justice.declare(q, ci); break; }
    }
    UI.refresh();
  };
  // a aba ⛓️ Prisão e justiça no Reinado (como a aba de Leis)
  const sh0 = Reign.show.bind(Reign);
  Reign.show = function (tab) {
    const t = tab || UI.sel.rgTab || 'council';
    let a = null; const op = UI.open; UI.open = (...x) => { a = x; };
    try { sh0(t === 'jus' ? 'council' : tab); } finally { UI.open = op; }
    if (!a) return;
    const S = Justice.S(), wait = Justice.myRealm().reduce((n, ci) => n + Justice.jail(ci).filter(x => !x.until).length + (S.queue[ci] || []).length, 0);
    let b = a[1].replace(/(<button[^>]*data-act="rgTab" data-t="aud"[^>]*>)/, `<button class="${t === 'jus' ? 'on' : ''}" data-act="rgTab" data-t="jus">⛓️ Prisão e justiça${wait ? ` (${wait})` : ''}</button>$1`);
    if (t === 'jus') { UI.sel.rgTab = 'jus'; b = b.replace(/(<button[^>]*) class="on"([^>]*data-t="council")/, '$1 class=""$2'); const i = b.indexOf('<div class="tabs">'), j = b.indexOf('</div>', i) + 6; b = b.slice(0, j) + Justice.page(); }
    const r = UI.open(a[0], b, a[2], [t], a[4]);
    // no Portfólio, o Reinado é dividido em páginas que cabem na janela
    if (UI.cur && UI.cur.fn === 'showKingdom' && UI.sel.knav === 'x:reign') UI.fitReino('x:reign');
    return r;
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Justice.monthTick(); } catch (e) { console.error(e); } };
}
