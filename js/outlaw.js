'use strict';
// Vida de fora da lei (Portfólio → 🗡️ Fora da lei): em vez de herói, chefe de bandidos.
//  • Assuma um bando: perto de um acampamento de bandidos, com a cabeça a prêmio em algum reino (ou 300 🪙 de "entrada").
//    O acampamento vira o seu esconderijo e os bandidos param de atacar você (menos os caçadores de recompensa).
//  • O bando: homens no esconderijo (para os golpes) e bandidos que seguem você como capangas.
//  • Golpes: assaltar caravanas nas estradas, saquear vilas e cobrar "proteção" das vilas perto do esconderijo.
//  • Cada golpe sobe a sua fama de fora da lei e a recompensa pela sua cabeça no reino roubado: os guardas de lá atacam,
//    e caçadores de recompensa aparecem.
//  • Perdão: pague ao rei (o dobro da recompensa + 300) e o reino esquece. Quando quiser, largue a vida de fora da lei.
const OutLaw = {
  O() { return G.outlaw || null; },
  hideout() { const O = this.O(); return O ? World.camps.find(c => c.x === O.hx && c.y === O.hy) || null : null; },
  campNear() { const px = P.x / TILE, py = P.y / TILE; return World.camps.find(c => !c.cleared && U.dist(px, py, c.x + 1.5, c.y + 1.5) < 10) || null; },
  wanted() { return Object.entries(Crime.W()).filter(([, w]) => w && w.bounty > 0).map(([ci, w]) => ({ ci: +ci, w })); },
  totalBounty() { return this.wanted().reduce((a, x) => a + x.w.bounty, 0); },
  power() { const O = this.O(); return (O ? O.band * 2 : 0) + Game.allies().length * 3 + P.level; },
  canStart() {
    if (this.O()) return 'Você já chefia um bando.';
    if (!this.campNear()) return 'Vá até um acampamento de bandidos (a até 10 passos).';
    if (this.totalBounty() < 150 && P.gold < 300) return 'Os bandidos só aceitam quem tem a cabeça a prêmio — ou 300 🪙 de entrada.';
    return null;
  },
  start() {
    const e = this.canStart(); if (e) { UI.msg(e, 'bad'); return; }
    const c = this.campNear();
    if (this.totalBounty() < 150) P.gold -= 300;
    G.outlaw = { hx: c.x, hy: c.y, since: G.day, band: 4, fame: 0, loot: 0, protect: [] };
    c.hideout = true; c.cleared = false;
    for (const e2 of G.ents) if (e2.kind === 'bandit' && e2.target === P) e2.target = null;
    UI.banner('🗡️ Chefe do bando!');
    UI.msg('🗡️ Os bandidos olham para você e baixam as armas: agora você é o chefe. O acampamento é o seu esconderijo. Assalte caravanas, saqueie vilas e cobre proteção — mas a sua cabeça vai valer cada vez mais.', 'gold', true);
    Progress.diary('🗡️ Virou chefe de um bando de fora da lei.'); Diplo.chronicle(`🗡️ ${G.name} ${G.surname || ''} assumiu um bando de fora da lei.`, true);
  },
  quit() {
    const O = this.O(); if (!O) return;
    const c = this.hideout(); if (c) c.hideout = false;
    G.outlaw = null;
    UI.msg('🏳️ Você largou a vida de fora da lei. O bando se espalhou pelas estradas.', 'gold', true);
    Progress.diary('🏳️ Largou a vida de fora da lei.');
  },
  recruit(capanga) {
    const O = this.O(); if (!O) return;
    if (capanga) {
      if (P.gold < 60) { UI.msg('Um bandido cobra 60 🪙 para seguir você.', 'bad'); return; }
      if (Game.allies().length >= Game.followerCap()) { UI.msg('Você não tem lugar para mais capangas.', 'bad'); return; }
      P.gold -= 60;
      const p = People.create({ rank: 'wanderer', age: U.rint(18, 40), trait: U.pick(['ganancioso', 'corajoso', 'rabugento', 'desconfiado']), home: { type: 'wild' }, civ: -1 });
      p.capanga = true; p.outlaw = true; p.loyal = 50; p.equip.weapon = 'iron_sword'; Game.spawnCapanga(p);
      UI.msg(`🗡️ ${p.name} entrou para o bando e segue você.`, 'gold');
    } else {
      if (P.gold < 30) { UI.msg('Cada homem novo para o bando custa 30 🪙.', 'bad'); return; }
      P.gold -= 30; O.band++; UI.msg(`🗡️ Mais um homem no esconderijo (${O.band} no bando).`, 'gold');
    }
  },
  // um golpe sobe a recompensa no reino e a fama de fora da lei
  heat(ci, what, n) {
    const O = this.O(); O.fame += Math.round(n / 20);
    const w = Crime.W()[ci] || (Crime.W()[ci] = { bounty: 0, crimes: [], resist: false });
    w.bounty += n; w.crimes.push(what); if (w.crimes.length > 5) w.crimes.shift(); w.day = G.day; if (w.bounty > 400) w.resist = true;
    Game.addRelation(ci, -6);
  },
  caravans() { return Caravans.list().filter(c => !c.done && !c.robbed && c.owner !== 'player'); },
  robCaravan(id) {
    const O = this.O(), c = this.caravans().find(x => x.id === id); if (!O || !c) return;
    const foe = (c.escort || 2) * 4 + 6, win = Math.random() < U.clamp(this.power() / (this.power() + foe), 0.15, 0.9);
    if (win) {
      c.robbed = true; c.done = true; const got = [];
      for (const g of c.goods || []) { if (ITEMS[g.k]) { Inv.add(g.k, g.n); got.push(`${g.n} ${ITEMS[g.k].name}`); } }
      const gold = U.rint(80, 240); P.gold += gold; O.loot += gold; Progress.add('caravansRobbed');
      this.heat(c.from, 'assalto a caravana', 220);
      Diplo.chronicle(`🗡️ O bando de ${G.name} assaltou uma caravana de ${Diplo.name(c.from)}.`, true);
      return { ok: true, text: `🗡️ A caravana caiu! ${gold} 🪙${got.length ? ' e ' + got.join(', ') : ''}. A recompensa pela sua cabeça em ${CIV_DEFS[c.from].short} subiu.` };
    }
    O.band = Math.max(0, O.band - 2); P.hp = Math.max(1, P.hp - 25); this.heat(c.from, 'ataque a caravana', 80);
    return { ok: false, text: '⚔️ A escolta reagiu: o bando fugiu, perdendo 2 homens.' };
  },
  near(n) { const O = this.O(); return World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.ruin && x.v.lord !== 'player' && !(G.civs[x.v.civ] && G.civs[x.v.civ].ruler === 'player' && !x.v.free) && U.dist(x.v.x, x.v.y, O.hx, O.hy) < n); },
  raid(vi) {
    const O = this.O(), v = World.villages[vi]; if (!O || !v) return;
    if (G.day - (O.lastRaid || -9) < 1) return { ok: false, text: 'O bando precisa de um mês para se refazer do último saque.' };
    O.lastRaid = G.day;
    const c = G.civs[v.civ], def = (v.free ? 4 : Math.round((c.garrison || 0) / 3)) + (v.level || 1) * 2 + (World.structs.some(s => s.type === 'vgate' && s.village === vi && !s.removed) ? 6 : 0);
    const win = Math.random() < U.clamp(this.power() / (this.power() + def), 0.1, 0.88);
    if (win) {
      let gold = 0; for (const f of Object.values(Families.F())) if (f.seat === vi && f.wealth > 0) { const g = Math.round(f.wealth * 0.15); f.wealth -= g; gold += g; }
      gold = Math.max(gold, U.rint(60, 160)); P.gold += gold; O.loot += gold;
      v.prosper = Math.max(0, (v.prosper || 0) - 10); v.sacked = G.day;
      for (const p of People.residents(vi)) { Mind.feel(p, 'anger', 60); People.addAff(p, -30); }
      if (!v.free) this.heat(v.civ, 'saque à vila de ' + v.name, 400);
      Rumors.atV(vi, `O bando de ${G.name} saqueou ${v.name}. Todos trancam as portas.`, { about: 'player', tone: -1 });
      Diplo.chronicle(`🔥 O bando de ${G.name} saqueou ${v.name}.`, true); Progress.add('sacks');
      return { ok: true, text: `🔥 ${v.name} foi saqueada: ${gold} 🪙. O povo vai lembrar.` };
    }
    O.band = Math.max(0, O.band - 3); P.hp = Math.max(1, P.hp - 35); if (!v.free) this.heat(v.civ, 'ataque à vila de ' + v.name, 150);
    return { ok: false, text: `⚔️ ${v.name} resistiu: o bando perdeu 3 homens.` };
  },
  protect(vi) { const O = this.O(); if (!O.protect.includes(vi)) O.protect.push(vi); UI.msg(`💰 Os seus homens avisaram ${World.villages[vi].name}: todo mês, proteção — ou fogo.`, 'gold'); },
  pardonCost(ci) { const w = Crime.W()[ci]; return w ? w.bounty * 2 + 300 : 0; },
  pardon(ci) {
    const c = this.pardonCost(ci); if (!c) return; if (P.gold < c) { UI.msg(`O perdão de ${CIV_DEFS[ci].short} custa ${c} 🪙.`, 'bad'); return; }
    P.gold -= c; G.civs[ci].treasury += c; Crime.clear(ci); Game.addRelation(ci, 5);
    UI.msg(`📜 ${G.civs[ci].rulerName} assinou o seu perdão: ${CIV_DEFS[ci].short} não procura mais você.`, 'gold', true);
    Progress.diary(`📜 Comprou o perdão de ${CIV_DEFS[ci].name}.`);
  },
  monthTick() {
    const O = this.O(); if (!O) return;
    // proteção: as vilas pagam (ou recusam, e você fica sabendo)
    let got = 0; const refused = [];
    for (const vi of O.protect.slice()) {
      const v = World.villages[vi]; if (!v || v.ruin) { O.protect = O.protect.filter(x => x !== vi); continue; }
      if (O.fame >= 10 && Math.random() < 0.75) { const g = 20 + Math.round(People.residents(vi).length / 2); got += g; v.prosper = Math.max(0, (v.prosper || 0) - 1); }
      else refused.push(v.name);
    }
    if (got) { P.gold += got; O.loot += got; Game.note(`💰 Proteção das vilas: +${got} 🪙.`); }
    if (refused.length) UI.msg(`😠 ${refused.join(', ')} se recusa${refused.length > 1 ? 'm' : ''} a pagar a proteção.`, 'bad');
    // caçadores de recompensa
    const tb = this.totalBounty();
    if (tb > 300 && Math.random() < 0.45 && !G.place && !G.dungeon) {
      for (let k = U.rint(2, 3); k > 0; k--) { const s = freeSpotNear(P.x, P.y, 260); const e = Game.spawn('bandit', s.x, s.y, { leash: 40, archer: k === 1 }); e.bounty = true; e.name = 'Caçador de Recompensas'; e.maxHp = e.hp = Math.round(e.hp * 1.8); e.dmg = Math.round(e.dmg * 1.4); e.target = P; }
      UI.msg(`🎯 Caçadores de recompensa vieram atrás da sua cabeça (${tb} 🪙)!`, 'bad', true);
    }
    // a recompensa não esfria enquanto você é chefe de bando
    for (const x of this.wanted()) x.w.bounty = Math.round(x.w.bounty / 0.92);
  },
  // ---------------------------------------------------------------- a página
  page() {
    const O = this.O(), esc = UI.esc.bind(UI), W = this.wanted();
    const poster = W.length ? `<div class="card ol-wanted"><div class="sec">📜 Procurado <span>${this.totalBounty()} 🪙 pela sua cabeça</span></div>${W.map(x => `<div class="crow"><span class="ri">${Heraldry.armsSvg(x.ci, 18)}</span><span><b>${CIV_DEFS[x.ci].short}: ${x.w.bounty} 🪙</b><small>${esc(x.w.crimes.join(', '))}${x.w.resist ? ' · os guardas atacam' : ''}</small></span>
      <span class="act-row"><button data-act="ol" data-op="pardon" data-c="${x.ci}" ${P.gold >= this.pardonCost(x.ci) ? '' : 'disabled'}>📜 Comprar o perdão — ${this.pardonCost(x.ci)} 🪙</button></span></div>`).join('')}</div>` : '';
    if (!O) {
      const e = this.canStart();
      return `<div class="card"><div class="sec">🗡️ A vida de fora da lei</div><p class="dt-desc">Chefe de bandidos: esconderijo num acampamento, golpes em caravanas e vilas, proteção cobrada à força — e a cabeça a prêmio nos reinos. Os bandidos param de atacar você (menos os caçadores de recompensa).</p>
        <div class="act-row"><button class="danger" data-act="ol" data-op="start" ${e ? 'disabled' : ''}>🗡️ Assumir o bando${this.totalBounty() < 150 ? ' (300 🪙)' : ''}</button></div>${e ? `<small class="muted">${esc(e)}</small>` : ''}</div>${poster}`;
    }
    const cars = this.caravans().slice(0, 6).map(c => `<button data-act="ol" data-op="car" data-i="${c.id}">🐫 ${CIV_DEFS[c.from].short} → ${CIV_DEFS[c.to].short}</button>`).join('');
    const vils = this.near(60).slice(0, 10).map(x => `<div class="crow"><span class="ri">🏘️</span><span><b>${esc(x.v.name)}</b><small>${x.v.free ? 'vila livre' : CIV_DEFS[x.v.civ].short} · ${Math.round(U.dist(x.v.x, x.v.y, O.hx, O.hy))} passos do esconderijo${O.protect.includes(x.i) ? ' · paga proteção' : ''}</small></span>
      <span class="act-row"><button class="danger" data-act="ol" data-op="raid" data-v="${x.i}">🔥 Saquear</button>${O.protect.includes(x.i) ? '' : `<button data-act="ol" data-op="protect" data-v="${x.i}">💰 Cobrar proteção</button>`}</span></div>`).join('');
    return `<div class="card ol-me"><div class="ol-ic">🏴</div><div><h3>O bando de ${esc(G.name)}</h3><small>${O.band} homens no esconderijo · ${Game.allies().length} capangas · fama de fora da lei ${O.fame} · saque total ${O.loot} 🪙</small>
        <div class="act-row"><button data-act="ol" data-op="man">➕ Homem no esconderijo — 30 🪙</button><button data-act="ol" data-op="cap">🗡️ Bandido para seguir você — 60 🪙</button><button data-act="ol" data-op="home">⛺ Ir ao esconderijo</button></div></div></div>
      <div class="card"><div class="sec">🐫 Caravanas nas estradas <span>força do bando ${Math.round(this.power())}</span></div><div class="act-row" style="flex-wrap:wrap">${cars || '<small class="muted">Nenhuma caravana na estrada agora.</small>'}</div></div>
      <div class="card"><div class="sec">🏘️ Vilas perto do esconderijo</div>${vils || '<p class="muted">Nenhuma vila por perto.</p>'}</div>
      ${poster}<div class="act-row"><button data-act="ol" data-op="quit">🏳️ Largar a vida de fora da lei</button></div>`;
  },
};

{
  // os bandidos não atacam o chefe nem os capangas dele (os caçadores de recompensa, sim)
  const h0 = hostile;
  // eslint-disable-next-line no-global-assign
  hostile = function (a, b) {
    if (G.outlaw && !a.bounty && !b.bounty) {
      const fa = fac(a), fb = fac(b);
      if ((fa === 'bandit' && fb === 'player') || (fb === 'bandit' && fa === 'player')) return false;
    }
    return h0(a, b);
  };
  // o esconderijo: interagir abre a página do bando e descansar
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s && s.type === 'camp' && s.hideout && G.outlaw) return 'Esconderijo — o seu bando'; return il0(s); };
  const us0 = Game.useStruct.bind(Game);
  Game.useStruct = function (s) {
    if (s && s.type === 'camp' && s.hideout && G.outlaw) { P.hp = P.maxHp; G.spawn = { x: (s.x + 1.5) * TILE, y: (s.y + 3.5) * TILE }; UI.sel.knav = 'x:outlaw'; UI.showKingdom(); UI.msg('⛺ Você descansou no esconderijo (vida cheia; você volta aqui se cair).', 'gold'); return; }
    return us0(s);
  };
  // o acampamento-esconderijo não é "limpo" pelos outros
  const cc0 = Game.campCleared.bind(Game);
  Game.campCleared = function (camp) { if (camp && camp.hideout && G.outlaw) { camp.left = 5; return; } return cc0(camp); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); OutLaw.monthTick(); };
  // o jogo salvo guarda o bando (e o acampamento volta a ser o esconderijo)
  const sn0 = Game.snapshot.bind(Game);
  Game.snapshot = function (...a) { const s = sn0(...a); if (s && typeof s === 'object') s.outlaw = G.outlaw || null; return s; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (slot, onProgress, data) { const s = data || Saves.read(slot); const r = await ld0(slot, onProgress, s); if (G.state === 'play') { G.outlaw = s && s.outlaw ? s.outlaw : null; const c = OutLaw.hideout(); if (c) { c.hideout = true; c.cleared = false; } } return r; };
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { G.outlaw = null; return ng0(...a); };
  const ni0 = Board.navItems.bind(Board);
  Board.navItems = function () { return ni0().concat([['x:outlaw', '🗡️', 'Fora da lei', OutLaw.totalBounty() ? '!' : '', OutLaw.totalBounty() > 300]]); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:outlaw') return UI.pageHead('🗡️', 'Fora da lei', 'O bando, os golpes, a recompensa pela sua cabeça e o perdão') + OutLaw.page(); return kp0(nav); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'ol') return a0(a, d);
    let r = null;
    switch (d.op) {
      case 'start': OutLaw.start(); break;
      case 'quit': Dialog.confirm({ icon: '🏳️', title: 'Largar a vida de fora da lei', ok: 'Largar', text: 'O bando se espalha e o esconderijo fica para trás. A recompensa pela sua cabeça continua até você comprar o perdão.' }, () => { OutLaw.quit(); UI.refresh(); }); return;
      case 'man': OutLaw.recruit(false); break;
      case 'cap': OutLaw.recruit(true); break;
      case 'home': { const O = OutLaw.O(); if (O) G.ping = { x: O.hx + 1.5, y: O.hy + 1.5, name: 'Esconderijo' }; UI.msg('⛺ O esconderijo está marcado no mapa.'); break; }
      case 'car': r = OutLaw.robCaravan(+d.i); break;
      case 'raid': r = OutLaw.raid(+d.v); break;
      case 'protect': OutLaw.protect(+d.v); break;
      case 'pardon': OutLaw.pardon(+d.c); break;
    }
    if (r) UI.msg(r.text, r.ok ? 'gold' : 'bad', true);
    UI.refresh();
  };
  ACHIEVEMENTS.push({ id: 'outlaw', icon: '🏴', name: 'Rei dos Ladrões', desc: 'Junte 2.000 🪙 de saque como chefe de bando.', t: () => !!G.outlaw && G.outlaw.loot >= 2000 }, { id: 'pardoned', icon: '📜', name: 'Perdoado', desc: 'Compre o perdão de um rei.', t: () => (G.diary || []).some(d => /perdão de/.test(d.text)) });
}
