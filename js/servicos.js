'use strict';
// Serviços mais claros: cada aba diz o que se faz nela (nomes novos), cada página tem, na linha das abas, uma frase do
// que ela serve e o botão "❓ Como usar" (para que serve, como usar e quando usar), e as duas áreas — Fora da lei e
// Mercenários — explicam a que vieram logo nas abas de cima.
const SVX_GUIDE = {
  vida: { name: 'Virar bandido', tip: 'Assuma um bando e viva de assaltos — mas a sua cabeça vira prêmio.',
    use: 'Tornar-se chefe de um bando de fora da lei: um acampamento vira o seu esconderijo e os bandidos passam a obedecer você.',
    how: ['Vá até um acampamento de bandidos (até 10 passos dele).', 'Abra esta página e clique em "Assumir o bando" (300 🪙).', 'Depois, a aba "O seu bando" e a aba "Golpes" mostram o que fazer.'],
    when: 'Quando quer ganhar dinheiro com crimes. Cuidado: guardas e caçadores de recompensa passam a vir atrás de você.' },
  bando: { name: 'O seu bando', tip: 'O seu esconderijo, os seus homens e quanto o bando rende.',
    use: 'Cuidar do bando que você comanda: quem está nele, o esconderijo e o que ele já roubou.',
    how: ['Veja os membros e a força do bando.', 'Descanse no esconderijo: lá os bandidos não atacam você.', 'Para planejar assaltos, vá para a aba "Golpes".'],
    when: 'Sempre que for preparar um golpe ou ver como o bando está.' },
  golpes: { name: 'Golpes', tip: 'Escolha a caravana ou a vila e mande o bando agir.',
    use: 'Assaltar caravanas nas estradas e saquear vilas (ou cobrar delas para não saquear).',
    how: ['Escolha uma caravana ou uma vila na lista.', 'Clique no golpe: o bando vai e volta com o ouro.', 'Cada golpe aumenta a recompensa pela sua cabeça.'],
    when: 'Quando o bando está forte e a recompensa pela sua cabeça ainda é baixa.' },
  procurado: { name: 'Sua cabeça a prêmio', tip: 'Onde você é procurado, quanto vale a sua cabeça e o perdão de cada reino.',
    use: 'Ver em quais reinos você é procurado, por quais crimes e quanto oferecem por você.',
    how: ['Cada reino mostra a recompensa e os crimes.', 'Clique em "Perdão" para pagar e limpar o seu nome naquele reino.'],
    when: 'Antes de entrar num reino onde você é procurado: lá, guardas e caçadores atacam você.' },
  bandos: { name: 'Acampamentos por perto', tip: 'Os acampamentos de bandidos mais próximos e quem está em cada bando.',
    use: 'Conhecer os bandos da região: onde estão, quantos guardam o acampamento e se estão com raiva de você.',
    how: ['Chegue perto de um acampamento para descobrir quem são os bandidos.', 'Destrua o acampamento para cumprir missões e ganhar recompensas.', 'Ou assuma um deles na aba "Virar bandido".'],
    when: 'Para caçar recompensas, cumprir missões de sociedades e ordens, ou escolher o seu esconderijo.' },
  companhias: { name: 'Contratar soldados', tip: 'Companhias de soldados de aluguel: o soldo é cobrado todo mês.',
    use: 'Contratar companhias de mercenários para lutar ao seu lado.',
    how: ['Compare homens, força, qualidade e lealdade de cada companhia.', 'Clique em "Contratar": o soldo sai do seu bolso (ou do tesouro do seu reino) todo mês.', 'Dispense quando não precisar mais, para não pagar à toa.'],
    when: 'Antes de uma guerra ou de um golpe contra um rei. Dois meses sem pagar e a companhia troca de lado.' },
  regras: { name: 'Seus contratos e regras', tip: 'O que você tem contratado e como funcionam o soldo e a lealdade.',
    use: 'Ver quantas companhias, homens e quanto soldo você paga, e as regras dos mercenários.',
    how: ['Confira o total de homens e o soldo do mês.', 'Leia as regras: nas guerras somam ao exército; num golpe seguram a guarda real.'],
    when: 'Para planejar o orçamento antes de contratar mais gente.' },
  noticias: { name: 'Notícias das companhias', tip: 'O que aconteceu com as companhias: contratos, batalhas e deserções.',
    use: 'Acompanhar a história recente das companhias de mercenários.',
    how: ['Leia as notícias em ordem, das mais novas para as mais antigas.'],
    when: 'Depois de uma guerra, ou quando uma companhia mudar de lado.' },
};
const SvX = {
  help(k) {
    const g = SVX_GUIDE[k]; if (!g) return;
    Dialog.alert({ icon: '❓', title: g.name, ok: 'Entendi', html: `<div class="svx-help"><div><b>🎯 Para que serve</b><p>${UI.esc(g.use)}</p></div>
      <div><b>🧭 Como usar</b><ol>${g.how.map(t => `<li>${UI.esc(t)}</li>`).join('')}</ol></div><div><b>⏰ Quando usar</b><p>${UI.esc(g.when)}</p></div></div>` });
  },
};
{
  // nomes que dizem o que se faz, e a frase + o botão de ajuda na linha das abas
  const sb0 = Services.subs.bind(Services);
  Services.subs = function (g, list) {
    if (!['ol0', 'ol1', 'mc'].includes(g)) return sb0(g, list);
    const L = list.map(([k, ic, l, body]) => [k, ic, SVX_GUIDE[k] ? SVX_GUIDE[k].name : l, body]);
    let h = sb0(g, L);
    const cur = (UI.sel.svSub || {})[g], k = (L.find(x => x[0] === cur) || L[0])[0], gd = SVX_GUIDE[k];
    if (gd) { const i = h.indexOf('class="tabs subtabs sv-sub">'); const j = i >= 0 ? h.indexOf('</div>', i) : -1; if (j > 0) h = h.slice(0, j) + `<span class="svx-tip">💡 ${UI.esc(gd.tip)}<button class="svx-q" data-act="svhelp" data-k="${k}">❓ Como usar</button></span>` + h.slice(j); }
    return h;
  };
  // as duas áreas explicam a que vieram
  const ol0 = Portfolio.outlaw.bind(Portfolio);
  Portfolio.outlaw = function (kp0) {
    let h = ol0(kp0);
    h = h.replace("O bando, os golpes e a recompensa pela sua cabeça · companhias livres para a guerra e para golpes", 'Viver do crime ou contratar soldados de aluguel: escolha uma das duas áreas abaixo');
    h = h.replace(/(data-act="oltab" data-t="bando">)([^<]*)Fora da lei/, '$1$2Fora da lei <small>· bandos, golpes e a sua cabeça a prêmio</small>');
    h = h.replace(/(data-act="oltab" data-t="merc">)([^<]*)Mercenários/, '$1$2Mercenários <small>· soldados de aluguel para guerras e golpes</small>');
    return h;
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'svhelp') { SvX.help(d.k); return; } return a0(a, d); };
}
