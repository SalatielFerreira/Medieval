'use strict';
// Cerco às vilas: o mesmo campo de batalha do assalto ao castelo, agora para as vilas — dá para conquistar um reino vila
// a vila até chegar no castelo. Cada vila conquistada passa para o reino de quem venceu, e o castelo do reino fica mais
// fraco a cada vila perdida (o portão aguenta menos).
//  • 🛡️ A defesa da vila é do governador: a muralha (paliçada de madeira → paliçada reforçada → muralha de pedra →
//    muralha alta), as torres (arqueiros) e a milícia (moradores armados). Você, governador, melhora na página da vila
//    (Reinado → a vila); os governadores da IA melhoram sozinhos, conforme a vila prospera. As muralhas e os portões que
//    o governador ergue na vila (Construir) também deixam o portão mais forte.
//  • ⚔️ No Conselho de Guerra: "Conquistar uma vila" (as vilas do inimigo, com a defesa de cada uma). Na batalha, arrombe
//    o portão e derrube quem comanda a vila (o governador ou o capitão da milícia).
//  • 🏘️ O inimigo também pode atacar uma vila do seu reino: você defende de dentro das muralhas.
const VDEF = {
  walls:   { icon: '🧱', name: 'Muralha', max: 3, cost: [0, 600, 1800, 4000], lv: ['Paliçada de madeira', 'Paliçada reforçada', 'Muralha de pedra', 'Muralha alta'] },
  towers:  { icon: '🗼', name: 'Torres', max: 3, cost: [0, 400, 900, 1800], lv: ['Sem torres', 'Duas torres', 'Quatro torres', 'Seis torres'] },
  militia: { icon: '🛡️', name: 'Milícia', max: 3, cost: [0, 300, 700, 1400], lv: ['Sem treino', 'Milícia treinada', 'Milícia armada', 'Milícia veterana'] },
};
const VillageDef = {
  D(v) { return v.def || (v.def = { walls: 0, towers: 0, militia: 0 }); },
  mine(vi) { const v = World.villages[vi]; return !!v && (v.lord === 'player' || v.chief === 'player'); },
  built(vi) { return World.structs.filter(s => s && !s.removed && s.village === vi && (s.type === 'vwall' || s.type === 'vgate')).length; },
  gateMax(vi) { const v = World.villages[vi], D = this.D(v); return 500 + D.walls * 700 + Math.min(600, this.built(vi) * 15); },
  militia(vi) { const v = World.villages[vi], D = this.D(v); const men = People.residents(vi).filter(p => p.age >= 18 && p.age <= 55 && !p.capanga && !p.kin).length; return Math.min(18, Math.round(men * (0.1 + 0.08 * D.militia))); },
  soldiers(vi) { const v = World.villages[vi]; if (v.free || !G.civs[v.civ]) return 2; return 2 + ((typeof Garrison !== 'undefined' && Garrison.plan(v.civ).v[vi]) || 0); },
  summary(vi) { const D = this.D(World.villages[vi]); return `${VDEF.walls.icon} ${VDEF.walls.lv[D.walls]} · ${VDEF.towers.icon} ${D.towers * 2} torres · ${VDEF.militia.icon} ${this.militia(vi) + this.soldiers(vi)} defensores`; },
  upgrade(vi, k) {
    const v = World.villages[vi], d = VDEF[k]; if (!v || !d) return false;
    if (!this.mine(vi)) { UI.msg('Só o governador decide a defesa da vila.', 'bad'); return false; }
    const D = this.D(v); if (D[k] >= d.max) return false;
    const cost = d.cost[D[k] + 1]; if (P.gold < cost) { UI.msg(`Custa ${cost.toLocaleString('pt-BR')} 🪙.`, 'bad'); return false; }
    P.gold -= cost; D[k]++; Sound.play('coin');
    UI.msg(`${d.icon} ${v.name}: ${d.lv[D[k]]}.`, 'gold');
    return true;
  },
  card(vi) {
    const v = World.villages[vi], D = this.D(v), esc = UI.esc.bind(UI);
    return `<div class="card vd-card"><div class="sec">🛡️ Defesa da vila <span>portão ${this.gateMax(vi).toLocaleString('pt-BR')} · ${this.militia(vi) + this.soldiers(vi)} defensores</span></div>
      <p class="dt-desc">Se um reino atacar ${esc(v.name)}, é isto que segura o portão. As muralhas e portões que você ergue na vila (Construir) também reforçam o portão.</p>
      ${Object.entries(VDEF).map(([k, d]) => { const n = D[k], next = n < d.max ? d.cost[n + 1] : 0; return `<div class="vd-row"><span>${d.icon}</span><span><b>${d.name}: ${d.lv[n]}</b><i class="vd-pips">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</i></span>${n < d.max ? `<button data-act="vdef" data-v="${vi}" data-k="${k}" ${P.gold >= next ? '' : 'disabled'}>${d.lv[n + 1]} — ${next.toLocaleString('pt-BR')} 🪙</button>` : '<b class="ok">✓ máximo</b>'}</div>`; }).join('')}</div>`;
  },
  // os governadores da IA melhoram a defesa conforme a vila prospera
  npcTick() {
    World.villages.forEach((v, vi) => {
      if (!v || v.ruin || this.mine(vi)) return;
      if (Math.random() > 0.05 + Math.min(0.1, (v.prosper || 0) / 300)) return;
      const D = this.D(v), k = ['walls', 'towers', 'militia'].filter(q => D[q] < VDEF[q].max).sort((a, b) => D[a] - D[b])[0]; if (k) D[k]++;
    });
  },
};

const VillageAssault = {
  // as vilas que dá para atacar: as do reino inimigo, as mais perto do seu reino primeiro
  targets(side, enemy) {
    const cp = World.capitals[side] || { x: P.x / TILE, y: P.y / TILE };
    return World.villages.map((v, vi) => ({ v, vi })).filter(x => x.v && !x.v.ruin && !x.v.free && x.v.civ === enemy).sort((a, b) => U.dist(a.v.x, a.v.y, cp.x, cp.y) - U.dist(b.v.x, b.v.y, cp.x, cp.y));
  },
  mineTargets(side) { return World.villages.map((v, vi) => ({ v, vi })).filter(x => x.v && !x.v.ruin && !x.v.free && x.v.civ === side); },
  start(wc) {
    const Z = War.zone() || Places.area(), vi = wc.vi, v = World.villages[vi];
    if (!wc || !Z || !v) { War.simulate(wc); return; }
    UI.close(); if (G.place) Places.exit(true); if (G.dungeon) Dungeon.exit(false);
    const defend = wc.assault === 'vdefend', side = wc.side, enemy = wc.enemy, att = defend ? enemy : side, def = defend ? side : enemy, myC = G.civs[side], D = VillageDef.D(v);
    let cats = Math.min(wc.cfg.cats, Math.floor(myC.treasury / WAR_CAT_COST)); myC.treasury -= cats * WAR_CAT_COST;
    const mine = War.armyOf(side, Object.assign({}, wc.cfg, { cats }));
    const guards = { soldiers: VillageDef.militia(vi) + VillageDef.soldiers(vi), archers: Math.min(70, 20 + D.towers * 15), cats: 0, cav: 0, king: false };
    const attArmy = defend ? Object.assign(War.armyOf(enemy), { king: false }) : Object.assign(mine, { king: false });
    const defArmy = defend ? Object.assign(guards, { soldiers: guards.soldiers + Math.min(20, Math.round(mine.soldiers * 0.5)) }) : guards;
    if (Routine.phase() !== 'day') G.time = NIGHT_LEN + (8 - 6) / 15 * DAYLIGHT_LEN;
    P.mounted = false; P.sailing = false; P.fishing = null;
    const FW = Math.min(150, Z.w - 24), FH = Math.min(90, Z.h - 24), fx0 = Z.x + ((Z.w - FW) >> 1), fy0 = Z.y + ((Z.h - FH) >> 1);
    const keep = Places.carve(Z.x, Z.y, Z.w, Z.h), rng = U.mulberry32((G.day * 431 + vi * 17) >>> 0);
    for (let y = Z.y; y < Z.y + Z.h; y++) for (let x = Z.x; x < Z.x + Z.w; x++) {
      const inF = x >= fx0 && x < fx0 + FW && y >= fy0 && y < fy0 + FH, edge = Math.min(x - fx0, fx0 + FW - 1 - x, y - fy0, fy0 + FH - 1 - y), i = World.idx(x, y);
      if (inF) { World.tiles[i] = T.GRASS; World.obj[i] = 0; } else { World.tiles[i] = T.FOREST; World.obj[i] = edge > -9 && rng() < 0.55 ? (rng() < 0.5 ? 1 : 2) : edge <= -9 ? (rng() < 0.85 ? 2 : 1) : 0; }
    }
    const CW = 26, CH = 22, x0 = fx0 + FW - CW - 10, y0 = fy0 + ((FH - CH) >> 1), gy = y0 + (CH >> 1) - 1;
    World.chunks.clear();
    if (!World.solid || World.solid.length !== WORLD_W * WORLD_H) World.solid = new Uint8Array(WORLD_W * WORLD_H);
    const bid = 7000 + (G.day % 1000);
    G.place = { kind: 'battle', id: bid, side, enemy, own: true, reward: 0, fx0, fy0, w: FW, h: FH, keep, back: { x: P.x, y: P.y }, t: 0, phase: 'intro', mine: defend ? defArmy : attArmy, foe: defend ? attArmy : defArmy,
      start: { [side]: 0, [enemy]: 0 }, kingDown: {}, foeAll: true, form: wc.cfg.form,
      assault: { mode: defend ? 'defend' : 'attack', att, def, x0, y0, w: CW, h: CH, gy, gateHp: 0, gateMax: 0, ramBonus: 1, t: 0, pSwing: 0, village: vi } };
    const A = G.place.assault; A.gateMax = A.gateHp = VillageDef.gateMax(vi);
    if (!defend && typeof Arsenal !== 'undefined') A.ramBonus = 1 + 0.5 * Math.min(3, Arsenal.A().ram || 0);
    Places.furn = [];
    const wood = D.walls < 2;
    const put = (k, x, y, w, h, extra) => { const f = Object.assign({ k, x, y, w, h, id: Places.furn.length, block: true, civ: def, wood }, extra || {}); Places.furn.push(f); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) World.solid[World.idx(x + i, y + j)] = 1; return f; };
    for (let x = x0; x < x0 + CW; x += 4) { put('cwall', x, y0, Math.min(4, x0 + CW - x), 2); put('cwall', x, y0 + CH - 2, Math.min(4, x0 + CW - x), 2); }
    for (let y = y0 + 2; y < y0 + CH - 2; y++) { put('cwall', x0 + CW - 2, y, 2, 1, { vert: true }); if (y < gy || y > gy + 2) put('cwall', x0, y, 2, 1, { vert: true }); }
    const tw = [[x0 - 1, gy - 3], [x0 - 1, gy + 3], [x0 - 1, y0 - 1], [x0 - 1, y0 + CH - 2], [x0 + CW - 2, y0 - 1], [x0 + CW - 2, y0 + CH - 2]].slice(0, D.towers * 2);
    for (const [tx, ty] of tw) put('ctower', tx, ty, 3, 3);
    A.gate = put('cgate', x0, gy, 2, 3);
    // as casas e o poço da vila, lá dentro
    for (const [hx, hy] of [[x0 + 6, y0 + 3], [x0 + 13, y0 + 3], [x0 + 6, y0 + CH - 6], [x0 + 13, y0 + CH - 6], [x0 + CW - 7, gy - 3], [x0 + CW - 7, gy + 3]]) put('bf_house', hx, hy, 3, 2, { seed: hx * 7 + hy });
    Places.furn.push(Object.assign({ k: 'bf_well', x: x0 + 15, y: gy + 1, w: 1, h: 1, id: Places.furn.length }, FURN.bf_well || {}));
    const cy = fy0 + FH / 2, f = FORMATIONS[wc.cfg.form] || FORMATIONS.linha;
    War.deploy(att, attArmy, fx0 + 24, cy, 1, defend ? FORMATIONS.linha : f, defend ? 'enemy' : 'player', false);
    War.deploy(def, defArmy, x0 + 6, gy + 1.5, -1, FORMATIONS.linha, defend ? 'player' : 'enemy', false);
    // quem comanda: o governador da vila (ou o capitão da milícia); no ataque inimigo, o general dele
    const chief = !defend && v.chief !== undefined && v.chief !== 'player' ? People.get(v.chief) : null;
    const cmdName = defend ? `General de ${CIV_DEFS[enemy].short}` : chief && chief.alive ? `${People.full(chief)}, governador${chief.sex === 'f' ? 'a' : ''}` : `Capitão da milícia de ${v.name}`;
    const cmd = Game.spawn('lord', (defend ? fx0 + 16 : x0 + CW - 9) * TILE, (defend ? cy : gy + 1.5) * TILE, { civ: defend ? att : def, leash: 3, siegeOf: 999, mult: 1.2, name: cmdName });
    cmd.battle = bid; cmd.wside = defend ? att : def; cmd.aggroOv = 0; cmd.form = FORMATIONS.linha; cmd.battleKing = true; cmd.noGarrison = true; cmd.home = { x: cmd.x, y: cmd.y }; cmd.post = { x: cmd.x, y: cmd.y };
    for (const e of War.units(def)) {
      if (e === cmd) continue;
      if (!Assault.inside(e)) { e.x = (x0 + 4 + Math.random() * (CW - 12)) * TILE; e.y = (y0 + 3 + Math.random() * (CH - 6)) * TILE; }
      e.post = { x: e.x, y: e.y }; e.home = { x: e.x, y: e.y };
      if (e.archer) { e.x = (x0 + 3 + Math.random() * 2) * TILE; e.post = { x: e.x, y: e.y }; }
    }
    if (defend) { P.x = (x0 + CW - 12) * TILE; P.y = (gy + 3) * TILE; } else { P.x = (fx0 + 16) * TILE; P.y = cy * TILE; }
    P.dir = defend ? -1 : 1; P.hp = Math.max(P.hp, P.maxHp * 0.6);
    if (wc.cfg.capangas) for (const a of Game.allies()) { const s = freeSpotNear(P.x + 30 * P.dir, P.y, 60); a.x = s.x; a.y = s.y; a.target = null; } else for (const a of Game.allies()) { a.benched = true; a.sleeping = true; }
    G.civs[enemy].atWar = true; G.warCall = null; War.badge(null);
    for (const ci of [side, enemy]) G.place.start[ci] = War.fighters(ci).length;
    UI.banner(defend ? `🏘️ ${CIV_DEFS[enemy].short} ataca ${v.name}!` : `🏘️ Ao ataque de ${v.name}!`);
    UI.msg(defend ? `O exército de ${CIV_DEFS[enemy].short} quer tomar ${v.name}. Segure o portão e derrube o general deles.` : `Arrombe o portão de ${v.name} e derrube quem comanda a vila (${cmdName}). ${VillageDef.summary(vi)}.`, 'gold', true);
    Sound.play('horn');
  },
  finish(win) {
    const B = G.place, A = B.assault; if (B.done) return; B.done = true;
    const side = B.side, enemy = B.enemy, myC = G.civs[side], foC = G.civs[enemy], v = World.villages[A.village], D = VillageDef.D(v);
    const lostMine = B.start[side] - War.fighters(side).length, lostFoe = B.start[enemy] - War.fighters(enemy).length;
    const rep = { win, side, enemy, own: true, lostMine, lostFoe, lines: [], knocked: !!B.knockedOut, assault: A.mode };
    G.warRest = G.warRest || {}; G.warRest[Diplo.pairKey(side, enemy)] = G.day + 1;
    const take = (to, from) => {
      v.civ = to; v.free = false; v.chief = undefined; delete v.elected; D.walls = Math.max(0, D.walls - 1); D.militia = Math.max(0, D.militia - 1);
      if (G.civs[from]) G.civs[from].garrison = Math.max(0, G.civs[from].garrison - Math.round((from === enemy ? lostFoe : lostMine) * 0.5));
      if (typeof Families !== 'undefined') Families.refresh(); if (typeof Perf !== 'undefined' && Perf.resDirty) Perf.resDirty(); World.chunks.clear();
    };
    if (A.mode === 'attack') {
      if (win) {
        take(side, enemy); Game.gainXp(180 + lostFoe * 6); Progress.add('battlesWon'); G.fame = (G.fame || 0) + 8;
        const left = World.villages.filter(x => x && !x.ruin && x.civ === enemy).length;
        rep.lines.push(`🏘️ ${v.name} caiu! A vila agora é de ${CIV_DEFS[side].name}.`, left ? `🏰 ${CIV_DEFS[enemy].short} ainda tem ${left} ${left === 1 ? 'vila' : 'vilas'}: cada vila perdida enfraquece o castelo dele.` : `🏰 ${CIV_DEFS[enemy].short} não tem mais vilas: o castelo está sozinho e fraco.`);
        Diplo.chronicle(`🏘️ ${G.name} tomou ${v.name} de ${CIV_DEFS[enemy].short}.`, true); Progress.diary(`🏘️ Conquistou ${v.name} (${lostFoe} defensores caídos, ${lostMine} perdas).`);
      } else {
        const toll = Math.round(myC.treasury * 0.1); myC.treasury -= toll; foC.treasury += toll;
        rep.lines.push(rep.knocked ? '🩸 Você caiu ferido diante da paliçada.' : `🩸 O ataque a ${v.name} fracassou.`, `💰 A campanha custou ${toll} 🪙 ao tesouro.`);
        Progress.diary(`🩸 O ataque a ${v.name} fracassou.`);
      }
    } else if (win) {
      Game.gainXp(150 + lostFoe * 5); Progress.add('battlesWon'); const loot = Math.min(foC.treasury, Math.round(foC.treasury * 0.15) + 40); foC.treasury -= loot; myC.treasury += loot;
      rep.lines.push(`🛡️ ${v.name} resistiu! O inimigo recuou.`, `💰 O acampamento inimigo deixou ${loot} 🪙.`); Progress.diary(`🛡️ Defendeu ${v.name} contra ${CIV_DEFS[enemy].short}.`);
    } else {
      take(enemy, side); rep.lines.push(`🏘️ ${v.name} caiu nas mãos de ${CIV_DEFS[enemy].short}.`); Diplo.chronicle(`🏘️ ${CIV_DEFS[enemy].short} tomou ${v.name} de ${CIV_DEFS[side].short}.`, true);
    }
    War.leave(); UI.showWarReport(rep);
  },
};

{
  // o conselho de guerra: conquistar uma vila; o ataque do inimigo a uma vila sua
  const st0 = War.start.bind(War);
  War.start = function () { const wc = G.warCall; if (wc && wc.own && (wc.assault === 'village' || wc.assault === 'vdefend')) return VillageAssault.start(wc); return st0(); };
  const fi0 = War.finish.bind(War);
  War.finish = function (win) { const A = Assault.A(); if (A && A.village !== undefined) return VillageAssault.finish(win); return fi0(win); };
  // quem comanda a vila caiu: a vila caiu (ou o ataque inimigo se desfez)
  const au0 = Assault.update.bind(Assault);
  Assault.update = function (dt) {
    const A = this.A(), B = G.place;
    if (A && A.village !== undefined && B.phase === 'fight' && !B.done && B.t > 6) {
      const side = A.mode === 'attack' ? A.def : A.att;
      if (!War.units(side).some(e => e.battleKing)) { UI.banner(A.mode === 'attack' ? `🏘️ ${World.villages[A.village].name} caiu!` : '🏘️ O general inimigo caiu!'); War.finish(true); return; }
    }
    return au0(dt);
  };
  // o castelo fica mais fraco a cada vila perdida
  const as0 = Assault.start.bind(Assault);
  Assault.start = function (wc) {
    const r = as0(wc), A = Assault.A();
    if (A && A.village === undefined) {
      const held = World.villages.filter(v => v && !v.ruin && v.civ === A.def).length, f = U.clamp(0.4 + held * 0.2, 0.4, 1);
      if (f < 1) { A.gateMax = A.gateHp = Math.round(A.gateMax * f); UI.msg(`🏘️ ${CIV_DEFS[A.def].short} ${held ? `só tem ${held} ${held === 1 ? 'vila' : 'vilas'}` : 'não tem mais vilas'}: o portão do castelo está mais fraco (${Math.round(f * 100)}%).`, 'gold'); }
    }
    return r;
  };
  // o inimigo às vezes ataca uma vila sua em vez de lutar em campo
  const sm0 = War.summon.bind(War);
  War.summon = function (side, enemy, own) {
    sm0(side, enemy, own);
    const wc = G.warCall;
    if (wc && own && !wc.assault && !Assault.manual && Math.random() < 0.25) { const L = VillageAssault.mineTargets(side); if (L.length) { const t = U.pick(L); wc.assault = 'vdefend'; wc.vi = t.vi; UI.banner(`🏘️ ${CIV_DEFS[enemy].short} marcha contra ${t.v.name}!`); UI.msg(`🏘️ O exército de ${CIV_DEFS[enemy].name} vai atacar ${t.v.name}: prepare a defesa no Conselho de Guerra.`, 'bad', true); } }
  };
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showWarCouncil' && G.warCall && G.warCall.own) {
      const wc = G.warCall, esc = UI.esc.bind(UI);
      if (wc.assault === 'vdefend' && World.villages[wc.vi]) {
        // (o conselho do castelo troca os botões do pé: a defesa da vila entra depois de a janela abrir)
        const v = World.villages[wc.vi], r = op0(title, body, fn, args, sub), go = UI.panel && UI.panel.querySelector('.wc-go');
        if (go) { for (const c of [...UI.panel.querySelectorAll('.card')].filter(c => /Duas estratégias|Cerco ao seu castelo/.test(c.textContent))) c.remove(); go.insertAdjacentHTML('beforebegin', `<div class="card"><div class="sec">🏘️ ${esc(v.name)} sob ataque</div><p class="dt-desc">${CIV_DEFS[wc.enemy].short} vem arrombar o portão de ${esc(v.name)}. ${VillageDef.summary(wc.vi)}. Se a vila cair, passa para o inimigo.</p></div>`); go.innerHTML = `<button class="primary" data-act="vdefgo">🛡️ Defender ${esc(v.name)}</button>`; }
        return r;
      } else if (wc.assault !== 'defend') {
        const L = VillageAssault.targets(wc.side, wc.enemy).slice(0, 5);
        if (L.length) body = body.replace(/<div class="act-row wc-go">/, `<div class="card wc-vils"><div class="sec">🏘️ Conquistar uma vila <span>cada vila tomada enfraquece o castelo de ${CIV_DEFS[wc.enemy].short}</span></div>${L.map(x => `<div class="crow"><span class="ri">🏘️</span><span><b>${esc(x.v.name)}</b><small>${VillageDef.summary(x.vi)} · portão ${VillageDef.gateMax(x.vi).toLocaleString('pt-BR')}</small></span><span class="act-row"><button data-act="vassault" data-v="${x.vi}">⚔️ Atacar</button></span></div>`).join('')}</div><div class="act-row wc-go">`);
      }
    }
    return op0(title, body, fn, args, sub);
  };
  // a defesa na página da vila (governador)
  const vg0 = Reinado.village.bind(Reinado);
  Reinado.village = function (vi) { return vg0(vi) + VillageDef.card(vi); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { VillageDef.npcTick(); } catch (e) { console.error(e); } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'vassault') { const wc = G.warCall; if (!wc) return; wc.assault = 'village'; wc.vi = +d.v; War.start(); return; }
    if (a === 'vdefgo') { War.start(); return; }
    if (a === 'vdef') { VillageDef.upgrade(+d.v, d.k); this.refresh(); return; }
    return a0(a, d);
  };
}
