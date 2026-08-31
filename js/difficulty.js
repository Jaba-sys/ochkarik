/* ============================================================
   ОЧКАРИК · сложность и расчёт ночи
   ============================================================ */
window.DIFF = {
  easy:      { key: 'easy',      label: 'ПОЛУСОН',     speed: .78, grace: 1.35, drain: .82,
               panic: .8,  batt: .75, fake: .5,  returnMul: 1.25, knockAt: 4 },
  normal:    { key: 'normal',    label: 'БЕССОННИЦА',  speed: 1,   grace: 1,    drain: 1,
               panic: 1,   batt: 1,   fake: 1,   returnMul: 1,    knockAt: 3 },
  nightmare: { key: 'nightmare', label: 'КОШМАР',      speed: 1.38, grace: .68, drain: 1.28,
               panic: 1.22, batt: 1.4, fake: 1.7, returnMul: .58,  knockAt: 1 }
};

/* Параметры конкретной ночи n на сложности d */
window.nightCfg = function (n, dkey) {
  const d = DIFF[dkey] || DIFF.normal;
  return {
    diff:      d,
    dur:       Math.min(150, 70 + n * 8),                       // длительность ночи, с
    speed:     (16 + n * 4.2) * d.speed,                        // м/с
    grace:     Math.max(1.5, (5.2 - n * .34) * d.grace),        // сек в квартире до входа
    start:     820 + Math.random() * 340,                       // стартовая дистанция
    drain:     (3.0 + n * .16) * d.drain,                       // сон/с бодрствования
    phoneMul:  3,                                               // множитель расхода сна с телефоном
    gain:      16,                                              // восстановление сна/с
    panicUp:   (8.0 + n * .45) * d.panic,
    panicDn:   6.8,
    battDrain: 3.1 * d.batt,                                    // %/с с поднятым телефоном
    battIdle:  .13,                                             // %/с просто так
    fakes:     n >= 3,                                          // с третьей ночи звуки-обманки
    fakeRate:  (n >= 3 ? (6 + Math.max(0, 9 - n)) : 99) / d.fake, // средний интервал обманок, с
    knocks:    n >= d.knockAt,                                  // стучит в дверь перед входом
    liar:      n >= 5 || dkey === 'nightmare'                   // может замереть у двери и не войти сразу
  };
};
