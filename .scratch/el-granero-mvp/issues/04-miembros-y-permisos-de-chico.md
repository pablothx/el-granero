# 04: Miembros y permisos de Chico

**What to build:** Un Adulto crea y edita Miembros (nombre, rol Adulto o Chico, Avatar emoji + color, PIN) y puede asignarles Tareas. Un Chico que entra ve en Hoy solo sus Ocurrencias y solo puede tildar o destildar las suyas; un Adulto puede tildar por cualquiera. Las acciones de Adulto piden reingresar el PIN si pasaron más de 5 minutos desde el último ingreso en esa sesión.

Ver la spec, secciones Reglas y Acceso.

**Blocked by:** 02 (Configuración inicial y entrar con PIN)

**Status:** ready-for-agent

- [x] Un Adulto puede crear un Miembro con nombre, rol, Avatar (de una lista de emojis y colores) y PIN de 4 dígitos.
- [x] Un Adulto puede editar el nombre, el Avatar y el rol de un Miembro.
- [x] Al crear una Tarea, un Adulto puede asignársela a cualquier Miembro activo (si el ticket 03 ya está hecho).
- [x] Un Chico no puede crear ni editar Miembros ni Tareas (la API lo rechaza).
- [x] Un Chico solo ve y tilda sus propias Ocurrencias; intentar tildar la de otro se rechaza.
- [x] Un Adulto puede tildar y destildar Ocurrencias de cualquier Miembro.
- [x] Las acciones de Adulto se rechazan con un error específico si el último ingreso del PIN fue hace más de 5 minutos; el cliente pide el PIN y reintenta.
- [x] Tests del Worker cubren los permisos de Chico y Adulto, y el reingreso con el reloj avanzado 4 y 6 minutos.

## Comments

**2026-11-13, implementación:** verificado con tests del Worker (permisos de Chico y Adulto, reingreso a los 4 y 6 minutos) y en el navegador (alta de Chico, diálogo de reingreso disparado envejeciendo la sesión en D1, Hoy del Chico sin Administrar). Además de la API, las rutas de administración del cliente redirigen a Hoy si el Miembro es Chico, y después de entrar siempre se va a Hoy.
