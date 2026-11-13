# 03: Primera Tarea Diaria en Hoy

**What to build:** Un Adulto crea una Tarea Diaria (todos los días, con nombre y emoji opcional) asignada a sí mismo, y la ve en su Hoy como Ocurrencia Pendiente. La tilda y queda Cumplida (tachada al fondo), con quién y cuándo la tildó; la puede destildar. Al día siguiente, en la hora de la Familia, aparece una Ocurrencia nueva. Esta porción crea el módulo de Períodos (por ahora solo el día) y la generación idempotente de Ocurrencias al leer Hoy.

Ver la spec, secciones Módulos, Modelo de datos y Reglas, y ADR 0005.

**Blocked by:** 02 (Configuración inicial y entrar con PIN)

**Status:** ready-for-agent

- [ ] Un Adulto puede crear una Tarea Diaria con nombre, emoji opcional y Miembro asignado (por ahora él mismo).
- [ ] Crear la Tarea genera su Ocurrencia Pendiente del Período actual en ese momento.
- [ ] El módulo de Períodos es una función pura que, dado un instante, la zona horaria de la Familia y una Frecuencia, devuelve el Período (inicio y fin); el día va de 00:00 a 00:00 local.
- [ ] Leer Hoy asegura de forma idempotente que exista la Ocurrencia del Período actual (clave única Tarea + inicio del Período); leerlo dos veces no duplica.
- [ ] Cada Ocurrencia guarda el Miembro al que estaba asignada al crearse.
- [ ] Tildar guarda quién y cuándo; destildar borra ambos datos.
- [ ] Hoy muestra las Pendientes arriba y las Cumplidas hoy abajo, tachadas.
- [ ] Test: con el reloj fijado a las 23:59 y luego a las 00:01 hora de Buenos Aires, Hoy muestra la Ocurrencia de cada día, y no cambia a las 21:00 (medianoche UTC).
