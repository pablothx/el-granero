# 13: Límite de intentos de Clave de la casa

**What to build:** Quien prueba Claves de la casa al azar (para vincular un dispositivo o para restablecer el PIN del único Adulto) queda bloqueado después de 5 fallos seguidos durante 15 minutos. El límite se cuenta por IP, porque todavía no hay Dispositivo vinculado, y así alguien de afuera no puede bloquearle la vinculación a la Familia.

**Blocked by:** 10: Seguridad de acceso.

**Status:** done

- [x] 5 Claves incorrectas seguidas desde una IP la bloquean 15 minutos (`bloqueado`, 429); mientras tanto ni la Clave correcta sirve.
- [x] Otra IP no queda afectada.
- [x] Vincular y restablecer el PIN comparten el mismo contador.
- [x] Un acierto reinicia el contador.
- [x] Tests del Worker por la API, con una IP por dispositivo de prueba.

## Comments

**2026-11-14, implementación:** TDD por la API HTTP (seam confirmado). La IP sale de `CF-Connecting-IP`, que Cloudflare pone en producción; sin ese header todo cae en una IP "desconocida" compartida (solo pasa en desarrollo local). La pantalla muestra el `mensaje` del servidor, así que no hizo falta tocar el cliente.
