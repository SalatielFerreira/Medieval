'use strict';
// Crônica da dinastia: um livro ilustrado com a história da sua casa. Um capítulo para cada herói da família (reis,
// guerras, golpes, eleições, falências, casamentos, jogos), com iluminuras, letra capitular e páginas para virar.
// Abre sozinho no fim de cada geração (quando o herdeiro assume) e a qualquer hora pelo Diário.

const BOOK_ICONS = [['👑', /coroa|reino|trono|rei |rainha|soberan|usurp/i], ['⚔️', /guerra|batalha|exército|cerco|vencer|derrot/i], ['🗡️', /golpe|complô|trai|assassin/i], ['🗳️', /eleiç|eleit|governador/i],
  ['💥', /faliu|falência|quebrou|anarquia/i], ['💍', /casou|casamento|noiv/i], ['🏅', /jogos|ouro|prata|bronze|torneio|justa/i], ['🏦', /banco|tesouro/i], ['📜', /lei |decret/i], ['👶', /nasceu|filho|filha/i], ['🏘️', /vila|aldeia/i], ['🏆', /conquista/i]];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

const Book = {
  icon(t) { const m = BOOK_ICONS.find(([, re]) => re.test(t)); return m ? m[0] : '✒️'; },
  clean(t) { return String(t).replace(/^\s*[\p{Extended_Pictographic}☀-➿️‍]+\s*/u, ''); },
  // os capítulos: cada herói da dinastia, com o que aconteceu no tempo dele
  chapters() {
    const heroes = (G.dynasty || []).map(h => Object.assign({ done: true }, h));
    heroes.push({ name: G.name, sex: P.sex, age: P.age, day: G.day, level: P.level, kingdoms: G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short), now: true });
    const src = [...(G.diary || []).map(d => ({ day: d.day, t: d.text })), ...(typeof Reign !== 'undefined' ? (Reign.R().chron || []).map(d => ({ day: d.d, t: d.t })) : []),
      ...(typeof Politics !== 'undefined' ? Politics.S().log.filter(l => /você|Você/.test(l.t)).map(l => ({ day: l.day, t: l.t })) : []),
      ...(typeof Laws !== 'undefined' ? Laws.L().log.map(l => ({ day: l.day, t: l.t })) : []),
      ...Diplo.D().log.filter(l => G.surname && l.text.includes(G.surname)).map(l => ({ day: l.day, t: l.text }))];
    const seen = new Set(), ev = src.filter(e => e.t && !seen.has(e.t) && seen.add(e.t)).sort((a, b) => a.day - b.day);
    let from = 0;
    return heroes.map((h, k) => { const to = h.now ? Infinity : h.day, list = ev.filter(e => e.day > from && e.day <= to); from = h.day; return Object.assign(h, { n: k, events: list }); });
  },
  pages() {
    const C = this.chapters(), esc = UI.esc.bind(UI), arms = G.mainRealm !== undefined && G.mainRealm !== null && G.civs[G.mainRealm] ? Heraldry.armsSvg(G.mainRealm, 120) : '<span class="bk-shield">🛡️</span>';
    const cd0 = Calendar.of(1), cd = Calendar.of(G.day), out = [];
    out.push(`<div class="bk-cover">${arms}<h1>Crônica da Casa ${esc(G.surname || '')}</h1><p class="bk-sub">${C.length} ${C.length === 1 ? 'geração' : 'gerações'} · do ano ${cd0.year} ao ano ${cd.year}</p><p class="bk-epi">“Que os nomes desta casa sejam lembrados enquanto houver quem leia.”</p></div>`);
    for (const h of C) {
      const title = h.kingdoms && h.kingdoms.length ? `${h.sex === 'f' ? 'Rainha' : 'Rei'} de ${h.kingdoms.join(', ')}` : h.sex === 'f' ? 'Aventureira' : 'Aventureiro';
      const big = h.kingdoms && h.kingdoms.length ? '👑' : '🗺️';
      const evs = h.events.slice(-28);
      const first = `<div class="bk-chap"><div class="bk-illu">${big}</div><h2>${ROMAN[h.n] || h.n + 1}. ${esc(h.name)} ${esc(G.surname || '')}</h2><p class="bk-sub">${title} · ${h.now ? `${h.age} anos e a história continua` : `viveu ${h.age} anos · morreu ${esc(h.cause || '')}`}</p>
        <p class="bk-text">${evs.length ? `No tempo de ${esc(h.name)}, ${evs.length === 1 ? 'aconteceu' : 'aconteceram'} ${evs.length} ${evs.length === 1 ? 'coisa digna de nota' : 'coisas dignas de nota'}. Assim os escribas contaram:` : `Pouco se escreveu sobre ${esc(h.name)}: ${h.now ? 'a história ainda está sendo escrita' : 'foi um tempo de paz e trabalho'}.`}</p></div>`;
      const items = evs.map(e => `<div class="bk-ev"><span class="bk-ic">${this.icon(e.t)}</span><span><small>${Calendar.short(e.day)}</small> ${esc(this.clean(e.t))}</span></div>`);
      // cada página: o começo do capítulo e até 7 acontecimentos; o resto continua nas páginas seguintes
      out.push(first + items.slice(0, 5).join(''));
      for (let k = 5; k < items.length; k += 8) out.push(`<div class="bk-cont"><h3>${esc(h.name)} — continuação</h3>${items.slice(k, k + 8).join('')}</div>`);
    }
    const ruled = G.civs.filter(c => c.ruler === 'player');
    out.push(`<div class="bk-end"><div class="bk-illu">🕯️</div><h2>E a história continua…</h2><p class="bk-text">Hoje a Casa ${esc(G.surname || '')} ${ruled.length ? `governa ${ruled.map(c => CIV_DEFS[c.id].name).join(', ')}` : 'ainda sonha com uma coroa'}, tem ${P.gold} moedas no cofre e ${Court.fame()} de fama. ${esc(G.name)} escreve o próximo capítulo.</p><p class="bk-epi">Fim do livro, por enquanto.</p></div>`);
    return out;
  },
};
UI.showBook = function (pg) {
  const P0 = Book.pages(), n = P0.length, k = U.clamp(pg === undefined ? (this.sel.bookPg || 0) : pg, 0, n - 1); this.sel.bookPg = k;
  const two = !document.body.classList.contains('small');
  const L = two ? k - (k % 2) : k, R = two ? L + 1 : -1;
  const h = `<div class="book ${two ? 'two' : 'one'}"><div class="bk-page left" style="animation-name:bkFlip">${P0[L] || ''}<small class="bk-n">${L + 1}</small></div>${two ? `<div class="bk-page right">${P0[R] || '<div class="bk-blank">✦</div>'}<small class="bk-n">${R < n ? R + 1 : ''}</small></div>` : ''}</div>
    <div class="act-row bk-nav"><button data-act="book" data-p="${L - (two ? 2 : 1)}" ${L <= 0 ? 'disabled' : ''}>◀ Página anterior</button><span>${L + 1}${two && R < n ? '–' + (R + 1) : ''} de ${n}</span><button class="primary" data-act="book" data-p="${L + (two ? 2 : 1)}" ${L + (two ? 2 : 1) >= n ? 'disabled' : ''}>Próxima página ▶</button></div>`;
  this.open('📖 Crônica da dinastia', h, 'showBook', [k], `Casa ${G.surname || ''}`);
};

{
  // fim de uma geração: o livro abre quando o herdeiro assume
  const eh0 = Progress.endHero.bind(Progress);
  Progress.endHero = function (cause) { const r = eh0(cause); G.bookPending = true; return r; };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); if (G.bookPending && G.state === 'play' && !P.dead && !UI.cur && !Dialog.isOpen()) { G.bookPending = false; UI.sel.bookPg = 0; UI.showBook(0); } };
  // no Diário: o botão do livro
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showDiary') body = `<div class="act-row bk-open"><button class="primary" data-act="book" data-p="0">📖 Crônica da dinastia (livro ilustrado)</button></div>` + body;
    return op0(title, body, fn, args, sub);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'book') { UI.showBook(+d.p); return; } return a0(a, d); };
}
