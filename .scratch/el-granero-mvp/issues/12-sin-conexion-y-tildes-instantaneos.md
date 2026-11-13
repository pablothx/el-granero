# 12: Sin conexión y tildes instantáneos

**What to build:** Sin conexión, la app abre y muestra lo último que cargó de Hoy y de las Listas; al intentar tildar o anotar, aparece un aviso claro y no se guarda nada. Con conexión, tildar se siente instantáneo (optimista) y se revierte si la API falla. Se confirma que la PWA se actualiza sola a la versión nueva.

Ver la spec, sección Cliente, y ADR 0003 y 0007.

**Blocked by:** 03 (Primera Tarea Diaria en Hoy), 09 (Listas de compras)

**Status:** ready-for-agent

- [ ] La caché de TanStack Query se persiste en IndexedDB; sin conexión, Hoy y las Listas muestran la última lectura.
- [ ] Sin conexión, tildar, destildar, anotar o editar muestra un aviso y no queda ningún cambio pendiente (sin cola de escrituras).
- [ ] Al tildar una Ocurrencia o un Ítem, la interfaz cambia antes de la respuesta, y si la API falla vuelve atrás y avisa.
- [ ] La app vuelve a consultar al recuperar el foco o la conexión.
- [ ] Verificado: después de un deploy nuevo, al reabrir la PWA instalada carga la versión nueva sin preguntar.
- [ ] Tests de componente cubren la reversión del tilde optimista y el aviso sin conexión.
