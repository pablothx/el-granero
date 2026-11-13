# 05: Semanales, Mensuales y días elegidos

**What to build:** Un Adulto puede crear Tareas Semanales (cumplibles cualquier día de lunes a domingo), Mensuales (cualquier día del mes calendario) y Diarias que caen solo en ciertos días de la semana. Hoy muestra las Diarias del día y las Semanales y Mensuales Pendientes, agrupadas y en orden; una Semanal tildada ayer ya no aparece hoy.

Ver la spec, secciones Módulos y Reglas.

**Blocked by:** 03 (Primera Tarea Diaria en Hoy)

**Status:** ready-for-agent

- [x] El módulo de Períodos soporta Semanal (lunes 00:00 a lunes 00:00 local) y Mensual (mes calendario), y Diarias con días de la semana elegidos (vacío = todos).
- [x] Una Diaria con días elegidos solo genera Ocurrencia en esos días.
- [x] Hoy muestra: Diarias de hoy; Semanales y Mensuales Pendientes del Período actual; Cumplidas cuyo tilde fue hoy.
- [x] Orden: Pendientes agrupadas en Diarias, Semanales y Mensuales, alfabético dentro de cada grupo; después las Cumplidas de hoy, tachadas.
- [x] Una Semanal tildada el lunes aparece tachada el lunes y no aparece el martes.
- [x] El formulario de Tarea permite elegir Frecuencia y días de la semana.
- [x] Tests de Períodos: cambio de semana de domingo a lunes, fin de mes (incluido febrero en año bisiesto y en año común), Diaria lunes/miércoles/viernes.

## Comments

**2026-11-13, implementación:** tests puros de Períodos (cambio de semana, fin de mes, febrero común y bisiesto, diciembre, Diaria L/M/V) y del Worker (agrupación y orden de Hoy, Semanal tildada ayer, Semanal Pendiente toda la semana, Mensual). En el navegador: formulario con Frecuencia y días, y Hoy agrupado.
