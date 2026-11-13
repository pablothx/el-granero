# 11: Archivar y borrar Miembros

**What to build:** Un Adulto puede archivar a un Miembro que ya no vive en casa: desaparece de los Avatares y de la Vista Familia, pero conserva su historial y se puede reactivar. Si tiene Tareas activas, la app lo guía a reasignarlas o archivarlas antes. Nunca puede quedar la Familia sin un Adulto activo. Un Miembro cargado por error se puede borrar si no tiene Ocurrencias.

Ver la spec, sección Reglas.

**Blocked by:** 07 (Editar, reasignar y archivar Tareas)

**Status:** ready-for-agent

- [ ] Archivar un Miembro con Tareas activas asignadas se rechaza; la app muestra esas Tareas con las acciones para reasignar o archivar cada una.
- [ ] Archivar al último Adulto activo se rechaza (y tampoco se puede pasar el último Adulto activo a Chico).
- [ ] Un Miembro Archivado no aparece en los Avatares ni en la Vista Familia, sus sesiones se cierran y no puede entrar.
- [ ] Sus Ocurrencias pasadas siguen existiendo con su nombre.
- [ ] Reactivar a un Miembro lo devuelve a los Avatares con su historial.
- [ ] Borrar un Miembro se permite solo si no tiene ninguna Ocurrencia; si no, la API lo rechaza y la app ofrece archivar.
- [ ] Tests del Worker cubren cada regla.
