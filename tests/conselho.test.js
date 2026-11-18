// Conselho do seu reino: escolher quem chamar numa lista completa — a sua família primeiro (filhos, netos e cônjuge,
// onde quer que morem), depois quem você conhece e a gente do reino, com filtros; nomear um filho; a lista cabe na
// janela (rola dentro do quadro) no computador e no celular.
'use strict';
const { open } = require('./harness');
const check = async (W, H, fails, tag) => {
  const { page, errors, close } = await open({ width: W, height: H });
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      UI.msg = () => {}; UI.banner = () => {}; Dialog.autoYes = true; Families.ensurePlayer();
      Game.becomeRuler(1, 'teste'); UI.close();
      for (const [n, s, a] of [['Miguel', 'm', 26], ['Lúcia', 'f', 23]]) { Game.birth(n, s); const k = G.people.find(p => p.name === n && p.kin); k.age = a; k.rank = 'peasant'; }
      Grown.monthTick();
      const mig = G.people.find(p => p.name === 'Miguel' && p.kin); mig.home = { type: 'village', idx: World.villages.findIndex(v => v && v.civ !== 1) }; // mora em outro reino
      UI.sel.knav = 'x:reign'; UI.sel.rnRole = 'k:1'; UI.sel.rnTab = 'conselho'; UI.showKingdom();
      UI.act('cpick', { s: 'treasurer' });
      const rows = [...UI.panel.querySelectorAll('.rn-pick')];
      ok(rows.length >= 5, 'a lista de candidatos está curta: ' + rows.length);
      ok(rows[0] && rows[0].classList.contains('fam') && rows[1] && rows[1].classList.contains('fam'), 'os seus filhos não aparecem primeiro');
      ok(UI.panel.querySelector(`[data-act="appoint"][data-id="${mig.id}"]`), 'o filho que mora em outro reino não aparece');
      const body = UI.panel.querySelector('.snav-body'); ok(body.scrollHeight <= body.clientHeight + 2, 'a página do conselho passou da janela');
      const card = UI.panel.querySelector('.rn-cpick').getBoundingClientRect(), pr = UI.panel.getBoundingClientRect(); ok(card.bottom <= pr.bottom + 1, 'o quadro da lista passou do pé da janela');
      UI.act('cfilt', { k: 'fam' }); ok(UI.panel.querySelectorAll('.rn-pick').length === 2, 'o filtro Sua família não mostra só a família');
      UI.act('appoint', { c: 1, s: 'treasurer', id: mig.id }); ok(Court.member(1, 'treasurer') === mig && mig.council && mig.council.seat === 'treasurer', 'não nomeou o filho tesoureiro');
      UI.act('cpick', { s: 'general' }); UI.act('appoint', { c: 1, s: 'general', id: mig.id });
      ok(Court.member(1, 'general') === mig && !Court.member(1, 'treasurer'), 'mudar o filho de cadeira deixou ele em duas');
      return bad;
    });
    fails.push(...r.map(x => `${tag}: ${x}`));
  } finally { await close(); }
  fails.push(...errors.map(e => `${tag}: erro no jogo: ${e}`));
};
module.exports = async () => { const fails = []; await check(1366, 720, fails, 'pc'); await check(844, 390, fails, 'celular'); return fails; };
