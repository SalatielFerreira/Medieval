'use strict';
// Invasão de castelo: uma arena de guerra própria, com o castelo do lado de quem defende.
// Quem ataca precisa arrombar o portão (soldados, catapultas, aríetes do arsenal e você mesmo, a golpes), entrar no
// pátio e derrubar o rei. Quem defende atira de trás das muralhas e segura o portão. Vale nos dois sentidos:
//  • você invade (Conselho de Guerra → "Invadir o castelo"): vencer = o reino inimigo é seu;
//  • o inimigo invade o seu castelo (às vezes, em vez da batalha em campo): perder = o reino cai nas mãos dele.
// A batalha em campo aberto continua existindo: serve para enfraquecer a guarnição do adversário.
// Guarnição máxima de um castelo: 30 soldados; até 10 catapultas por exército.

const CASTLE_GARRISON_MAX = 30;
Game.maxGarrison = function () { return CASTLE_GARRISON_MAX; };
// as catapultas: até 10 por exército (conselho, arsenal e o exército da IA)
War.limits = function (wc) { const c = G.civs[wc.side]; return { soldiers: wc.own ? Math.min(WAR_MAX, c.garrison) : 0, cats: Math.min(WAR_CATS_MAX, Math.floor((wc.own ? c.treasury : P.gold) / WAR_CAT_COST)) }; };
{
  const ar0 = War.armyOf.bind(War);
  War.armyOf = function (ci, cfg) { const a = ar0(ci, cfg); if (!cfg) a.cats = Math.min(WAR_CATS_MAX, Math.floor(G.civs[ci].treasury / 400)); return a; };
}

const Assault = {
  A() { const B = G.place; return B && B.kind === 'battle' && B.assault ? B.assault : null; },
  // está dentro das muralhas?
  inside(e) { const A = this.A(); if (!A) return false; const tx = e.x / TILE, ty = (e.y - 6) / TILE; return tx > A.x0 + 1.6 && tx < A.x0 + A.w && ty > A.y0 && ty < A.y0 + A.h; },
  gateFront(k) { const A = this.A(); return { x: (A.x0 - 1.4 - (k % 3) * 0.7) * TILE, y: (A.gy + 0.6 + ((k % 5) - 2) * 0.55) * TILE + 16 }; },
  gateMid() { const A = this.A(); return { x: (A.x0 + 1) * TILE, y: (A.gy + 1.5) * TILE + 6 }; },

  // ---------------------------------------------------------------- começar
  start(wc) {
    const Z = War.zone() || Places.area();
    if (!wc || !Z) { War.simulate(wc); return; }
    UI.close();
    if (G.place) Places.exit(true);
    if (G.dungeon) Dungeon.exit(false);
    const defend = wc.assault === 'defend';
    const side = wc.side, enemy = wc.enemy, myC = G.civs[side], foC = G.civs[enemy];
    const att = defend ? enemy : side, def = defend ? side : enemy;
    // catapultas e o exército de cada lado
    let cats = wc.cfg.cats;
    cats = Math.min(cats, Math.floor(myC.treasury / WAR_CAT_COST)); myC.treasury -= cats * WAR_CAT_COST;
    const stored = Math.min(WAR_CATS_MAX, (typeof Arsenal !== 'undefined' ? Arsenal.A().catapult : 0) || 0);
    const mine = War.armyOf(side, Object.assign({}, wc.cfg, { cats: Math.min(WAR_CATS_MAX, cats + (defend ? 0 : stored)) }));
    const dc = G.civs[def];
    const defArmy = defend ? Object.assign(mine, { archers: Math.max(40, mine.archers) }) : { soldiers: Math.min(CASTLE_GARRISON_MAX, dc.garrison), archers: 40, cats: Math.min(WAR_CATS_MAX, Math.floor(dc.treasury / 400)), cav: Math.min(6, War.knightsOf(def)), king: true };
    const attArmy = defend ? War.armyOf(enemy) : mine;
    if (Routine.phase() !== 'day') G.time = NIGHT_LEN + (8 - 6) / 15 * DAYLIGHT_LEN;
    P.mounted = false; P.sailing = false; P.fishing = null;
    // o terreno: campo aberto e, do lado de quem defende, o castelo
    const FW = Math.min(172, Z.w - 24), FH = Math.min(102, Z.h - 24);
    const fx0 = Z.x + ((Z.w - FW) >> 1), fy0 = Z.y + ((Z.h - FH) >> 1);
    const keep = Places.carve(Z.x, Z.y, Z.w, Z.h);
    const rng = U.mulberry32((G.day * 613 + att * 17 + def) >>> 0);
    for (let y = Z.y; y < Z.y + Z.h; y++) for (let x = Z.x; x < Z.x + Z.w; x++) {
      const inF = x >= fx0 && x < fx0 + FW && y >= fy0 && y < fy0 + FH, edge = Math.min(x - fx0, fx0 + FW - 1 - x, y - fy0, fy0 + FH - 1 - y), i = World.idx(x, y);
      if (inF) { World.tiles[i] = rng() < 0.05 ? T.ROAD : T.GRASS; World.obj[i] = 0; }
      else { World.tiles[i] = T.FOREST; World.obj[i] = edge > -9 && rng() < 0.55 ? (rng() < 0.5 ? 1 : 2) : edge <= -9 ? (rng() < 0.85 ? 2 : 1) : 0; }
    }
    const CW = 32, CH = 28, x0 = fx0 + FW - CW - 12, y0 = fy0 + ((FH - CH) >> 1), gy = y0 + (CH >> 1) - 1;
    for (let y = y0; y < y0 + CH; y++) for (let x = x0; x < x0 + CW; x++) World.tiles[World.idx(x, y)] = T.ROAD;
    // estrada até o portão
    for (let x = fx0 + 20; x < x0; x++) for (let k = 0; k < 3; k++) World.tiles[World.idx(x, gy + k)] = T.ROAD;
    World.chunks.clear();
    if (!World.solid || World.solid.length !== WORLD_W * WORLD_H) World.solid = new Uint8Array(WORLD_W * WORLD_H);
    const bid = 7000 + (G.day % 1000);
    G.place = { kind: 'battle', id: bid, side, enemy, own: true, reward: 0, fx0, fy0, w: FW, h: FH, keep, back: { x: P.x, y: P.y }, t: 0, phase: 'intro', mine: defend ? defArmy : attArmy, foe: defend ? attArmy : defArmy,
      start: { [side]: 0, [enemy]: 0 }, kingDown: {}, foeAll: true, form: wc.cfg.form,
      assault: { mode: defend ? 'defend' : 'attack', att, def, x0, y0, w: CW, h: CH, gy, gateHp: 0, gateMax: 0, ramBonus: 1, t: 0, pSwing: 0 } };
    const A = G.place.assault;
    A.gateMax = A.gateHp = 3000 + (dc.invest && dc.invest.walls ? dc.invest.walls * 400 : 0);
    if (!defend && typeof Arsenal !== 'undefined') A.ramBonus = 1 + 0.5 * Math.min(3, Arsenal.A().ram || 0);
    // muralhas (em pedaços, para ficar na frente ou atrás de quem passa), torres, portão e a torre de menagem
    Places.furn = [];
    const put = (k, x, y, w, h, extra) => { const f = Object.assign({ k, x, y, w, h, id: Places.furn.length, block: true, civ: def }, extra || {}); Places.furn.push(f); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) World.solid[World.idx(x + i, y + j)] = 1; return f; };
    for (let x = x0; x < x0 + CW; x += 4) { put('cwall', x, y0, Math.min(4, x0 + CW - x), 2); put('cwall', x, y0 + CH - 2, Math.min(4, x0 + CW - x), 2); }
    for (let y = y0 + 2; y < y0 + CH - 2; y++) { put('cwall', x0 + CW - 2, y, 2, 1, { vert: true }); if (y < gy || y > gy + 2) put('cwall', x0, y, 2, 1, { vert: true }); }
    for (const [tx, ty] of [[x0 - 1, y0 - 1], [x0 + CW - 2, y0 - 1], [x0 - 1, y0 + CH - 2], [x0 + CW - 2, y0 + CH - 2], [x0 - 1, gy - 3], [x0 - 1, gy + 3]]) put('ctower', tx, ty, 3, 3);
    A.gate = put('cgate', x0, gy, 2, 3);
    put('ckeep', x0 + CW - 12, y0 + (CH >> 1) - 4, 8, 7);
    for (const [bx, by] of [[x0 + 6, y0 + 3], [x0 + 6, y0 + CH - 5], [x0 + CW - 16, y0 + 3], [x0 + CW - 16, y0 + CH - 5]]) Places.furn.push(Object.assign({ k: 'brazier', x: bx, y: by, w: 1, h: 1, id: Places.furn.length }, FURN.brazier || {}));
    // acampamento de quem ataca
    for (const [dx, dy, k] of [[0, -8, 'tent'], [0, 6, 'tent'], [-3, -2, 'tent'], [2, -1, 'flagpole'], [-1, 2, 'campfire2']]) {
      const f = Object.assign({ k, x: fx0 + 10 + dx, y: Math.round(fy0 + FH / 2 + dy), w: k === 'tent' ? 2 : 1, h: 1, id: Places.furn.length, civ: att }, FURN[k] || {});
      Places.furn.push(f); if (f.block) for (let i = 0; i < f.w; i++) World.solid[World.idx(f.x + i, f.y)] = 1;
    }
    // os exércitos: quem ataca no campo, quem defende dentro do castelo
    const cy = fy0 + FH / 2, f = FORMATIONS[wc.cfg.form] || FORMATIONS.linha;
    War.deploy(att, attArmy, fx0 + 26, cy, 1, defend ? FORMATIONS.linha : f, defend ? 'enemy' : 'player', defend);
    War.deploy(def, defArmy, x0 + 6, gy + 1.5, -1, FORMATIONS.linha, defend ? 'player' : 'enemy', !defend);
    for (const e of War.units(def)) {
      if (e.battleKing) { e.x = (x0 + CW - 14) * TILE; e.y = (gy + 1.5) * TILE; }
      // ninguém fica fora das muralhas: quem caiu do lado de fora é levado para o pátio
      if (!this.inside(e)) { e.x = (x0 + 4 + Math.random() * (CW - 18)) * TILE; e.y = (y0 + 3 + Math.random() * (CH - 6)) * TILE; }
      e.post = { x: e.x, y: e.y }; e.home = { x: e.x, y: e.y };
      if (e.archer) { e.x = (x0 + 3 + Math.random() * 2) * TILE; e.post = { x: e.x, y: e.y }; }
    }
    // você: comandando o ataque, ou no pátio do seu castelo
    if (defend) { P.x = (x0 + CW - 16) * TILE; P.y = (gy + 3) * TILE; } else { P.x = (fx0 + 18) * TILE; P.y = cy * TILE; }
    P.dir = defend ? -1 : 1; P.hp = Math.max(P.hp, P.maxHp * 0.6);
    if (wc.cfg.capangas) for (const a of Game.allies()) { const s = freeSpotNear(P.x + 30 * P.dir, P.y, 60); a.x = s.x; a.y = s.y; a.target = null; }
    else for (const a of Game.allies()) { a.benched = true; a.sleeping = true; }
    G.civs[enemy].atWar = true;
    G.warCall = null; War.badge(null);
    for (const ci of [side, enemy]) G.place.start[ci] = War.fighters(ci).length;
    UI.banner(defend ? `🏰 ${CIV_DEFS[enemy].short} cerca o seu castelo!` : `🏰 Ao assalto de ${CIV_DEFS[enemy].short}!`);
    UI.msg(defend ? 'O inimigo quer arrombar o portão e chegar até você, o rei. Segure as muralhas: os seus arqueiros atiram de lá de cima.' : `Arrombe o portão do castelo (catapultas, soldados${A.ramBonus > 1 ? ', aríetes' : ''} e os seus golpes), entre no pátio e derrube ${G.civs[enemy].rulerName}.`, 'gold', true);
    Sound.play('horn');
  },

  // ---------------------------------------------------------------- a cada quadro
  update(dt) {
    const A = this.A(); if (!A) return;
    const B = G.place; A.t -= dt;
    const gateUp = A.gateHp > 0;
    // você golpeando o portão
    if (gateUp && P.swing > 0.2 && A.pSwing <= 0.2 && U.dist(P.x, P.y, this.gateMid().x, this.gateMid().y) < 3 * TILE && A.mode === 'attack') this.hitGate(Game.pDmg() * 1.5, P.x, P.y - 20);
    A.pSwing = P.swing;
    if (B.phase !== 'fight') return;
    const tick = A.t <= 0; if (tick) A.t = 0.25;
    let k = 0;
    for (const e of G.ents) {
      if (e.dead || e.battle !== B.id) continue;
      if (e.wside === A.att && e.faction !== 'engine') {
        if (this.inside(e)) { e.aggroOv = 90; continue; }
        if (gateUp) {
          if (e.archer) { // arqueiros atiram por cima das muralhas, de longe
            const m = this.gateMid(), hx = m.x - 7 * TILE, hy = m.y + ((k % 9) - 4) * TILE * 0.8;
            e.aggroOv = 14; e.home = { x: hx, y: hy }; if (!e.target) { e.wx = hx; e.wy = hy; e.wt = 0.7; } k++; continue;
          }
          const p = this.gateFront(k++);
          if (e.target && (U.dist(e.target.x, e.target.y, e.x, e.y) > 1.8 * TILE || this.inside(e.target))) e.target = null;
          e.aggroOv = 1.5; e.home = { x: p.x, y: p.y }; e.wx = p.x; e.wy = p.y; e.wt = 0.7;
          if (tick && U.dist(e.x, e.y, p.x, p.y) < 2.4 * TILE) { this.hitGate(Math.max(2, e.dmg) * 0.07 * A.ramBonus, e.x, e.y - 16); e.swing = 0.25; e.dir = 1; }
        } else {
          // o portão caiu: todos para dentro, passando pela brecha
          const m = this.gateMid(), tx = m.x + 2.5 * TILE;
          if (e.target && !this.inside(e.target) && U.dist(e.target.x, e.target.y, e.x, e.y) > 1.8 * TILE) e.target = null;
          if (e.target && this.inside(e.target)) e.target = null;
          e.aggroOv = 3; e.home = { x: tx, y: m.y }; e.wx = tx; e.wy = m.y; e.wt = 0.7;
        }
      } else if (e.wside === A.def && e.faction !== 'engine' && e.post) {
        // quem defende guarda o posto enquanto o portão estiver de pé
        if (gateUp) { e.aggroOv = e.archer ? 16 : 2.5; if (!e.archer && e.target && !this.inside(e.target) && U.dist(e.target.x, e.target.y, e.x, e.y) > 1.6 * TILE) e.target = null; e.home = { x: e.post.x, y: e.post.y }; if (!e.target) { e.wx = e.post.x; e.wy = e.post.y; e.wt = 0.7; } }
        else { e.aggroOv = e.battleKing ? 6 : 14; if (e.battleKing) e.home = { x: e.post.x, y: e.post.y }; }
      }
    }
    if (!tick) return;
    // as catapultas de quem ataca miram o portão enquanto ele estiver de pé
    if (gateUp) for (const e of War.units(A.att)) {
      if (e.faction !== 'engine') continue;
      e.gcd = (e.gcd === undefined ? 2 + Math.random() * 3 : e.gcd) - 0.25; if (e.gcd > 0) continue;
      e.gcd = 6 + Math.random() * 1.5; e.cd = 3; e.swing = 0.4; e.dir = 1;
      const m = this.gateMid();
      Sieges.boulders.push({ x0: e.x, y0: e.y - 20, x1: m.x + U.rnd(-14, 14), y1: m.y + U.rnd(-16, 16), t: 0, dur: 1.7, war: true, civ: e.wside, by: e, gate: true });
    }
    // o rei caiu: o castelo cai (ou o ataque se desfaz, se era o rei de quem ataca)
    const king = ci => War.units(ci).find(e => e.battleKing);
    if (!B.done && B.start[A.def] && A.mode === 'attack' && !king(A.def) && B.t > 6) { UI.banner(`👑 ${G.civs[A.def].rulerName} caiu!`); War.finish(true); return; }
    if (!B.done && A.mode === 'defend' && B.hadAttKing && !king(A.att) && B.t > 6) { UI.banner('👑 O rei inimigo caiu: o cerco acabou!'); War.finish(true); return; }
    if (king(A.att)) B.hadAttKing = true;
  },
  hitGate(n, x, y) {
    const A = this.A(); if (!A || A.gateHp <= 0) return;
    A.gateHp = Math.max(0, A.gateHp - n);
    if (Math.random() < 0.3) Game.burst(x + 10, y, '#7a5a30', 4);
    if (A.gateHp <= 0) {
      for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) World.solid[World.idx(A.x0 + i, A.gy + j)] = 0;
      A.gate.block = false; A.gate.broken = true;
      Game.burst((A.x0 + 1) * TILE, (A.gy + 1.5) * TILE, '#7a5a30', 40); Sound.play('mine', { vol: 1 }); Game.shake && Game.shake(8);
      UI.banner('🚪 O portão caiu!'); UI.msg(A.mode === 'attack' ? 'O portão caiu! Para dentro, e derrubem o rei!' : 'O portão caiu! Defendam o pátio e o rei!', A.mode === 'attack' ? 'gold' : 'bad', true);
    }
  },

  // ---------------------------------------------------------------- fim
  finish(win) {
    const B = G.place, A = B.assault; if (B.done) return; B.done = true;
    const side = B.side, enemy = B.enemy, myC = G.civs[side], foC = G.civs[enemy];
    const lostMine = B.start[side] - War.fighters(side).length, lostFoe = B.start[enemy] - War.fighters(enemy).length;
    const rep = { win, side, enemy, own: true, lostMine, lostFoe, lines: [], knocked: !!B.knockedOut, assault: A.mode };
    G.warRest = G.warRest || {}; G.warRest[Diplo.pairKey(side, enemy)] = G.day + 1;
    // as catapultas do arsenal que voltaram
    if (typeof Arsenal !== 'undefined' && A.mode === 'attack') { const back = War.units(side).filter(e => e.battleCat).length, used = Math.min(WAR_CATS_MAX, Arsenal.A().catapult || 0); Arsenal.A().catapult = Math.max(0, (Arsenal.A().catapult || 0) - Math.max(0, used - back)); }
    if (A.mode === 'attack') {
      if (win) {
        Game.gainXp(300 + lostFoe * 8); Progress.add('battlesWon'); G.fame = (G.fame || 0) + 15;
        rep.lines.push(`🏰 O castelo de ${CIV_DEFS[enemy].short} caiu! ${foC.rulerName} foi derrubado.`, `👑 ${CIV_DEFS[enemy].name} agora é seu.`);
        Diplo.chronicle(`🏰 ${G.name} tomou de assalto o castelo de ${CIV_DEFS[enemy].short}.`, true);
        Progress.diary(`🏰 Tomou o castelo de ${CIV_DEFS[enemy].short} (${lostFoe} defensores caídos, ${lostMine} perdas).`);
        if (Diplo.atWar(side, enemy)) Diplo.makePeace(side, enemy, `${CIV_DEFS[enemy].short} foi conquistado`);
        War.leave(); Game.conquer(enemy); UI.showWarReport(rep); return;
      }
      const toll = Math.round(myC.treasury * 0.2); myC.treasury -= toll; foC.treasury += toll;
      rep.lines.push(rep.knocked ? '🩸 Você caiu ferido diante das muralhas e foi carregado de volta.' : '🩸 O assalto fracassou: o seu exército foi destruído diante das muralhas.', `💰 A campanha custou ${toll} 🪙 ao tesouro.`, '⚔️ A guerra continua.');
      myC.happy = Math.max(0, myC.happy - 8);
      Diplo.chronicle(`🛡️ ${CIV_DEFS[enemy].short} resistiu ao assalto de ${CIV_DEFS[side].short}.`, true);
      Progress.diary(`🩸 O assalto ao castelo de ${CIV_DEFS[enemy].short} fracassou.`);
    } else {
      if (win) {
        Game.gainXp(220 + lostFoe * 6); Progress.add('battlesWon'); G.fame = (G.fame || 0) + 10;
        const loot = Math.min(foC.treasury, Math.round(foC.treasury * 0.3) + 60); foC.treasury -= loot; myC.treasury += loot;
        myC.happy = Math.min(100, myC.happy + 10);
        rep.lines.push('🛡️ As muralhas resistiram: o cerco foi rompido!', `💰 O acampamento inimigo deixou ${loot} 🪙 para o tesouro.`);
        if (foC.garrison < 6 && Diplo.atWar(side, enemy)) { Diplo.makePeace(side, enemy, `${CIV_DEFS[enemy].short} perdeu o exército diante das suas muralhas`); rep.lines.push(`🕊️ ${CIV_DEFS[enemy].short} pediu a paz.`); }
        Diplo.chronicle(`🛡️ ${G.name} defendeu o castelo de ${CIV_DEFS[side].short} contra ${CIV_DEFS[enemy].short}.`, true);
        Progress.diary(`🛡️ Defendeu o castelo contra ${CIV_DEFS[enemy].short}.`);
      } else {
        rep.lines.push(rep.knocked ? '🩸 Você caiu no pátio do seu castelo.' : '🩸 Os defensores caíram.', '🏰 O castelo foi tomado.');
        War.cede(side, enemy, rep);
        Diplo.chronicle(`🏰 ${CIV_DEFS[enemy].short} tomou de assalto o castelo de ${CIV_DEFS[side].short}.`, true);
        Progress.diary(`🏰 Perdeu o castelo de ${CIV_DEFS[side].short} para ${CIV_DEFS[enemy].short}.`);
      }
    }
    War.leave(); UI.showWarReport(rep);
  },
  // o inimigo decide se cerca o seu castelo (em vez de lutar em campo)
  decide(wc) {
    if (!wc || !wc.own || this.manual) return;
    const mine = War.power(War.armyOf(wc.side, wc.cfg), War.heroPower()), foe = War.power(War.armyOf(wc.enemy));
    const ch = foe > mine * 1.1 ? 0.55 : foe > mine * 0.8 ? 0.3 : 0.12;
    if (Math.random() < ch) { wc.assault = 'defend'; UI.banner(`🏰 ${CIV_DEFS[wc.enemy].short} marcha contra o seu castelo!`); UI.msg(`🏰 O exército de ${CIV_DEFS[wc.enemy].name} vai cercar o seu castelo: prepare a defesa no Conselho de Guerra.`, 'bad', true); }
  },
  // botão no castelo inimigo: convocar o exército contra ele (estando em guerra)
  castleCard(ci) {
    const mine = G.civs.filter(c => c.ruler === 'player' && Diplo.atWar(c.id, ci));
    if (!mine.length || G.warCall || G.place) return '';
    return `<div class="card"><div class="sec">⚔️ Guerra contra ${CIV_DEFS[ci].short}</div><p class="dt-desc">Convoque o exército de ${CIV_DEFS[mine[0].id].short}: no Conselho de Guerra você escolhe entre a batalha em campo aberto (enfraquece a guarnição deles) e o assalto ao castelo (vencer = o reino é seu).</p>
      <div class="act-row"><button class="primary" data-act="amarch" data-c="${ci}" data-s="${mine[0].id}">🏰 Convocar o exército</button></div></div>`;
  },
};

// ------------------------------------------------------------------ ganchos na guerra
{
  const st0 = War.start.bind(War);
  War.start = function () { const wc = G.warCall; if (wc && wc.own && wc.assault) return Assault.start(wc); return st0(); };
  const up0 = War.update.bind(War);
  War.update = function (dt) { const r = up0(dt); if (Assault.A()) Assault.update(dt); return r; };
  const fi0 = War.finish.bind(War);
  War.finish = function (win) { if (Assault.A()) return Assault.finish(win); return fi0(win); };
  const kn0 = War.knocked.bind(War);
  War.knocked = function () {
    const A = Assault.A();
    if (A && A.mode === 'defend') { P.hp = 1; P.dead = false; G.place.knockedOut = true; War.finish(false); return; } // o rei caiu: o castelo cai
    if (A && A.gateHp > 0) { P.hp = 1; P.dead = false; G.place.knockedOut = true; War.finish(false); return; } // sem você, o portão não cai
    return kn0();
  };
  const la0 = War.land.bind(War);
  War.land = function (b) { if (b.gate && Assault.A()) { Assault.hitGate(85 * Assault.A().ramBonus, b.x1, b.y1); } return la0(b); };
  const sm0 = War.summon.bind(War);
  War.summon = function (side, enemy, own) { sm0(side, enemy, own); if (own && G.warCall && !G.warCall.assault) Assault.decide(G.warCall); };
  // placar: a vida do portão
  const hud0 = War.drawHud.bind(War);
  War.drawHud = function (ctx, cw) {
    hud0(ctx, cw);
    const A = Assault.A(); if (!A) return;
    const w = 220, x = cw / 2 - w / 2, y = 112;
    ctx.fillStyle = 'rgba(20,14,8,0.82)'; ctx.fillRect(x - 6, y - 4, w + 12, 26);
    ctx.fillStyle = '#3a2410'; ctx.fillRect(x, y + 12, w, 6); ctx.fillStyle = A.gateHp > 0 ? '#c8883a' : '#6a6a6a'; ctx.fillRect(x, y + 12, w * A.gateHp / A.gateMax, 6);
    ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText(A.gateHp > 0 ? `🚪 Portão: ${Math.ceil(A.gateHp)} / ${A.gateMax}` : `🚪 Portão arrombado · derrube o rei!`, cw / 2, y + 9); ctx.textAlign = 'left';
  };
  // conselho de guerra: assalto ao castelo ou defesa das muralhas
  const ua0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'wassault') { const wc = G.warCall; if (!wc) return; if (wc.assault !== 'defend') wc.assault = 'attack'; War.start(); return; }
    if (a === 'wfield') { const wc = G.warCall; if (!wc) return; wc.assault = null; War.start(); return; }
    if (a === 'amarch') { if (G.warCall) { UI.showWarCouncil(); return; } Assault.manual = true; try { War.summon(+d.s, +d.c, true); } finally { Assault.manual = false; } if (G.warCall) G.warCall.assault = null; G.warCall.shown = true; G.warCall.deadline = G.realTime + 150; UI.showWarCouncil(); return; }
    return ua0(a, d);
  };
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showCastle' && args && args[0] !== undefined) body += Assault.castleCard(args[0]);
    if (fn === 'showWarCouncil' && G.warCall && G.warCall.own) {
      const wc = G.warCall;
      const btn = wc.assault === 'defend'
        ? `<button class="primary" data-act="wassault">🏰 Defender as muralhas</button>`
        : `<button class="primary" data-act="wfield">⚔️ Batalha em campo aberto</button><button class="primary" data-act="wassault">🏰 Invadir o castelo de ${CIV_DEFS[wc.enemy].short}</button>`;
      const note = wc.assault === 'defend'
        ? `<div class="card"><div class="sec">🏰 Cerco ao seu castelo</div><p class="dt-desc">${CIV_DEFS[wc.enemy].short} vem arrombar o seu portão e chegar até você. Os seus arqueiros atiram de cima das muralhas; se o portão cair, defendam o pátio. Se você cair, o reino cai.</p></div>`
        : `<div class="card"><div class="sec">🧭 Duas estratégias</div><p class="dt-desc"><b>Campo aberto:</b> os exércitos se enfrentam e o perdedor perde soldados da guarnição (bom para enfraquecer o inimigo).<br><b>Assalto ao castelo:</b> arrombe o portão (catapultas, aríetes do arsenal e golpes), entre no pátio e derrube o rei: vencer = o reino é seu. Eles defendem com até ${CASTLE_GARRISON_MAX} soldados atrás das muralhas.</p></div>`;
      body = body.replace(/<div class="act-row wc-go">[\s\S]*?<\/div>$/, `${note}<div class="act-row wc-go">${btn}</div>`);
    }
    return op0(title, body, fn, args, sub);
  };
}

// ------------------------------------------------------------------ desenho: muralhas, torres, portão e torre de menagem
{
  const df0 = drawFurn;
  // eslint-disable-next-line no-global-assign
  drawFurn = function (ctx, f, X, Y, time) {
    if (!['cwall', 'ctower', 'cgate', 'ckeep'].includes(f.k)) return df0(ctx, f, X, Y, time);
    const w = f.w * TILE, h = f.h * TILE;
    const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    const stone = '#9a948a', dark = '#6e6a62', light = '#b8b2a6';
    const col = f.civ !== undefined && f.civ >= 0 ? Game.civColor(f.civ) : '#8e1f2a';
    switch (f.k) {
      case 'cwall': {
        const up = f.vert ? 20 : 22;
        R(0, -up, w, h + up, stone); R(0, -up, w, 4, light); for (let y = -up + 8; y < h; y += 8) R(0, y, w, 1, dark);
        for (let x = (f.vert ? 0 : 4); x < w; x += 16) R(x, -up + (f.vert ? 4 : 8), 1, 8, dark);
        for (let x = 0; x < w; x += 12) R(x, -up - 6, 7, 6, stone);
        R(0, h - 3, w, 3, 'rgba(0,0,0,0.25)');
        break;
      }
      case 'ctower': {
        R(2, -40, w - 4, h + 38, stone); R(2, -40, 6, h + 38, dark); for (let y = -32; y < h; y += 9) R(2, y, w - 4, 1, dark);
        for (let x = 0; x < w; x += 12) R(x, -48, 8, 8, light); R(w / 2 - 4, -24, 8, 12, '#2a2a3a');
        R(w / 2 - 1, -70, 2, 24, '#3a2a1a'); const wv = Math.sin(time * 4 + f.x) * 2; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + w / 2 + 1, Y - 70); ctx.lineTo(X + w / 2 + 16, Y - 66 + wv); ctx.lineTo(X + w / 2 + 1, Y - 60); ctx.fill();
        break;
      }
      case 'cgate': {
        if (f.broken) { for (let k = 0; k < 7; k++) R(4 + (k * 13) % (w - 10), 10 + (k * 17) % (h - 16), 10, 6, k % 2 ? '#6a4423' : '#5a5a5a'); break; }
        const A = Assault.A(), dmg = A ? 1 - A.gateHp / A.gateMax : 0;
        R(0, -22, w, h + 22, dark); R(4, -14, w - 8, h + 10, '#6a4423');
        for (let y = -10; y < h - 4; y += 10) R(4, y, w - 8, 2, '#3a3a40');
        for (let x = 10; x < w - 6; x += 12) R(x, -14, 2, h + 10, '#4a2e16');
        if (dmg > 0.3) R(12, 20, 14, 6, '#2a1a0e'); if (dmg > 0.6) { R(30, 50, 12, 8, '#2a1a0e'); R(8, 70, 18, 6, '#2a1a0e'); }
        R(0, -28, w, 8, light);
        break;
      }
      case 'ckeep': {
        R(0, -50, w, h + 48, '#a8a296'); R(0, -50, 10, h + 48, dark); for (let y = -42; y < h; y += 10) R(0, y, w, 1, dark);
        for (let x = 0; x < w; x += 14) R(x, -58, 9, 8, light);
        for (const x of [24, w - 34]) { R(x, -30, 10, 16, '#2a2a3a'); if (G.darkness > 0.2) R(x + 2, -28, 6, 12, '#ffd36b'); }
        R(w / 2 - 14, h - 40, 28, 38, '#4a2e16'); ctx.fillStyle = '#4a2e16'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 40, 14, Math.PI, 0); ctx.fill();
        R(w / 2 - 1, -90, 2, 34, '#3a2a1a'); const wv = Math.sin(time * 4) * 2; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + w / 2 + 1, Y - 90); ctx.lineTo(X + w / 2 + 22, Y - 84 + wv); ctx.lineTo(X + w / 2 + 1, Y - 76); ctx.fill();
        break;
      }
    }
  };
}
