# 07: Editar, reasignar y archivar Tareas

**What to build:** Un Adulto ve la lista de Tareas activas (con Frecuencia y Miembro asignado) y puede editarlas. Reasignar a mitad de Período pasa la Ocurrencia Pendiente actual al nuevo Miembro; las pasadas no cambian. Cambiar la Frecuencia aplica enseguida. Puede archivar una Tarea (su Pendiente actual se descarta sin contar como No cumplida), reactivarla (genera la Ocurrencia del Período actual) y borrarla solo si no tiene historial.

Ver la spec, sección Reglas.

**Blocked by:** 04 (Miembros y permisos de Chico), 05 (Semanales, Mensuales y días elegidos)

**Status:** ready-for-agent

- [x] Lista de Tareas activas con Frecuencia y Miembro asignado, y acceso a ver las Archivadas.
- [x] Editar nombre y emoji no toca las Ocurrencias.
- [x] Reasignar cambia el Miembro asignado de la Tarea y de su Ocurrencia Pendiente actual; las Cumplidas y No cumplidas conservan el Miembro anterior.
- [x] Cambiar la Frecuencia (o los días) borra la Ocurrencia Pendiente actual sin tilde y regenera según la nueva regla; si la actual ya estaba Cumplida, se conserva.
- [x] Archivar deja de generar Ocurrencias y borra la Pendiente actual; la Tarea desaparece de Hoy.
- [x] Reactivar vuelve a generar la Ocurrencia del Período actual en el momento.
- [x] Borrar se permite solo si la Tarea no tiene Ocurrencias Cumplidas ni de Períodos terminados; si no, la API lo rechaza y la app ofrece archivar.
- [x] Tests del Worker cubren cada uno de estos casos a mitad de semana con una Tarea Semanal.

## Comments

**2026-11-13, implementación:** verificado con tests del Worker (reasignar con historial, cambiar Frecuencia con Pendiente y con Cumplida, cambiar días, archivar sin No cumplida, reactivar, Cron con Archivadas, borrar con y sin historial) y en el navegador (reasignar, archivar/reactivar, rechazo al borrar con historial, borrar sin historial). Las acciones delicadas usan confirmación en dos toques, sin diálogos del navegador.
