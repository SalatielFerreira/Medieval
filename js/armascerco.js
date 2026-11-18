'use strict';
// Armas de cerco: além das catapultas, para derrubar o portão do castelo ou da vila (Conselho de Guerra → Armas de cerco):
//  • 🐏 Aríetes: avançam até o portão e batem com força (200 🪙 cada, até 3). Os defensores atiram neles.
//  • 🪓 Sapadores: soldados com machados e marretas que racham o portão muito mais rápido que os outros.
//  • 🔥 Fogo (tochas e óleo, 80 🪙): quando os seus chegam ao portão, ele pega fogo e queima sozinho — o de madeira (das
//    vilas com paliçada) queima depressa; o de ferro e carvalho do castelo, devagar.
//  • 🗡️ Você batendo na porta: chegue no portão e ataque — cada golpe aparece no portão; machados, martelos e maças batem
//    bem mais forte que espadas.
// O inimigo também traz aríetes e fogo quando cerca o seu castelo ou uma vila sua.
const RAM_COST = 200, FIRE_COST = 80;
const SiegeArms = {
  A() { return typeof Assault !== 'undefined' ? Assault.A() : null; },
  heavy(k) { return /axe|hammer|mace|maul|machado|martelo|maca/i.test(k || ''); },
  // o que o conselho deixa levar
  limits(wc) { const c = G.civs[wc.side]; return { rams: Math.min(3, Math.floor(((wc.own ? c.treasury : P.gold) || 0) / RAM_COST)), sappers: Math.min(12, wc.cfg.soldiers || 0) }; },
  html(wc) {
    const cfg = wc.cfg, L = this.limits(wc);
    const step = (k, label, val, max, hint) => `<div class="wc-row"><span class="wc-l"><b>${label}</b><small>${hint}</small></span><span class="wc-step"><button data-act="wcfg" data-k="${k}" data-d="-1" ${val <= 0 ? 'disabled' : ''}>−</button><b>${val}</b><button data-act="wcfg" data-k="${k}" data-d="1" ${val >= max ? 'disabled' : ''}>+</button></span></div>`;
    return `<div class="card wc-arms"><div class="sec">🏰 Armas de cerco <span>para o assalto ao castelo ou a uma vila</span></div>
      ${step('rams', '🐏 Aríetes', cfg.rams || 0, L.rams, `${RAM_COST} 🪙 cada · batem forte no portão`)}
      ${step('sappers', '🪓 Sapadores', cfg.sappers || 0, L.sappers, 'soldados com machados e marretas: racham o portão depressa')}
      <div class="wc-row"><span class="wc-l"><b>🔥 Fogo</b><small>tochas e óleo (${FIRE_COST} 🪙): o portão pega fogo e queima sozinho</small></span><button class="${cfg.fire ? 'primary' : ''}" data-act="wfire">${cfg.fire ? '✔ Sim' : 'Não'}</button></div></div>`;
  },
  // depois de montar o assalto: aríetes, sapadores e fogo de quem ataca
  setup(cfg) {
    const A = this.A(), B = G.place; if (!A || !B) return;
    const mine = A.mode === 'attack', att = A.att, ac = G.civs[att];
    let rams = 0, fire = false, sap = 0;
    if (mine && cfg) {
      const pay = n => { const c = G.civs[B.side]; if (c && c.treasury >= n) { c.treasury -= n; return true; } if (P.gold >= n) { P.gold -= n; return true; } return false; };
      for (let k = 0; k < Math.min(3, cfg.rams || 0); k++) if (pay(RAM_COST)) rams++;
      fire = !!cfg.fire && pay(FIRE_COST); sap = Math.min(12, cfg.sappers || 0);
    } else { rams = ((ac && ac.treasury) || 0) >= 2500 ? 1 : 0; fire = Math.random() < 0.3; sap = 2; } // o inimigo traz menos (a defesa continua possível)
    A.fire = fire; A.burn = 0;
    const gm = Assault.gateMid();
    for (let k = 0; k < rams; k++) {
      const x = Math.max(B.fx0 + 20, A.x0 - 32) * TILE, y = gm.y + (k - (rams - 1) / 2) * 2.2 * TILE; // na frente do exército
      const e = Game.spawn('ram_e', x, y, { civ: att, leash: 999, siegeOf: 999 });
      e.battle = B.id; e.wside = att; e.side = mine ? 'player' : 'enemy'; e.dir = 1; e.noGarrison = true; e.battleRam = true; e.lane = k - (rams - 1) / 2; e.form = FORMATIONS.linha; e.aggroOv = 0; e.maxHp = e.hp = 420; e.rcd = 1 + k * 0.5;
    }
    const inf = War.units(att).filter(e => e.faction !== 'engine' && !e.archer && !e.mounted && !e.battleKing);
    for (const e of inf.slice(0, sap)) { e.sapper = true; e.unit = 'sapper'; e.name = 'Sapador de ' + CIV_DEFS[att].short; e.dmg = Math.round(e.dmg * 1.15); }
    if (rams || sap || fire) UI.msg(`🏰 Armas de cerco${mine ? '' : ' do inimigo'}: ${[rams ? `🐏 ${rams} ${rams === 1 ? 'aríete' : 'aríetes'}` : '', sap ? `🪓 ${sap} sapadores` : '', fire ? '🔥 tochas e óleo' : ''].filter(Boolean).join(' · ')}.`, mine ? 'gold' : 'bad');
  },
  t: 0,
  update(dt) {
    const A = this.A(), B = G.place; if (!A || !B || B.done) return;
    // você batendo na porta: o golpe aparece no portão
    if (A.gateHp > 0 && A.mode === 'attack' && P.swing > 0.2 && (A.pSw2 || 0) <= 0.2) {
      const m = Assault.gateMid();
      if (U.dist(P.x, P.y, m.x, m.y) < 3.6 * TILE) {
        const n = Math.round(Game.pDmg() * (this.heavy(P.equip.weapon) ? 3.2 : 1.6));
        Assault.hitGate(n, P.x + 8, P.y - 20); Game.addText(m.x - 10, m.y - 40, `−${n}`, '#ffcf6b'); Sound.play('chop', { vol: 0.8 }); Game.shake && Game.shake(2);
      }
    }
    A.pSw2 = P.swing;
    if (B.phase !== 'fight' || A.gateHp <= 0) return;
    this.t -= dt; const tick = this.t <= 0; if (tick) this.t = 0.25;
    const m = Assault.gateMid(), front = { x: (A.x0 - 1.6) * TILE, y: m.y };
    let atGate = false;
    for (const e of G.ents) {
      if (e.dead || e.battle !== B.id || e.wside !== A.att) continue;
      if (e.battleRam) {
        // o aríete avança até o portão e bate
        const ty = front.y + (e.lane || 0) * 18, d = U.dist(e.x, e.y, front.x, ty);
        if (d > 10) { const sp = 50 * dt; e.x += (front.x - e.x) / d * Math.min(sp, d); e.y += (ty - e.y) / d * Math.min(sp, d); e.moving = true; e.dir = 1; }
        else { e.moving = false; atGate = true; e.rcd -= dt; if (e.rcd <= 0) { e.rcd = 1.6; e.swing = 0.4; Assault.hitGate(95 * (A.ramBonus || 1), m.x - 10, m.y - 10); Sound.play('mine', { vol: 0.7 }); Game.shake && Game.shake(3); } }
        if (e.swing > 0) e.swing = Math.max(0, e.swing - dt);
        continue;
      }
      if (tick && e.faction !== 'engine' && U.dist(e.x, e.y, front.x, front.y) < 2.6 * TILE) { atGate = true; if (e.sapper) { Assault.hitGate(Math.max(3, e.dmg) * 0.4 * (A.ramBonus || 1), e.x, e.y - 16); e.swing = 0.25; } }
    }
    // fogo: os de quem ataca chegaram ao portão com tochas e óleo
    if (A.fire && atGate && !A.burn) { A.burn = 1; UI.banner('🔥 O portão pegou fogo!'); }
    if (A.burn && tick) {
      const wood = Places.furn.some(f => f.k === 'cgate' && f.wood);
      Assault.hitGate(A.gateMax * (wood ? 0.012 : 0.003), m.x, m.y - 30);
      if (Math.random() < 0.6) Game.burst(m.x + U.rnd(-14, 14), m.y - U.rnd(10, 60), Math.random() < 0.5 ? '#ff9a30' : '#ffcf4a', 3);
    }
  },
};

{
  // o conselho: as armas de cerco
  const cl0 = War.clampCfg.bind(War);
  War.clampCfg = function (wc) { cl0(wc); const L = SiegeArms.limits(wc), c = wc.cfg; c.rams = U.clamp(c.rams | 0, 0, L.rams); c.sappers = U.clamp(c.sappers | 0, 0, L.sappers); c.fire = !!c.fire; };
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showWarCouncil' && G.warCall && G.warCall.own && G.warCall.assault !== 'defend' && G.warCall.assault !== 'vdefend') body = body.replace(/<div class="act-row wc-go">/, SiegeArms.html(G.warCall) + '<div class="act-row wc-go">');
    return op0(title, body, fn, args, sub);
  };
  // montar o assalto: aríetes, sapadores e fogo
  const st0 = War.start.bind(War);
  War.start = function (...a) { const wc = G.warCall, cfg = wc && wc.cfg ? Object.assign({}, wc.cfg) : null; const r = st0(...a); try { if (SiegeArms.A()) SiegeArms.setup(cfg); } catch (e) { console.error(e); } return r; };
  const up0 = War.update.bind(War);
  War.update = function (dt) { const r = up0(dt); try { SiegeArms.update(dt); } catch (e) { console.error(e); } return r; };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'wfire') { const wc = G.warCall; if (wc) wc.cfg.fire = !wc.cfg.fire; this.showWarCouncil(); return; } return a0(a, d); };
}
// o Conselho de Guerra em tela cheia, em três colunas que cabem sem rolar: o seu exército e as armas de cerco · os dois
// exércitos e as forças · a chance de vitória, as estratégias e as vilas para conquistar
{
  if (!WIDE_PANELS.includes('showWarCouncil')) WIDE_PANELS.push('showWarCouncil');
  const lay = () => {
    const pb = UI.panel && UI.panel.querySelector('.pb'); if (!pb || pb.querySelector('.wcx')) return;
    const kg = pb.querySelector(':scope > .kgrid.two'); if (!kg || kg.children.length < 2) return;
    const [cfg, armies] = [...kg.children], q = s => pb.querySelector(`:scope > ${s}`);
    const odds = q('.war-odds'), arms = q('.wc-arms'), vils = q('.wc-vils');
    const strat = [...pb.querySelectorAll(':scope > .card')].filter(c => c !== odds && c !== arms && c !== vils);
    const col = (cls, list) => { const d = document.createElement('div'); d.className = 'wcx-col ' + cls; for (const n of list) if (n) d.appendChild(n); return d; };
    const grid = document.createElement('div'); grid.className = 'wcx';
    const small = document.body.classList.contains('small'); // no celular as armas de cerco vão para a coluna do meio (mais curta)
    grid.append(col('a', small ? [cfg] : [cfg, arms]), col('b', small ? [armies, arms] : [armies]), col('c', [odds, ...strat, vils]));
    kg.replaceWith(grid); pb.classList.add('wc3');
  };
  const op1 = UI.open.bind(UI);
  UI.open = function (title, body, fn, ...rest) { const r = op1(title, body, fn, ...rest); if (fn === 'showWarCouncil') { try { lay(); } catch (e) { console.error(e); } } return r; };
}
// os aríetes do campo de batalha são guiados pelas armas de cerco (não pelo cerco antigo, que os apagava sem alvo)
{ const eu0 = Sieges.engineUpdate.bind(Sieges); Sieges.engineUpdate = function (e, dt) { if (e && e.battleRam) { e.anim = (e.anim || 0) + dt; e.hurt -= dt; return; } return eu0(e, dt); }; }
