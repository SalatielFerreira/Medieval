'use strict';
// Os Jogos e a cidadania, e a arena em festa:
//  • Você compete pelo reino da sua cidadania. Sem cidadania, a página dos Jogos oferece escolher um reino para
//    representar (e ele vira a sua cidadania).
//  • Medalhas trazem fama e o reconhecimento do seu reino: relação com o reino, amizade do rei e serviços prestados
//    (sendo rei, o povo comemora).
//  • No ano dos Jogos, a arena do anfitrião fica em festa: no lugar das arquibancadas de cima, um palanque para cada
//    reino convidado, com o brasão e as cores dele e o rei sentado lá; o camarote do anfitrião no meio; mastros com as
//    bandeiras dos reinos, bandeirolas sobre a areia e, no chão, o brasão do anfitrião cercado pelos dos convidados.
//    Por fora, a arena ganha mastros com as bandeiras e bandeirolas coloridas.
const OLY_BOX = [0, 4, 8, 15, 19, 23];       // onde ficam os palanques dos reinos convidados (3 de largura)
const OLY_REC = [[4, 5, 4], [2, 3, 3], [1, 2, 2]]; // por medalha (ouro, prata, bronze): relação, amizade do rei, serviços

const Oly = {
  on(ci) { if (typeof Games === 'undefined') return false; const S = Games.S(); return !!S.on && S.host === ci; },
  guests(host) { return G.civs.filter(c => c && !c.dead && !c.anarchy && c.id !== host).map(c => c.id).slice(0, OLY_BOX.length); },
  // ---------------------------------------------------------------- medalhas: reconhecimento do seu reino
  reward(rec) {
    const ci = Games.myCi(), m = [0, 0, 0];
    for (const L of Object.values(rec.ev || {})) L.forEach((x, k) => { if (x && x.who === 'player') m[k]++; });
    const n = m[0] + m[1] + m[2]; if (!n || ci < 0 || !G.civs[ci]) return;
    const c = G.civs[ci];
    if (c.ruler === 'player') { c.happy = Math.min(100, c.happy + n * 2); UI.msg(`🏅 O povo de ${CIV_DEFS[ci].short} comemora as medalhas do rei (+${n * 2} de felicidade).`, 'gold', true); return; }
    let rel = 0, aff = 0, sv = 0; m.forEach((q, k) => { rel += q * OLY_REC[k][0]; aff += q * OLY_REC[k][1]; sv += q * OLY_REC[k][2]; });
    rel = Math.min(rel, 20); aff = Math.min(aff, 25); sv = Math.min(sv, 25); // (no máximo, por edição)
    Game.addRelation(ci, rel); Cid.addKingAff(ci, aff); Court.addService(ci, sv);
    UI.msg(`🏅 As suas ${n} medalhas honram ${CIV_DEFS[ci].name}: +${rel} de relação com o reino, +${aff} de amizade de ${c.rulerName} e +${sv} de serviços prestados.`, 'gold', true);
    rec.honor = { ci, rel, aff, sv };
  },
};

{
  const rs0 = Games.resolve.bind(Games);
  Games.resolve = function (...a) { const r = rs0(...a); if (r) try { Oly.reward(r); } catch (e) { console.error(e); } return r; };
  // ---------------------------------------------------------------- a arena em festa (por dentro)
  const lay0 = LAYOUTS.coliseum;
  LAYOUTS.coliseum = function (o) {
    const L = lay0.call(this, o), host = o && o.src ? o.src.owner : -1;
    if (typeof host !== 'number' || !Oly.on(host)) return L;
    const gs = Oly.guests(host), all = [host, ...gs];
    L.items = L.items.filter(it => !(it[0] === 'stands' && it[2] === 0) && it[0] !== 'banner' && it[0] !== 'emblem');
    gs.forEach((ci, k) => L.items.push(['olybox', OLY_BOX[k], 0, 3, 3, { civ: ci }]));
    [3, 7, 18, 22].forEach((x, k) => L.items.push(['olymast', x, 0, 1, 3, { civ: all[(k * 2 + 1) % all.length] }]));
    [1, 5, 9, 12, 16, 20, 24].forEach((x, k) => L.items.push(['olyflag', x, -1, 1, 1, { civ: all[k % all.length] }]));
    L.items.push(['bunting', 4, 4, 18, 1, { civs: all }]);
    L.items.push(['olyemblem', 11, 6, 4, 4, { host, gs }]);
    L.crowd = L.crowd.filter(([, y]) => y > 2);
    L.oly = gs.map((ci, k) => ({ ci, seat: [OLY_BOX[k] + 1, 1] }));
    return L;
  };
  Object.assign(FURN, { olybox: { flat: true }, olymast: {}, olyflag: {}, bunting: {}, olyemblem: { flat: true } });
  Object.assign(FURN_EXTRA, {
    // o palanque de um reino: toldo nas cores do reino, sanefa listrada, brasão no alto, grade dourada e duas cadeiras
    olybox(ctx, f, X, Y, time, { R }) {
      const w = f.w * TILE, h = f.h * TILE, col = Game.civColor(f.civ), dk = U.shade(col, -0.35), lt = U.shade(col, 0.25);
      R(0, -22, w, h + 20, '#4a3420'); R(2, -20, w - 4, h + 14, dk);
      R(0, -24, w, 6, '#d8a84a');
      for (let k = 0; k < 6; k++) R(k * (w / 6), -18, w / 6 - 1, 9, k % 2 ? lt : col);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? lt : col; ctx.beginPath(); ctx.moveTo(X + k * (w / 6), Y - 9); ctx.lineTo(X + (k + 0.5) * (w / 6), Y - 3); ctx.lineTo(X + (k + 1) * (w / 6) - 1, Y - 9); ctx.fill(); }
      for (const cx of [w / 2 - 22, w / 2 + 8]) { R(cx, 30, 14, 20, '#5a2a1a'); R(cx, 26, 14, 6, '#d8a84a'); R(cx + 2, 33, 10, 9, col); }
      R(2, h - 16, w - 4, 4, '#d8a84a'); for (let x = 6; x < w - 4; x += 9) R(x, h - 12, 2, 10, '#b8862a'); R(2, h - 3, w - 4, 3, '#8a6420');
      Heraldry.drawArms(ctx, X + w / 2, Y + 6, 20, f.civ);
    },
    // mastro alto com a bandeira de um reino
    olymast(ctx, f, X, Y, time, { R }) { R(14, -46, 4, f.h * TILE + 40, '#6b4423'); R(12, -50, 8, 5, '#d8a84a'); Heraldry.drawFlag(ctx, X + 18, Y - 44, 26, 17, f.civ, time); },
    // estandarte pendurado na parede
    olyflag(ctx, f, X, Y, time, { R }) {
      const col = Game.civColor(f.civ); R(4, 0, 24, 2, '#3a2a1a'); R(6, 2, 20, 26, col);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + 6, Y + 28); ctx.lineTo(X + 16, Y + 34); ctx.lineTo(X + 26, Y + 28); ctx.fill();
      R(6, 2, 20, 2, '#d8a84a'); Heraldry.drawArms(ctx, X + 16, Y + 16, 13, f.civ);
    },
    // bandeirolas nas cores dos reinos, de um lado ao outro da areia
    bunting(ctx, f, X, Y) {
      const w = f.w * TILE, L = f.civs || [], y0 = -54;
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.5;
      for (const sag of [0, 1]) {
        const yy = y0 + sag * 14; ctx.beginPath(); ctx.moveTo(X, Y + yy); ctx.quadraticCurveTo(X + w / 2, Y + yy + 18, X + w, Y + yy); ctx.stroke();
        const n = 24; for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, x = X + t * w, y = Y + yy + 4 * t * (1 - t) * 18;
          ctx.fillStyle = L.length ? Game.civColor(L[(k + sag) % L.length]) : '#c84a3a';
          ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 10); ctx.fill();
        }
      }
    },
    // no chão: os anéis dos Jogos, o brasão do anfitrião no meio e os dos convidados em volta
    olyemblem(ctx, f, X, Y, time, { ell }) {
      const w = f.w * TILE, h = f.h * TILE, cx = X + w / 2, cy = Y + h / 2;
      ell(w / 2, h / 2, w / 2 + 14, h / 2 + 6, 'rgba(120,80,40,0.16)');
      ctx.strokeStyle = 'rgba(216,168,74,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 + 6, h / 2 - 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(110,70,30,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 14, h / 2 - 14, 0, 0, Math.PI * 2); ctx.stroke();
      const gs = f.gs || [];
      ctx.globalAlpha = 0.75;
      gs.forEach((ci, k) => { const an = -Math.PI / 2 + k / gs.length * Math.PI * 2; Heraldry.drawArms(ctx, cx + Math.cos(an) * (w / 2 - 4), cy + Math.sin(an) * (h / 2 - 12) + 4, 14, ci); });
      if (f.host >= 0) Heraldry.drawArms(ctx, cx, cy + 4, 28, f.host);
      ctx.globalAlpha = 1;
    },
  });
  // os reis convidados sentados nos palanques
  const pp0 = Places.people.bind(Places);
  Places.people = function (src, d, L) {
    const r = pp0(src, d, L);
    if (!L || !L.oly || !G.place) return r;
    for (const { ci, seat } of L.oly) {
      const k = Cid.king(ci); if (!k || !k.alive || k.jail > G.day) continue;
      const old = G.spawned.get(k.id); if (old && old.placeNpc && !old.dead) continue;
      const tx = G.place.fx0 + seat[0], ty = G.place.fy0 + seat[1];
      const e = Game.spawn('villager', (tx + 0.5) * TILE, (ty + 0.85) * TILE, { civ: ci, npc: k, leash: 0.3 });
      e.placeNpc = true; e.still = true; e.dir = seat[0] < 13 ? 1 : -1; e.outside = old && !old.dead && !old.placeNpc ? old : null;
      if (e.outside) e.outside.inRoom = true;
      G.spawned.set(k.id, e);
    }
    return r;
  };
  // ---------------------------------------------------------------- a arena em festa (por fora)
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) {
    const r = ds0(ctx, s, X, Y, time);
    if (s.type !== 'arena' || !Oly.on(s.owner) || G.place) return r;
    const cp = World.capitals[s.owner]; if (!cp || cp.arena !== s) return r;
    const w = s.w * TILE, h = s.h * TILE, all = [s.owner, ...Oly.guests(s.owner)], n = all.length;
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X + 4, Y - 14); ctx.quadraticCurveTo(X + w / 2, Y + 2, X + w - 4, Y - 14); ctx.stroke();
    for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14, x = X + 4 + t * (w - 8), y = Y - 14 + 4 * t * (1 - t) * 16; ctx.fillStyle = Game.civColor(all[k % n]); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 8); ctx.fill(); }
    for (let k = 0; k < n; k++) {
      const x = X + 2 + k * ((w - 6) / Math.max(1, n - 1));
      const tall = k % 2 ? 50 : 58;
      ctx.fillStyle = '#6b4423'; ctx.fillRect(Math.round(x), Math.round(Y - tall), 3, tall - 6); ctx.fillStyle = '#d8a84a'; ctx.fillRect(Math.round(x) - 1, Math.round(Y - tall - 2), 5, 3);
      Heraldry.drawFlag(ctx, x + 3, Y - tall, 22, 14, all[k], time);
    }
    return r;
  };
  // ---------------------------------------------------------------- sem cidadania: escolher o reino que você representa
  if (typeof Olympics !== 'undefined') {
    const ar0 = Olympics.arena.bind(Olympics);
    Olympics.arena = function (ci) {
      const h = ar0(ci); if (Games.myCi() >= 0 || !Games.S().on) return h;
      return h.replace('<button data-act="games">📋 Registros e medalhas</button>', '<button class="primary" data-act="corte" data-t="cid">🏳️ Representar um reino</button><button data-act="games">📋 Registros e medalhas</button>');
    };
  }
}
