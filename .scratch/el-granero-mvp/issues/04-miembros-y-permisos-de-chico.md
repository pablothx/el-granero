# 04: Miembros y permisos de Chico

**What to build:** Un Adulto crea y edita Miembros (nombre, rol Adulto o Chico, Avatar emoji + color, PIN) y puede asignarles Tareas. Un Chico que entra ve en Hoy solo sus Ocurrencias y solo puede tildar o destildar las suyas; un Adulto puede tildar por cualquiera. Las acciones de Adulto piden reingresar el PIN si pasaron más de 5 minutos desde el último ingreso en esa sesión.

Ver la spec, secciones Reglas y Acceso.

**Blocked by:** 02 (Configuración inicial y entrar con PIN)

**Status:** ready-for-agent

- [ ] Un Adulto puede crear un Miembro con nombre, rol, Avatar (de una lista de emojis y colores) y PIN de 4 dígitos.
- [ ] Un Adulto puede editar el nombre, el Avatar y el rol de un Miembro.
- [ ] Al crear una Tarea, un Adulto puede asignársela a cualquier Miembro activo (si el ticket 03 ya está hecho).
- [ ] Un Chico no puede crear ni editar Miembros ni Tareas (la API lo rechaza).
- [ ] Un Chico solo ve y tilda sus propias Ocurrencias; intentar tildar la de otro se rechaza.
- [ ] Un Adulto puede tildar y destildar Ocurrencias de cualquier Miembro.
- [ ] Las acciones de Adulto se rechazan con un error específico si el último ingreso del PIN fue hace más de 5 minutos; el cliente pide el PIN y reintenta.
- [ ] Tests del Worker cubren los permisos de Chico y Adulto, y el reingreso con el reloj avanzado 4 y 6 minutos.
