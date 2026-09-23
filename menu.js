export const ITEMS = {
  pan: ['Pan integral / pan', 'g', 'Cereales'], pavo: ['Pechuga de pavo', 'g', 'Proteínas'], leche: ['Leche semidesnatada', 'ml', 'Lácteos'],
  quesoBatido: ['Queso fresco batido 0 %', 'g', 'Lácteos'], platano: ['Plátano', 'g', 'Fruta y verdura'], miel: ['Miel', 'g', 'Otros'], nueces: ['Nueces', 'g', 'Otros'],
  arroz: ['Arroz (en crudo)', 'g', 'Cereales'], pasta: ['Pasta (en crudo)', 'g', 'Cereales'], pollo: ['Pollo', 'g', 'Proteínas'], verdura: ['Verdura variada', 'g', 'Fruta y verdura'], aceite: ['Aceite de oliva virgen extra', 'g', 'Otros'], fruta: ['Fruta variada', 'g', 'Fruta y verdura'],
  tortillas: ['Tortillas para fajitas', 'g', 'Cereales'], aguacate: ['Aguacate', 'g', 'Fruta y verdura'], yogurGriego: ['Yogur griego 0 %', 'g', 'Lácteos'],
  garbanzos: ['Garbanzos cocidos escurridos', 'g', 'Legumbres'], atun: ['Atún escurrido', 'g', 'Proteínas'], salmon: ['Salmón', 'g', 'Proteínas'], patata: ['Patata', 'g', 'Fruta y verdura'], yogur: ['Yogur proteico', 'g', 'Lácteos'],
  vacuno: ['Carne de vacuno magra', 'g', 'Proteínas'], tomate: ['Tomate triturado', 'g', 'Fruta y verdura'], huevos: ['Huevos', 'ud', 'Proteínas'], claras: ['Claras de huevo', 'g', 'Proteínas'],
  pure: ['Puré de calabaza', 'g', 'Fruta y verdura'], panBurger: ['Pan de hamburguesa', 'g', 'Cereales'], queso: ['Queso ligero', 'g', 'Lácteos'], judias: ['Judías cocidas escurridas', 'g', 'Legumbres'], merluza: ['Merluza', 'g', 'Proteínas'], feta: ['Queso feta', 'g', 'Lácteos'], aceitunas: ['Aceitunas', 'g', 'Otros']
};

const breakfast = { name: 'Desayuno', time: '10:30', title: 'Tostadas de pavo y café', parts: {pan:90,pavo:100,leche:200} };
const snack = { name: 'Merienda', time: '17:30–18:00', title: 'Queso batido, plátano y nueces', parts: {quesoBatido:250,platano:120,miel:10,nueces:10} };
const days = [
  [{title:'Arroz con pollo y verduras',parts:{arroz:90,pollo:170,verdura:250,aceite:10,fruta:150}}, {title:'Fajitas de pollo',parts:{tortillas:120,pollo:160,verdura:250,aceite:10,aguacate:35,yogurGriego:60}}],
  [{title:'Ensalada de garbanzos y atún',parts:{garbanzos:200,atun:120,verdura:250,aceite:8,pan:40,fruta:150}}, {title:'Salmón con patata',parts:{salmon:160,patata:280,verdura:250,aceite:6,yogur:125,pan:15}}],
  [{title:'Pasta con carne y tomate',parts:{pasta:75,vacuno:160,tomate:150,verdura:150,aceite:5,fruta:150}}, {title:'Tortilla con patata',parts:{huevos:3,claras:150,patata:250,verdura:200,aceite:8,pan:25,yogur:125}}],
  [{title:'Puré de calabaza, arroz y pollo',parts:{pure:350,arroz:70,pollo:180,aceite:8,fruta:200}}, {title:'Hamburguesa con patata',parts:{panBurger:80,vacuno:170,queso:25,patata:170,verdura:200,aceite:5,aguacate:30}}],
  [{title:'Judías con pollo',parts:{judias:220,pollo:140,verdura:250,aceite:8,pan:60,fruta:150}}, {title:'Merluza con arroz',parts:{merluza:220,arroz:80,verdura:250,aceite:10,aguacate:40,yogur:125}}],
  [{title:'Arroz con pollo y verduras',parts:{arroz:60,pollo:180,verdura:300,aceite:8,fruta:150}}, {title:'Cena social',parts:{},note:'Libre, aproximadamente 850–950 kcal. No se añaden ingredientes a la compra.'}],
  [{title:'Ensalada de pasta y atún',parts:{pasta:80,atun:120,feta:30,aceitunas:25,verdura:250,aceite:7,fruta:150}}, {title:'Pollo con patata',parts:{pollo:180,patata:300,verdura:250,aceite:10,aguacate:40,yogur:125,pan:20},note:'Puedes sustituir los 300 g de patata por 300 g de boniato; ajusta la despensa manualmente si haces el cambio.'}]
];
export const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
export const SHORT_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export const MENU = days.map(([lunch,dinner]) => [breakfast,{name:'Comida',time:'15:00',...lunch},snack,{name:'Cena',time:'22:00',...dinner}]);
