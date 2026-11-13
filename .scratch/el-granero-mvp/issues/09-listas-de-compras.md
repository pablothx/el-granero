# 09: Listas de compras

**What to build:** Cualquier Miembro abre las Listas Súper o Generales, anota Ítems como texto libre, los edita, los borra y los tilda cuando los compra. Un Ítem Comprado queda tachado al fondo y desaparece a las 24 h. Al anotar, la app avisa si ya hay un Ítem parecido sin comprar. Lo que anota otro Miembro aparece en unos 15 segundos sin recargar.

Ver la spec, secciones Modelo de datos, Reglas y Cliente.

**Blocked by:** 02 (Configuración inicial y entrar con PIN)

**Status:** ready-for-agent

- [x] Dos Listas fijas (Súper y Generales), como un campo del Ítem, sin tabla de listas.
- [x] Cualquier Miembro (Adulto o Chico) puede anotar, editar el texto, borrar, tildar y destildar cualquier Ítem.
- [x] Cada Ítem guarda quién lo anotó y cuándo; al tildarlo, quién lo compró y cuándo.
- [x] Orden: sin comprar con el más nuevo arriba; Comprados abajo, tachados.
- [x] Los Comprados hace más de 24 h no se devuelven, y el Cron diario los borra.
- [x] Al escribir, la app avisa si hay un Ítem sin comprar parecido en esa Lista (sin distinguir mayúsculas ni tildes), pero deja anotarlo igual.
- [x] La Lista se actualiza al volver a la app y cada ~15 s mientras está abierta.
- [x] Tests del Worker cubren el ciclo de vida del Ítem, el orden y las 24 h con el reloj avanzado; test de componente para el aviso de repetidos.

## Comments

**2026-11-13, implementación:** verificado con tests del Worker (ciclo de vida, orden, 24 h con el reloj avanzado y borrado del Cron, permisos), tests puros de parecidos y un test de componente del aviso de repetidos (nuevo proyecto 'cliente' de Vitest con jsdom). En el navegador: anotar, aviso 'Ya está: Azúcar', comprar, editar, borrar, y un Ítem insertado desde otro lado apareció solo a los 14 s.
