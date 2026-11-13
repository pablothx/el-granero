# 12: Sin conexión y tildes instantáneos

**What to build:** Sin conexión, la app abre y muestra lo último que cargó de Hoy y de las Listas; al intentar tildar o anotar, aparece un aviso claro y no se guarda nada. Con conexión, tildar se siente instantáneo (optimista) y se revierte si la API falla. Se confirma que la PWA se actualiza sola a la versión nueva.

Ver la spec, sección Cliente, y ADR 0003 y 0007.

**Blocked by:** 03 (Primera Tarea Diaria en Hoy), 09 (Listas de compras)

**Status:** ready-for-agent

- [x] La caché de TanStack Query se persiste en IndexedDB; sin conexión, Hoy y las Listas muestran la última lectura.
- [x] Sin conexión, tildar, destildar, anotar o editar muestra un aviso y no queda ningún cambio pendiente (sin cola de escrituras).
- [x] Al tildar una Ocurrencia o un Ítem, la interfaz cambia antes de la respuesta, y si la API falla vuelve atrás y avisa.
- [x] La app vuelve a consultar al recuperar el foco o la conexión.
- [x] Verificado: después de un deploy nuevo, al reabrir la PWA instalada carga la versión nueva sin preguntar.
- [x] Tests de componente cubren la reversión del tilde optimista y el aviso sin conexión.

## Comments

**2026-11-13, implementación:** verificado con tests de componentes (tilde optimista que vuelve atrás con aviso si la API falla; sin conexión: aviso, vuelta atrás, sin llamada a la API ni envío al volver la red; franja 'Sin conexión') y en el navegador sobre el build de producción: con la red cortada y recargando, la app abre desde el service worker con Hoy y Compras de IndexedDB, muestra la franja y un tilde no se guarda; un build v2 reemplazó solo al v1 abierto al recargar. Las mutaciones usan networkMode 'always' para que TanStack no las encole sin red (ADR 0003). La versión del build se ve en Administrar.
