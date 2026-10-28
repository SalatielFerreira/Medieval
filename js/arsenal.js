'use strict';
// Arsenal: comprar máquinas de guerra (catapultas e aríetes, guardadas no arsenal), equipar a tropa (melhorias
// para sempre do seu exército) e negociar armas com o armeiro. As catapultas guardadas vão sozinhas com o seu
// exército para o campo de batalha (até 10) e as que sobrevivem voltam ao arsenal.
// Guerra por mensageiro: em vez de declarar na hora, um mensageiro leva a declaração — ou um ultimato
// ("paguem tanto ou haverá guerra").

const ARSENAL_ENGINES = {
  catapult: { name: 'Catapulta', icon: '🏹', gold: 400, cost: { wood: 20, stone: 10 }, desc: 'Lança pedras no campo de batalha e derruba portões nos cercos.' },
  ram:      { name: 'Aríete',    icon: '🪵', gold: 250, cost: { wood: 15 },             desc: 'Arromba o portão de um castelo durante o cerco.' },
};
const ARSENAL_UPS = {
  spears:  { name: 'Lanças de aço',          icon: '🔱', gold: 600, cost: { iron_bar: 10 }, desc: 'Os seus soldados a pé causam 15% mais dano.' },
  shields: { name: 'Escudos reforçados',     icon: '🛡️', gold: 600, cost: { plank: 15, iron_bar: 5 }, desc: 'Os seus soldados a pé têm 20% mais vida.' },
  bows:    { name: 'Arcos longos',           icon: '🏹', gold: 500, cost: { wood: 30, rope: 6 }, desc: 'Os seus arqueiros causam 25% mais dano.' },
  barding: { name: 'Armaduras para cavalos', icon: '🐎', gold: 800, cost: { iron_bar: 8, leather: 10 }, desc: 'Os seus cavaleiros têm 30% mais vida.' },
};

const Arsenal = {
  // guardado junto das obras (vai no jogo salvo)
  A() { const u = G.urban || (G.urban = {}); return u.arsenal || (u.arsenal = { catapult: 0, ram: 0, up: {} }); },
  has() { return World.structs.some(s => s.type === 'armory' && s.owner === 'player' && !s.removed); },
  costTxt(c) { return Object.entries(c).filter(([k]) => ITEMS[k]).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', '); },
  can(o) { return P.gold >= o.gold && Inv.has(Object.fromEntries(Object.entries(o.cost).filter(([k]) => ITEMS[k]))); },
  pay(o) { P.gold -= o.gold; Inv.pay(Object.fromEntries(Object.entries(o.cost).filter(([k]) => ITEMS[k]))); },
  open(sid) {
    const A = this.A(), s = sid !== undefined ? World.structs[sid] : World.structs.find(x => x.type === 'armory' && x.owner === 'player' && !x.removed);
    const k = s && Shops.keeper(s);
    const eng = Object.entries(ARSENAL_ENGINES).map(([key, o]) => `<div class="card"><div class="sec">${o.icon} ${o.name} <small class="muted">· no arsenal: ${A[key] || 0} · na mochila: ${Inv.count(key)}</small></div>
      <p class="dt-desc">${o.desc} Custa ${o.gold} 🪙 + ${this.costTxt(o.cost)}.</p>
      <div class="act-row"><button class="primary" data-act="arsenal" data-op="buy" data-k="${key}" ${this.can(o) ? '' : 'disabled'}>Comprar</button>
        <button data-act="arsenal" data-op="take" data-k="${key}" ${A[key] > 0 ? '' : 'disabled'}>Pegar 1 para a mochila</button>
        <button data-act="arsenal" data-op="store" data-k="${key}" ${Inv.count(key) > 0 ? '' : 'disabled'}>Guardar 1</button></div></div>`).join('');
    const ups = Object.entries(ARSENAL_UPS).map(([key, o]) => `<div class="card"><div class="sec">${o.icon} ${o.name}${A.up[key] ? ' <small class="ok">✓ equipado</small>' : ''}</div>
      <p class="dt-desc">${o.desc}${A.up[key] ? '' : ` Custa ${o.gold} 🪙 + ${this.costTxt(o.cost)}.`}</p>
      ${A.up[key] ? '' : `<div class="act-row"><button class="primary" data-act="arsenal" data-op="up" data-k="${key}" ${this.can(o) ? '' : 'disabled'}>Equipar a tropa</button></div>`}</div>`).join('');
    UI.open('⚔️ Arsenal', `<p>Seu ouro: <b>${P.gold} 🪙</b>. As catapultas guardadas aqui vão com o seu exército às batalhas (até 10); as que sobrevivem voltam. Para um cerco, pegue a máquina para a mochila e monte-a perto do castelo.</p>
      <h3>Máquinas de guerra</h3><div class="kgrid two">${eng}</div>
      <h3>Equipamento da tropa</h3><div class="kgrid two">${ups}</div>
      <h3>Armas e armaduras</h3><div class="act-row"><button data-act="arsenal" data-op="shop" data-s="${s ? s.id : ''}" ${k ? '' : 'disabled'}>⚒️ ${k ? `Negociar com ${UI.esc(k.name)} (${People.title(k)})` : 'Sem armeiro agora'}</button></div>`, 'showArsenal', [sid], 'Máquinas de guerra, tropa e armas');
  },
  act(d) {
    const A = this.A(), key = d.k;
    if (d.op === 'buy') { const o = ARSENAL_ENGINES[key]; if (!o || !this.can(o)) return; this.pay(o); A[key] = (A[key] || 0) + 1; UI.msg(`${o.icon} ${o.name} comprad${key === 'ram' ? 'o' : 'a'} e guardad${key === 'ram' ? 'o' : 'a'} no arsenal.`, 'gold'); Sound.play('coin'); }
    if (d.op === 'take' && A[key] > 0) { A[key]--; Inv.add(key, 1); }
    if (d.op === 'store' && Inv.count(key) > 0) { Inv.add(key, -1); A[key] = (A[key] || 0) + 1; }
    if (d.op === 'up') { const o = ARSENAL_UPS[key]; if (!o || A.up[key] || !this.can(o)) return; this.pay(o); A.up[key] = true; UI.msg(`${o.icon} ${o.name}: a sua tropa está mais forte.`, 'gold'); Sound.play('levelup'); }
    if (d.op === 'shop') { const s = World.structs[+d.s], k = s && Shops.keeper(s); if (k) { UI.showShop('smith', Work.vi(s), k.id); return; } }
    this.open();
  },
};

// guerra por mensageiro: declaração ou ultimato
const WarEnvoy = {
  myStr(mine) { return mine !== null ? Diplo.strength(mine) : War.heroPower() * 2; },
  open(mine, other, gold) {
    const o = G.civs[other];
    if (mine === undefined) mine = null;
    if (mine !== null ? Diplo.atWar(mine, other) : o.atWar) { UI.msg(`Já há guerra com ${CIV_DEFS[other].short}.`); return; }
    if (Envoy.list().some(e => e.other === other)) { UI.msg('📜 O seu mensageiro ainda está a caminho. Aguarde a resposta.'); return; }
    gold = gold === undefined ? Math.max(100, Math.round(o.treasury * 0.2 / 50) * 50) : U.clamp(gold, 50, 99999);
    const ratio = this.myStr(mine) / Math.max(1, Diplo.strength(other));
    const step = (dd, lab) => `<button data-act="wenvoy" data-op="amt" data-c="${mine === null ? '' : mine}" data-o="${other}" data-g="${Math.max(50, gold + dd)}">${lab}</button>`;
    UI.open('📜 Mensageiro de guerra', `<p>Mandar um mensageiro a <b>${UI.esc(o.rulerName)}</b> de ${CIV_DEFS[other].name}${mine !== null ? ` em nome de ${CIV_DEFS[mine].name}` : ''}.</p>
      <div class="card"><p class="dt-desc">Força deles: ${Math.round(Diplo.strength(other))} · a sua: ${Math.round(this.myStr(mine))} · tesouro deles: ${o.treasury} 🪙${mine === null ? ' · como a guerra é sua, os guardas deles vão atacar você e começa o cerco quando você estiver perto do castelo' : ''}</p>
      <div class="act-row"><button class="danger" data-act="wenvoy" data-op="war" data-c="${mine === null ? '' : mine}" data-o="${other}">⚔️ Levar a declaração de guerra</button></div></div>
      <div class="card"><div class="sec">💰 Ultimato: ${gold} 🪙 ou guerra</div>
      <p class="dt-desc">Exigir ouro em troca de não haver guerra. Quanto mais forte você for perto deles (e quanto menos pedir), maior a chance de pagarem; se recusarem, a guerra começa. ${ratio >= 1.5 ? 'Eles parecem intimidados.' : ratio >= 1 ? 'As forças são parecidas.' : 'Eles são mais fortes: dificilmente vão pagar.'}</p>
      <div class="act-row">${step(-5000, '−5000')}${step(-500, '−500')}${step(-100, '−100')}${step(-1, '−1')}${step(1, '+1')}${step(100, '+100')}${step(500, '+500')}${step(5000, '+5000')}
        <button class="danger" data-act="wenvoy" data-op="ult" data-c="${mine === null ? '' : mine}" data-o="${other}" data-g="${gold}">📜 Mandar o ultimato</button></div></div>`, 'showWarEnvoy', [mine, other, gold], 'Declaração de guerra ou ultimato');
  },
  send(mine, other, kind, gold) {
    Envoy.list().push({ kind, mine, other, gold: gold || 0, at: G.realTime + 10 });
    UI.close();
    UI.msg(`📜 Um mensageiro partiu para ${CIV_DEFS[other].short} levando ${kind === 'ult' ? `o ultimato (${gold} 🪙 ou guerra)` : 'a declaração de guerra'}.`, 'bad');
    Sound.play('horn');
  },
  war(mine, other, why) {
    if (mine !== null) { Diplo.declareWar(mine, other, why); if (!G.warCall) War.summon(mine, other, true); }
    else {
      Game.declareWar(other);
      if (G.siege && G.siege.civ === other && U.dist(P.x / TILE, P.y / TILE, World.capitals[other].x, World.capitals[other].y) > 30) Game.endSiege(null); // longe: o cerco começa quando você chegar
    }
  },
  resolve(e) {
    const { mine, other, gold } = e, o = G.civs[other];
    if (e.kind === 'war') { UI.msg(`📜 O mensageiro entregou a declaração a ${o.rulerName}.`, 'bad'); this.war(mine, other, `declaração levada pelo mensageiro de ${G.name}`); return; }
    const ratio = this.myStr(mine) / Math.max(1, Diplo.strength(other));
    const chance = o.treasury < gold ? 0 : U.clamp((ratio - 0.8) * 0.6 - gold / Math.max(1, o.treasury) * 0.5 + 0.2, 0, 0.85);
    if (Math.random() < chance) {
      o.treasury -= gold;
      if (mine !== null) { G.civs[mine].treasury += gold; Diplo.addRel(mine, other, -15); } else { P.gold += gold; Game.addRelation(other, -15); }
      UI.banner(`💰 ${CIV_DEFS[other].short} pagou o ultimato`);
      UI.msg(`💰 ${o.rulerName} preferiu pagar ${gold} 🪙 a enfrentar uma guerra (−15 relação).`, 'gold', true);
      Diplo.chronicle(`💰 ${CIV_DEFS[other].short} pagou ${gold} moedas a ${G.name} para evitar a guerra.`, true);
    } else {
      UI.msg(`📜 ${o.rulerName} rasgou o ultimato diante do mensageiro. É guerra!`, 'bad', true);
      this.war(mine, other, `${CIV_DEFS[other].short} recusou o ultimato`);
    }
  },
};

{
  UI.showArsenal = function (sid) { Arsenal.open(sid === null ? undefined : sid); };
  UI.showWarEnvoy = function (mine, other, gold) { WarEnvoy.open(mine, other, gold); };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'arsenal') { Arsenal.act(d); return; }
    if (a === 'wenvoy') { const mine = d.c === '' || d.c === undefined ? null : +d.c; if (d.op === 'war') WarEnvoy.send(mine, +d.o, 'war'); else if (d.op === 'ult') WarEnvoy.send(mine, +d.o, 'ult', +d.g); else WarEnvoy.open(mine, +d.o, +d.g); return; }
    if (a === 'war') { WarEnvoy.open(null, +d.c); return; }
    // em guerra: começar uma batalha agora (Conselho de Guerra e depois o campo de batalha)
    if (a === 'wbattle') {
      const mine = +d.c, other = +d.o;
      if (!Diplo.atWar(mine, other)) { UI.msg('Vocês não estão em guerra.'); return; }
      if (G.warCall && !(G.warCall.side === mine && G.warCall.enemy === other)) { UI.msg(`Já há uma batalha marcada contra ${CIV_DEFS[G.warCall.enemy].short}.`, 'bad'); return; }
      if (!G.warCall) War.summon(mine, other, true);
      UI.showWarCouncil(); return;
    } // a declaração do castelo também vai por mensageiro
    return act0(a, d);
  };
  const pa0 = Diplo.playerAction.bind(Diplo);
  Diplo.playerAction = function (mine, other, act) { if (act === 'war') { WarEnvoy.open(mine, other); return; } return pa0(mine, other, act); };
  const rs0 = Envoy.resolve.bind(Envoy);
  Envoy.resolve = function (e) { if (e.kind === 'war' || e.kind === 'ult') { WarEnvoy.resolve(e); return; } return rs0(e); };
  // o arsenal abre ao clicar nele (e no móvel principal lá dentro)
  const ci0 = Content2.interact.bind(Content2);
  Content2.interact = function (s) { if (s && s.type === 'armory' && s.owner === 'player') { Arsenal.open(s.id); return true; } return ci0(s); };
  // no campo de batalha: catapultas do arsenal e o equipamento da tropa
  const st0 = War.start.bind(War);
  War.start = function (...a) {
    const A = Arsenal.A(), n = Math.min(typeof WAR_CATS_MAX !== 'undefined' ? WAR_CATS_MAX : 4, A.catapult || 0);
    const before = new Set(G.ents);
    st0(...a);
    const B = G.place; if (!B || B.kind !== 'battle' || B.fake) return;
    const ups = A.up || {};
    for (const e of G.ents) {
      if (before.has(e) || e.dead || e.battle !== B.id || e.wside !== B.side || e.faction === 'engine') continue;
      if (!B.own) continue; // o equipamento é da sua tropa (não da de um rei aliado)
      if (e.mounted) { if (ups.barding) { e.maxHp = Math.round(e.maxHp * 1.3); e.hp = e.maxHp; } continue; }
      if (e.archer) { if (ups.bows) e.dmg = Math.round(e.dmg * 1.25); continue; }
      if (e.kind === 'guard') { if (ups.spears) e.dmg = Math.round(e.dmg * 1.15); if (ups.shields) { e.maxHp = Math.round(e.maxHp * 1.2); e.hp = e.maxHp; } }
    }
    if (n) {
      A.catapult -= n;
      const cy = B.fy0 + B.h / 2, x0 = B.fx0 + B.w * 0.38 - 4;
      const had = new Set(G.ents);
      War.deploy(B.side, { soldiers: 0, archers: 0, cats: n, cav: 0, king: false }, x0, cy + 6, 1, FORMATIONS.linha, 'player', false);
      for (const e of G.ents) if (!had.has(e) && e.battleCat) e.arsenalCat = true;
      B.start[B.side] = War.fighters(B.side).length;
      UI.msg(`🏹 ${n} catapulta${n > 1 ? 's' : ''} do seu arsenal entra${n > 1 ? 'm' : ''} na batalha.`, 'gold');
    }
  };
  const lv0 = War.leave.bind(War);
  War.leave = function (...a) {
    const B = G.place;
    if (B && B.kind === 'battle') { const back = G.ents.filter(e => !e.dead && e.arsenalCat && e.battle === B.id).length; if (back) { Arsenal.A().catapult += back; UI.msg(`🏹 ${back} catapulta${back > 1 ? 's voltaram' : ' voltou'} ao arsenal.`); } }
    return lv0(...a);
  };
}

// ------------------------------------------------------------------ a batalha só acaba quando você cai (ou quando cai o último inimigo)
// O rei do seu lado pode cair e o seu exército inteiro também: enquanto você estiver de pé, a luta continua.
{
  const wu1 = War.update.bind(War);
  War.update = function (dt) {
    const r = wu1(dt);
    const B = G.place;
    if (B && B.kind === 'battle' && !B.fake && !B.done && !P.dead) {
      const king = G.ents.some(e => !e.dead && e.battle === B.id && e.wside === B.side && e.battleKing);
      if (!king && B.hadKing && !B.kingMsg) { B.kingMsg = true; UI.banner('👑 O rei do seu lado caiu!'); UI.msg('O rei do seu lado caiu, mas a batalha continua enquanto você estiver de pé.', 'bad', true); }
      if (king) B.hadKing = true;
      if (!B.aloneMsg && War.fighters(B.side).length === 0) { B.aloneMsg = true; UI.banner('⚔️ Você luta sozinho!'); UI.msg('Todo o seu exército caiu. A batalha só acaba quando você vencer — ou cair.', 'bad', true); }
    }
    return r;
  };
}
