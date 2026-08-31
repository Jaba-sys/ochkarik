/* ============================================================
   ОЧКАРИК · достижения
   У каждого достижения есть правило — функция от итогов ночи.
   Выдача проходит только если правило действительно выполнено,
   поэтому подделать её вызовом «дай мне это» нельзя.
   ============================================================ */
window.ACH = [
  { id: 'n1',        n: 'Первая ночь',         d: 'Дожить до 6:00.',
    r: g => g.won },
  { id: 'n3',        n: 'Привычка',            d: 'Пройти три ночи подряд за один заход.',
    r: g => g.won && g.chain >= 3 },
  { id: 'n5',        n: 'Пять ночей',          d: 'Пройти пять ночей подряд за один заход.',
    r: g => g.won && g.chain >= 5 },
  { id: 'n7',        n: 'Неделя без сна',      d: 'Пройти семь ночей подряд за один заход.',
    r: g => g.won && g.chain >= 7 },
  { id: 'clutch',    n: 'В последнюю секунду', d: 'Закрыть дверь, когда до него осталось меньше секунды.',
    r: g => g.repelled > 0 && g.lastFleeGrace < 1 },
  { id: 'blind',     n: 'Слышу тебя',          d: 'Прогнать его, ни разу за ночь не подняв телефон.',
    r: g => g.repelled > 0 && g.phoneUses === 0 },
  { id: 'nophone',   n: 'Телефон? Не знаю',    d: 'Пройти всю ночь, ни разу не подняв телефон.',
    r: g => g.won && g.phoneUses === 0 },
  { id: 'calm',      n: 'Железные нервы',      d: 'Пройти ночь, не подняв панику выше 40%.',
    r: g => g.won && g.maxPanic <= 40 },
  { id: 'owl',       n: 'Сова',                d: 'Не спать 45 секунд подряд и дожить до утра.',
    r: g => g.won && g.maxAwake >= 45 },
  { id: 'sleep',     n: 'Соня',                d: 'Проспать больше половины ночи и всё равно выжить.',
    r: g => g.won && g.slept > g.dur / 2 },
  { id: 'x3',        n: 'Трижды отогнан',      d: 'Прогнать его три раза за одну ночь.',
    r: g => g.repelled >= 3 },
  { id: 'red',       n: 'Красная зона',        d: 'Дожить до утра после того, как экран покраснел.',
    r: g => g.won && g.wasRed },
  { id: 'lastdrop',  n: 'На последней капле',  d: 'Дожить до утра со сном ниже 5%.',
    r: g => g.won && g.minSleep < 5 },
  { id: 'deadbatt',  n: 'Ноль процентов',      d: 'Дожить до утра с полностью севшим телефоном.',
    r: g => g.won && g.batt <= 0 },
  { id: 'notfooled', n: 'Меня не проведёшь',   d: 'Пройти ночь с обманками, ни разу не закрыв дверь впустую.',
    r: g => g.won && g.hadFake && !g.fooled },
  { id: 'nightmare', n: 'Кошмар пройден',      d: 'Дожить до 6:00 на сложности «Кошмар».',
    r: g => g.won && g.diff === 'nightmare' }
];

window.Achievements = {
  has(id) { return Save.data.ach.indexOf(id) !== -1; },
  count()  { return Save.data.ach.length; },

  /* Единственный путь к награде. Нужны три вещи сразу:
     живая сессия ночи, её токен и факты, подтверждающие правило. */
  claim(id, token, facts) {
    if (!Guard.accepts(token)) return false;
    if (this.has(id)) return false;
    const a = ACH.find(x => x.id === id);
    if (!a) return false;
    if (!this.sane(facts)) return false;
    if (!a.r(facts)) return false;
    Save.data.ach.push(id);
    Save.persist();
    if (window.UI && UI.popAch) UI.popAch(a.n);
    return true;
  },

  /* Отсев невозможных итогов: ночь не может длиться дольше себя самой
     или содержать больше побегов, чем физически успевает случиться. */
  sane(f) {
    if (!f || typeof f !== 'object') return false;
    if (!(f.t > 0) || f.t > f.dur + 3) return false;
    if (f.repelled < 0 || f.repelled > f.dur / 4) return false;
    if (f.slept < 0 || f.slept > f.t + 1) return false;
    if (f.chain < 1 || f.chain > 99) return false;
    return true;
  }
};
