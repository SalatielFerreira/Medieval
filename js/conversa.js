'use strict';
// A conversa com um NPC cabe numa página só: as ações ficam em colunas que se equilibram e, se ainda faltar espaço,
// os botões ficam mais compactos (sem rolar a janela).
{
  const fit = () => {
    const el = UI.panel && UI.panel.querySelector('.tk2-acts'); if (!el) return;
    el.classList.remove('tight', 'tighter');
    const over = () => el.scrollWidth > el.clientWidth + 8 || el.scrollHeight > el.clientHeight + 4;
    if (over()) el.classList.add('tight');
    if (over()) el.classList.add('tighter');
    if (over()) { el.style.overflowY = 'auto'; } else el.style.overflowY = ''; // (último recurso: nada fica escondido)
  };
  const st0 = UI.showTalk.bind(UI);
  UI.showTalk = function (...a) { const r = st0(...a); try { fit(); requestAnimationFrame(fit); } catch (e) { console.error(e); } return r; };
}
