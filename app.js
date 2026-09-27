import { ITEMS, MENU, DAY_NAMES, SHORT_DAYS } from './menu.js';
import { mondayOf, dateAt, localDate, mealsForWeek, forecast, weightStats } from './core.js';

const STORAGE = 'mi-menu-inventario-v1';
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const content = document.querySelector('#dialog-content');
const tabs = document.querySelectorAll('.nav-item');
let tab = 'week', selectedDay = Math.min(6,(new Date().getDay()+6)%7), filter = 'all', searchQuery = '';
let weightMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
let week = mondayOf();
let state = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE));
    if (raw?.version === 1 && raw.stock && raw.done && Array.isArray(raw.purchases)) return {...raw,deductions:raw.deductions||{},permanent:raw.permanent||{arroz:true},shared:raw.shared||{},weights:raw.weights||{}};
  } catch { /* Empty or malformed local data. */ }
  return {version:1,stock:{},done:{},deductions:{},permanent:{arroz:true},shared:{},weights:{},purchases:[]};
}
function save() { localStorage.setItem(STORAGE,JSON.stringify(state)); render(); }
function fmt(n) { return Number(n).toLocaleString('es-ES',{maximumFractionDigits:1}); }
function qty(key,n) { return `${fmt(n)} ${ITEMS[key][1]}`; }
function safe(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(message) {
  const t = document.querySelector('#toast'); t.textContent=message;t.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3200);
}
function dateLabel(day) { return `${dateAt(week,day).getDate()} ${new Intl.DateTimeFormat('es-ES',{month:'short'}).format(dateAt(week,day))}`; }
function hero(eyebrow,title,description) { return `<div class="section-head"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${description}</p></div>`; }
function daySelector() { return `<div class="day-strip" role="group" aria-label="Seleccionar día">${SHORT_DAYS.map((label,day)=>`<button class="day-pill ${selectedDay===day?'selected':''}" data-day="${day}" aria-pressed="${selectedDay===day}"><span>${label}</span><strong>${dateAt(week,day).getDate()}</strong></button>`).join('')}</div>`; }
function mealCard(meal) {
  const entries=Object.entries(meal.parts);
  const canShare=meal.name==='Comida'||meal.name==='Cena';
  return `<article class="meal-card ${meal.done?'completed':''} ${meal.shared?'shared-meal':''}"><div class="meal-top"><div><span class="meal-kind">${meal.name} <i>·</i> ${meal.time}</span><h3>${meal.title}</h3></div><div class="meal-actions">${canShare?`<button class="share-button ${meal.shared?'active':''}" data-shared="${meal.key}" aria-label="${meal.shared?'Quitar a Carolina':'Añadir a Carolina'} en ${meal.name.toLowerCase()}" aria-pressed="${meal.shared}" ${meal.done?'disabled':''}><span>${meal.shared?'2×':'1×'}</span><small>${meal.shared?'Con Carolina':'Solo Adri'}</small></button>`:''}<button class="check-button ${meal.done?'checked':''}" data-meal="${meal.key}" aria-label="${meal.done?'Desmarcar':'Marcar como preparada'} ${meal.name}" aria-pressed="${meal.done}">${meal.done?'✓':''}</button></div></div>${meal.shared?'<div class="shared-note">Cantidades calculadas para dos personas</div>':''}${entries.length?`<div class="ingredients">${entries.map(([key,value])=>`<span>${safe(ITEMS[key][0])} <b>${qty(key,value)}${meal.shared?' × 2':''}</b></span>`).join('')}</div>`:''}${meal.note?`<p class="meal-note">${safe(meal.note)}</p>`:''}</article>`;
}
function normalizeSearch(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function searchResults(query) {
  const normalized=normalizeSearch(query);
  if(!normalized)return '<p class="search-hint">Escribe un alimento, por ejemplo: pollo, arroz, patata o yogur.</p>';
  const matches=Object.keys(ITEMS).filter(key=>normalizeSearch(ITEMS[key][0]).includes(normalized));
  if(!matches.length)return `<div class="search-empty"><span>⌕</span><strong>No aparece en el menú</strong><small>Prueba con otro nombre de alimento.</small></div>`;
  return matches.map(key=>{
    const uses=MENU.flatMap((meals,day)=>meals.flatMap((meal,slot)=>meal.parts[key]?[{day,meal,amount:meal.parts[key]*(state.shared[`${week}:${day}:${slot}`]?2:1),shared:!!state.shared[`${week}:${day}:${slot}`]}]:[]));
    const total=uses.reduce((sum,use)=>sum+use.amount,0),days=new Set(uses.map(use=>use.day)).size;
    return `<article class="search-product"><div class="search-product-head"><div><small>${ITEMS[key][2]}</small><h3>${safe(ITEMS[key][0])}</h3></div><strong>${days} ${days===1?'día':'días'} · ${qty(key,total)}</strong></div><div class="search-uses">${uses.map(use=>`<button data-result-day="${use.day}"><span>${SHORT_DAYS[use.day]}</span><div><strong>${use.meal.name}: ${safe(use.meal.title)}</strong><small>${qty(key,use.amount)}${use.shared?' · 2 personas':''}</small></div><i>›</i></button>`).join('')}</div></article>`;
  }).join('');
}
function searchPanel() {
  return `<section class="product-search"><label for="product-search">Buscar un producto en tu menú</label><div class="search-field"><span aria-hidden="true">⌕</span><input id="product-search" type="search" inputmode="search" autocomplete="off" placeholder="Ej.: pollo, arroz, patata…" value="${safe(searchQuery)}"><button type="button" data-clear-search aria-label="Borrar búsqueda" ${searchQuery?'':'hidden'}>×</button></div><div id="search-results" class="search-results">${searchResults(searchQuery)}</div></section>`;
}
function weekView() {
  const meals=mealsForWeek(week,state.done,state.shared).filter(m=>m.day===selectedDay);
  const all=mealsForWeek(week,state.done,state.shared);const count=all.filter(m=>m.done).length;
  return `${hero('TU PLAN, A TU RITMO','Una semana más fácil','Cada comida preparada descuenta sus ingredientes de la despensa.')}
  <section class="hero-card"><div class="hero-top"><span>SEMANA DEL ${dateLabel(0).toUpperCase()}</span><span>${count} / 28 comidas</span></div><div class="hero-main"><div><strong>${DAY_NAMES[selectedDay]}</strong><span>${dateLabel(selectedDay)} · 4 momentos</span></div><div class="hero-ornament" aria-hidden="true">✳</div></div><div class="progress"><div style="width:${100*count/28}%"></div></div></section>
  ${daySelector()}${searchPanel()}<div class="section-row"><h2>Plan del día</h2><span>Pesos indicados por alimento</span></div><div class="meal-list">${meals.map(mealCard).join('')}</div><p class="footnote">Arroz y pasta en crudo; legumbres cocidas y escurridas. Café y sacarina del desayuno son opcionales. La cena social del sábado queda fuera de la compra.</p>`;
}
function statusText(row) {
  if (row.permanent) return 'Marcado como siempre disponible';
  if (!row.required) return 'Cubierto esta semana';
  if (row.firstMissing===null) return 'Tienes para toda la semana';
  if (row.firstMissing===0) return 'Hace falta desde el lunes';
  return `Tienes hasta el ${SHORT_DAYS[row.firstMissing-1].toLowerCase()} · falta el ${SHORT_DAYS[row.firstMissing].toLowerCase()}`;
}
function shopCard(key,row) {
  const [name,unit,category]=ITEMS[key];
  const need=filter==='all'?row.toBuy:row.daily[Number(filter)]?.missing||0;
  const label=filter==='all'?'Falta para la semana':`Falta el ${SHORT_DAYS[Number(filter)].toLowerCase()}`;
  const dayList=row.daily.map((r,d)=>r.amount?`<span class="day-need ${r.missing?'short':''}">${SHORT_DAYS[d]} · ${fmt(r.amount)}${unit}${r.missing?` · faltan ${fmt(r.missing)}`:''}</span>`:'').join('');
  return `<article class="shop-card ${row.permanent?'permanent-item':''}"><div class="item-heading"><div><small>${category}</small><h3>${safe(name)}</h3></div><span class="status-dot ${row.toBuy?'missing':'ok'}" aria-hidden="true"></span></div>${row.permanent?'<div class="permanent-banner"><span>∞</span><strong>Siempre en casa</strong></div>':`<div class="item-stats"><div><span>En casa</span><b>${qty(key,row.available)}</b></div><div><span>Plan pendiente</span><b>${qty(key,row.required)}</b></div><div class="${need?'missing-text':'ok-text'}"><span>${label}</span><b>${qty(key,need)}</b></div></div>`}<div class="coverage">${statusText(row)}</div><details><summary>Ver consumo por día</summary><div class="day-needs">${dayList||'<span>Sin comidas pendientes</span>'}</div></details>${row.permanent?`<button class="secondary-button" data-stock="${key}">Cambiar disponibilidad</button>`:`<button class="buy-button" data-buy="${key}">+ Registrar compra</button>`}</article>`;
}
function shopView() {
  const rows=withPermanent(forecast(week,state.stock,state.done,state.shared));
  const relevant=Object.keys(ITEMS).filter(k=>rows[k].required>0);
  const missing=relevant.filter(k=>rows[k].toBuy>0);
  const visible=relevant.filter(k=>filter==='all'?true:rows[k].daily[Number(filter)].amount>0).sort((a,b)=>Number(rows[b].toBuy>0)-Number(rows[a].toBuy>0)||ITEMS[a][0].localeCompare(ITEMS[b][0],'es'));
  return `${hero('COMPRA CON CABEZA','Lo que falta','Las cantidades se calculan con lo que hay en casa y las comidas pendientes.')}
  <div class="summary-card"><div><strong>${missing.length}</strong><span>productos por reponer</span></div><div class="summary-divider"></div><div><strong>${relevant.length-missing.length}</strong><span>cubiertos</span></div></div>
  <div class="filter-wrap"><label for="day-filter">Ver necesidades</label><select id="day-filter"><option value="all" ${filter==='all'?'selected':''}>Toda la semana</option>${DAY_NAMES.map((n,i)=>`<option value="${i}" ${String(filter)===String(i)?'selected':''}>${n} ${dateLabel(i)}</option>`).join('')}</select></div>
  <div class="section-row"><h2>Lista de la compra</h2><span>${visible.length} productos</span></div><div class="shop-list">${visible.map(key=>shopCard(key,rows[key])).join('')}</div><p class="footnote">«Falta el martes» significa que ese día se agota la cantidad actual. Añade una compra y la previsión se actualizará. Los productos en blanco no se incluyen en el menú.</p>`;
}
function pantryView() {
  const rows=withPermanent(forecast(week,state.stock,state.done,state.shared));
  const categories=[...new Set(Object.values(ITEMS).map(item=>item[2]))];
  return `${hero('TU INVENTARIO','La despensa','Indica cuánto tienes ahora mismo. Al preparar comidas, se descontará automáticamente.')}
  <div class="tip-card"><span aria-hidden="true">✦</span><p>Empieza anotando lo que ya tienes en casa. Las compras se suman y las comidas preparadas se restan.</p></div>
  ${categories.map(cat=>`<section class="pantry-group"><h2>${cat}</h2><div class="pantry-items">${Object.keys(ITEMS).filter(k=>ITEMS[k][2]===cat).map(key=>`<button class="pantry-item ${rows[key].permanent?'permanent-item':''}" data-stock="${key}"><span>${safe(ITEMS[key][0])}<small>${rows[key].permanent?'No se añadirá a la compra':rows[key].required?`${qty(key,rows[key].required)} pendiente esta semana`:'Sin consumo pendiente'}</small></span><strong class="${rows[key].available<0?'missing-text':''}">${rows[key].permanent?'∞ Siempre':qty(key,rows[key].available)}</strong><span class="pantry-arrow">›</span></button>`).join('')}</div></section>`).join('')}
  <p class="footnote">La despensa se conserva entre semanas. Si cambias de móvil o borras los datos del navegador, importa una copia desde Ajustes.</p>`;
}
function parseDateKey(key) {
  const [year,month,day]=key.split('-').map(Number);return new Date(year,month-1,day);
}
function weightDateLabel(key,options={day:'numeric',month:'short',year:'numeric'}) {
  return new Intl.DateTimeFormat('es-ES',options).format(parseDateKey(key));
}
function weightChart(entries) {
  if(entries.length<2)return `<div class="weight-chart-empty"><span>⌁</span><strong>Tu evolución aparecerá aquí</strong><small>Añade al menos dos registros para dibujar la tendencia.</small></div>`;
  const values=entries.slice(-12),min=Math.min(...values.map(e=>e.value)),max=Math.max(...values.map(e=>e.value)),range=Math.max(1,max-min);
  const points=values.map((entry,index)=>`${12+(296*index/Math.max(1,values.length-1))},${88-((entry.value-min)/range)*68}`).join(' ');
  const last=points.split(' ').at(-1).split(',');
  return `<div class="weight-chart"><div class="chart-scale"><span>${fmt(max)} kg</span><span>${fmt(min)} kg</span></div><svg viewBox="0 0 320 105" role="img" aria-label="Evolución de los últimos ${values.length} registros"><path d="M12 88 H308" class="chart-grid"></path><path d="M12 54 H308" class="chart-grid"></path><path d="M12 20 H308" class="chart-grid"></path><polyline points="${points}" class="chart-line"></polyline><circle cx="${last[0]}" cy="${last[1]}" r="5" class="chart-point"></circle></svg><div class="chart-dates"><span>${weightDateLabel(values[0].date,{day:'numeric',month:'short'})}</span><span>${weightDateLabel(values.at(-1).date,{day:'numeric',month:'short'})}</span></div></div>`;
}
function weightCalendar() {
  const year=weightMonth.getFullYear(),month=weightMonth.getMonth(),firstOffset=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate(),today=localDate();
  const cells=Array.from({length:firstOffset},()=>'<span class="weight-day empty" aria-hidden="true"></span>');
  for(let day=1;day<=days;day++){
    const key=localDate(new Date(year,month,day)),value=state.weights[key];
    cells.push(`<button class="weight-day ${key===today?'today':''} ${value!==undefined?'has-weight':''}" data-weight-date="${key}" aria-label="${day} de ${new Intl.DateTimeFormat('es-ES',{month:'long'}).format(weightMonth)}${value!==undefined?`, ${fmt(value)} kilos`:`, sin registro`}"><span>${day}</span>${value!==undefined?`<strong>${fmt(value)}</strong><small>kg</small>`:'<i>+</i>'}</button>`);
  }
  return `<section class="weight-calendar"><div class="calendar-head"><button data-weight-month="-1" aria-label="Mes anterior">‹</button><h2>${new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(weightMonth)}</h2><button data-weight-month="1" aria-label="Mes siguiente">›</button></div><div class="weekdays">${['L','M','X','J','V','S','D'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div><p class="calendar-help"><span></span> Día con peso registrado · pulsa cualquier fecha para añadir o editar</p></section>`;
}
function weightView() {
  const summary=weightStats(state.weights),change=summary.change;
  const changeText=change===null?'—':`${change>0?'+':''}${fmt(change)} kg`;
  const recent=summary.entries.slice(-6).reverse();
  return `${hero('TU EVOLUCIÓN','Registro de peso','Anota tu peso los días que quieras. Lo importante es observar la tendencia, no un dato aislado.')}
  <section class="weight-summary"><div class="weight-main"><span>ÚLTIMO REGISTRO</span><strong>${summary.latest?`${fmt(summary.latest.value)} <small>kg</small>`:'—'}</strong><small>${summary.latest?weightDateLabel(summary.latest.date):'Todavía no hay mediciones'}</small></div><div class="weight-summary-side"><div><span>CAMBIO TOTAL</span><strong class="${change<0?'weight-down':change>0?'weight-up':''}">${changeText}</strong></div><div><span>REGISTROS</span><strong>${summary.entries.length}</strong></div></div></section>
  <button class="quick-weight" data-weight-date="${localDate()}"><span>＋</span><div><strong>Registrar peso de hoy</strong><small>${weightDateLabel(localDate())}</small></div><i>›</i></button>
  <div class="section-row weight-row"><h2>Evolución reciente</h2><span>Últimos 12 registros</span></div>${weightChart(summary.entries)}
  <div class="section-row weight-row"><h2>Calendario</h2><span>Elige cualquier día</span></div>${weightCalendar()}
  <div class="section-row weight-row"><h2>Últimos pesos</h2><span>${summary.entries.length} en total</span></div><div class="weight-history">${recent.map(entry=>`<button data-weight-date="${entry.date}"><span><strong>${weightDateLabel(entry.date,{weekday:'long',day:'numeric',month:'long'})}</strong><small>${entry.date===localDate()?'Hoy':'Pulsa para editar'}</small></span><b>${fmt(entry.value)} kg</b><i>›</i></button>`).join('')||'<div class="empty-history"><span>○</span><p>Cuando registres tu primer peso aparecerá aquí.</p></div>'}</div>`;
}
function render() {
  const todayWeek=mondayOf();if (week!==todayWeek) {week=todayWeek;selectedDay=(new Date().getDay()+6)%7;filter='all';}
  tabs.forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});
  app.innerHTML=tab==='week'?weekView():tab==='shop'?shopView():tab==='pantry'?pantryView():weightView();
}
function openDialog(html) { content.innerHTML=html; if (!dialog.open) dialog.showModal(); }
function closeDialog() {dialog.close();}
function numberInput(value,unit) {return `<div class="quantity-input"><input id="amount" type="number" inputmode="decimal" min="0" step="${unit==='ud'?'1':'0.1'}" value="${Math.max(0,value)}" required aria-label="Cantidad"><span>${unit}</span></div>`;}
function editStock(key) {
  const [name,unit]=ITEMS[key],isPermanent=!!state.permanent[key];openDialog(`<form id="stock-form" data-key="${key}"><button type="button" class="close" data-close aria-label="Cerrar">×</button><p class="eyebrow">AJUSTAR DESPENSA</p><h2>${safe(name)}</h2><label class="permanent-toggle"><input id="permanent" type="checkbox" ${isPermanent?'checked':''}><span><strong>Siempre en casa</strong><small>No aparecerá como pendiente en la lista de compra.</small></span></label><div id="quantity-block" class="${isPermanent?'quantity-disabled':''}"><p class="dialog-desc">Cantidad disponible ahora mismo. Úsalo para corregir el inventario inicial o cualquier diferencia.</p>${numberInput(state.stock[key]||0,unit)}</div><button class="primary-button" type="submit">Guardar cambios</button></form>`);
}
function buy(key) {
  const [name,unit]=ITEMS[key],r=forecast(week,state.stock,state.done,state.shared)[key];
  openDialog(`<form id="buy-form" data-key="${key}"><button type="button" class="close" data-close aria-label="Cerrar">×</button><p class="eyebrow">NUEVA COMPRA</p><h2>${safe(name)}</h2><p class="dialog-desc">Quedan ${qty(key,r.available)} en casa. Faltan ${qty(key,r.toBuy)} para completar las comidas pendientes.</p>${numberInput(r.toBuy||0,unit)}<button class="primary-button" type="submit">Añadir a la despensa</button></form>`);
}
function editWeight(date) {
  const value=state.weights[date];
  openDialog(`<form id="weight-form" data-date="${date}"><button type="button" class="close" data-close aria-label="Cerrar">×</button><p class="eyebrow">REGISTRO DE PESO</p><h2>${weightDateLabel(date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h2><p class="dialog-desc">Introduce el peso medido ese día. Puedes utilizar un decimal.</p><div class="quantity-input weight-input"><input id="weight-amount" type="number" inputmode="decimal" min="25" max="300" step="0.1" value="${value??''}" placeholder="Ej.: 80,7" required aria-label="Peso en kilos"><span>kg</span></div><button class="primary-button" type="submit">${value!==undefined?'Actualizar peso':'Guardar peso'}</button>${value!==undefined?'<button class="delete-weight" type="button" data-delete-weight>Eliminar este registro</button>':''}</form>`);
  setTimeout(()=>dialog.querySelector('#weight-amount')?.focus(),50);
}
function settings() {
  openDialog(`<div><button type="button" class="close" data-close aria-label="Cerrar">×</button><p class="eyebrow">AJUSTES</p><h2>Tus datos, contigo</h2><p class="dialog-desc">La información se guarda únicamente en este navegador. La web publicada contiene el menú, pero no tus compras ni registros de peso.</p><button class="setting-action" data-export>↓ Exportar copia de seguridad</button><label class="setting-action upload">↑ Importar copia de seguridad<input id="import-file" type="file" accept="application/json,.json" hidden></label><p class="small-note">Importar sustituye el inventario, los pesos, las compras y las comidas marcadas de este dispositivo.</p><hr><h3>Últimas compras</h3>${state.purchases.slice(-6).reverse().map((p,i)=>`<div class="history-row"><span>${safe(ITEMS[p.key]?.[0]||p.key)} · ${qty(p.key,p.amount)}<small>${safe(p.date)}</small></span><button data-undo="${state.purchases.length-1-i}" aria-label="Deshacer compra">Deshacer</button></div>`).join('')||'<p class="small-note">Todavía no hay compras registradas.</p>'}</div>`);
}
function validAmount(form) {
  const el=form.querySelector('#amount'),value=Number(el.value);
  if (!el.value.trim() || !Number.isFinite(value) || value<0 || (ITEMS[form.dataset.key][1]==='ud'&&!Number.isInteger(value))) {el.setCustomValidity('Introduce una cantidad válida');el.reportValidity();return null;}
  el.setCustomValidity('');return value;
}
function toggleMeal(key) {
  const meal=mealsForWeek(week,state.done,state.shared).find(m=>m.key===key);if (!meal)return;
  const newDone=!meal.done;
  if(newDone){
    const deductions={};
    for (const [item,baseAmount] of Object.entries(meal.parts)) {
      const amount=baseAmount*(meal.shared?2:1);
      if(state.permanent[item]){deductions[item]=0;continue;}
      const available=Math.max(0,Number(state.stock[item])||0),deducted=Math.min(available,amount);
      state.stock[item]=Math.round((available-deducted)*10)/10;deductions[item]=deducted;
    }
    state.deductions[key]=deductions;state.done[key]=true;
  }else{
    for (const [item,amount] of Object.entries(state.deductions[key]||{})) state.stock[item]=Math.round(((Number(state.stock[item])||0)+amount)*10)/10;
    delete state.deductions[key];delete state.done[key];
  }
  save();toast(newDone?'Comida preparada: ingredientes descontados':'Comida desmarcada: ingredientes devueltos');
}
app.addEventListener('click',e=>{
  const monthButton=e.target.closest('[data-weight-month]');if(monthButton){weightMonth=new Date(weightMonth.getFullYear(),weightMonth.getMonth()+Number(monthButton.dataset.weightMonth),1);render();return;}
  const weightDate=e.target.closest('[data-weight-date]');if(weightDate){editWeight(weightDate.dataset.weightDate);return;}
  const result=e.target.closest('[data-result-day]');if(result){selectedDay=Number(result.dataset.resultDay);searchQuery='';render();document.querySelector('.section-row')?.scrollIntoView({behavior:'smooth'});return;}
  if(e.target.closest('[data-clear-search]')){searchQuery='';const input=document.querySelector('#product-search');if(input){input.value='';input.focus();document.querySelector('#search-results').innerHTML=searchResults('');e.target.hidden=true;}return;}
  const day=e.target.closest('[data-day]');if(day){selectedDay=Number(day.dataset.day);render();return;}
  const meal=e.target.closest('[data-meal]');if(meal){toggleMeal(meal.dataset.meal);return;}
  const shared=e.target.closest('[data-shared]');if(shared){const key=shared.dataset.shared;if(state.done[key])return;if(state.shared[key])delete state.shared[key];else state.shared[key]=true;save();toast(state.shared[key]?'Comida calculada para Adri y Carolina':'Comida calculada solo para Adri');return;}
  const purchase=e.target.closest('[data-buy]');if(purchase){buy(purchase.dataset.buy);return;}
  const stock=e.target.closest('[data-stock]');if(stock)editStock(stock.dataset.stock);
});
app.addEventListener('input',e=>{if(e.target.id==='product-search'){searchQuery=e.target.value;document.querySelector('#search-results').innerHTML=searchResults(searchQuery);document.querySelector('[data-clear-search]').hidden=!searchQuery;}});
app.addEventListener('change',e=>{if(e.target.id==='day-filter'){filter=e.target.value;render();}});
tabs.forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;render();window.scrollTo({top:0,behavior:'instant'});}));
document.querySelector('#settings-button').addEventListener('click',settings);
document.querySelector('#refresh-button').addEventListener('click',refreshApp);
dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close]'))closeDialog();});
dialog.addEventListener('submit',e=>{
  if(e.target.id==='weight-form'){
    e.preventDefault();const input=e.target.querySelector('#weight-amount'),value=Number(input.value);
    if(!input.value.trim()||!Number.isFinite(value)||value<25||value>300){input.setCustomValidity('Introduce un peso entre 25 y 300 kg');input.reportValidity();return;}
    state.weights[e.target.dataset.date]=Math.round(value*10)/10;closeDialog();save();toast('Peso guardado correctamente');return;
  }
  if(!['stock-form','buy-form'].includes(e.target.id))return;
  e.preventDefault();const key=e.target.dataset.key,amount=validAmount(e.target);if(amount===null)return;
  if(e.target.id==='buy-form'){
    if(amount===0){toast('Indica una cantidad mayor que cero');return;}
    state.stock[key]=Math.round(((Number(state.stock[key])||0)+amount)*10)/10;
    state.purchases.push({key,amount,date:localDate(),id:Date.now()});toast(`Compra añadida: ${qty(key,amount)}`);
  }else{state.stock[key]=amount;if(e.target.querySelector('#permanent')?.checked)state.permanent[key]=true;else delete state.permanent[key];toast(state.permanent[key]?'Marcado como siempre en casa':'Despensa actualizada');}
  closeDialog();save();
});
dialog.addEventListener('click',e=>{
  if(e.target.closest('[data-delete-weight]')){
    const form=e.target.closest('#weight-form'),date=form?.dataset.date;if(!date||state.weights[date]===undefined)return;
    if(!window.confirm(`¿Eliminar el peso registrado el ${weightDateLabel(date)}?`))return;
    delete state.weights[date];closeDialog();save();toast('Registro de peso eliminado');return;
  }
  if(e.target.closest('[data-export]')){
    const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mi-menu-copia-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('Copia descargada');
  }
  const undo=e.target.closest('[data-undo]');if(undo){const index=Number(undo.dataset.undo),p=state.purchases[index];if(!p)return;state.stock[p.key]=Math.max(0,Math.round(((Number(state.stock[p.key])||0)-p.amount)*10)/10);state.purchases.splice(index,1);save();settings();toast('Compra deshecha');}
});
dialog.addEventListener('change',async e=>{
  if(e.target.id==='permanent'){
    dialog.querySelector('#quantity-block')?.classList.toggle('quantity-disabled',e.target.checked);return;
  }
  if(e.target.id!=='import-file'||!e.target.files[0])return;
  try {
    const next=JSON.parse(await e.target.files[0].text());
    if(next.version!==1||!next.stock||!next.done||!Array.isArray(next.purchases))throw Error('Formato no válido');
    const stock=Object.fromEntries(Object.entries(next.stock).filter(([key,v])=>ITEMS[key]&&typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1000000));
    const done=Object.fromEntries(Object.entries(next.done).filter(([key,value])=>/^\d{4}-\d{2}-\d{2}:[0-6]:[0-3]$/.test(key)&&value===true));
    const purchases=next.purchases.filter(p=>ITEMS[p.key]&&typeof p.amount==='number'&&p.amount>0&&Number.isFinite(p.amount)&&typeof p.date==='string');
    const deductions=next.deductions&&typeof next.deductions==='object'?next.deductions:{};
    const permanent=next.permanent&&typeof next.permanent==='object'?Object.fromEntries(Object.entries(next.permanent).filter(([key,value])=>ITEMS[key]&&value===true)):{arroz:true};
    const shared=next.shared&&typeof next.shared==='object'?Object.fromEntries(Object.entries(next.shared).filter(([key,value])=>/^\d{4}-\d{2}-\d{2}:[0-6]:[0-3]$/.test(key)&&value===true)):{};
    const weights=next.weights&&typeof next.weights==='object'?Object.fromEntries(Object.entries(next.weights).filter(([date,value])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&typeof value==='number'&&Number.isFinite(value)&&value>=25&&value<=300)):{};
    if(!window.confirm('¿Sustituir los datos actuales por los de esta copia?'))return;
    state={version:1,stock,done,deductions,permanent,shared,weights,purchases};closeDialog();save();toast('Copia importada correctamente');
  }catch{toast('No se ha podido leer esta copia');}
});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=6').catch(()=>{});
render();

async function refreshApp() {
  const button=document.querySelector('#refresh-button');
  button.disabled=true;button.classList.add('loading');
  try {
    const check=await fetch(`./index.html?update=${Date.now()}`,{cache:'no-store'});
    if(!check.ok)throw Error('Sin conexión');
    if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.getRegistration('./');await registration?.update();}
    if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('mi-menu-')).map(key=>caches.delete(key)));}
    window.location.reload();
  }catch{
    button.disabled=false;button.classList.remove('loading');toast('No se ha podido actualizar. Comprueba la conexión.');
  }
}

function withPermanent(rows) {
  return Object.fromEntries(Object.entries(rows).map(([key,row])=>[key,state.permanent[key]?{...row,permanent:true,toBuy:0,firstMissing:null,lastCovered:6,daily:row.daily.map(day=>({...day,missing:0}))}:row]));
}
