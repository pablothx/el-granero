# Gestor de issues: Markdown local

Las issues y specs de este repo viven como archivos markdown en `.scratch/`.

## Convenciones

- Un directorio por feature: `.scratch/<feature-slug>/`
- La spec es `.scratch/<feature-slug>/spec.md`
- Las issues de implementación son un archivo por ticket en `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numerados desde `01`; nunca un único archivo con todos los tickets
- El estado de triaje se registra con una línea `Status:` cerca del inicio de cada archivo de issue (ver `triage-labels.md` para los valores)
- Los comentarios y el historial de conversación se añaden al final del archivo bajo un encabezado `## Comments`

## Cuando una skill dice "publicar en el gestor de issues"

Crear un archivo nuevo en `.scratch/<feature-slug>/` (creando el directorio si hace falta).

## Cuando una skill dice "obtener el ticket correspondiente"

Leer el archivo en la ruta indicada. Normalmente el usuario pasará la ruta o el número de issue directamente.

## Operaciones de wayfinding

Las usa `/wayfinder`. El **mapa** es un archivo, con un archivo **hijo** por cada ticket.

- **Mapa**: `.scratch/<effort>/map.md` (con las secciones Notas / Decisiones hasta ahora / Niebla).
- **Ticket hijo**: `.scratch/<effort>/issues/NN-<slug>.md`, numerado desde `01`, con la pregunta en el cuerpo. Una línea `Type:` registra el tipo de ticket (`research`/`prototype`/`grilling`/`task`); una línea `Status:` registra `claimed`/`resolved`.
- **Bloqueos**: una línea `Blocked by: NN, NN` cerca del inicio. Un ticket queda desbloqueado cuando todos los archivos que lista están `resolved`.
- **Frontera**: recorrer `.scratch/<effort>/issues/` buscando archivos abiertos, desbloqueados y sin reclamar; gana el de número más bajo.
- **Reclamar**: poner `Status: claimed` y guardar antes de empezar cualquier trabajo.
- **Resolver**: añadir la respuesta bajo un encabezado `## Answer`, poner `Status: resolved` y luego añadir un puntero de contexto (resumen + enlace) en la sección Decisiones hasta ahora de `map.md`.
