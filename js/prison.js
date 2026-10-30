'use strict';
// A Prisão: cada castelo tem a sua (aparece sozinha perto da capital, como a arena e o cemitério). Quem é pego por um guarda
// e escolhe ir preso cumpre a pena que o rei daquele reino decide — o tamanho vem da multa e do jeito do rei (um rei
// rabugento ou desconfiado é duro; um gentil, brando). O herói fica numa cela trancada lá dentro até cumprir a pena:
// a cama de palha passa um mês e a tigela dá a ração. Lá dentro: o corredor com o carcereiro, guardas, braseiros e as
// celas gradeadas, com os moradores que estão presos de verdade.
CIV_STRUCTS.prison = { name: 'Prisão', blocks: true };
ROOM_TYPES.prison = { lay: 'jail', theme: 'stone', name: s => `Prisão de ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : ''}` };
SHOP_KEEPER.prison = 'jailer';
if (!RANKS.jailer) RANKS.jailer = { m: 'Carcereiro', f: 'Carcereira', order: 6 };
if (!RANK_LOOK.jailer) RANK_LOOK.jailer = '#4a4a52';
if (typeof PEOPLE_OUTFIT !== 'undefined' && !PEOPLE_OUTFIT.jailer) PEOPLE_OUTFIT.jailer = 'apron_leather';
FIXED_STRUCTS.push('prison');
Object.assign(FURN, { bars: { block: true }, straw: { block: true }, chains: {}, bowl: { block: true } });

// a cela do herói (meio da direita) e as celas dos outros presos
const PRISON_CELL = [13, 5], PRISON_OTHERS = [[2, 1], [2, 5], [2, 9], [13, 1], [13, 9], [3, 1], [3, 9]];
// o jeito do rei pesa na pena
const PRISON_HARSH = { rabugento: 1.5, desconfiado: 1.4, ganancioso: 1.3, corajoso: 1.1, gentil: 0.7, alegre: 0.8, leal: 0.9 };

LAYOUTS.jail = function () {
  const items = [
    // corredor: a mesa do carcereiro, a parede de armas, braseiros e tochas
    ['desk', 6, 0, 2, 1], ['weaponrack', 9, 0, 1, 1], ['brazier', 6, 5, 1, 1, { light: 1 }], ['brazier', 9, 5, 1, 1, { light: 1 }],
    ['lamp', 7, -1], ['lamp', 2, -1], ['lamp', 13, -1], ['barrel', 9, 9], ['crate', 6, 9],
    // grades das celas (esquerda e direita)
    ['bars', 5, 0, 1, 3], ['bars', 5, 4, 1, 3], ['bars', 5, 8, 1, 3], ['bars', 10, 0, 1, 3], ['bars', 10, 4, 1, 3], ['bars', 10, 8, 1, 3],
    // palha e correntes nas celas dos outros presos
    ['straw', 0, 0, 2, 1], ['straw', 0, 4, 2, 1], ['straw', 0, 8, 2, 1], ['straw', 14, 0, 2, 1], ['straw', 14, 8, 2, 1],
    ['chains', 4, -1], ['chains', 4, 3], ['chains', 11, 7], ['chains', 11, -1],
    // a cela do herói: cama de palha (passa um mês) e a tigela da ração
    ['straw', 14, 4, 2, 1, { act: 'jailbed' }], ['bowl', 11, 6, 1, 1, { act: 'jailfood' }],
  ];
  return { w: 16, h: 11, doorX: 7.5, items,
    // paredes de pedra entre as celas
    tiles: [[T.IWALL, 0, 3, 6, 1], [T.IWALL, 0, 7, 6, 1], [T.IWALL, 10, 3, 6, 1], [T.IWALL, 10, 7, 6, 1]],
    keeper: [7, 1.3], wander: [[7, 4], [8, 7]] };
};

const Prison = {
  S() { const u = G.urban || (G.urban = {}); return u; },
  cur() { return this.S().prison || null; },               // { ci, until, months, king } enquanto você cumpre a pena
  of(ci) { return World.structs.find(s => s && !s.removed && s.type === 'prison' && s.owner === ci) || null; },
  // uma prisão perto de cada castelo (o mesmo lugar sempre que o mundo é montado)
  init() {
    World.capitals.forEach((cp, c) => { if (cp && !cp.prison && !this.of(c)) cp.prison = Arena.place('prison', cp.x, cp.y, 4, 3, c, 9, 20, c * 1.7 + 3.1); });
  },
  // a pena que o rei decide: a multa e o jeito dele
  sentence(ci, bounty) {
    const c = G.civs[ci], k = c && c.ruler === 'npc' ? G.people[c.rulerId] : null, harsh = (k && PRISON_HARSH[k.trait]) || 1;
    return { months: U.clamp(Math.round((1 + bounty / 150) * harsh), 1, 12), king: k, harsh };
  },
  jailed() { return !!this.cur(); },
  // entra na cela (também ao carregar um jogo salvo no meio da pena)
  lockUp() {
    const J = this.cur(), s = J && this.of(J.ci); if (!s) return false;
    if (G.place) Places.exit(true, true);
    if (!Places.enterRoom(s)) return false;
    const pl = G.place; P.x = (pl.fx0 + PRISON_CELL[0] + 0.5) * TILE; P.y = (pl.fy0 + PRISON_CELL[1] + 0.8) * TILE;
    P.mounted = false; P.sailing = false;
    return true;
  },
  // cumpriu a pena: sai pela porta da prisão
  release() {
    const J = this.cur(); if (!J) return;
    this.S().prison = null;
    if (G.place && G.place.type === 'prison') Places.exit(true, true);
    UI.banner('⛓️ Você está livre');
    UI.msg(`⛓️ Você cumpriu ${J.months} ${J.months === 1 ? 'mês' : 'meses'} na Prisão de ${CIV_DEFS[J.ci].short} e foi solto.`, 'gold', true);
    Rumors.add(`${G.name} cumpriu ${J.months} ${J.months === 1 ? 'mês' : 'meses'} de prisão em ${CIV_DEFS[J.ci].short}.`, P.x / TILE, P.y / TILE, { about: 'player' });
  },
  // dormir na palha: passa um mês
  sleep() {
    const J = this.cur(); if (!J) return;
    Game.onNewDay(); P.hp = P.maxHp; P.stamina = Game.maxSt(); P.hunger = Math.max(0, P.hunger - 25);
    if (G.day >= J.until) { this.release(); return; }
    const left = J.until - G.day;
    UI.msg(`🌙 Mais um mês na cela. Faltam ${left} ${left === 1 ? 'mês' : 'meses'}.`, 'bad');
  },
  eat() {
    const J = this.cur(); if (!J) return;
    if (J.fed === G.day) { UI.msg('🥣 A tigela está vazia: a ração vem uma vez por mês.'); return; }
    J.fed = G.day; P.hunger = Math.min(Game.maxHu ? Game.maxHu() : 100, Math.max(P.hunger, 60));
    UI.msg('🥣 Pão duro e água. Melhor que nada.');
  },
  // os presos de verdade nas celas e os guardas no corredor
  fill(src, pl) {
    const prisoners = G.people.filter(p => p && p.alive && p.jail > G.day && (p.civ === src.owner || (p.home && p.home.type === 'village' && World.villages[p.home.idx] && World.villages[p.home.idx].civ === src.owner)));
    prisoners.slice(0, PRISON_OTHERS.length).forEach((p, i) => {
      const [x, y] = PRISON_OTHERS[i], old = G.spawned.get(p.id);
      const e = Game.spawn('villager', (pl.fx0 + x + 0.5) * TILE, (pl.fy0 + y + 0.85) * TILE, { civ: src.owner, npc: p, leash: 0.3 });
      e.placeNpc = true; e.still = true; e.outside = old && !old.dead && !old.placeNpc ? old : null; if (e.outside) e.outside.inRoom = true;
      G.spawned.set(p.id, e);
    });
    for (const [x, y] of [[7, 3], [8, 8]]) { const g = Game.spawn('guard', (pl.fx0 + x + 0.5) * TILE, (pl.fy0 + y + 0.8) * TILE, { civ: src.owner, leash: 1.2 }); g.placeNpc = true; }
  },
};

{
  // a prisão aparece junto com o castelo — por último, depois da arena, da catedral, do cemitério e do porto (para não
  // tomar o lugar de nenhum deles)
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') { try { Prison.init(); } catch (e) { console.error(e); } } return r; };
  // quem cuida dela: o carcereiro, da vila mais perto
  const is0 = Shops.isShop.bind(Shops);
  Shops.isShop = function (s) { if (s && s.type === 'prison') return !s.removed && Work.vi(s) >= 0; return is0(s); };
  // ir preso: a pena do rei, na cela
  const pr0 = Crime.prison.bind(Crime);
  Crime.prison = function (ci) {
    const w = this.wanted(ci), s = Prison.of(ci); if (!w || !s) return pr0(ci);
    const st = Prison.sentence(ci, w.bounty);
    this.clear(ci); UI.close();
    Prison.S().prison = { ci, until: G.day + st.months, months: st.months, king: st.king ? People.full(st.king) : null };
    Prison.lockUp();
    const who = st.king ? `${People.title(st.king)} ${People.full(st.king)}` : `O rei de ${CIV_DEFS[ci].short}`;
    const how = st.harsh > 1.15 ? ', conhecido pela mão pesada,' : st.harsh < 0.95 ? ', conhecido pela clemência,' : '';
    UI.banner(`⛓️ ${st.months} ${st.months === 1 ? 'mês' : 'meses'} de prisão`);
    UI.msg(`⚖️ ${who}${how} sentenciou você a ${st.months} ${st.months === 1 ? 'mês' : 'meses'} na Prisão de ${CIV_DEFS[ci].short}. Durma na palha para os meses passarem.`, 'bad', true);
  };
  // a cela está trancada: ninguém sai antes de cumprir a pena (a não ser o jogo, ao soltar)
  const ex0 = Places.exit.bind(Places);
  Places.exit = function (quiet, force) {
    if (Prison.jailed() && G.place && G.place.type === 'prison' && !force) { UI.msg('🔒 A cela está trancada. Cumpra a pena (durma na palha para os meses passarem).', 'bad'); return; }
    return ex0(quiet);
  };
  const us0 = Places.use.bind(Places);
  Places.use = function (f) {
    if (f && f.act === 'jailbed') { if (Prison.jailed()) Prison.sleep(); else UI.msg('Uma cama de palha de cela.'); return; }
    if (f && f.act === 'jailfood') { if (Prison.jailed()) Prison.eat(); else UI.msg('Uma tigela de ração.'); return; }
    return us0(f);
  };
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    if (f && f.act === 'jailbed') return Prison.jailed() ? `Palha da cela — dormir (passa um mês; faltam ${Math.max(0, Prison.cur().until - G.day)})` : 'Palha da cela';
    if (f && f.act === 'jailfood') return 'Tigela — a ração do mês';
    return fl0(f);
  };
  // os presos e os guardas lá dentro
  const pe0 = Places.people.bind(Places);
  Places.people = function (src, d, L) { const r = pe0(src, d, L); if (d && d.lay === 'jail' && G.place) { try { Prison.fill(src, G.place); } catch (e) { console.error(e); } } return r; };
  // o tempo passa sozinho também: cumpriu, sai
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); const J = Prison.cur(); if (J && G.day >= J.until && G.state === 'play') Prison.release(); };
  // jogo salvo no meio da pena: volta para a cela
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) {
    const r = await ld0(...a);
    if (G.state === 'play') { try { Prison.init(); if (Prison.jailed()) Prison.lockUp(); } catch (e) { console.error(e); } }
    return r;
  };

  // ---------------------------------------------------------------- desenho
  const df0 = drawFurn;
  // eslint-disable-next-line no-global-assign
  drawFurn = function (ctx, f, X, Y, time) {
    const w = f.w * TILE, h = f.h * TILE, R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
    switch (f.k) {
      case 'bars': { // grades de ferro de alto a baixo
        R(w / 2 - 6, 0, 12, h, 'rgba(0,0,0,0.18)');
        for (let k = 3; k < h; k += 7) { R(w / 2 - 7, k, 14, 2, '#3a3a42'); }
        for (const dx of [-6, -1, 4]) { R(w / 2 + dx, -6, 3, h + 4, '#4a4a54'); R(w / 2 + dx, -6, 1, h + 4, '#7a7a86'); }
        return;
      }
      case 'straw': { // monte de palha
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(X + 2, Y + h - 6, w - 4, 5);
        R(2, h / 2 - 2, w - 4, h / 2 - 2, '#b8943a'); R(4, h / 2 - 6, w - 10, 6, '#d0ac4a');
        ctx.strokeStyle = '#8a6a22'; ctx.lineWidth = 1; for (let k = 6; k < w - 6; k += 5) { ctx.beginPath(); ctx.moveTo(X + k, Y + h / 2 - 4); ctx.lineTo(X + k + 3, Y + h - 4); ctx.stroke(); }
        if (f.act === 'jailbed') R(w - 14, h / 2 - 8, 10, 6, '#7a6a5a'); // a manta do herói
        return;
      }
      case 'chains': { // correntes presas na parede
        ctx.strokeStyle = '#6a6a72'; ctx.lineWidth = 2;
        for (const x0 of [10, 22]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.ellipse(X + x0, Y + 6 + k * 4, 2, 2.5, 0, 0, Math.PI * 2); } ctx.stroke(); R(x0 - 3, 28, 6, 3, '#4a4a52'); }
        return;
      }
      case 'bowl': { // tigela com pão e caneca
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 26, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(X + 14, Y + 22, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c89a5a'; ctx.beginPath(); ctx.ellipse(X + 14, Y + 20, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        R(22, 14, 5, 8, '#8a8a92'); R(23, 15, 3, 2, '#5a8ab0');
        return;
      }
    }
    return df0(ctx, f, X, Y, time);
  };
  // por fora: um prédio de pedra com ameias, janelas gradeadas, porta de ferro, torre e a bandeira do reino
  const ds0 = drawStructExtra;
  // eslint-disable-next-line no-global-assign
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    if (s.type !== 'prison') return ds0(ctx, s, X, Y, time, H);
    const { R, shadow, flag, w, h } = H;
    shadow();
    R(6, 14, w - 12, h - 16, '#7a7670'); R(6, 14, w - 12, 5, '#8e8a83'); R(6, h - 6, w - 12, 4, '#5e5a54');
    for (let y = 22; y < h - 8; y += 9) for (let x = 8 + (y % 2 ? 0 : 6); x < w - 10; x += 14) R(x, y, 10, 1, '#6a6660');
    for (let x = 6; x < w - 6; x += 10) R(x, 6, 6, 8, '#7a7670'); // ameias
    // torre no canto
    R(w - 30, -18, 22, h - 2, '#6e6a64'); for (let x = w - 30; x < w - 8; x += 7) R(x, -24, 4, 6, '#6e6a64');
    R(w - 22, -6, 6, 9, '#1e1c22'); for (let k = 0; k < 2; k++) R(w - 21 + k * 3, -6, 1, 9, '#5a5a62');
    flag(w - 20, -40, Game.civColor(typeof s.owner === 'number' ? s.owner : 0));
    // janelas gradeadas
    for (const x of [16, 40]) { R(x, 28, 12, 10, '#1e1c22'); for (let k = 0; k < 3; k++) R(x + 2 + k * 4, 28, 1.5, 10, '#6a6a72'); }
    // porta de ferro com rebites e a placa
    R(w / 2 - 12, h - 30, 18, 26, '#3a3a42'); R(w / 2 - 12, h - 30, 18, 3, '#55555e');
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) R(w / 2 - 9 + j * 10, h - 25 + k * 7, 2, 2, '#8a8a92');
    R(w / 2 - 14, h - 40, 22, 8, '#5a3a1e'); ctx.font = '7px sans-serif'; ctx.fillStyle = '#efe6d2'; ctx.fillText('⛓', X + w / 2 - 6, Y + h - 33);
  };
}
