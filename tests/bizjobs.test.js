// Empreendimentos: quem você contrata é o responsável e assume o cargo do lugar (os nomes das obras da vila); ao ser
// dispensado, volta ao ofício de antes. O responsável do porto é o Capitão.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; P.gold = 5000;
      const at = (type, dx) => { const B = BUILDINGS[type], x = Math.floor(P.x / TILE) + dx, y = Math.floor(P.y / TILE) + 6; for (let j = y; j < y + B.h; j++) for (let i = x; i < x + B.w; i++) World.obj[World.idx(i, j)] = 0; return World.addStruct(type, x, y, B.w, B.h, 'player', { built: true }); };
      ok(Object.keys(BIZ_TYPES).every(t => BIZ_JOBS[t] && RANKS[BIZ_JOBS[t]]), 'empreendimento sem cargo: ' + Object.keys(BIZ_TYPES).filter(t => !BIZ_JOBS[t] || !RANKS[BIZ_JOBS[t]]).join());
      const bak = at('biz_bakery', -6), tan = at('biz_tannery', 2);
      const pick = (rank) => G.people.find(p => p.alive && p.age >= 18 && p.rank === rank && Biz.can(p) === true);
      const a = pick('peasant') || pick('wanderer'), was = a.rank;
      ok(Biz.hire(a, bak), 'não contratou');
      ok(a.rank === 'baker' && /Padeir/.test(People.title(a)), `o contratado não virou Padeiro: ${a.rank} / ${People.title(a)}`);
      // quem trabalha para você não vira lojista da vila
      Shops.ensure(); ok(!a.shop, 'o funcionário virou lojista da vila');
      Biz.fire(a); ok(a.rank === was && a.oldRank === undefined, `dispensado não voltou ao ofício: ${a.rank}`);
      // o bônus de ofício continua valendo pelo ofício de antes (caçador no curtume)
      const h = pick('hunter'); if (h) { Biz.hire(h, tan); ok(h.rank === 'tanner' && Biz.skilled(h, tan), 'o caçador perdeu o bônus no curtume'); }
      // Vinícola sem responsável à parte
      const win = at('biz_winery', 10); Shops.ensure(); ok(!Shops.keeper(win), 'a Vinícola ainda tem responsável à parte');
      // porto: o Capitão
      Ports.ensureKeepers(); const cap = G.people.find(p => p.alive && p.port);
      if (cap) ok(cap.rank === 'captain' && /Capit/.test(People.title(cap)), 'o responsável do porto não é o Capitão: ' + (cap && People.title(cap)));
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
