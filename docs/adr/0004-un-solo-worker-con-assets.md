# Un solo Worker sirve el front y la API

El build de Vite y la API se despliegan juntos en un único Cloudflare Worker con archivos estáticos (`@cloudflare/vite-plugin`), en lugar de Cloudflare Pages + Functions como se planteó al principio. Cloudflare recomienda Workers para proyectos nuevos, deja un solo deploy y una sola configuración, y permite correr front, API y D1 local juntos con `vite dev`. Todo sigue dentro del free tier.
