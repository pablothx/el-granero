# 02: Configuración inicial y entrar con PIN

**What to build:** Un Adulto que abre la app recién desplegada completa un asistente (protegido por el token de instalación) donde define la Clave de la casa, la zona horaria de la Familia y su propio Miembro (nombre, Avatar emoji + color, PIN de 4 dígitos). Su dispositivo queda vinculado y con la sesión abierta. En otro dispositivo, un Adulto ingresa la Clave de la casa para vincularlo; ahí aparecen los Avatares, cada Miembro toca el suyo y entra con su PIN. "Cambiar de Miembro" vuelve a los Avatares. Sin Dispositivo vinculado, la app no muestra ningún dato de la Familia.

Ver la spec, sección Acceso, y ADR 0002.

**Blocked by:** 01 (Esqueleto desplegable)

**Status:** ready-for-agent

- [ ] Si no existe ningún Miembro, la app muestra el asistente inicial; este exige el token de instalación (secreto del Worker) y se rechaza si el token es incorrecto.
- [ ] El asistente crea la configuración de la Familia (hash de la Clave de la casa, zona horaria) y el primer Adulto, vincula el dispositivo y abre la sesión.
- [ ] Una vez que existe un Miembro, el asistente ya no está disponible (la API lo rechaza).
- [ ] Vincular un dispositivo con la Clave de la casa correcta crea un Dispositivo vinculado; con una incorrecta, falla.
- [ ] Sin Dispositivo vinculado, la API solo responde a la vinculación y a la configuración inicial (cuando corresponde).
- [ ] En un Dispositivo vinculado se ven los Avatares de los Miembros activos; tocar uno y poner el PIN correcto abre la sesión.
- [ ] La sesión no vence; "Cambiar de Miembro" la cierra y vuelve a los Avatares.
- [ ] Dispositivo vinculado y sesión viajan en dos cookies `HttpOnly`, `Secure`, `SameSite=Strict`; en D1 solo se guardan sus hashes.
- [ ] El PIN se guarda con hash PBKDF2 (WebCrypto) y sal propia, nunca en texto plano.
- [ ] Tests del Worker cubren el asistente (token, una sola vez), la vinculación, el ingreso con PIN y el rechazo sin dispositivo.
