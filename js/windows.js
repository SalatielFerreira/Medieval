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

// ---------------------------------------------------------------- janelas de negociar (loja, balcão)
// Comprar e vender lado a lado, cada lista com a sua rolagem (guardada entre os cliques); as linhas e as colunas têm
// tamanho fixo, então nada se desloca quando um número muda ou um botão fica cinza.
const Trade = {
  row(o) {
    return `<div class="trd-row ${o.off ? 'off' : ''}"><span class="trd-ic">${o.ic}</span><span class="trd-n"><b>${o.name}</b><small>${o.sub || ''}</small></span>
      <span class="trd-p">${o.price}</span><span class="trd-b">${o.btns}</span></div>`;
  },
  btn(attrs, label, ok, cls) { return `<button class="trd-btn ${cls || ''}" ${attrs} ${ok ? '' : 'disabled'}>${label}</button>`; },
  col(key, ic, title, sub, rows, empty, cls) {
    return `<div class="card trd-col"><div class="sec">${ic} ${title}${sub ? ` <span>${sub}</span>` : ''}</div>
      ${rows.length ? `<div class="trd-list ${cls || ''}" data-scroll="${key}">${rows.join('')}</div>` : `<div class="trd-empty">${empty}</div>`}</div>`;
  },
  wrap(head, left, right) { return `<div class="trd">${head}<div class="trd-cols">${left}${right}</div></div>`; },
};
