# 06: Cron y No cumplidas

**What to build:** Todos los días a las 00:05 hora de la Familia, el Cron genera las Ocurrencias del nuevo Período para todas las Tareas activas, así un día en que nadie abre la app igual queda registrado. Una Ocurrencia sin tildar cuyo Período terminó pasa a No cumplida y no se arrastra al siguiente. Un Chico ya no puede destildar (ni tildar) una Ocurrencia de un Período terminado.

Ver la spec, secciones Reglas y Testing, y ADR 0005.

**Blocked by:** 03 (Primera Tarea Diaria en Hoy), 04 (Miembros y permisos de Chico)

**Status:** ready-for-agent

- [ ] El handler `scheduled` genera las Ocurrencias del Período actual de cada Tarea activa, usando la misma operación idempotente que Hoy.
- [ ] El Cron está programado para las 00:05 de la zona horaria de la Familia (traducido a UTC en el trigger).
- [ ] Correr el Cron dos veces, o el Cron y después leer Hoy, no duplica Ocurrencias.
- [ ] El estado de una Ocurrencia se deriva: Cumplida con tilde; Pendiente sin tilde y Período abierto; No cumplida sin tilde y Período terminado.
- [ ] Una No cumplida no aparece en el Hoy del Período siguiente.
- [ ] Un Chico no puede tildar ni destildar Ocurrencias de un Período terminado (la API lo rechaza).
- [ ] Test: Tarea Diaria, nadie abre la app el martes, el Cron corre el martes a las 00:05; el miércoles la Ocurrencia del martes figura como No cumplida.
