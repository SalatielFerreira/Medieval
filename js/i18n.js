'use strict';
// Idiomas do jogo: português (o original), inglês e espanhol.
// O jogo é escrito em português; as traduções ficam em js/lang_xx.js (geradas por scripts/i18n-build.js).
// Tudo o que vai para a tela passa por aqui: o HTML das janelas (innerHTML, textContent...) e os textos
// desenhados no mapa (fillText). Cada texto é procurado inteiro; se não estiver na lista (tem nome, número...),
// é procurado o modelo dele ("Você tem {0} moedas") e, por último, os pedaços conhecidos.
const I18N_LANGS = [
  { k: 'pt', name: 'Português' },
  { k: 'en', name: 'English' },
  { k: 'es', name: 'Español' },
];
// bandeiras desenhadas (os emojis de bandeira não aparecem no Windows): Brasil, Estados Unidos e Espanha
const I18N_FLAGS = {
  pt: '<rect width="30" height="20" fill="#009b3a"/><path d="M15 2.5 27.5 10 15 17.5 2.5 10z" fill="#fedf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/><path d="M10.6 9.1q4.6-1 8.8 1.6" stroke="#fff" stroke-width=".9" fill="none"/>',
  en: '<rect width="30" height="20" fill="#fff"/>' + [0, 2, 4, 6, 8, 10, 12].map(i => `<rect y="${i * 20 / 13}" width="30" height="${20 / 13}" fill="#b22234"/>`).join('') + '<rect width="13" height="10.77" fill="#3c3b6e"/>' + [1.6, 4.3, 7, 9.7].map(y => [2, 5, 8, 11].map(x => `<circle cx="${x}" cy="${y + (x === 5 || x === 11 ? 0.9 : 0)}" r=".55" fill="#fff"/>`).join('')).join(''),
  es: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/><rect x="7" y="7.5" width="3.4" height="5" rx=".6" fill="#aa151b" opacity=".75"/>',
};
const i18nFlag = (k, h) => `<svg class="lang-flag" viewBox="0 0 30 20" width="${h * 1.5}" height="${h}" aria-hidden="true">${I18N_FLAGS[k]}</svg>`;

// chave de um texto: espaços juntados e sem o que vem antes da primeira letra e depois da última (emoji, pontos...)
const I18N_TOOLS = {
  core(s) {
    const t = String(s).replace(/\s+/g, ' ');
    const pre = (t.match(/^(?:(?!\{\d+\})[^\p{L}\p{N}])*/u) || [''])[0];
    const rest = t.slice(pre.length);
    const suf = (rest.match(/[^\p{L}\p{N}}]*$/u) || [''])[0];
    return { pre, core: rest.slice(0, rest.length - suf.length), suf };
  },
  // é texto para pessoas (e não um nome interno, cor, CSS, caminho de arquivo...)?
  isText(k) {
    if ((k.match(/\p{L}/gu) || []).length < 2) return false;
    if (/^[a-z0-9_.$-]+$/.test(k) && (/[0-9_.$-]/.test(k) || k.length < 3)) return false; // nome interno (gold_ring, data-m)
    if (/^[a-z]+[A-Z][A-Za-z0-9]*$/.test(k)) return false; // camelCase
    if (/^(rgba?|hsla?|url|var|calc|translate|rotate|scale)\(/.test(k) || /^#[0-9a-f]{3,8}$/i.test(k)) return false;
    if (/^[\w-]+:\s*[^ ]+;/.test(k) || /;\s*[\w-]+:/.test(k)) return false; // CSS
    if (/^(https?:|\.\/|\/)/.test(k) || /^[\w./-]+\.(js|json|png|svg|css|html|mp3|ogg|wav)$/.test(k)) return false;
    if (/^[\w-]+(\s+[\w-]+)*$/.test(k) && /[-_]/.test(k) && !/\s/.test(k)) return false;
    if (/^[a-z][\w-]*(\s+[a-z][\w-]*)+$/.test(k) && /[a-z]-[a-z]/.test(k)) return false; // classes de CSS ("mc-opt on")
    if (/="|='|data-[a-z]|class=|style=/.test(k)) return false; // pedaço de marca de HTML
    return true;
  },
};
if (typeof module !== 'undefined') module.exports = { I18N_TOOLS, I18N_LANGS };

const I18N = {
  KEY: 'medieval_lang',
  lang: 'pt',
  dict: null,     // { chave: tradução }
  tpls: null,     // modelos com {n}, por pedaço mais longo
  cache: new Map(),
  init() {
    try { const l = localStorage.getItem(this.KEY); if (l && I18N_LANGS.some(x => x.k === l)) this.lang = l; } catch (e) {}
    const url = new URLSearchParams(location.search).get('lang'); if (url && I18N_LANGS.some(x => x.k === url)) this.lang = url;
    document.documentElement.lang = { pt: 'pt-BR', en: 'en', es: 'es' }[this.lang];
  },
  on() { return this.lang !== 'pt' && !!this.dict; },
  // escolher o idioma: guarda e recarrega a página (tudo é redesenhado já traduzido)
  set(l) {
    if (l === this.lang) return;
    try { localStorage.setItem(this.KEY, l); } catch (e) {}
    location.reload();
  },
  // o arquivo do idioma (js/lang_xx.js) chama isto
  load(lang, d) {
    if (lang !== this.lang) return;
    this.dict = d; this.cache.clear();
    // modelos: indexados pelo pedaço fixo mais longo, para achar os candidatos de um texto
    this.tpls = new Map(); const segs = new Set();
    for (const k in d) {
      if (k.indexOf('{') < 0 || !/\{\d+\}/.test(k)) continue;
      const parts = k.split(/\{\d+\}/), long = parts.reduce((a, b) => b.trim().length > a.trim().length ? b : a, '').trim();
      if (long.length < 2) continue;
      const order = [...k.matchAll(/\{(\d+)\}/g)].map(m => +m[1]);
      const re = new RegExp('^' + parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)') + '$');
      if (!this.tpls.has(long)) this.tpls.set(long, []);
      this.tpls.get(long).push({ re, order, to: d[k] });
      segs.add(long);
    }
    // pedaços: os textos curtos conhecidos (para os textos que vêm montados com +)
    const all = Object.keys(d).filter(k => k.indexOf('{') < 0 && k.length >= 3).sort((a, b) => b.length - a.length);
    this.pieceRe = all.length ? new RegExp('(?<![\\p{L}\\p{N}])(' + all.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{N}])', 'gu') : null;
    this.segRe = segs.size ? new RegExp([...segs].sort((a, b) => b.length - a.length).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g') : null;
    if (document.body) this.sweep(); else document.addEventListener('DOMContentLoaded', () => this.sweep());
  },
  // traduz um texto qualquer da tela
  t(s) {
    if (!this.dict || s == null) return s;
    s = String(s); if (s.length < 2 || !/\p{L}/u.test(s)) return s;
    const c = this.cache.get(s); if (c !== undefined) return c;
    let r = this.tx(s);
    if (this.cache.size > 20000) this.cache.clear();
    this.cache.set(s, r); this.cache.set(r, r);
    return r;
  },
  tx(s) {
    const lead = s.match(/^\s*/)[0], trail = s.slice(lead.length).match(/\s*$/)[0];
    const { pre, core, suf } = I18N_TOOLS.core(s.slice(lead.length, s.length - trail.length));
    if (!core) return s;
    const w = this.word(core);
    return w === null ? s : lead + pre + w + suf + trail;
  },
  // o miolo do texto (sem os enfeites): inteiro, modelo ou pedaços. null = não traduz
  word(core, depth) {
    const d = this.dict, hit = d[core]; if (hit !== undefined) return hit;
    depth = depth || 0;
    if (depth < 3 && this.segRe) {
      this.segRe.lastIndex = 0; let m; const seen = new Set();
      while ((m = this.segRe.exec(core))) {
        if (seen.has(m[0])) continue; seen.add(m[0]);
        for (const tp of this.tpls.get(m[0]) || []) {
          const mm = core.match(tp.re); if (!mm) continue;
          return tp.to.replace(/\{(\d+)\}/g, (_, n) => { const v = mm[1 + tp.order.indexOf(+n)]; return v === undefined ? '' : this.part(v, depth + 1); });
        }
      }
    }
    if (!this.pieceRe) return null;
    let any = false;
    const out = core.replace(this.pieceRe, p => { const t = d[p]; if (t === undefined) return p; any = true; return t; });
    return any ? out : null;
  },
  // um pedaço que entrou no lugar de um {n} (nome de item, de lugar...): traduz se for conhecido
  part(v, depth) {
    const lead = v.match(/^\s*/)[0], trail = v.slice(lead.length).match(/\s*$/)[0];
    const { pre, core, suf } = I18N_TOOLS.core(v.slice(lead.length, v.length - trail.length));
    if (!core) return v;
    const w = this.word(core, depth);
    return lead + pre + (w === null ? core : w) + suf + trail;
  },
  // HTML: traduz o texto entre as marcas e os atributos de dica
  html(h) {
    if (!this.dict || h == null) return h;
    h = String(h); if (!/\p{L}/u.test(h)) return h;
    const c = this.cache.get('\u0003' + h); if (c !== undefined) return c;
    const r = h.replace(/(\b(?:title|placeholder|aria-label|data-tip)=")([^"]*)"/g, (_, a, v) => a + this.t(v.replace(/&quot;/g, '"')).replace(/"/g, '&quot;') + '"')
      .replace(/(<[^>]*)?>([^<]+)</g, (m, tag, x) => (tag || '') + '>' + (tag && tag.indexOf('data-noi18n') >= 0 ? x : this.ent(x)) + '<') // data-noi18n: fica como está
      .replace(/^([^<]+)(?=<|$)/, x => this.ent(x)).replace(/>([^<]+)$/, (m, x) => '>' + this.ent(x));
    if (this.cache.size > 20000) this.cache.clear();
    this.cache.set('\u0003' + h, r);
    return r;
  },
  // texto que veio de HTML (com &amp; etc.)
  ent(x) {
    if (!/\p{L}/u.test(x)) return x;
    if (x.indexOf('&') < 0) return this.t(x).replace(/</g, '&lt;');
    const plain = x.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const t = this.t(plain); if (t === plain) return x;
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  // liga a tradução em tudo o que escreve na tela
  hook() {
    const self = this;
    const wrapSet = (proto, prop, fn) => {
      const d = Object.getOwnPropertyDescriptor(proto, prop); if (!d || !d.set) return;
      if (prop === 'innerHTML') this.rawHTML = (el, h) => d.set.call(el, h);
      Object.defineProperty(proto, prop, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, self.dict ? fn(v, this) : v); } });
    };
    const skip = el => el && (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEXTAREA' || (el.closest && el.closest('[data-noi18n]')));
    wrapSet(Element.prototype, 'innerHTML', (v, el) => skip(el) ? v : self.html(v));
    wrapSet(Element.prototype, 'outerHTML', v => self.html(v));
    wrapSet(Node.prototype, 'textContent', (v, el) => el.nodeType === 1 && skip(el) ? v : self.t(v));
    wrapSet(HTMLElement.prototype, 'innerText', (v, el) => skip(el) ? v : self.t(v));
    wrapSet(CharacterData.prototype, 'data', (v, el) => skip(el.parentNode) ? v : self.t(v));
    wrapSet(Node.prototype, 'nodeValue', (v, el) => el.nodeType === 3 && !skip(el.parentNode) ? self.t(v) : v);
    wrapSet(HTMLInputElement.prototype, 'placeholder', v => self.t(v));
    wrapSet(HTMLElement.prototype, 'title', v => self.t(v));
    const iah = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function (p, h) { return iah.call(this, p, self.html(h)); };
    const ctn = Document.prototype.createTextNode;
    Document.prototype.createTextNode = function (s) { return ctn.call(this, self.t(s)); };
    const sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) { return sa.call(this, n, (n === 'title' || n === 'placeholder' || n === 'aria-label') ? self.t(v) : v); };
    // textos desenhados no mapa e nos quadros (nomes de vilas, placas, balões)
    const C = CanvasRenderingContext2D.prototype;
    for (const fn of ['fillText', 'strokeText', 'measureText']) {
      const o = C[fn];
      C[fn] = function (s, ...a) { return o.call(this, self.dict && typeof s === 'string' ? self.t(s) : s, ...a); };
    }
    if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') for (const fn of ['fillText', 'strokeText', 'measureText']) {
      const P2 = OffscreenCanvasRenderingContext2D.prototype, o = P2[fn];
      P2[fn] = function (s, ...a) { return o.call(this, self.dict && typeof s === 'string' ? self.t(s) : s, ...a); };
    }
    const al = window.alert, cf = window.confirm, pr = window.prompt;
    window.alert = s => al(self.t(s)); window.confirm = s => cf(self.t(s)); window.prompt = (s, d) => pr(self.t(s), d);
  },
  // o que já estava escrito na página (index.html) antes do idioma carregar
  sweep(root) {
    if (!this.dict) return;
    const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
    for (const x of nodes) { const p = x.parentNode; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue; x.data = x.data; }
    document.title = this.t(document.title);
  },
  // o botão do idioma entra no menu sem passar pela tradução (cada idioma com o próprio nome)
  mount(parent) {
    const el = document.createElement('div'); (this.rawHTML || ((e, h) => { e.innerHTML = h; }))(el, this.pickerHtml());
    parent.appendChild(el.firstElementChild);
  },
  // o botão do menu: bandeira do idioma atual; ao tocar, a lista dos idiomas
  pickerHtml() {
    const cur = I18N_LANGS.find(x => x.k === this.lang);
    return `<div class="lang-pick"><button class="lang-btn" data-m="langMenu" title="Idioma · Language">${i18nFlag(cur.k, 16)}<span>${cur.name}</span><i>▾</i></button>
      <div class="lang-list hidden" id="langList">${I18N_LANGS.map(x => `<button class="${x.k === this.lang ? 'on' : ''}" data-m="lang" data-v="${x.k}">${i18nFlag(x.k, 16)}<span>${x.name}</span></button>`).join('')}</div></div>`;
  },};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  I18N.init();
  I18N.hook();
  // o arquivo do idioma escolhido entra logo depois deste (o carregador do index.html lê I18N.lang)
}
