# Academia - Plan de Rediseño e Implementación

## Estado del Proyecto: 🚧 EN PROGRESO
### Progreso General: 80%

---

## Resumen Ejecutivo
- ✅ Base de datos y RLS definidas en `database/academia_simplified_schema.sql` (pendiente ejecución manual en Supabase).
- ✅ Servicio `src/services/academiaService.ts` con timeout de 12s, CRUD completo y dedupe de temas.
- ✅ UI `src/AcademiaSimplified.tsx` con tabs Registro/Calendario, validaciones y control de ownership.
- ⚠️ Pendientes: ejecutar el schema en Supabase, probar flujo end-to-end con sesión válida y ajustar mensajes UX ante timeouts/duplicados.

---

## Objetivo
Rediseñar la sección Academia con un sistema simplificado donde los residentes se anotan para dar clases, manteniendo control de ownership vía RLS.

## Fases de Implementación

### ✅ Fase 0: Planificación (100%)
- [x] Clarificar requerimientos con usuario
- [x] Diseñar arquitectura de base de datos
- [x] Diseñar estructura de componentes
- [x] Crear plan detallado

### 🚧 Fase 1: Base de Datos (90%)
- [x] Crear `database/academia_simplified_schema.sql`
- [x] Tabla `class_topics` con RLS policies
- [x] Modificar tabla `academic_classes`
- [x] Insertar datos iniciales de temas
- [ ] ⚠️ PENDIENTE MANUAL: Ejecutar script en Supabase

### 🚧 Fase 2: Servicio (90%)
- [x] Crear `src/services/academiaService.ts`
- [x] fetchTopics()/addTopic() con dedupe por `topic_name`
- [x] fetchClasses()/addClass()/updateClass()/deleteClass()
- [x] Timeout protection (12 segundos) y orden por fecha/hora
- [ ] Ajustar mensajes de error UX-friendly (timeouts/duplicados)

### 🚧 Fase 3: Componente Principal (90%)
- [x] `src/AcademiaSimplified.tsx` con tabs Registro/Calendario
- [x] Tab Registro: dropdown de temas, alta rápida, fecha futura obligatoria, hora opcional, ownership y loading states
- [x] Tab Calendario: clases futuras/pasadas, formateo de fecha/hora, editar/eliminar solo propias
- [x] Modal agregar tema con validación y mensajes
- [ ] Revisar edge cases: timeouts, duplicados, validaciones adicionales

### 🚧 Fase 4: Integración (50%)
- [x] `src/AcademiaManager.tsx` usa el componente simplificado
- [ ] Probar flujo completo con BD configurada
- [ ] Verificar RLS policies end-to-end

---

## Detalles Técnicos

### Base de Datos
- Nueva tabla `class_topics` (UNIQUE `topic_name`, RLS: todos leen, autenticados insertan).
- `academic_classes` simplificada: `topic_id`, `topic_name`, `class_date`, `class_time`, `instructor_email`, `instructor_name`, `created_by`.
- Ownership/RLS: `created_by` debe almacenar `auth.uid()` (user.id) para `INSERT/UPDATE/DELETE`; `instructor_email` queda para mostrar contacto.

### Frontend
- **Componente:** tabs Registro/Calendario, usa `useAuth`.
- **Validaciones UI:** tema obligatorio, fecha futura, hora opcional, evita clases pasadas, feedback para duplicados/errores de red, control de ownership en edición/eliminación, loading states por acción.
- **Servicio:** timeout de 12s; `addTopic` devuelve error legible en duplicados; `addClass`/`updateClass`/`deleteClass` envían `created_by = user.id`; normalizar `class_time` a `HH:MM:SS`; `fetchTopics` ordena alfabéticamente; `fetchClasses` ordena por fecha y hora.

---

## Próximos Pasos
1. Ejecutar `database/academia_simplified_schema.sql` en Supabase (acción manual).
2. Probar Registro/Calendario con sesión válida; validar que solo el owner puede editar/eliminar.
3. Ajustar mensajes UX en servicio/UI para timeouts y duplicados.
4. Correr `npx tsc --noEmit` y `pm run lint -- --fix` tras aplicar cambios.
