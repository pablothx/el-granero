# Spec: El Granero — MVP

Status: ready-for-agent

## Problem Statement

En casa, las tareas del hogar (sacar la basura, darle de comer al perro, limpiar el patio) se reparten de palabra y se olvidan: nadie sabe con certeza a quién le toca qué, si ya se hizo, ni qué quedó sin hacer. Los chicos no tienen una forma simple de ver "lo mío de hoy" y marcarlo como hecho, y los adultos tienen que preguntar uno por uno. Con las compras pasa lo mismo: alguien nota que falta azúcar, no lo anota en ningún lado compartido, y quien va al súper no se entera.

Las herramientas existentes no sirven: las apps de tareas genéricas no entienden de tareas recurrentes asignadas a miembros de una familia, piden cuentas con email que los chicos no tienen, o son pagas.

## Solution

El Granero es una PWA privada de la Familia, instalable en el celular. Cada Miembro (Adulto o Chico) entra tocando su Avatar y poniendo su PIN en un Dispositivo vinculado con la Clave de la casa.

- Los Adultos definen Tareas recurrentes (Diarias, Semanales o Mensuales) y se las asignan a un Miembro.
- Cada Miembro abre **Hoy** y ve sus Ocurrencias del día y sus Semanales y Mensuales Pendientes, y las va tildando.
- Lo que no se hizo en su Período queda No cumplida y no se arrastra.
- Los Adultos tienen la **Vista Familia** para ver el progreso de todos y tildar o corregir por cualquiera.
- Hay dos Listas de compras compartidas, Súper y Generales, donde cualquiera anota Ítems y quien compra los tilda.

Todo corre en el free tier de Cloudflare: un solo Worker que sirve el front y la API, con D1 como base de datos.

## User Stories

### Puesta en marcha

1. Como Adulto que instala la app, quiero un asistente inicial que me pida un token de instalación, para que nadie más pueda configurar mi Familia antes que yo entre el deploy y la primera visita.
2. Como Adulto que instala la app, quiero definir en el asistente la Clave de la casa, la zona horaria de la Familia y mi propio Miembro (nombre, Avatar y PIN), para empezar a usarla sin tocar la línea de comandos.
3. Como Adulto que completó el asistente, quiero que mi dispositivo quede vinculado y con mi sesión abierta, para no tener que ingresar la Clave de la casa enseguida otra vez.
4. Como Adulto, quiero que el asistente desaparezca una vez que existe un Miembro, para que nadie pueda reconfigurar la Familia.

### Vincular dispositivos y entrar

5. Como Miembro con un celular nuevo, quiero que un Adulto ingrese la Clave de la casa una sola vez, para que ese celular quede vinculado.
6. Como visitante sin Clave de la casa, quiero no poder ver Avatares ni datos de la Familia, para que la URL pública no exponga nada.
7. Como Chico, quiero ver los Avatares de la Familia en un Dispositivo vinculado y tocar el mío, para entrar sin escribir mi nombre.
8. Como Chico, quiero entrar con un PIN de 4 dígitos, para poder acordármelo.
9. Como Miembro, quiero que mi sesión siga abierta en mi celular hasta que toque "Cambiar de Miembro", para no tener que poner el PIN cada vez.
10. Como Miembro en una tablet compartida, quiero tocar "Cambiar de Miembro" y volver a la pantalla de Avatares, para que otro pueda entrar con su PIN.
11. Como Adulto, quiero que las acciones de Adulto me pidan el PIN de nuevo si pasaron más de 5 minutos desde el último ingreso, para que un Chico no use mi sesión abierta en la tablet.
12. Como Familia, quiero que después de 5 PIN fallidos seguidos ese Miembro quede bloqueado 5 minutos en ese Dispositivo vinculado, para que no se pueda adivinar un PIN probando.
13. Como Adulto, quiero ponerle un PIN nuevo a cualquier Miembro que lo olvidó, para que pueda volver a entrar.
14. Como único Adulto de la Familia, quiero poder resetear mi propio PIN con la Clave de la casa, para no quedar afuera si lo olvido.
15. Como Adulto, quiero ver la lista de Dispositivos vinculados con su nombre y su último uso, para saber desde dónde se usa la app.
16. Como Adulto, quiero desvincular un Dispositivo vinculado puntual, para cortar el acceso de un celular perdido sin molestar al resto.
17. Como Adulto, quiero cambiar la Clave de la casa y que se desvinculen todos los dispositivos menos el mío, para cortar el acceso de cualquiera que la conociera.

### Miembros

18. Como Adulto, quiero crear un Miembro con nombre, rol (Adulto o Chico), Avatar (emoji + color de fondo) y PIN, para sumar a alguien de la Familia.
19. Como Adulto, quiero editar el nombre, el Avatar y el rol de un Miembro, para corregir o actualizar sus datos.
20. Como Chico, quiero elegir mi animal y mi color de Avatar, para reconocerme rápido en la pantalla de entrada.
21. Como Adulto, quiero archivar a un Miembro que ya no vive en casa, para que deje de aparecer sin perder su historial.
22. Como Adulto que archiva a un Miembro, quiero que la app me obligue antes a reasignar o archivar sus Tareas activas, para que ninguna Tarea quede asignada a alguien que no está.
23. Como Adulto, quiero reactivar a un Miembro archivado, para que vuelva a usar la app con su historial.
24. Como Adulto, quiero borrar un Miembro que cargué por error, siempre que no tenga ninguna Ocurrencia, para limpiar errores sin tocar el historial.
25. Como Familia, quiero que siempre quede al menos un Adulto activo, para que nadie pueda dejar la app sin administración.

### Tareas

26. Como Adulto, quiero crear una Tarea con nombre, emoji opcional, Frecuencia y Miembro asignado, para repartir las cosas del hogar.
27. Como Adulto, quiero crear una Tarea Diaria que caiga solo ciertos días de la semana (ej. basura lunes, miércoles y viernes), para representar tareas con días fijos.
28. Como Adulto, quiero crear una Tarea Semanal que se pueda cumplir cualquier día de la semana (lunes a domingo), para cosas como limpiar el patio.
29. Como Adulto, quiero crear una Tarea Mensual que se pueda cumplir cualquier día del mes, para cosas como cambiar las sábanas de invierno.
30. Como Adulto, quiero que una Tarea nueva genere su Ocurrencia Pendiente en el Período actual apenas la creo, para que cuente desde ya.
31. Como Adulto, quiero cargar algo que se hace dos veces por día como dos Tareas Diarias distintas ("perro a la mañana", "perro a la noche"), para que cada una se tilde por separado.
32. Como Chico que todavía no lee bien, quiero ver el emoji de cada Tarea, para reconocerla sin leer.
33. Como Adulto, quiero reasignar una Tarea a otro Miembro y que su Ocurrencia Pendiente actual pase al nuevo Miembro, para que la haga otro desde ya.
34. Como Adulto que reasigna una Tarea, quiero que las Ocurrencias pasadas queden a nombre de quien las tenía, para que el historial no cambie.
35. Como Adulto, quiero cambiar la Frecuencia de una Tarea y que aplique ya (se descarta la Ocurrencia Pendiente actual y se genera la que corresponde), para ver el efecto enseguida.
36. Como Adulto que cambia la Frecuencia, quiero que las Ocurrencias ya Cumplidas no se toquen, para no perder lo que se hizo.
37. Como Adulto, quiero archivar una Tarea que ya no corresponde, para que deje de generar Ocurrencias sin perder su historial.
38. Como Chico, quiero que al archivarse una Tarea su Ocurrencia Pendiente se descarte sin contar como No cumplida, para que no me cuente algo que ya no correspondía.
39. Como Adulto, quiero reactivar una Tarea Archivada y que genere su Ocurrencia del Período actual, para retomarla.
40. Como Adulto, quiero borrar una Tarea creada por error, siempre que no tenga Ocurrencias Cumplidas ni No cumplidas, para limpiar errores sin tocar el historial.
41. Como Adulto, quiero ver la lista de Tareas activas con su Frecuencia y su Miembro asignado, para revisar el reparto.

### Hoy

42. Como Miembro, quiero abrir Hoy y ver mis Ocurrencias Diarias de hoy, para saber qué me toca.
43. Como Miembro, quiero ver en Hoy mis Ocurrencias Semanales y Mensuales Pendientes, para acordarme de lo que tengo que hacer en algún momento de la semana o del mes.
44. Como Miembro, quiero ver primero las Pendientes, agrupadas en Diarias, Semanales y Mensuales y ordenadas alfabéticamente, para encontrar rápido lo que falta.
45. Como Miembro, quiero tildar una Ocurrencia y verla tachada al instante, para sentir que la terminé.
46. Como Miembro, quiero ver al fondo de Hoy, tachadas, las Ocurrencias que tildé hoy, para ver lo que ya hice.
47. Como Miembro que tildó una Semanal el lunes, quiero que el martes ya no aparezca en Hoy, para que mi lista quede corta.
48. Como Chico, quiero destildar mi propia Ocurrencia mientras su Período siga abierto, para corregir un tilde por error sin pedirle a un Adulto.
49. Como Chico, quiero no poder destildar una Ocurrencia de un Período ya terminado, para que el historial no se pueda cambiar después.
50. Como Chico, quiero ver y tildar solo mis propias Ocurrencias, para no tocar las de mis hermanos.
51. Como Miembro, quiero que una Ocurrencia que no tildé en su Período quede No cumplida y no se arrastre al siguiente, para no acumular atrasos.
52. Como Miembro, quiero que el día cambie a las 00:00 hora de la Familia (no en UTC), para que Hoy no cambie a las 21 h.
53. Como Familia, quiero que un día en que nadie abrió la app sus Ocurrencias igual existan y queden No cumplidas, para que el historial refleje lo que pasó.

### Vista Familia

54. Como Adulto, quiero una Vista Familia con el progreso de hoy de cada Miembro (ej. "Tomi 2/3"), para controlar de un vistazo si ya dieron de comer al perro.
55. Como Adulto, quiero que mi propio Hoy muestre solo mis Tareas, para no perderme entre las de todos.
56. Como Adulto, quiero abrir el Hoy de cualquier Miembro desde la Vista Familia y tildar o destildar por él, para registrar algo que hizo y no tildó.
57. Como Adulto, quiero cambiar una Ocurrencia de un Período ya terminado entre Cumplida y No cumplida, en ambos sentidos, para corregir olvidos de tilde.
58. Como Adulto, quiero que cada Ocurrencia Cumplida guarde quién la tildó y cuándo, para saber si la tildó el Chico o un Adulto en su nombre.
59. Como Adulto, quiero que al destildar se borren quién la tildó y cuándo, para que no quede información falsa.

### Listas de compras

60. Como Miembro, quiero ver las dos Listas fijas, Súper y Generales, para anotar cada cosa donde corresponde.
61. Como Miembro (incluso Chico), quiero anotar un Ítem como texto libre (ej. "falta azúcar", "2 kg de papas"), para avisar que falta algo sin llenar campos.
62. Como Miembro, quiero que cada Ítem recuerde quién lo anotó, para saber a quién preguntarle.
63. Como Miembro que está anotando, quiero que la app me avise si ya hay un Ítem parecido sin comprar (sin distinguir mayúsculas ni tildes), para no anotar dos veces lo mismo.
64. Como Miembro, quiero poder anotar el Ítem igual después del aviso, para casos como "leche entera" y "leche descremada".
65. Como Miembro en el súper, quiero tildar un Ítem y que quede Comprado, tachado al fondo de la Lista, para que el resto vea que ya lo compré.
66. Como Miembro, quiero destildar un Ítem Comprado, para corregir un tilde por error.
67. Como Miembro, quiero que los Ítems Comprados desaparezcan solos a las 24 h, para que nadie tenga que limpiar la Lista.
68. Como Miembro, quiero editar el texto de cualquier Ítem, para corregirlo o agregar una cantidad.
69. Como Miembro, quiero borrar cualquier Ítem, para sacar algo que ya no hace falta.
70. Como Miembro, quiero ver los Ítems sin comprar con el más nuevo arriba, y los Comprados abajo, para ver primero lo último que se anotó.
71. Como Miembro en el súper, quiero que lo que anota alguien desde casa me aparezca en unos 15 segundos sin recargar, para comprarlo en el mismo viaje.

### PWA, sin conexión y actualizaciones

72. Como Miembro, quiero instalar El Granero en la pantalla de inicio del celular, para abrirlo como una app.
73. Como Miembro, quiero que la app se vea y se use bien en el celular, con botones grandes, para usarla con una mano o siendo chico.
74. Como Miembro sin conexión, quiero que la app abra y me muestre lo último que cargó (Hoy y Listas), para consultar sin señal.
75. Como Miembro sin conexión, quiero un aviso claro cuando intento tildar o anotar, para saber que no se guardó.
76. Como Miembro, quiero que al volver a la app o al cambiar de pantalla los datos se actualicen solos, para no ver información vieja.
77. Como Miembro, quiero que la app se actualice sola a la versión nueva al volver a abrirla, sin avisos que tenga que aceptar.
78. Como Miembro con la versión anterior todavía abierta, quiero que la app siga funcionando contra la API nueva, para no ver errores justo después de un deploy.

## Implementation Decisions

### Arquitectura (ver ADR 0001, 0004)

- Una sola Familia por instalación: no hay datos de varias familias ni alta de familias. Las tablas no llevan identificador de familia.
- Un único Cloudflare Worker sirve el build de Vite (archivos estáticos) y la API, con `@cloudflare/vite-plugin`, para que `vite dev` corra front, API y D1 local juntos. No se usa Cloudflare Pages.
- Un solo paquete npm (sin workspaces), con tres zonas: cliente, worker y código compartido (esquema, validaciones y cálculo de Períodos).
- Todo dentro del free tier: Workers, D1 y Cron Triggers. Sin R2, Durable Objects ni servicios pagos.
- Los términos del dominio van en español también en el código (tablas, tipos, endpoints), y el vocabulario genérico de programación queda en inglés (ADR 0006).

### Módulos

- **Reloj**: única fuente de "ahora" del Worker, inyectable. Ningún otro módulo lee la hora del sistema.
- **Períodos** (compartido): una función pura que, dados un instante, la zona horaria de la Familia y una Frecuencia (con los días de la semana si es Diaria), devuelve si corresponde una Ocurrencia y el inicio y fin del Período. Semana de lunes a domingo, mes calendario, día de 00:00 a 00:00 local. Es la interfaz más chica posible para la lógica de fechas más delicada.
- **Generación de Ocurrencias**: una operación idempotente que asegura que exista la Ocurrencia del Período actual de cada Tarea activa a la que le corresponda, con el Miembro asignado de ese momento. La invocan el Cron, la lectura de Hoy y de la Vista Familia, y los cambios de Tarea (crear, reactivar, reasignar, cambiar Frecuencia).
- **Acceso**: vinculación de dispositivos, PIN, sesiones, bloqueo por intentos fallidos y reingreso de Adulto. Expone al resto de la API "quién es el Miembro actual, con qué rol, y si pasó el reingreso reciente".
- **API HTTP** (Hono): rutas de configuración inicial, acceso, Miembros, Tareas, Hoy y Vista Familia, Ocurrencias y Listas. Entradas validadas con Zod. El cliente usa el cliente RPC de Hono para tener tipos de punta a punta.
- **Cliente**: React + Vite + `vite-plugin-pwa`, React Router v7 (modo librería), TanStack Query, Tailwind CSS y shadcn/ui solo para piezas complejas (diálogos, selects, toasts).

### Modelo de datos (D1 + Drizzle; migraciones generadas por Drizzle Kit)

- **Configuración de la Familia** (una fila): hash de la Clave de la casa y zona horaria (por defecto `America/Argentina/Buenos_Aires`). Que exista un Miembro marca que la configuración inicial ya se hizo.
- **Miembro**: nombre, rol (Adulto | Chico), emoji y color del Avatar, hash del PIN (PBKDF2 con WebCrypto, con sal propia), si está Archivado, fechas.
- **Dispositivo vinculado**: hash de un token aleatorio, nombre descriptivo, creado y último uso.
- **Sesión**: hash de un token aleatorio, Dispositivo vinculado, Miembro, hora del último ingreso del PIN.
- **Intentos de PIN**: por (Dispositivo vinculado, Miembro), con la cantidad de fallos seguidos y el bloqueo vigente.
- **Tarea**: nombre, emoji opcional, Frecuencia (Diaria | Semanal | Mensual), días de la semana (solo Diaria; vacío = todos), Miembro asignado, si está Archivada, fechas.
- **Ocurrencia**: Tarea, Miembro asignado (copiado al crearla), inicio y fin del Período, tildada por (Miembro, nullable), tildada en (instante, nullable). Clave única (Tarea, inicio del Período). Estado derivado, no guardado: Cumplida si tiene tilde; Pendiente si no lo tiene y el Período no terminó; No cumplida si no lo tiene y el Período terminó (ADR 0005).
- **Ítem**: Lista (Súper | Generales, campo fijo, sin tabla de listas), texto libre, anotado por (Miembro), anotado en, comprado en (nullable), comprado por (nullable).

### Reglas de comportamiento

- **Cron** a las 00:05 de la hora de la Familia (un trigger en UTC, que el código traduce): genera las Ocurrencias del nuevo Período y borra los Ítems con más de 24 h Comprados.
- **Reasignar una Tarea**: actualiza la Tarea y el Miembro asignado de su Ocurrencia Pendiente actual, si hay. Las pasadas no se tocan.
- **Cambiar la Frecuencia**: borra la Ocurrencia Pendiente actual (sin tilde) y vuelve a generar. Las Cumplidas quedan.
- **Archivar una Tarea**: borra su Ocurrencia Pendiente actual. Reactivarla vuelve a generar.
- **Borrar una Tarea**: solo si no tiene Ocurrencias Cumplidas ni de Períodos terminados.
- **Archivar un Miembro**: se rechaza si tiene Tareas activas asignadas o si es el último Adulto activo. Borrarlo: solo si no tiene Ocurrencias.
- **Tildar y destildar Ocurrencias**:
  - Un Chico solo puede con las propias y dentro de su Período.
  - Un Adulto puede con cualquiera, sin límite de Período.
  - Tildar guarda quién y cuándo; destildar borra ambos.
- **Hoy**:
  - Las Diarias del día de hoy.
  - Las Semanales y Mensuales Pendientes del Período actual.
  - Las Cumplidas cuyo tilde fue hoy (hora de la Familia).
  - Orden: Pendientes (Diarias, luego Semanales, luego Mensuales, alfabético dentro de cada grupo), y después las Cumplidas.
- **Vista Familia**: solo para Adultos. Por cada Miembro activo: Cumplidas sobre total de Hoy, y acceso a su Hoy.
- **Ítems repetidos**: aviso en el cliente comparando sin distinguir mayúsculas ni tildes contra los Ítems sin comprar de esa Lista. No bloquea.
- **Ítems en la Lista**: los sin comprar con el más nuevo arriba; los Comprados abajo; los Comprados hace más de 24 h no se devuelven, aunque el Cron todavía no los haya borrado.

### Acceso (ADR 0002)

- **Cookies**: dos, `HttpOnly`, `Secure`, `SameSite=Strict`.
  - Una del Dispositivo vinculado.
  - Una de la sesión del Miembro.
  - En la base solo se guardan sus hashes.
- **Sin dispositivo vinculado**, la API solo responde a la vinculación y, si no hay ningún Miembro, a la configuración inicial.
- **Configuración inicial**:
  - Exige el token de instalación, que es un secreto del Worker.
  - Crea la configuración de la Familia y el primer Adulto.
  - Vincula el dispositivo y abre la sesión.
  - Se rechaza si ya existe algún Miembro.
- **PIN**:
  - 4 dígitos.
  - 5 fallos seguidos bloquean a ese Miembro 5 minutos en ese Dispositivo vinculado.
  - Un ingreso correcto reinicia el contador.
- **Sesión**: no vence. Termina con "Cambiar de Miembro" o al desvincularse el dispositivo.
- **Reingreso de Adulto**: las acciones de Adulto (Vista Familia, gestión de Tareas, Miembros, dispositivos y Clave) exigen que el último ingreso del PIN de esa sesión tenga menos de 5 minutos. Si no, la API responde un error específico y el cliente pide el PIN.
- **Cambiar la Clave de la casa**: borra todos los Dispositivos vinculados y sus sesiones, menos el actual.
- **Reset de PIN**:
  - Un Adulto resetea el PIN de cualquier Miembro.
  - Si hay un solo Adulto activo, él puede resetear el suyo ingresando la Clave de la casa.

### Cliente, sin conexión y actualizaciones (ADR 0003, 0007)

- **TanStack Query**:
  - Refetch al enfocar la ventana y al cambiar de pantalla.
  - `refetchInterval` de unos 15 s en Hoy, Vista Familia y Listas.
  - Actualizaciones optimistas al tildar, que se revierten si falla.
- **Sin conexión**:
  - Persistencia de la caché de consultas en IndexedDB, para mostrar la última lectura.
  - Sin cola de escrituras: tildar o anotar sin conexión muestra un aviso y no se guarda.
- **Actualizaciones**:
  - `vite-plugin-pwa` en modo `autoUpdate`.
  - El service worker cachea solo el shell de la app; las respuestas de la API las maneja la caché persistida de TanStack Query.
  - La API acepta las requests del front anterior: agregar campos o rutas sí; quitar o renombrar, en dos deploys.
- **Pantallas**: configuración inicial, vincular dispositivo, Avatares, PIN, Hoy, Vista Familia, Lista Súper, Lista Generales y administración (Miembros, Tareas, Dispositivos vinculados, Clave de la casa).
- **Diseño**: mobile first, con botones táctiles grandes y la interfaz en español rioplatense.

### Despliegue

- Manual desde la máquina del desarrollador: un script `deploy` aplica las migraciones remotas de D1 y después ejecuta `wrangler deploy`.
- El token de instalación se carga como secreto del Worker antes del primer uso.
- Sin CI en el MVP.

## Testing Decisions

- **Un solo punto de prueba principal: el Worker completo, visto desde afuera.**
  - Los tests le mandan requests HTTP a su `fetch` y disparan su handler `scheduled` (Cron).
  - Corren con Vitest y `@cloudflare/vitest-pool-workers`, dentro del runtime real de Workers, contra una D1 local real con las migraciones aplicadas.
  - Sin mocks de la base ni de módulos internos.
- **El reloj se controla por inyección**: cada test fija "ahora" (ej. "martes 23:59 en Buenos Aires") y lo avanza. Es la única dependencia que se reemplaza.
- **Un buen test** describe comportamiento observable desde afuera, en el lenguaje de `CONTEXT.md`. Por ejemplo: "una Ocurrencia Diaria sin tildar al pasar la medianoche de la Familia aparece como No cumplida". No verifica tablas, columnas ni funciones internas: si se reescribe la implementación sin cambiar el comportamiento, los tests no se rompen.
- **Casos prioritarios:**
  - **Períodos y zona horaria:**
    - cambio de día a las 00:00 local y no a las 21 h;
    - semana de lunes a domingo;
    - fin de mes (incluido febrero);
    - Diarias con días de la semana elegidos.
  - **Generación idempotente:** un Cron repetido no duplica Ocurrencias, la lectura de Hoy no duplica lo que generó el Cron, y un día sin uso de la app igual deja No cumplidas.
  - **Estados:** Pendiente, Cumplida y No cumplida, y que no se arrastre al Período siguiente.
  - **Cambios de Tarea:**
    - reasignar a mitad de Período;
    - cambiar la Frecuencia con la Ocurrencia actual Cumplida y sin cumplir;
    - archivar y reactivar;
    - cuándo se permite borrar y cuándo no.
  - **Permisos:**
    - un Chico solo con lo propio y dentro del Período;
    - un Adulto con cualquier cosa y en cualquier Período;
    - el reingreso de 5 minutos.
  - **Acceso:**
    - sin Dispositivo vinculado no hay datos;
    - bloqueo tras 5 PIN fallidos y desbloqueo a los 5 minutos;
    - cambiar la Clave de la casa desvincula a todos menos el actual;
    - desvincular uno puntual;
    - la configuración inicial exige el token y solo funciona una vez;
    - reset de PIN, incluido el caso del único Adulto.
  - **Miembros:** no se puede archivar con Tareas activas, ni archivar al último Adulto activo.
  - **Listas:**
    - anotar, editar, tildar, destildar y borrar;
    - orden;
    - los Comprados de más de 24 h no aparecen y el Cron los borra.
  - **Hoy y Vista Familia:** contenido y orden exactos, y una Semanal tildada ayer que hoy no aparece.
- **Front**: tests de componentes (Vitest + Testing Library) solo para piezas con lógica propia, como el aviso de Ítems repetidos o la reversión de un tilde optimista. Sin tests end-to-end (Playwright) en el MVP.
- **Antecedentes**: el repo está vacío, así que no hay tests previos que seguir. Los primeros tests del Worker sientan el patrón para el resto.

## Out of Scope

- Granos (puntos para los Chicos).
- Rotación de Tareas y Tareas asignadas a varios Miembros o a "cualquiera".
- Notificaciones push y actualizaciones en tiempo real (WebSockets o Durable Objects).
- Escrituras sin conexión con cola de sincronización.
- Varias familias por instalación, o alta pública de familias.
- Listas de compras configurables, y Ítems con cantidad o nota en campos separados.
- Fotos o ilustraciones como Avatar.
- Tareas con horario o que se repiten varias veces dentro del mismo día.
- Semanales en un día fijo distinto de "Diaria en ciertos días".
- Ordenar a mano Tareas o Ítems.
- Historial o estadísticas navegables más allá de la Vista Familia de hoy y la corrección de Períodos pasados.
- CI/CD y tests end-to-end.

## Further Notes

- Vocabulario: `CONTEXT.md`. Decisiones con su porqué: ADR 0001 a 0007 en `docs/adr/`.
- La creación inmediata de la Ocurrencia al crear o reactivar una Tarea, y la edición de cualquier Ítem por cualquier Miembro, se dieron por aceptadas al cierre de la sesión de diseño, por coherencia con el resto de las decisiones.
- El historial de Ocurrencias (quién tenía asignada cada una y quién la tildó) se diseñó pensando en los Granos de la v2: no hay que perderlo ni reescribirlo.
- La zona horaria se carga en la configuración inicial. Todo cálculo de Período usa esa zona, nunca la del Worker (UTC) ni la de cada celular.
