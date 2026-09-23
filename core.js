import { MENU, ITEMS } from './menu.js';

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function mondayOf(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - (d.getDay()+6)%7);
  return localDate(d);
}
export function dateAt(week, day) {
  const [y,m,d] = week.split('-').map(Number);
  return new Date(y,m-1,d+day);
}
export function mealsForWeek(week, done = {}) {
  return MENU.flatMap((meals, day) => meals.map((meal, slot) => ({...meal, day, slot, date:localDate(dateAt(week,day)), key:`${week}:${day}:${slot}`, done:!!done[`${week}:${day}:${slot}`]})));
}
export function requirements(week, done = {}) {
  const rows = Object.fromEntries(Object.keys(ITEMS).map(key => [key, Array(7).fill(0)]));
  for (const meal of mealsForWeek(week,done)) if (!meal.done) for (const [key,amount] of Object.entries(meal.parts)) rows[key][meal.day] += amount;
  return rows;
}
export function forecast(week, stock = {}, done = {}) {
  const req = requirements(week,done);
  return Object.fromEntries(Object.entries(req).map(([key,days]) => {
    const available = Number(stock[key]) || 0;
    const required = days.reduce((sum,n) => sum+n,0);
    let remaining = available, firstMissing = null, lastCovered = null;
    const daily = days.map((amount,day) => {
      const before = remaining;
      remaining -= amount;
      const missing = Math.max(0, -remaining) - Math.max(0, -before);
      if (amount && missing === 0) lastCovered = day;
      if (missing > 0 && firstMissing === null) firstMissing = day;
      return {amount,missing,balance:remaining};
    });
    return [key,{available,required,toBuy:Math.max(0,required-available),firstMissing,lastCovered,daily}];
  }));
}
export function totalForDay(week, day, done = {}) {
  const rows = requirements(week,done);
  return Object.fromEntries(Object.entries(rows).map(([key,values])=>[key,values[day]]));
}
