# 09: Listas de compras

**What to build:** Cualquier Miembro abre las Listas Súper o Generales, anota Ítems como texto libre, los edita, los borra y los tilda cuando los compra. Un Ítem Comprado queda tachado al fondo y desaparece a las 24 h. Al anotar, la app avisa si ya hay un Ítem parecido sin comprar. Lo que anota otro Miembro aparece en unos 15 segundos sin recargar.

Ver la spec, secciones Modelo de datos, Reglas y Cliente.

**Blocked by:** 02 (Configuración inicial y entrar con PIN)

**Status:** ready-for-agent

- [ ] Dos Listas fijas (Súper y Generales), como un campo del Ítem, sin tabla de listas.
- [ ] Cualquier Miembro (Adulto o Chico) puede anotar, editar el texto, borrar, tildar y destildar cualquier Ítem.
- [ ] Cada Ítem guarda quién lo anotó y cuándo; al tildarlo, quién lo compró y cuándo.
- [ ] Orden: sin comprar con el más nuevo arriba; Comprados abajo, tachados.
- [ ] Los Comprados hace más de 24 h no se devuelven, y el Cron diario los borra.
- [ ] Al escribir, la app avisa si hay un Ítem sin comprar parecido en esa Lista (sin distinguir mayúsculas ni tildes), pero deja anotarlo igual.
- [ ] La Lista se actualiza al volver a la app y cada ~15 s mientras está abierta.
- [ ] Tests del Worker cubren el ciclo de vida del Ítem, el orden y las 24 h con el reloj avanzado; test de componente para el aviso de repetidos.
