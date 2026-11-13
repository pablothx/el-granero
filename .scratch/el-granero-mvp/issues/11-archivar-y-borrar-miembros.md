# 11: Archivar y borrar Miembros

**What to build:** Un Adulto puede archivar a un Miembro que ya no vive en casa: desaparece de los Avatares y de la Vista Familia, pero conserva su historial y se puede reactivar. Si tiene Tareas activas, la app lo guía a reasignarlas o archivarlas antes. Nunca puede quedar la Familia sin un Adulto activo. Un Miembro cargado por error se puede borrar si no tiene Ocurrencias.

Ver la spec, sección Reglas.

**Blocked by:** 07 (Editar, reasignar y archivar Tareas)

**Status:** ready-for-agent

- [x] Archivar un Miembro con Tareas activas asignadas se rechaza; la app muestra esas Tareas con las acciones para reasignar o archivar cada una.
- [x] Archivar al último Adulto activo se rechaza (y tampoco se puede pasar el último Adulto activo a Chico).
- [x] Un Miembro Archivado no aparece en los Avatares ni en la Vista Familia, sus sesiones se cierran y no puede entrar.
- [x] Sus Ocurrencias pasadas siguen existiendo con su nombre.
- [x] Reactivar a un Miembro lo devuelve a los Avatares con su historial.
- [x] Borrar un Miembro se permite solo si no tiene ninguna Ocurrencia; si no, la API lo rechaza y la app ofrece archivar.
- [x] Tests del Worker cubren cada regla.

## Comments

**2026-11-13, implementación:** verificado con tests del Worker (rechazo con Tareas activas y su lista, último Adulto activo al archivar, borrar o pasar a Chico, archivado sin Avatares ni Vista Familia ni sesión, historial conservado, reactivar, borrar solo sin historial) y en el navegador (lista de Tareas pendientes con enlaces, borrar, archivar y reactivar). 'Sin historial' incluye también Tareas e Ítems anotados o comprados, para no dejar referencias rotas.
