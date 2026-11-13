# 10: Seguridad de acceso

**What to build:** Después de 5 PIN fallidos seguidos, ese Miembro queda bloqueado 5 minutos en ese Dispositivo vinculado. Un Adulto puede ponerle un PIN nuevo a cualquier Miembro, y si es el único Adulto puede resetear el suyo con la Clave de la casa. Un Adulto ve la lista de Dispositivos vinculados (nombre, último uso), puede desvincular uno puntual y puede cambiar la Clave de la casa, lo que desvincula a todos los dispositivos menos el actual.

Ver la spec, sección Acceso, y ADR 0002.

**Blocked by:** 04 (Miembros y permisos de Chico)

**Status:** ready-for-agent

- [ ] 5 PIN fallidos seguidos para un Miembro en un Dispositivo vinculado lo bloquean 5 minutos; un ingreso correcto reinicia el contador.
- [ ] Un Adulto puede cambiar el PIN de cualquier Miembro.
- [ ] Si hay un solo Adulto activo, puede resetear su propio PIN ingresando la Clave de la casa desde la pantalla de PIN.
- [ ] La lista de Dispositivos vinculados muestra nombre y último uso; el último uso se actualiza al usarlos.
- [ ] Desvincular un dispositivo invalida su cookie y sus sesiones; ese dispositivo vuelve a la pantalla de vinculación.
- [ ] Cambiar la Clave de la casa borra todos los Dispositivos vinculados y sus sesiones, menos el actual.
- [ ] Todas estas acciones de Adulto requieren reingreso reciente.
- [ ] Tests del Worker cubren el bloqueo y el desbloqueo con el reloj avanzado, los dos tipos de reset y la desvinculación (puntual y por cambio de Clave).
