/* ============================================================
   ОЧКАРИК · страницы меню, достижений и правил
   ============================================================ */
window.Pages = {
  menu() {
    const s = Save.data;
    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    set('achCount', s.ach.length + '/' + ACH.length);
    set('bestTxt', 'Пройдено ночей: ' + s.best + (s.runs ? ' · заходов: ' + s.runs : ''));
    const c = document.getElementById('contBtn');
    if (c) { c.hidden = s.cont < 2; const n = document.getElementById('contN'); if (n) n.textContent = s.cont; }
    document.querySelectorAll('.dbtn').forEach(b => b.classList.toggle('on', b.dataset.diff === s.diff));
    const warn = document.getElementById('tamper');
    if (warn) warn.hidden = !s.tampered;
  },

  ach() {
    const list = document.getElementById('achList');
    if (!list) return;
    const s = Save.data;
    const head = document.getElementById('achHead');
    if (head) head.textContent = s.ach.length + ' / ' + ACH.length;
    list.innerHTML = ACH.map(a => {
      const got = s.ach.indexOf(a.id) !== -1;
      return '<div class="ach ' + (got ? 'got' : '') + '"><span class="mk">' + (got ? '✦' : '·') +
             '</span><div><b>' + a.n + '</b><p>' + a.d + '</p></div></div>';
    }).join('');
  }
};
