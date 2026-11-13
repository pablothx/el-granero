# 10: Seguridad de acceso

**What to build:** Después de 5 PIN fallidos seguidos, ese Miembro queda bloqueado 5 minutos en ese Dispositivo vinculado. Un Adulto puede ponerle un PIN nuevo a cualquier Miembro, y si es el único Adulto puede resetear el suyo con la Clave de la casa. Un Adulto ve la lista de Dispositivos vinculados (nombre, último uso), puede desvincular uno puntual y puede cambiar la Clave de la casa, lo que desvincula a todos los dispositivos menos el actual.

Ver la spec, sección Acceso, y ADR 0002.

**Blocked by:** 04 (Miembros y permisos de Chico)

**Status:** ready-for-agent

- [x] 5 PIN fallidos seguidos para un Miembro en un Dispositivo vinculado lo bloquean 5 minutos; un ingreso correcto reinicia el contador.
- [x] Un Adulto puede cambiar el PIN de cualquier Miembro.
- [x] Si hay un solo Adulto activo, puede resetear su propio PIN ingresando la Clave de la casa desde la pantalla de PIN.
- [x] La lista de Dispositivos vinculados muestra nombre y último uso; el último uso se actualiza al usarlos.
- [x] Desvincular un dispositivo invalida su cookie y sus sesiones; ese dispositivo vuelve a la pantalla de vinculación.
- [x] Cambiar la Clave de la casa borra todos los Dispositivos vinculados y sus sesiones, menos el actual.
- [x] Todas estas acciones de Adulto requieren reingreso reciente.
- [x] Tests del Worker cubren el bloqueo y el desbloqueo con el reloj avanzado, los dos tipos de reset y la desvinculación (puntual y por cambio de Clave).

## Comments

**2026-11-13, implementación:** verificado con tests del Worker (bloqueo y desbloqueo con el reloj, reinicio del contador, reingreso cuenta para el bloqueo, cambio de PIN, reset del único Adulto con la Clave y sus rechazos, lista y desvinculación de dispositivos, cambio de Clave) y en el navegador (cambiar PIN, desvincular, bloqueo tras 5 fallos, '¿Olvidaste tu PIN?'). **Pendiente fuera de alcance:** los intentos de Clave de la casa en `/vincular` y `/restablecer-pin` no tienen límite; convendría un bloqueo similar (por IP o global) antes de exponer la app.
