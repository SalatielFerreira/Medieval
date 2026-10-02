'use strict';
// Janelas de confirmação e de aviso no tema do jogo (no lugar das caixas padrão do navegador).
// Dialog.confirm({ icon, title, text, ok, cancel, danger }, aoConfirmar, aoCancelar)
// Dialog.alert({ icon, title, text, ok }, aoFechar)

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
  push(d) { this.queue.push(d); if (!this.cur) this.next(); },
  isOpen() { return !!this.cur; },
  el() {
    if (this._el) return this._el;
    const el = document.createElement('div');
    el.id = 'dialog'; el.className = 'hidden';
    el.addEventListener('mousedown', e => { if (e.target === el) this.answer(false); });
    el.addEventListener('click', e => { const b = e.target.closest('[data-dlg]'); if (b) this.answer(b.dataset.dlg === 'ok'); });
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
      <div class="dlg-btns">${d.kind === 'confirm' ? `<button data-dlg="cancel">${esc(d.cancel)}</button>` : ''}
        <button class="${d.danger ? 'danger' : 'primary'}" data-dlg="ok">${esc(d.ok)}</button></div>
      <small class="dlg-keys">${d.kind === 'confirm' ? 'Enter confirma · Esc cancela' : 'Enter fecha'}</small></div>`;
    el.classList.remove('hidden');
    // o jogo pausa enquanto a pergunta está na tela
    this.prevPaused = typeof G !== 'undefined' ? G.paused : false;
    this.prevModal = typeof UI !== 'undefined' ? UI.modal : false;
    if (typeof G !== 'undefined') { G.paused = true; G.mouse.down = false; G.keys = {}; }
    if (typeof UI !== 'undefined') UI.modal = true;
    if (typeof Sound !== 'undefined') Sound.play('ui');
    setTimeout(() => { const b = el.querySelector('[data-dlg="ok"]'); if (b) b.focus(); }, 30);
  },
  answer(ok) {
    const d = this.cur;
    if (!d) return;
    if (d.kind === 'alert') ok = true; // aviso: fechar de qualquer jeito é "entendi"
    this.cur = null;
    const el = this.el();
    el.classList.add('hidden'); el.innerHTML = '';
    if (typeof G !== 'undefined') G.paused = this.prevPaused;
    if (typeof UI !== 'undefined') UI.modal = this.prevModal;
    try { if (ok && d.onOk) d.onOk(); else if (!ok && d.onCancel) d.onCancel(); }
    finally { if (this.queue.length) this.next(); }
  },
};
