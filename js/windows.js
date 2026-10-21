'use strict';
// Kit visual das janelas. Toda janela ocupa a tela inteira (no computador e no celular); as de conteúdo curto usam uma
// coluna central. As janelas listadas aqui ganham a cena de abertura (UI.scene, em js/ui.js): medalhão com ícone,
// título, uma frase e os números que importam. Para dar cena a outra janela, basta acrescentar uma linha em WIN_SCENES
// com o nome da função que a abre; a função recebe os mesmos argumentos da janela.

const WIN_SCENES = {
  showFinance: () => {
    const D = Fin.D();
    return { ic: '💰', theme: 'gold', kicker: 'Sua casa', title: 'Finanças', line: 'Ouro parado não rende: guarde na poupança, empreste a quem precisa ou invista nas famílias e nas vilas.',
      chips: [['🪙', `${P.gold} no bolso`], ['🏦', `${D.save} guardado`], ['📈', `${D.earned} já rendeu`]] };
  },
  showArsenal: () => {
    const A = Arsenal.A();
    return { ic: '⚔️', theme: 'red', kicker: 'Seu arsenal', title: 'Arsenal', line: 'Máquinas de guerra e equipamento para a tropa. As catapultas guardadas aqui marcham com o seu exército.',
      chips: [['🪙', `${P.gold} no bolso`], ['🏹', `${A.catapult || 0} catapulta${A.catapult === 1 ? '' : 's'}`], ['🪵', `${A.ram || 0} aríete${A.ram === 1 ? '' : 's'}`]] };
  },
  showLoans: () => {
    const L = Loans.L().filter(l => l.left > 0), owed = L.reduce((a, l) => a + l.left, 0);
    return { ic: '📜', theme: 'earth', kicker: 'Crédito', title: 'Empréstimos', line: 'Dinheiro hoje, parcelas todo mês. Quem atrasa perde bens e pode virar procurado.',
      chips: [['🧾', `${L.length} dívida${L.length === 1 ? '' : 's'}`, L.length ? 'bad' : ''], ['🪙', `${owed} a pagar`]] };
  },
  showWarEnvoy: (mine, other) => ({ ic: '📜', theme: 'red', kicker: CIV_DEFS[other].name, title: 'Mensageiro de guerra', line: `${UI.esc(G.civs[other].rulerName)} vai receber a sua mensagem: uma declaração de guerra ou um ultimato em ouro.`,
    chips: [['⚔️', `força deles ${Math.round(Diplo.strength(other))}`], ['💰', `tesouro deles ${G.civs[other].treasury}`]] }),
  showEnvoy: (mine, other) => ({ ic: '🕊️', theme: 'blue', kicker: CIV_DEFS[other].name, title: 'Mensageiro de paz', line: `Uma oferta em ouro pode convencer ${UI.esc(G.civs[other].rulerName)} a encerrar a guerra.`,
    chips: [['⚔️', `força deles ${Math.round(Diplo.strength(other))}`]] }),
  showCemetery: ci => ({ ic: '⚰️', theme: 'stone', kicker: CIV_DEFS[ci].name, title: `Cemitério de ${CIV_DEFS[ci].short}`, line: 'Entre ciprestes e lápides de pedra, a história de quem já partiu.' }),
};

{
  const open0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    const sc = WIN_SCENES[fn];
    if (sc && !String(body).includes('class="scn')) { try { body = this.scene(sc(...(args || []))) + body; } catch (e) { /* sem cena se faltar algum dado */ } }
    return open0(title, body, fn, args, sub);
  };
}
