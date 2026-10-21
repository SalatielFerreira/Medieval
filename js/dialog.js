'use strict';
// Janelas de confirmação e de aviso no tema do jogo (no lugar das caixas padrão do navegador).
// Dialog.confirm({ icon, title, text, ok, cancel, danger }, aoConfirmar, aoCancelar)
// Dialog.alert({ icon, title, text, ok }, aoFechar)
// Dialog.prompt({ icon, title, text, ok, value, placeholder, max, suggestions, check }, aoConfirmar(texto), aoCancelar)

const Dialog = {
  autoYes: false, // testes automáticos: confirma na hora, sem mostrar a janela
  queue: [], cur: null,
  confirm(o, onOk, onCancel) {
    if (typeof o === 'string') o = { text: o };
    if (this.autoYes) { if (onOk) onOk(); return; }
    this.push(Object.assign({ kind: 'confirm', icon: o.danger ? '⚠️' : '❓', title: 'Confirmar', ok: 'Confirmar', cancel: 'Cancelar' }, o, { onOk, onCancel }));
  },
  alert(o, onClose) {
    if (typeof o === 'string') o = { text: o };
    if (this.autoYes) { if (onClose) onClose(); return; }
    this.push(Object.assign({ kind: 'alert', icon: 'ℹ️', title: 'Aviso', ok: 'Entendi' }, o, { onOk: onClose }));
  },
  // pergunta com campo de texto (ex.: o nome de uma vila). check(texto) devolve uma mensagem de erro ou nada.
  prompt(o, onOk, onCancel) {
    if (this.autoYes) { if (onOk) onOk(String(o.value || '').trim()); return; }
    this.push(Object.assign({ kind: 'prompt', icon: '✏️', title: 'Escreva', ok: 'Confirmar', cancel: 'Cancelar', value: '', max: 28 }, o, { onOk, onCancel }));
  },
  push(d) { this.queue.push(d); if (!this.cur) this.next(); },
  isOpen() { return !!this.cur; },
  el() {
    if (this._el) return this._el;
    const el = document.createElement('div');
    el.id = 'dialog'; el.className = 'hidden';
    el.addEventListener('mousedown', e => { if (e.target === el) this.answer(false); });
    el.addEventListener('click', e => {
      const sg = e.target.closest('[data-dsug]');
      if (sg) { const inp = el.querySelector('#dlgIn'); if (inp) { inp.value = sg.dataset.dsug; inp.focus(); } return; }
      const b = e.target.closest('[data-dlg]'); if (b) this.answer(b.dataset.dlg === 'ok');
    });
    // teclado: Enter confirma, Esc cancela (e nada chega ao jogo enquanto a janela está aberta)
    window.addEventListener('keydown', e => {
      if (!this.cur) return;
      if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.answer(false); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); e.stopImmediatePropagation(); this.answer(true); }
      else if (e.target.tagName !== 'INPUT') e.stopImmediatePropagation();
    }, true);
    document.body.appendChild(el);
    return (this._el = el);
  },
  next() {
    const d = this.cur = this.queue.shift();
    if (!d) return;
    const el = this.el(), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    el.innerHTML = `<div class="dlg-box ${d.danger ? 'danger' : ''}" role="dialog" aria-modal="true">
      <div class="dlg-ic">${esc(d.icon)}</div>
      <h3>${esc(d.title)}</h3>
      <p>${esc(d.text)}</p>
      ${d.kind === 'prompt' ? `<input class="dlg-in" id="dlgIn" maxlength="${d.max}" value="${esc(d.value)}" placeholder="${esc(d.placeholder || '')}" autocomplete="off">
        ${d.suggestions && d.suggestions.length ? `<div class="dlg-sug">${d.suggestions.map(x => `<button data-dsug="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
        <small class="dlg-err" id="dlgErr"></small>` : ''}
      <div class="dlg-btns">${d.kind !== 'alert' ? `<button data-dlg="cancel">${esc(d.cancel)}</button>` : ''}
        <button class="${d.danger ? 'danger' : 'primary'}" data-dlg="ok">${esc(d.ok)}</button></div>
      <small class="dlg-keys">${d.kind !== 'alert' ? 'Enter confirma · Esc cancela' : 'Enter fecha'}</small></div>`;
    el.classList.remove('hidden');
    document.body.classList.add('dlg-open');
    // o jogo pausa enquanto a pergunta está na tela
    this.prevPaused = typeof G !== 'undefined' ? G.paused : false;
    this.prevModal = typeof UI !== 'undefined' ? UI.modal : false;
    if (typeof G !== 'undefined') { G.paused = true; G.mouse.down = false; G.keys = {}; }
    if (typeof UI !== 'undefined') UI.modal = true;
    if (typeof Sound !== 'undefined') Sound.play('ui');
    setTimeout(() => { const inp = el.querySelector('#dlgIn'); if (inp) { inp.focus(); inp.select(); return; } const b = el.querySelector('[data-dlg="ok"]'); if (b) b.focus(); }, 30);
  },
  answer(ok) {
    const d = this.cur;
    if (!d) return;
    if (d.kind === 'alert') ok = true; // aviso: fechar de qualquer jeito é "entendi"
    let value;
    if (d.kind === 'prompt' && ok) {
      const inp = this.el().querySelector('#dlgIn');
      value = (inp ? inp.value : '').replace(/\s+/g, ' ').trim();
      const err = !value ? 'Escreva um nome.' : d.check ? d.check(value) : null;
      if (err) { const e = this.el().querySelector('#dlgErr'); if (e) e.textContent = err; if (inp) inp.focus(); return; }
    }
    this.cur = null;
    const el = this.el();
    el.classList.add('hidden'); el.innerHTML = '';
    document.body.classList.remove('dlg-open');
    if (typeof G !== 'undefined') G.paused = this.prevPaused;
    if (typeof UI !== 'undefined') UI.modal = this.prevModal;
    try { if (ok && d.onOk) d.onOk(value); else if (!ok && d.onCancel) d.onCancel(); }
    finally { if (this.queue.length) this.next(); }
  },
};
