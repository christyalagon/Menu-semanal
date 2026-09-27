import assert from 'node:assert/strict';
import { forecast, mondayOf, mealsForWeek, weightStats } from './core.js';

const week = mondayOf(new Date(2026, 8, 23));
const empty = forecast(week, {}, {});
assert.equal(mealsForWeek(week, {}).length, 28);
assert.equal(empty.arroz.required, 300);
assert.equal(empty.pollo.required, 1010);
assert.equal(empty.verdura.required, 2850);
assert.equal(empty.aceite.required, 103);
assert.equal(empty.pan.required, 790);
assert.equal(empty.huevos.required, 3);
assert.equal(empty.arroz.firstMissing, 0);

const covered = forecast(week, { arroz: 300 }, {});
assert.equal(covered.arroz.toBuy, 0);
assert.equal(covered.arroz.firstMissing, null);
assert.equal(covered.arroz.lastCovered, 5);

const mondayBreakfastDone = { [`${week}:0:0`]: true };
const afterBreakfast = forecast(week, { pan: 700 }, mondayBreakfastDone);
assert.equal(afterBreakfast.pan.required, 700);
assert.equal(afterBreakfast.pan.toBuy, 0);

const carolinaMondayLunch = { [`${week}:0:1`]: true };
const shared = forecast(week, {}, {}, carolinaMondayLunch);
assert.equal(shared.arroz.required, 390);
assert.equal(shared.pollo.required, 1180);
assert.equal(shared.verdura.required, 3100);

const progress = weightStats({'2026-09-25':80.7,'2026-09-01':82,'fecha-mal':99,'2026-09-12':81.2});
assert.equal(progress.entries.length,3);
assert.deepEqual(progress.first,{date:'2026-09-01',value:82});
assert.deepEqual(progress.latest,{date:'2026-09-25',value:80.7});
assert.equal(progress.change,-1.3);

console.log('Cálculos del menú verificados correctamente.');
