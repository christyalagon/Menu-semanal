import assert from 'node:assert/strict';
import { forecast, mondayOf, mealsForWeek } from './core.js';

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

console.log('Cálculos del menú verificados correctamente.');
