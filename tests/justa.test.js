// Jogos dos Sete Reinos: depois da justa, as provas seguintes (Desafio dos Três e Duelo dos Campeões) continuam e os
// Jogos terminam com a cerimônia (antes a justa ficava "em andamento" e travava tudo depois dela); a justa da arena
// também deixa lutar de novo e mostra o resultado.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(async () => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, wait = ms => new Promise(res => setTimeout(res, ms));
      UI.msg = () => {}; UI.banner = () => {}; P.god = true;
      P.horse = Horses.make('puro', { name: 'Relâmpago' }); P.hx = P.x - 30; P.hy = P.y;
      const S = Games.S(); S.year = 0; Games.start(); Places.enterRoom(Arena.arenaOf(S.host));
      for (const ev of GAMES_ORDER) { if (ev === 'joust') break; S.me[ev] = 70; }
      // a justa dos Jogos até o fim
      ok(Games.canPlay('joust'), 'a justa não estava liberada'); Games.play('joust'); ok(G.joust, 'a justa não começou');
      for (let k = 0; k < 5 && G.joust; k++) Arena.joustStrike();
      UI.showJoust(); ok(!G.joust && G.lastJoust && G.lastJoust.over, 'a justa terminou mas continua em andamento');
      ok(UI.panel && /Sair|Voltar/.test(UI.panel.textContent), 'o resultado da justa não aparece');
      ok(S.me.joust !== undefined, 'a nota da justa não entrou');
      // as provas depois da justa
      UI.close(); Places.enterRoom(Arena.arenaOf(S.host));
      ok(Games.canPlay('gauntlet'), 'depois da justa, o Desafio dos Três ficou travado');
      Games.play('gauntlet'); ok(G.duel, 'o Desafio dos Três não começou');
      G.duel = null; G.gamesBout = null; G.gamesRun = null; S.me.gauntlet = 80;
      ok(Games.canPlay('masters'), 'o Duelo dos Campeões não foi liberado');
      Games.play('masters'); ok(G.duel, 'o Duelo dos Campeões não começou'); G.duel.ent.dead = true; Arena.update();
      await wait(2200);
      ok(!S.on && S.history.length, 'os Jogos não terminaram com a cerimônia depois da justa');
      // a justa da arena: dá para lutar de novo
      UI.close(); Places.enterRoom(Arena.arenaOf(0)); Arena.joustStart(0, 0, 0); for (let k = 0; k < 5 && G.joust; k++) Arena.joustStrike();
      ok(!G.joust, 'a justa da arena ficou em andamento'); Arena.joustStart(0, 0, 0); ok(G.joust && !G.joust.over, 'não deu para começar outra justa');
      return bad;
    });
    fails.push(...r);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
