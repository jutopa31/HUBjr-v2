## Tarea pendiente: simplificar header y formulario de eventos

- **Contexto**: `src/EventManagerSupabase.tsx` aún conserva el bloque de `SectionHeader` con toggles (vista semana/mes) y filtros de clases/tareas, además de un formulario extenso con selección de tipo de evento.
- **Objetivo**: reescribir el header y el formulario para una vista mensual fija y liviana.
  - Header: eliminar toggles/filtros, dejar solo acciones simples (ej. botón “Nuevo Evento” y eliminación masiva si aplica).
  - Formulario: conservar solo campos mínimos (Nombre, inicio, fin, recurrente con fecha de fin opcional), en un contenedor compacto.
  - Remover dependencia de `showClases`, `showTareas`, `viewMode` semanal y `type` del evento dentro del formulario.
- **Notas**: mantener el botón “+” en cada día de la vista mensual que llama a `handleQuickAddEvent`; asegurar que los cambios no reintroduzcan referencias a funciones eliminadas (`navigateDate`, filtros de clases).
