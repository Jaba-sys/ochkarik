/* ============================================================
   ОЧКАРИК · навигация
   Проект многостраничный: каждая страница — отдельный HTML.
   Собранная одностраничная версия держит все <main data-page>
   в одном документе, и роутер переключает их без перезагрузки.
   ============================================================ */
window.Router = (function () {
  const pages = document.querySelectorAll('[data-page]');
  const single = pages.length > 1;
  const FILE = { menu: 'index.html', game: 'game.html', ach: 'achievements.html', help: 'help.html' };

  function current() {
    if (!single) return document.querySelector('[data-page]').dataset.page;
    const on = document.querySelector('[data-page].on');
    return on ? on.dataset.page : null;
  }

  function go(page, params) {
    if (params) Session.setPending(params);
    if (single) {
      pages.forEach(p => p.classList.toggle('on', p.dataset.page === page));
      window.dispatchEvent(new CustomEvent('page:' + page));
      window.scrollTo(0, 0);
    } else {
      location.href = FILE[page];
    }
  }

  /* Выполнить fn при загрузке нужной страницы и при каждом заходе на неё */
  function on(page, fn) {
    if (current() === page) fn();
    window.addEventListener('page:' + page, fn);
  }

  if (pages.length) {
    pages.forEach((p, i) => p.classList.toggle('on', i === 0));
  }

  return { go, on, current, single };
})();
