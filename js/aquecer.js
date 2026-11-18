'use strict';
// Janelas sem engasgo: na primeira vez que uma janela abre, o navegador ainda precisa preparar as letras, os emojis e os
// estilos dela (100 ms ou mais na primeira; depois, menos de 10 ms). Logo depois de o jogo começar ou carregar, as
// janelas principais são abertas e fechadas escondidas, de uma vez — assim, quando você abre, ela já sai rápida.
// As quatro estações (árvores, pedras e plantas de cada uma) também ficam desenhadas de antemão.
// (Nada muda no jogo: a escolha de abas, o histórico e a pausa voltam como estavam.)
const UIWarm = {
  done: false,
  list() {
    const L = [];
    const nav = (k, extra) => L.push(() => { UI.sel.knav = k; if (extra) Object.assign(UI.sel, extra); UI.showKingdom(); });
    for (const k of ['overview', 'biz', 'families', 'tree', 'x:painel', 'x:ordens', 'x:outlaw', 'x:games']) nav(k);
    const king = G.civs.find(c => c && c.ruler === 'player');
    if (king && typeof RN_TABS !== 'undefined') for (const [t] of RN_TABS) nav('x:reign', { rnRole: 'k:' + king.id, rnTab: t });
    else nav('x:reign');
    for (const f of ['showInventory', 'showBuild', 'showDiary', 'showSettings']) if (typeof UI[f] === 'function') L.push(() => UI[f]());
    if (typeof UI.showBank === 'function' && typeof Bank !== 'undefined') L.push(() => { const b = Bank.home ? Bank.home() : null; UI.showBank(b !== null && b !== undefined ? b : (king ? king.id : 0)); });
    if (typeof MapView !== 'undefined' && MapView.show) L.push(() => { MapView.show(); MapView.hide(); });
    return L;
  },
  run() {
    if (this.done || G.state !== 'play' || (UI.isOpen && UI.isOpen()) || (typeof MapView !== 'undefined' && MapView.isOpen) || G.place || UI.modal) return;
    this.done = true;
    const sel = JSON.stringify(UI.sel), hist = UI.hist, paused = G.paused, msg = UI.msg, banner = UI.banner, snd = Sound.play;
    document.documentElement.classList.add('uiwarm');
    UI.msg = () => {}; UI.banner = () => {}; Sound.play = () => {};
    const t0 = performance.now();
    try {
      for (const f of this.list()) { try { f(); void document.body.offsetHeight; } catch (e) { console.warn('aquecer janela', e); } }
      // as quatro estações já desenhadas (a troca de estação andando pelo mundo não para o jogo)
      if (typeof Perf !== 'undefined' && Perf.prepSeason && World.season >= 0) for (let k = 0; k < 4; k++) try { Perf.prepSeason(k); } catch (e) { console.warn('estação', e); }
    } finally {
      try { UI.close(); } catch (e) { /* já fechada */ }
      for (const k of Object.keys(UI.sel)) delete UI.sel[k]; Object.assign(UI.sel, JSON.parse(sel));
      UI.hist = hist; G.paused = paused; UI.msg = msg; UI.banner = banner; Sound.play = snd;
      document.documentElement.classList.remove('uiwarm');
    }
    this.ms = Math.round(performance.now() - t0);
  },
};

{
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); UIWarm.done = false; try { UIWarm.run(); } catch (e) { console.error(e); } return r; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); UIWarm.done = false; try { UIWarm.run(); } catch (e) { console.error(e); } return r; };
}
