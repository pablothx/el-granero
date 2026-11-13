# 08: Vista Familia y correcciones de Adulto

**What to build:** Un Adulto abre la Vista Familia y ve a cada Miembro activo con su progreso de hoy (ej. "Tomi 2/3"). Al tocar uno, abre su Hoy y puede tildar o destildar por él. También puede corregir Ocurrencias de Períodos ya terminados entre Cumplida y No cumplida, en ambos sentidos. El Hoy propio del Adulto sigue mostrando solo sus Tareas.

Ver la spec, sección Reglas.

**Blocked by:** 04 (Miembros y permisos de Chico), 06 (Cron y No cumplidas)

**Status:** ready-for-agent

- [ ] La Vista Familia es solo para Adultos (requiere reingreso reciente) y lista a cada Miembro activo con Cumplidas / total de su Hoy.
- [ ] Desde la Vista Familia, el Adulto abre el Hoy de cualquier Miembro y tilda o destilda por él; queda registrado que la tildó el Adulto.
- [ ] El Adulto puede ver Ocurrencias de Períodos recientes terminados de un Miembro y pasarlas de No cumplida a Cumplida y viceversa.
- [ ] El Hoy del Adulto muestra solo sus propias Ocurrencias.
- [ ] Tests: el progreso de la Vista Familia coincide con el Hoy de cada Miembro; un Chico no accede a la Vista Familia; corregir una No cumplida de ayer la deja Cumplida con quién y cuándo.
