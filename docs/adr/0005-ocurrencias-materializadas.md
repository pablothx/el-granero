# Las Ocurrencias se guardan como filas, creadas por un Cron

Cada Ocurrencia es una fila en D1, con clave única (Tarea, inicio del Período) y el Miembro al que estaba asignada. Un Cron Trigger del Worker crea las Pendientes del nuevo Período a las 00:05 hora de la Familia, y abrir Hoy o la Vista Familia vuelve a asegurarlas de forma idempotente por si el Cron falló. No cumplida no se guarda: es una Ocurrencia Pendiente cuyo Período ya terminó.

Se descartó calcular las Ocurrencias al vuelo a partir de la Tarea, porque cambiar la frecuencia, reasignar o archivar reescribiría el historial. El Cron hace falta para que un día en que nadie abre la app igual cuente como No cumplida.
