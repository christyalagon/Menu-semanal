# Mi menú · Compra semanal

PWA estática para consultar el menú, controlar la despensa y calcular las compras necesarias por día.

## Publicar en GitHub Pages

1. Crea un repositorio público, por ejemplo `menu-semanal`.
2. Sube todos los archivos de esta carpeta a la raíz del repositorio.
3. Abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama **main**, carpeta **/(root)**, y guarda.
6. Abre la dirección que muestra GitHub Pages. En iPhone: **Compartir → Añadir a pantalla de inicio**.

La aplicación funciona en una ruta de proyecto como `usuario.github.io/menu-semanal/`; todos los enlaces del PWA son relativos.

## Datos

El inventario, las compras y las comidas marcadas se guardan en `localStorage` en el dispositivo. El botón de ajustes permite exportar e importar una copia JSON.

## Prueba local

La aplicación necesita un servidor web para activar el modo sin conexión:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`.
