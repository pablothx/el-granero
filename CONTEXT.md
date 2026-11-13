# El Granero

App de una familia para organizar las tareas del hogar y las compras compartidas.

## Familia y acceso

**Familia**:
El grupo de personas que usa El Granero. Hay exactamente una.
_Avoid_: Hogar, casa, grupo

**Miembro**:
Una persona de la Familia, con su propio acceso a la app. Es un Adulto o un Chico.
_Avoid_: Usuario, cuenta, perfil

**Avatar**:
El emoji con color de fondo que identifica a un Miembro y que se toca para entrar.
_Avoid_: Foto, ícono, imagen de perfil

**Clave de la casa**:
El secreto compartido de la Familia que un Adulto ingresa para vincular un dispositivo.
_Avoid_: Código de familia, contraseña

**Dispositivo vinculado**:
Un celular o navegador en el que ya se ingresó la Clave de la casa; ahí los Miembros entran con su PIN. Un Adulto puede desvincularlo, y cambiar la Clave de la casa desvincula a todos.
_Avoid_: Dispositivo autorizado, sesión de familia

**PIN**:
El código numérico corto con el que un Miembro entra en un Dispositivo vinculado.
_Avoid_: Contraseña, clave

**Adulto**:
Miembro que administra la Familia: gestiona Miembros y Tareas, y puede tildar o destildar en nombre de cualquiera, incluso Ocurrencias de Períodos ya terminados.
_Avoid_: Admin, padre, tutor

**Chico**:
Miembro que solo ve y tilda sus propias Tareas, y puede destildar sus Ocurrencias mientras siga su Período; usa las listas de compras como cualquier Miembro.
_Avoid_: Niño, hijo, menor

## Tareas

**Tarea**:
Algo del hogar que se repite con una Frecuencia y está asignado a un Miembro (ej. sacar la basura). Lo que se hace varias veces por día son Tareas distintas (ej. "perro a la mañana" y "perro a la noche").
_Avoid_: Quehacer, actividad, plantilla

**Ocurrencia**:
Cada Período concreto en que una Tarea tiene que cumplirse; es lo que se tilda. Guarda a qué Miembro estaba asignada, así el historial no cambia si la Tarea se reasigna.
_Avoid_: Instancia, turno

**Frecuencia**:
Cada cuánto genera Ocurrencias una Tarea: Diaria, Semanal o Mensual.
_Avoid_: Periodicidad, repetición, recurrencia

**Diaria**:
Frecuencia con una Ocurrencia por día, opcionalmente solo en ciertos días de la semana.

**Semanal**:
Frecuencia con una Ocurrencia por semana (lunes a domingo), que se puede cumplir cualquier día de esa semana.

**Mensual**:
Frecuencia con una Ocurrencia por mes calendario, que se puede cumplir cualquier día de ese mes.

**Período**:
El día, la semana (lunes a domingo) o el mes calendario al que corresponde una Ocurrencia, contado en la hora de la Familia.
_Avoid_: Ventana, plazo, ciclo

**Pendiente**:
Estado de una Ocurrencia cuyo Período todavía no terminó y que nadie tildó.

**Cumplida**:
Estado de una Ocurrencia que fue tildada dentro de su Período.
_Avoid_: Hecha, completada, terminada

**No cumplida**:
Estado de una Ocurrencia cuyo Período terminó sin que nadie la tildara. No se arrastra al Período siguiente.
_Avoid_: Vencida, atrasada, perdida

**Archivada**:
Tarea o Miembro que ya no está en uso: no aparece en las vistas ni genera Ocurrencias, pero conserva su historial y se puede reactivar. Al archivar una Tarea, su Ocurrencia Pendiente se descarta sin contar como No cumplida; un Miembro solo se archiva cuando no le quedan Tareas activas.
_Avoid_: Borrada, eliminada, desactivada

**Hoy**:
La vista de un Miembro con sus Ocurrencias Diarias de hoy y sus Semanales y Mensuales Pendientes; lo Cumplido aparece tachado solo el día en que se tildó.
_Avoid_: Inicio, dashboard, mis tareas

**Vista Familia**:
La vista de un Adulto con el progreso de hoy de cada Miembro, desde la que puede abrir el Hoy de cualquiera y tildar por él.
_Avoid_: Panel, resumen, administración

## Compras

**Lista**:
Una de las dos listas de compras fijas de la Familia: Súper o Generales.
_Avoid_: Lista de compras, carrito, categoría

**Súper**:
La Lista de lo que se compra en el supermercado (comida, limpieza, etc.).

**Generales**:
La Lista de todo lo que se compra en otro lado (ferretería, farmacia, etc.).

**Ítem**:
Algo que hace falta comprar, anotado como texto libre en una Lista por cualquier Miembro (ej. "2 kg de papas"). Recuerda quién lo anotó.
_Avoid_: Producto, artículo, pedido

**Comprado**:
Estado de un Ítem que alguien tildó; queda tachado al fondo de la Lista y desaparece a las 24 h.
_Avoid_: Tildado, resuelto, hecho
