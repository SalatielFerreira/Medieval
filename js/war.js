'use strict';
// Guerras de verdade. Quando o seu reino está em guerra, todo mês os exércitos se enfrentam: você é convocado (não dá
// para fugir), monta o exército no Conselho de Guerra e parte para o campo de batalha, uma tela só para a luta, onde os
// dois reis estão com os soldados, arqueiros, cavaleiros e catapultas que quiseram levar. A batalha só acaba quando um
// lado destrói o outro por completo. Nas guerras dos outros reinos, um rei amigo pode pedir a sua ajuda.

const FORMATIONS = {
  linha:     { name: 'Linha de batalha', icon: '⚔️', desc: 'Equilibrada: avança em bloco e enfrenta quem chegar.', aggro: 30 },
  cunha:     { name: 'Cunha (ataque)',   icon: '🔺', desc: 'Todos partem para cima na hora. Os cavaleiros rompem as linhas.', aggro: 80, dmg: 1.1 },
  defensiva: { name: 'Defensiva',        icon: '🛡️', desc: 'Espera o inimigo chegar perto; os arqueiros atiram primeiro. Mais vida.', aggro: 13, hp: 1.15 },
};
const WAR_CAT_COST = 150;   // cada catapulta montada pelo tesouro
const WAR_MAX = 40;         // soldados de cada lado no campo (o resto fica de reserva)

const War = {
  // ---------------------------------------------------------------- convocação
  call() { return G.warCall || null; },
  // o reino seu numa guerra (ou null)
  mySide(w) { const a = G.civs[w.a], b = G.civs[w.b]; if (!a || !b) return null; if (a.ruler === 'player' && b.ruler !== 'player') return w.a; if (b.ruler === 'player' && a.ruler !== 'player') return w.b; return null; },
  // uma vez por mês, para cada guerra do seu reino: os exércitos vão se enfrentar
  monthWar(w) {
    const mine = this.mySide(w); if (mine === null) return;
    if (G.warCall || (G.place && G.place.kind === 'battle')) return;
    if (G.warRest && G.warRest[Diplo.pairKey(w.a, w.b)] > G.day) return; // descanso depois de uma batalha
    this.summon(mine, mine === w.a ? w.b : w.a, true);
  },
  summon(side, enemy, own) {
    G.warCall = { side, enemy, own: !!own, day: G.day, shown: false, deadline: null, cfg: this.defaults(side, own) };
    UI.banner(own ? `⚔️ ${CIV_DEFS[enemy].short} marcha contra o seu reino!` : `⚔️ ${CIV_DEFS[side].short} pede a sua ajuda!`);
    UI.msg(own ? `⚔️ O exército de ${CIV_DEFS[enemy].name} se aproxima de ${CIV_DEFS[side].short}. Monte o seu exército no Conselho de Guerra: vocês partem em breve.` : `⚔️ Você aceitou lutar ao lado de ${CIV_DEFS[side].name}. Monte o seu grupo no Conselho de Guerra.`, 'bad', true);
    Sound.play('ui');
  },
  // rei amigo pede ajuda numa guerra entre outros reinos
  invite(side, enemy) {
    if (G.warCall || G.place || G.dungeon || P.dead) return;
    const reward = 250 + Math.min(600, Math.round(G.civs[side].treasury * 0.2));
    Dialog.confirm({ icon: '📯', title: `${CIV_DEFS[side].short} pede ajuda`, text: `Um mensageiro de ${G.civs[side].rulerName} chega a galope: ${CIV_DEFS[side].name} está em guerra contra ${CIV_DEFS[enemy].name}. O soberano pede que você lute ao lado dele no campo de batalha. Recompensa prometida: cerca de ${reward} 🪙.`, ok: 'Aceitar e ir à guerra', cancel: 'Recusar' },
      () => { this.summon(side, enemy, false); G.warCall.reward = reward; UI.showWarCouncil(); },
      () => { Game.addRelation(side, -6); UI.msg(`Você recusou o pedido de ${CIV_DEFS[side].short} (−6 relação).`); });
  },
  // configuração inicial do exército
  defaults(side, own) {
    const c = G.civs[side];
    const sold = own ? Math.min(WAR_MAX, c.garrison) : 0;
    return { soldiers: sold, archers: 30, cats: own ? Math.min(2, Math.floor(c.treasury / WAR_CAT_COST / 2)) : 0, knights: true, capangas: true, form: 'linha' };
  },
  // limites do conselho: soldados da guarnição e catapultas que o tesouro (ou o seu bolso) paga
  limits(wc) { const c = G.civs[wc.side]; return { soldiers: wc.own ? Math.min(WAR_MAX, c.garrison) : 0, cats: Math.min(4, Math.floor((wc.own ? c.treasury : P.gold) / WAR_CAT_COST)) }; },
  clampCfg(wc) { const L = this.limits(wc), c = wc.cfg; c.soldiers = U.clamp(c.soldiers | 0, 0, L.soldiers); c.cats = U.clamp(c.cats | 0, 0, L.cats); c.archers = U.clamp(c.archers | 0, 0, 70); if (!FORMATIONS[c.form]) c.form = 'linha'; },
  knightsOf(ci) { return G.people.filter(p => p.alive && p.rank === 'knight' && !p.capanga && p.home.type === 'castle' && p.home.civ === ci).length; },
  // o que cada rei leva: o seu lado pela configuração; o rei inimigo leva quase tudo (guarda uma reserva se for grande)
  armyOf(ci, cfg) {
    const c = G.civs[ci];
    // uma parte da tropa vai montada (cavaleiros), somada aos cavaleiros nobres do reino
    const horse = n => Math.min(8, Math.floor(n * 0.12));
    if (cfg) { const n = Math.min(cfg.soldiers, c.garrison, WAR_MAX), h = horse(n); return { soldiers: n - h, archers: cfg.archers, cats: cfg.cats, cav: (cfg.knights ? Math.min(6, this.knightsOf(ci)) : 0) + h, king: true }; }
    const g = c.garrison, take = g > 8 ? Math.round(g * 0.75) : g, n = Math.min(WAR_MAX, take), h = horse(n);
    return { soldiers: n - h, archers: 30, cats: Math.min(3, Math.floor(c.treasury / 400)), cav: Math.min(6, this.knightsOf(ci)) + h, king: true, all: take >= g };
  },
  power(a, extra) { return a.soldiers * (1 - a.archers / 100) * 1 + a.soldiers * a.archers / 100 * 0.9 + a.cav * 1.8 + a.cats * 3 + (a.king ? 4 : 0) + (extra || 0); },
  heroPower() { return 2 + P.level / 3 + Game.allies().length * 1.5; },
  // o conselho abre sozinho quando a convocação chega (e você não está ocupado); a do seu reino parte sozinha no prazo
  // aviso de pontos de nível (abre a escolha sozinho quando não há luta por perto)
  levelBadge() {
    let el = document.getElementById('lvlpts');
    const n = P.statPts || 0;
    if (!n || G.state !== 'play') { if (el && el.classList) el.classList.add('hidden'); return; }
    if (!el || !el.classList) { el = document.createElement('button'); el.id = 'lvlpts'; el.className = 'lvlpts'; el.addEventListener && el.addEventListener('click', () => UI.showLevelUp()); document.body.appendChild(el); }
    el.classList.remove('hidden');
    const t = `⭐ ${n} ${n === 1 ? 'ponto' : 'pontos'} de nível para distribuir`; if (el.textContent !== t) el.textContent = t;
    const calm = !UI.isOpen() && !UI.modal && !G.duel && !G.siege && !this.isBattle() && !G.ents.some(e => !e.dead && e.target === P);
    if (calm && (this.lvT || 0) < G.realTime && n > (this.lvSeen || 0)) { this.lvSeen = n; this.lvT = G.realTime + 2; UI.showLevelUp(); }
    if (!n) this.lvSeen = 0;
  },
  tick() {
    this.levelBadge();
    const wc = G.warCall;
    if (!wc || G.state !== 'play' || P.dead) { this.badge(null); return; }
    if (G.place && G.place.kind === 'battle') { this.badge(null); return; }
    const busy = G.dungeon || G.place || G.duel || G.siege || UI.modal;
    if (!wc.shown && !busy && !UI.isOpen()) { wc.shown = true; wc.deadline = G.realTime + 150; UI.showWarCouncil(); }
    if (wc.own && wc.deadline && G.realTime > wc.deadline && !busy) { UI.msg('⚔️ O prazo acabou: o exército partiu com a configuração do conselho.', 'bad'); this.start(); return; }
    this.badge(wc);
  },
  // aviso fixo na tela: guerra marcada
  badge(wc) {
    let el = document.getElementById('warcall');
    if (!wc) { if (el && el.classList) el.classList.add('hidden'); return; }
    if (!el || !el.classList) {
      el = document.createElement('button'); el.id = 'warcall'; el.className = 'warcall';
      el.addEventListener && el.addEventListener('click', () => UI.showWarCouncil());
      document.body.appendChild(el);
    }
    el.classList.remove('hidden');
    const left = wc.deadline ? Math.max(0, Math.ceil(wc.deadline - G.realTime)) : null;
    const t = `⚔️ ${wc.own ? 'Guerra contra' : 'Ajudar contra'} ${CIV_DEFS[wc.enemy].short}${wc.own && left !== null ? ` · o exército parte em ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : ''} — Conselho de Guerra`;
    if (el.textContent !== t) el.textContent = t;
  },
  // desistir só é possível nas guerras dos outros
  decline() {
    const wc = G.warCall; if (!wc || wc.own) return;
    Game.addRelation(wc.side, -10); G.warCall = null; this.badge(null);
    UI.msg(`Você voltou atrás e não foi à guerra de ${CIV_DEFS[wc.side].short} (−10 relação).`, 'bad');
  },

  // ---------------------------------------------------------------- o campo de batalha
  start() {
    const wc = G.warCall, Z = Places.area();
    if (!wc) return;
    UI.close();
    if (!Z) { this.simulate(wc); return; } // mundo sem mar em volta: a batalha é decidida no conselho
    if (G.place) Places.exit(true);
    if (G.dungeon) Dungeon.exit(false);
    const cfg = wc.cfg, side = wc.side, enemy = wc.enemy, myC = G.civs[side];
    // catapultas montadas com o tesouro do reino (ou do seu bolso, numa guerra dos outros)
    let cats = cfg.cats;
    if (wc.own) { cats = Math.min(cats, Math.floor(myC.treasury / WAR_CAT_COST)); myC.treasury -= cats * WAR_CAT_COST; }
    else { cats = Math.min(cats, Math.floor(P.gold / WAR_CAT_COST)); P.gold -= cats * WAR_CAT_COST; }
    const mine = wc.own ? this.armyOf(side, Object.assign({}, cfg, { cats })) : Object.assign(this.armyOf(side), { cats: this.armyOf(side).cats + cats });
    const foe = this.armyOf(enemy);
    if (Routine.phase() !== 'day') G.time = NIGHT_LEN + (8 - 6) / 15 * DAYLIGHT_LEN; // a marcha leva a noite: a luta começa de manhã
    P.mounted = false; P.sailing = false; P.fishing = null;
    // o terreno: campo aberto cercado de mata
    const FW = Math.min(100, Z.w - 24), FH = Math.min(62, Z.h - 24);
    const fx0 = Z.x + ((Z.w - FW) >> 1), fy0 = Z.y + ((Z.h - FH) >> 1);
    const keep = Places.carve(Z.x, Z.y, Z.w, Z.h);
    const rng = U.mulberry32((G.day * 977 + side * 31 + enemy) >>> 0);
    for (let y = Z.y; y < Z.y + Z.h; y++) for (let x = Z.x; x < Z.x + Z.w; x++) {
      const inF = x >= fx0 && x < fx0 + FW && y >= fy0 && y < fy0 + FH;
      const edge = Math.min(x - fx0, fx0 + FW - 1 - x, y - fy0, fy0 + FH - 1 - y);
      const i = World.idx(x, y);
      if (inF) { World.tiles[i] = rng() < 0.05 ? T.ROAD : T.GRASS; World.obj[i] = 0; }
      else { World.tiles[i] = T.FOREST; World.obj[i] = edge > -9 && rng() < 0.55 ? (rng() < 0.5 ? 1 : 2) : edge <= -9 ? (rng() < 0.85 ? 2 : 1) : 0; }
    }
    // algumas pedras e arbustos no meio do campo
    for (let k = 0; k < 10; k++) { const x = fx0 + 20 + Math.floor(rng() * (FW - 40)), y = fy0 + 4 + Math.floor(rng() * (FH - 8)); if (Math.abs(x - (fx0 + FW / 2)) > 4) World.obj[World.idx(x, y)] = rng() < 0.5 ? 3 : 1; }
    World.chunks.clear();
    if (!World.solid || World.solid.length !== WORLD_W * WORLD_H) World.solid = new Uint8Array(WORLD_W * WORLD_H);
    const bid = 7000 + (G.day % 1000);
    G.place = { kind: 'battle', id: bid, side, enemy, own: wc.own, reward: wc.reward || 0, fx0, fy0, w: FW, h: FH, keep, back: { x: P.x, y: P.y }, t: 0, phase: 'intro', mine, foe,
      start: { [side]: 0, [enemy]: 0 }, kingDown: {}, foeAll: !!foe.all, form: cfg.form };
    // acampamentos atrás de cada exército
    Places.furn = [];
    const camp = (x0, flip, ci) => {
      for (const [dx, dy, k] of [[0, -8, 'tent'], [0, 6, 'tent'], [-3, -2, 'tent'], [2, -1, 'flagpole'], [2, 3, 'flagpole'], [-1, 2, 'campfire2']]) {
        const f = Object.assign({ k, x: x0 + dx * flip, y: Math.round(fy0 + FH / 2 + dy), w: k === 'tent' ? 2 : 1, h: 1, id: Places.furn.length, civ: ci }, FURN[k] || {});
        Places.furn.push(f);
        if (f.block) for (let i = 0; i < f.w; i++) World.solid[World.idx(f.x + i, f.y)] = 1;
      }
    };
    camp(fx0 + 4, 1, side); camp(fx0 + FW - 6, -1, enemy);
    // os exércitos
    const cy = fy0 + FH / 2, f = FORMATIONS[cfg.form] || FORMATIONS.linha;
    this.deploy(side, mine, fx0 + FW * 0.3, cy, 1, wc.own ? f : FORMATIONS.linha, 'player', !wc.own);
    this.deploy(enemy, foe, fx0 + FW * 0.7, cy, -1, FORMATIONS.linha, 'enemy', true);
    // o herói: se o reino é seu, você é o rei e fica no centro do seu exército
    P.x = (fx0 + FW * 0.3 - 7) * TILE; P.y = cy * TILE; P.dir = 1; P.hp = Math.max(P.hp, P.maxHp * 0.6);
    if (cfg.capangas) for (const a of Game.allies()) { const s = freeSpotNear(P.x + 30, P.y, 60); a.x = s.x; a.y = s.y; a.target = null; }
    if (!cfg.capangas) for (const a of Game.allies()) { a.benched = true; a.sleeping = true; }
    if (!wc.own) G.place.prevWar = G.civs[enemy].atWar;
    G.civs[enemy].atWar = true; // os soldados inimigos atacam você e os seus
    G.warCall = null; this.badge(null);
    for (const ci of [side, enemy]) G.place.start[ci] = this.fighters(ci).length;
    UI.banner(`⚔️ ${CIV_DEFS[side].short} × ${CIV_DEFS[enemy].short}`);
    UI.msg(`Os exércitos se encaram no campo de batalha. ${wc.own ? 'Você comanda o seu reino: só há uma saída, a vitória!' : `Você luta ao lado de ${G.civs[side].rulerName}.`}`, 'gold', true);
    Sound.play('horn');
  },
  // põe um exército em formação
  deploy(ci, a, x0, cy, dir, form, sideTag, withKing) {
    const bid = G.place.id, spawn = (kind, x, y, o) => {
      const e = Game.spawn(kind, x * TILE, y * TILE, Object.assign({ civ: ci, leash: 3, siegeOf: 999 }, o || {}));
      e.battle = bid; e.wside = ci; e.aggroOv = 0; e.form = form; e.home = { x: e.x, y: e.y };
      if (form.hp) { e.maxHp = Math.round(e.maxHp * form.hp); e.hp = e.maxHp; }
      if (form.dmg) e.dmg = Math.round(e.dmg * form.dmg);
      return e;
    };
    const ar = Math.round(a.soldiers * a.archers / 100), inf = a.soldiers - ar;
    const col = (n, x, gap) => { const rows = Math.min(10, Math.max(1, n)); for (let k = 0; k < n; k++) { const c = Math.floor(k / rows), r = k % rows; out.push([x - dir * c * 1.3, cy + (r - (Math.min(rows, n - c * rows) - 1) / 2) * gap]); } };
    let out = [];
    col(inf, x0, 1.25);
    const nS = Math.round(inf * 0.35), nL = Math.round(inf * 0.3);
    out.forEach(([x, y], k) => {
      const e = spawn('guard', x, y, { mult: 1.05 });
      if (k < nS) { e.unit = 'shield'; e.maxHp = e.hp = Math.round(e.maxHp * 1.45); e.dmg = Math.round(e.dmg * 0.85); e.spMul = 0.9; e.name = 'Escudeiro de ' + CIV_DEFS[ci].short; }
      else if (k < nS + nL) { e.unit = 'spear'; e.reach = 16; e.dmg = Math.round(e.dmg * 1.1); e.name = 'Lanceiro de ' + CIV_DEFS[ci].short; }
    });
    out = []; col(ar, x0 - dir * 4.5, 1.35); for (const [x, y] of out) spawn('guard', x, y, { archer: true });
    for (let k = 0; k < a.cav; k++) { const e = spawn('guard', x0 + dir * 1, cy + (k % 2 ? 1 : -1) * (8 + Math.floor(k / 2) * 1.6), { mult: 1.6 }); e.mounted = true; e.spMul = 1.55; e.noGarrison = true; e.name = 'Cavaleiro de ' + CIV_DEFS[ci].short; }
    for (let k = 0; k < a.cats; k++) { const e = spawn('catapult_e', x0 - dir * 9, cy + (k - (a.cats - 1) / 2) * 4); e.side = sideTag; e.cd = 3 + k; e.battleCat = true; e.noGarrison = true; }
    if (withKing) { const e = spawn('lord', x0 - dir * 7, cy, { mult: 1.5, name: G.civs[ci].rulerName }); e.battleKing = true; e.noGarrison = true; }
  },
  fighters(ci) { return this.units(ci).filter(e => e.faction !== 'engine'); },
  units(ci) { return G.ents.filter(e => !e.dead && e.battle === (G.place && G.place.id) && e.wside === ci); },
  isBattle() { return !!(G.place && G.place.kind === 'battle'); },
  // a cada quadro: começo da carga, catapultas, fim da batalha
  // botão de rendição (só aparece no campo de batalha)
  surrenderBtn() {
    let b = document.getElementById('surrenderBtn');
    if (!b) {
      b = document.createElement('button'); b.id = 'surrenderBtn'; b.className = 'hidden'; b.innerHTML = '🏳️ <span>Render-se</span>';
      b.addEventListener('click', e => { e.stopPropagation(); this.askSurrender(); });
      document.body.appendChild(b);
    }
    return b;
  },
  askSurrender() {
    const B = G.place; if (!B || B.kind !== 'battle' || B.done) return;
    const own = B.own && G.civs[B.side] && G.civs[B.side].ruler === 'player';
    Dialog.confirm({ icon: '🏳️', title: 'Render-se', danger: true, ok: 'Render-se',
      text: own ? `Render-se a ${Diplo.name(B.enemy)}? Você sai vivo, mas ${CIV_DEFS[B.side].name} passa para o adversário (um governador da casa dele assume o trono) e metade do tesouro vai para ele. A guerra acaba.`
        : `Render-se e deixar o campo? A batalha está perdida: ${G.civs[B.side] ? G.civs[B.side].rulerName : 'o reino'} não vai gostar e a sua fama diminui, mas você sai vivo.` },
      () => this.surrender());
  },
  surrender() {
    const B = G.place; if (!B || B.kind !== 'battle' || B.done) return;
    B.surrendered = true;
    this.finish(false);
  },
  // o reino rendido passa para o vencedor: um governador da casa dele assume o trono
  cede(side, enemy, rep) {
    const c = G.civs[side], att = G.civs[enemy];
    const gov = People.create({ rank: 'ruler', civ: side, home: { type: 'castle', civ: side }, age: U.rint(30, 50), aff: -40, surname: (Families.of(People.get(att.rulerId)) || {}).surname });
    Heraldry.apply(); c.ruler = 'npc'; c.rulerId = gov.id; c.rulerName = People.title(gov) + ' ' + gov.name; c.relation = -30; c.happy = Math.max(20, c.happy - 15); c.overlord = enemy;
    const tribute = Math.round(c.treasury * 0.5); c.treasury -= tribute; att.treasury += tribute;
    if (Diplo.atWar(side, enemy)) Diplo.makePeace(side, enemy, `${CIV_DEFS[side].short} se rendeu`);
    if (G.mainRealm === side) G.mainRealm = null;
    rep.lines.push(`👑 ${CIV_DEFS[side].name} passou para ${Diplo.name(enemy)}: ${c.rulerName} governa agora em nome de ${att.rulerName}.`, `💰 ${tribute} 🪙 do tesouro foram entregues ao vencedor.`, '🕊️ A guerra acabou. Você está vivo, mas sem essa coroa.');
    UI.banner(`🏳️ ${CIV_DEFS[side].short} se rendeu`);
    Diplo.chronicle(`🏳️ ${G.name} ${G.surname} se rendeu no campo de batalha e entregou ${CIV_DEFS[side].name} a ${Diplo.name(enemy)}.`, true);
    Progress.diary(`🏳️ Rendeu-se a ${Diplo.name(enemy)} e perdeu ${CIV_DEFS[side].name}.`);
  },
  update(dt) {
    const B = G.place;
    { const sb = this.surrenderBtn(); sb.classList.toggle('hidden', !B || B.kind !== 'battle' || !!B.done || !!P.dead); }
    if (!B || B.kind !== 'battle') { this.tick(); return; }
    this.levelBadge();
    B.t += dt;
    if (B.phase === 'intro' && B.t > 4) {
      B.phase = 'fight'; UI.banner('📯 À carga!'); Sound.play('horn');
      for (const e of G.ents) if (e.battle === B.id) e.aggroOv = e.wside === B.side && B.own ? (e.form.aggro || 30) : 30;
    }
    if (B.phase === 'fight') {
      // depois de um tempo todos avançam (ninguém fica parado esperando)
      if (B.t > 22) for (const e of G.ents) if (e.battle === B.id && e.aggroOv < 90) e.aggroOv = 90;
      // quem está sem inimigo por perto marcha para o lado do inimigo
      B.mt = (B.mt || 0) - dt;
      if (B.mt <= 0) {
        B.mt = 0.6;
        for (const e of G.ents) {
          if (e.dead || e.battle !== B.id || e.target || e.faction === 'engine') continue;
          const foes = this.units(e.wside === B.side ? B.enemy : B.side);
          const t = foes.length ? foes.reduce((b, o) => U.dist(o.x, o.y, e.x, e.y) < U.dist(b.x, b.y, e.x, e.y) ? o : b) : (e.wside !== B.side ? P : null);
          if (t) { const a = Math.atan2(t.y - e.y, t.x - e.x); e.home = { x: e.x + Math.cos(a) * 3 * TILE, y: e.y + Math.sin(a) * 3 * TILE }; e.wx = e.home.x; e.wy = e.home.y; e.wt = 0.7; }
        }
      }
      // o lado sem ninguém que lute (soldados, cavaleiros e o rei) foi destruído; as catapultas dele são capturadas
      const mineN = this.fighters(B.side).length, foeN = this.fighters(B.enemy).length;
      if (foeN === 0) this.finish(true);
      else if (mineN === 0 && P.dead) this.finish(false);
    }
  },
  // catapulta no campo: escolhe um grupo inimigo e lança uma pedra
  catUpdate(e, dt) {
    e.anim += dt; e.hurt -= dt; e.cd -= dt; e.moving = false; e.swing = Math.max(0, (e.swing || 0) - dt);
    const B = G.place; if (!B || B.phase !== 'fight' || e.cd > 0) return;
    const foes = this.units(e.wside === B.side ? B.enemy : B.side).concat(e.wside === B.enemy ? [P] : []).filter(o => U.dist(o.x, o.y, e.x, e.y) > 5 * TILE && U.dist(o.x, o.y, e.x, e.y) < 30 * TILE);
    if (!foes.length) return;
    const t = U.pick(foes);
    e.cd = 4.2 + Math.random(); e.swing = 0.4; e.dir = t.x < e.x ? -1 : 1;
    Sieges.boulders.push({ x0: e.x, y0: e.y - 20, x1: t.x + U.rnd(-20, 20), y1: t.y + U.rnd(-14, 14), t: 0, dur: 1.5, war: true, civ: e.wside, by: e });
    Sound.play('bow', { vol: 0.8 });
  },
  // a pedra caiu: fere todos do outro lado por perto
  land(b) {
    Game.burst(b.x1, b.y1, '#7a7468', 16); Sound.play('mine', { vol: 0.9 }); Game.shake && Game.shake(4);
    const B = G.place; if (!B) return;
    for (const e of G.ents) if (!e.dead && e.battle === B.id && e.wside !== b.civ && U.dist(e.x, e.y, b.x1, b.y1) < 46) Game.damage(e, e.faction === 'engine' ? 60 : 34, null);
    if (b.civ === B.enemy && U.dist(P.x, P.y, b.x1, b.y1) < 46) Game.damage(P, 22, null);
    if (b.civ === B.side) for (const a of Game.allies()) if (U.dist(a.x, a.y, b.x1, b.y1) < 46) void a; // as suas pedras não ferem os seus
  },
  // o herói caiu no campo: é carregado ferido, e a batalha se decide sem ele
  knocked() {
    const B = G.place;
    P.hp = 1; P.dead = false;
    const str = ci => this.fighters(ci).reduce((s, e) => s + Math.max(0, e.hp) * Math.max(1, e.dmg) / 600 + (e.faction === 'engine' ? 2 : 0), 0);
    const mine = str(B.side) + Game.allies().length * 0.8, foe = str(B.enemy);
    const win = mine > 0 && mine * U.rnd(0.85, 1.15) > foe;
    // as baixas da parte que faltou: o lado que perdeu é destruído
    for (const e of this.units(win ? B.enemy : B.side)) { if (e.faction === 'engine' || e.battleKing || e.noGarrison) e.dead = true; else Game.kill(e, null); }
    B.knockedOut = true;
    this.finish(win);
  },

  // ---------------------------------------------------------------- fim da batalha
  finish(win) {
    const B = G.place; if (!B || B.done) return; B.done = true;
    const side = B.side, enemy = B.enemy, myC = G.civs[side], foC = G.civs[enemy];
    const lostMine = B.start[side] - this.fighters(side).length, lostFoe = B.start[enemy] - this.fighters(enemy).length;
    const rep = { win, side, enemy, own: B.own, lostMine, lostFoe, lines: [], knocked: !!B.knockedOut };
    G.warRest = G.warRest || {}; G.warRest[Diplo.pairKey(side, enemy)] = G.day + 1;
    if (win) {
      Game.gainXp(150 + lostFoe * 6); Progress.add('battlesWon'); G.fame = (G.fame || 0) + 6;
      const loot = Math.min(foC.treasury, Math.round(foC.treasury * 0.4) + 80); foC.treasury -= loot;
      if (B.own) {
        // o rei inimigo foi capturado: se ele trouxe o exército inteiro, o reino se rende
        if (B.foeAll && foC.garrison <= 1 && foC.ruler !== 'player') {
          rep.lines.push(`👑 O rei inimigo foi capturado sem exército em casa: ${CIV_DEFS[enemy].name} se rendeu a você!`);
          Diplo.makePeace(side, enemy, 'o reino se rendeu');
          this.leave(); Game.conquer(enemy); UI.showWarReport(rep); return;
        }
        myC.treasury += loot; rep.lines.push(`💰 O rei capturado pagou ${loot} 🪙 de resgate ao tesouro de ${CIV_DEFS[side].short}.`);
        const vs = Diplo.villagesOf(enemy);
        if (vs.length > 1) { const v = vs.reduce((b, x) => U.dist(x.x, x.y, World.capitals[side].x, World.capitals[side].y) < U.dist(b.x, b.y, World.capitals[side].x, World.capitals[side].y) ? x : b);
          Diplo.captureVillage(v, side, true); World.buildMinimap(); rep.lines.push(`🏴 ${v.name} passou para o seu reino.`); }
        Diplo.makePeace(side, enemy, `${CIV_DEFS[enemy].short} perdeu a batalha e pediu a paz`);
        rep.lines.push(`🕊️ ${CIV_DEFS[enemy].short} pediu a paz.`);
        myC.happy = Math.min(100, myC.happy + 8);
      } else {
        const g = B.reward || 300; P.gold += g; Game.addRelation(side, 25); Court.addService(side, 15); foC.treasury += 0; G.civs[side].treasury += loot;
        rep.lines.push(`💰 ${G.civs[side].rulerName} pagou a recompensa: ${g} 🪙 (+25 relação).`);
        Game.addRelation(enemy, -30); rep.lines.push(`😠 ${CIV_DEFS[enemy].short} não vai esquecer (−30 relação).`);
        if (Diplo.atWar(side, enemy)) Diplo.makePeace(side, enemy, `${CIV_DEFS[enemy].short} perdeu a batalha em campo aberto`);
      }
      Diplo.chronicle(`🏆 ${CIV_DEFS[side].short} venceu ${CIV_DEFS[enemy].short} numa grande batalha${B.own ? ` comandada por ${G.name}` : ` com a ajuda de ${G.name}`}.`, true);
      Progress.diary(`⚔️ Venceu a batalha contra ${CIV_DEFS[enemy].short} (${lostFoe} inimigos caídos, ${lostMine} perdas).`);
    } else {
      if (B.surrendered) {
        rep.lines.push('🏳️ Você se rendeu e deixou o campo de batalha com vida.');
        if (B.own && myC.ruler === 'player') this.cede(side, enemy, rep);
        else { Game.addRelation(side, -10); Court.addFame(-5); rep.lines.push(`😞 ${G.civs[side].rulerName} esperava mais de você (−10 relação, −5 de fama).`); }
        Diplo.chronicle(`💀 ${CIV_DEFS[enemy].short} venceu ${CIV_DEFS[side].short} numa grande batalha.`, true);
        this.leave(); UI.showWarReport(rep); return;
      }
      rep.lines.push(rep.knocked ? '🩸 Você foi ferido e carregado para longe do campo.' : '🩸 O seu exército foi destruído.');
      if (B.own) {
        const toll = Math.round(myC.treasury * 0.3); myC.treasury -= toll; foC.treasury += toll; rep.lines.push(`💰 O inimigo levou ${toll} 🪙 do tesouro.`);
        const vs = Diplo.villagesOf(side);
        if (vs.length) { const v = vs.reduce((b, x) => U.dist(x.x, x.y, World.capitals[enemy].x, World.capitals[enemy].y) < U.dist(b.x, b.y, World.capitals[enemy].x, World.capitals[enemy].y) ? x : b);
          Diplo.captureVillage(v, enemy, true); World.buildMinimap(); rep.lines.push(`🔥 ${CIV_DEFS[enemy].short} tomou ${v.name}.`); }
        myC.happy = Math.max(0, myC.happy - 10);
        rep.lines.push('⚔️ A guerra continua: o inimigo voltará no mês que vem. Reforce a guarnição ou peça a paz.');
      } else { Game.addRelation(side, 5); rep.lines.push(`${G.civs[side].rulerName} agradece por ter lutado (+5 relação).`); }
      Diplo.chronicle(`💀 ${CIV_DEFS[enemy].short} derrotou ${CIV_DEFS[side].short} numa grande batalha.`, true);
      Progress.diary(`🩸 Perdeu a batalha contra ${CIV_DEFS[enemy].short}.`);
    }
    this.leave();
    UI.showWarReport(rep);
  },
  // volta para onde você estava antes da marcha
  leave() {
    const B = G.place; if (!B || B.kind !== 'battle') return;
    { const sb = document.getElementById('surrenderBtn'); if (sb) sb.classList.add('hidden'); }
    for (const e of G.ents) if (e.battle === B.id) e.dead = true;
    G.ents = G.ents.filter(e => !e.dead);
    Sieges.boulders = Sieges.boulders.filter(b => !b.war);
    for (const a of G.ents) if (a.kind === 'ally') { if (a.benched) { a.benched = false; a.sleeping = false; continue; } const s = freeSpotNear(B.back.x, B.back.y, 50); a.x = s.x; a.y = s.y; a.target = null; }
    if (!B.own && G.civs[B.enemy] && G.civs[B.enemy].ruler !== 'player' && !Diplo.warsOf(B.enemy).some(w => this.mySide(w) !== null)) G.civs[B.enemy].atWar = !!B.prevWar;
    // árvores derrubadas no campo não voltam a crescer no mar
    const k = B.keep; World.regrow = World.regrow.filter(r => { const x = r.i % WORLD_W, y = (r.i / WORLD_W) | 0; return x < k.x0 || x >= k.x0 + k.w || y < k.y0 || y >= k.y0 + k.h; });
    Places.uncarve(B.keep); Places.furn = [];
    G.place = null;
    P.x = B.back.x; P.y = B.back.y;
    if (World.blockedAt(P.x, P.y, 8)) { const s = freeSpotNear(P.x, P.y, 60); P.x = s.x; P.y = s.y; }
    if (P.hp < P.maxHp * 0.3) P.hp = Math.round(P.maxHp * 0.3);
  },
  // sem campo de batalha possível (mundo antigo, sem mar em volta): o conselho decide pela força
  simulate(wc) {
    const mine = this.power(this.armyOf(wc.side, wc.own ? wc.cfg : null), this.heroPower()), foe = this.power(this.armyOf(wc.enemy));
    const win = mine * U.rnd(0.8, 1.2) > foe;
    G.civs[wc.enemy].garrison = Math.max(0, G.civs[wc.enemy].garrison - (win ? 6 : 2)); G.civs[wc.side].garrison = Math.max(0, G.civs[wc.side].garrison - (win ? 2 : 6));
    G.warCall = null; this.badge(null);
    G.place = { kind: 'battle', fake: true, side: wc.side, enemy: wc.enemy, own: wc.own, reward: wc.reward, start: { [wc.side]: 0, [wc.enemy]: 0 }, keep: { x0: 0, y0: 0, w: 0, h: 0, tiles: [], obj: [] }, back: { x: P.x, y: P.y }, id: -1 };
    this.finish(win);
  },

  // ---------------------------------------------------------------- desenho: placar no alto da tela
  drawHud(ctx, cw) {
    const B = G.place; if (!B || B.kind !== 'battle') return;
    const a = this.units(B.side).length, b = this.units(B.enemy).length;
    const w = Math.min(520, cw - 40), x = cw / 2 - w / 2, y = 20;
    ctx.fillStyle = 'rgba(20,14,8,0.82)'; ctx.fillRect(x - 6, y - 6, w + 12, 46);
    const tot = Math.max(1, a + b);
    ctx.fillStyle = Game.civColor(B.side); ctx.fillRect(x, y + 22, w * a / tot, 10);
    ctx.fillStyle = Game.civColor(B.enemy); ctx.fillRect(x + w * a / tot, y + 22, w * b / tot, 10);
    ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText(`${CIV_DEFS[B.side].short} · ${a}`, x, y + 14);
    ctx.textAlign = 'right'; ctx.fillText(`${b} · ${CIV_DEFS[B.enemy].short}`, x + w, y + 14);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(B.phase === 'intro' ? `Os exércitos se encaram... ${Math.max(1, Math.ceil(4 - B.t))}` : '⚔️', cw / 2, y + 14);
    ctx.textAlign = 'left';
  },
};
