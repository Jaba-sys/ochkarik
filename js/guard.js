/* ============================================================
   ОЧКАРИК · защита достижений
   Достижение нельзя получить из меню, с чужой страницы или
   вызовом из консоли: выдача принимает только живую сессию ночи,
   а условие ещё раз проверяется по фактическим цифрам этой ночи.
   ============================================================ */
window.Guard = (function () {
  let token = null;      // секрет текущей ночи
  let open = false;      // ночь идёт прямо сейчас
  let sealed = false;    // ночь закончена — выдача закрыта

  function rnd() {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(3); crypto.getRandomValues(a);
      return Array.from(a).map(x => x.toString(36)).join('');
    }
    return String(Math.random()) + Date.now().toString(36);
  }

  return {
    /* Ночь началась — выдаём одноразовый токен игровому ядру */
    openRun() { token = rnd(); open = true; sealed = false; return token; },

    /* Ночь закончилась: даём короткое окно на подсчёт итогов, потом закрываем */
    finishRun() { open = false; sealed = false; },
    seal() { token = null; sealed = true; open = false; },

    /* Проверка: правильный токен и ночь не запечатана */
    accepts(t) {
      if (sealed || token === null) return false;
      if (t !== token) return false;
      return Router.current() === 'game';
    }
  };
})();
