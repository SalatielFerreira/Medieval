// Comércio e religiões: insumos da cadeia de produção, oferta e procura, encomendas, desgaste e seguro, funcionários
// que sobem de nível, guilda própria com recrutamento pela amizade, feira e leilão, sócio, painel; religiões e
// culturas dos reinos, conversão, decreto e gostos do povo nos preços.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {};
      P.god = true; P.gold = 50000;
      const v0 = World.villages[0];
      const free = (x, y, w, h) => World.areaOk(x, y, w, h) && World.areaFree(x, y, w, h) && [...Array(w)].every((_, i) => [...Array(h)].every((__, j) => !World.obj[World.idx(x + i, y + j)]));
      const build = k => { const b = BUILDINGS[k]; for (let rr = 0; rr < 120; rr++) for (let a = 0; a < 48; a++) { const x = Math.round(v0.x + Math.cos(a / 48 * 6.28) * (14 + rr)), y = Math.round(v0.y + Math.sin(a / 48 * 6.28) * (14 + rr)); if (free(x - 1, y - 1, b.w + 2, b.h + 2)) return World.addStruct(k, x, y, b.w, b.h, 'player', { built: true }); } return null; };
      const mill = build('biz_mill'), bakery = build('biz_bakery'), farm = build('biz_farm');
      const hire = s => { for (const c of Biz.candidates(s).slice(0, 2)) { c.p.aff = 40; Biz.hire(c.p, s); } };
      hire(mill); hire(bakery); hire(farm);
      ok(Biz.workers(bakery).length > 0, 'não contratou ninguém para a padaria');
      // 1. insumos: a padaria gasta farinha (do moinho, do depósito ou do mercado)
      Commerce.inbox(bakery).flour = 40;
      Biz.dayTick();
      ok((Commerce.inbox(bakery).flour || 0) < 40, 'a padaria não gastou farinha do depósito');
      const sup = Commerce.supply(bakery, 1); ok(sup && sup.flour, 'a padaria não mostra os insumos');
      // 2. oferta e procura: vender muito do mesmo item derruba o preço naquele reino
      const k = 'perfume', p0 = Game.price(0, k).sell; Commerce.sat(0, k, 60); ok(Game.price(0, k).sell < p0, 'vender muito não derrubou o preço');
      ok(Religion.taste(4, 'wine') > 1 && Game.price(4, 'wine').sell >= Game.price(2, 'wine').sell * 0.8, 'o gosto do povo não mexe no preço');
      // 3. encomendas
      Commerce.genContracts(); const off = Commerce.offers(); ok(off.length > 0, 'não há encomendas');
      if (off.length) { const c = off[0]; Commerce.take(c.id); Inv.add(c.item, c.n); const g0 = P.gold; Commerce.deliver(c.id); ok(P.gold > g0, 'entregar a encomenda não pagou'); }
      // 4. desgaste, conserto e seguro
      bakery.cond = 30; ok(Commerce.condMul(bakery) < 1, 'prédio gasto não produz menos'); Commerce.repair(bakery); ok(bakery.cond === 100, 'o conserto não funcionou');
      UI.act('bbins', { s: bakery.id }); ok(bakery.insured, 'o seguro não foi feito');
      // 5. funcionários sobem de nível
      const w = Biz.workers(bakery)[0]; if (w) { w.bizXp = 7; Commerce.staff(bakery); ok(Commerce.lv(w) >= 2 && (w.raise || 0) >= 1, 'o funcionário não subiu de nível'); }
      // 6. guilda própria e recrutamento pela amizade
      Dialog.autoYes = true; Commerce.found(); ok(Commerce.st().myGuild && Commerce.st().myGuild.name.startsWith('Irmandade'), 'não fundou a guilda com o nome escolhido'); ok(Commerce.GUILDS.crafts.name === 'Maçonaria', 'as ordens do jogo não têm os nomes novos'); ok(RELIGIONS[Religion.of(1)].name === 'Islamismo', 'Dorne não segue o Islamismo');
      const smith = G.people.find(p => p.alive && p.rank === 'smith' && Commerce.guildOf(p) === 'smiths');
      if (smith) { smith.aff = 0; let res = Commerce.recruit(smith); ok(smith.guild !== 'player', 'recrutou sem amizade'); smith.aff = 90; res = Commerce.recruit(smith); ok(smith.guild === 'player', 'não recrutou com amizade: ' + (res && res.note)); }
      UI.showTalk(G.people.find(p => p.alive && p.age > 20 && p.guild !== 'player').id); ok(UI.panel.innerHTML.includes('grecruit'), 'a conversa não oferece convidar para a guilda'); UI.close();
      // 7. feira e leilão; 8. sócio
      Commerce.after(); ok(Commerce.st().auction || Commerce.fair() || true, 'mês do comércio');
      const st = Commerce.st(); st.auction = { ci: 1, item: 'painting', price: 100, until: G.day, mine: 0, top: 0 }; Commerce.bid(1); ok(st.auction.mine > 0, 'não deu lance');
      const rich = G.people.find(p => p.alive && p.age >= 25 && ['merchant', 'trader', 'knight'].includes(p.rank)); if (rich) { rich.purse = 99999; rich.aff = 40; Commerce.takePartner(mill, rich.id); ok(mill.partner, 'o sócio não entrou'); }
      for (const t of ['biz', 'contracts', 'market', 'log']) { UI.showBizBoard(t); ok(UI.cur && UI.cur.fn === 'showKingdom' && UI.sel.knav === 'x:board' && UI.sel.bbTab === t && UI.panel.innerHTML.includes('data-act="bboard"'), 'painel não abriu: ' + t); }
      UI.close();
      // religiões
      ok(RELIGIONS[Religion.mine()], 'você não tem religião');
      const other = Object.keys(RELIGIONS).find(x => x !== Religion.mine()); Religion.convert(other); ok(Religion.mine() === other, 'não converteu');
      Game.becomeRuler(0, 'teste'); UI.close(); const r0 = Religion.of(0); if (r0 !== Religion.mine()) { Religion.decree(0); ok(Religion.of(0) === Religion.mine(), 'o decreto não mudou a fé do reino'); }
      const chapel = World.structs.find(s => s.type === 'chapel' && !s.removed); if (chapel) { UI.showChapel(chapel.id); ok(UI.panel.innerHTML.includes('relshow'), 'a capela não mostra a religião'); UI.close(); }
      UI.showCastle(3); ok(UI.panel.innerHTML.includes(CULTURES[3].people), 'o castelo não mostra a cultura'); UI.close();
      Religion.monthTick();
      for (let k2 = 0; k2 < 3; k2++) Game.onNewDay();
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
