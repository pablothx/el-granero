# La PWA se actualiza sola y la API acepta el front anterior

`vite-plugin-pwa` va en modo `autoUpdate`: la versión nueva se descarga en segundo plano y se activa al volver a abrir la app, sin preguntarle al usuario, porque un aviso de "Actualizar" no lo toca nadie, y menos un chico. A cambio, durante un tiempo convive el front anterior con la API nueva, así que cada cambio de API tiene que seguir aceptando las requests de la versión anterior del front (agregar campos y endpoints sí; quitar o renombrar, en dos pasos).
