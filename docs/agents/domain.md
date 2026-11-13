# Documentación de dominio

Cómo deben usar las skills de ingeniería la documentación de dominio de este repo al explorar el código.

## Antes de explorar, leer esto

- **`CONTEXT.md`** en la raíz del repo, o
- **`CONTEXT-MAP.md`** en la raíz del repo si existe: apunta a un `CONTEXT.md` por contexto. Leer cada uno que sea relevante para el tema.
- **`docs/adr/`**: leer los ADR que afecten al área en la que se va a trabajar. En repos multicontexto, revisar también `src/<context>/docs/adr/` para decisiones propias de cada contexto.

Si alguno de estos archivos no existe, **seguir sin decir nada**. No señalar su ausencia ni proponer crearlos de antemano. La skill `/domain-modeling` (a la que se llega mediante `/grill-with-docs` y `/improve-codebase-architecture`) los crea cuando realmente se resuelven términos o decisiones.

## Estructura de archivos

Repo de contexto único (la mayoría):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Repo multicontexto (hay un `CONTEXT-MAP.md` en la raíz):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← decisiones de todo el sistema
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← decisiones del contexto
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Usar el vocabulario del glosario

Cuando el resultado nombre un concepto de dominio (en el título de una issue, una propuesta de refactor, una hipótesis, el nombre de un test), usar el término tal como está definido en `CONTEXT.md`. No derivar hacia sinónimos que el glosario evita explícitamente.

Si el concepto que se necesita aún no está en el glosario, es una señal: o se está inventando lenguaje que el proyecto no usa (reconsiderar), o hay un hueco real (anotarlo para `/domain-modeling`).

## Señalar conflictos con ADR

Si el resultado contradice un ADR existente, decirlo explícitamente en lugar de ignorarlo en silencio:

> _Contradice el ADR-0007 (pedidos con event sourcing), pero merece reabrirse porque…_
