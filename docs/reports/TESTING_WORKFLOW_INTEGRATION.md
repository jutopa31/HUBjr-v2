# Testing Checklist: Workflow Integration
## Interconsultas → Evolucionador → Pase de Sala

**Date**: 2025-12-11
**Sprint**: 4 - Testing & Validation
**Dev Server**: http://localhost:3006

---

## Pre-Testing Setup

### ✅ Database Migrations

1. **Execute SQL Migrations**
   - [ ] Open Supabase Dashboard → SQL Editor
   - [ ] Copy contents of `database/workflow_integration_migrations.sql`
   - [ ] Paste and click "Run"
   - [ ] Verify success message: "✅ Workflow integration migrations completed successfully!"
   - [ ] Check verification queries output to confirm columns exist

2. **Verify Row Level Security (RLS)**
   - [ ] Check that existing RLS policies still apply
   - [ ] Ensure new columns are accessible by authenticated users

---

## Test Suite 1: Interconsultas - Filtro Automático del Día

**Objetivo**: Verificar que el filtro automático muestra solo interconsultas de hoy al cargar.

### Steps:
1. [ ] Abrir aplicación en http://localhost:3006
2. [ ] Iniciar sesión con credenciales válidas
3. [ ] Navegar al módulo **Interconsultas** (sidebar)
4. [ ] **VERIFICAR**: Badge "📅 Solo hoy" aparece en el header
5. [ ] **VERIFICAR**: Tabla muestra solo interconsultas con fecha de hoy
6. [ ] Cambiar filtro de fecha manualmente a "Última semana"
7. [ ] **VERIFICAR**: Badge desaparece
8. [ ] **VERIFICAR**: Aparecen interconsultas de fechas anteriores
9. [ ] Recargar página (F5)
10. [ ] **VERIFICAR**: Filtro vuelve automáticamente a "Solo hoy"

### Expected Result:
- ✅ Al cargar, solo se muestran interconsultas del día actual
- ✅ Badge visual indica filtro activo
- ✅ Filtro es modificable manualmente
- ✅ Al recargar, vuelve al filtro del día

---

## Test Suite 2: Interconsultas - Carga de Imágenes

**Objetivo**: Verificar funcionalidad de subida de imágenes en interconsultas existentes.

### Preparación:
- [ ] Tener al menos 1 interconsulta creada
- [ ] Preparar 2-3 imágenes de prueba (PNG/JPG)

### Steps:
1. [ ] Abrir modal detalle de una interconsulta (click en fila de tabla)
2. [ ] **VERIFICAR**: Sección "Imágenes y Estudios" aparece en el modal
3. [ ] **VERIFICAR**: Botones visibles: 📄 OCR, 🖼️ Subir
4. [ ] Click en botón "🖼️ Subir"
5. [ ] Seleccionar 1 imagen desde file picker
6. [ ] **VERIFICAR**: Loading state o spinner aparece
7. [ ] **VERIFICAR**: Imagen aparece en grid con thumbnail
8. [ ] **VERIFICAR**: Toast notification: "1 imagen(es) subida(s)"
9. [ ] Hover sobre imagen subida
10. [ ] **VERIFICAR**: Botón de eliminar (✕) aparece
11. [ ] Click en imagen
12. [ ] **VERIFICAR**: Imagen se abre en nueva pestaña (full size)
13. [ ] Cerrar pestaña, volver al modal
14. [ ] Subir 2 imágenes más (selección múltiple)
15. [ ] **VERIFICAR**: Grid muestra 3 imágenes total
16. [ ] Click en botón eliminar (✕) de la segunda imagen
17. [ ] **VERIFICAR**: Modal de confirmación "¿Eliminar esta imagen?"
18. [ ] Confirmar eliminación
19. [ ] **VERIFICAR**: Imagen se remueve del grid
20. [ ] **VERIFICAR**: Toast: "Imagen eliminada"
21. [ ] Cerrar modal y volver a abrirlo
22. [ ] **VERIFICAR**: Imágenes persisten (2 imágenes restantes)

### Expected Result:
- ✅ Upload de imágenes funciona correctamente
- ✅ Thumbnails se muestran en grid
- ✅ Eliminación funciona con confirmación
- ✅ Persistencia en base de datos correcta

---

## Test Suite 3: Interconsultas - OCR de Estudios

**Objetivo**: Verificar extracción de texto desde PDFs/imágenes.

### Preparación:
- [ ] Tener un PDF con texto o imagen con texto claro
- [ ] Interconsulta creada para testing

### Steps:
1. [ ] Abrir modal detalle de interconsulta
2. [ ] Click en botón "📄 OCR"
3. [ ] **VERIFICAR**: Modal de OCR aparece
4. [ ] Seleccionar archivo PDF o imagen con texto
5. [ ] **VERIFICAR**: Processing indicator aparece
6. [ ] Esperar procesamiento (puede tomar 5-15 segundos)
7. [ ] **VERIFICAR**: Texto extraído aparece en preview
8. [ ] **VERIFICAR**: Botón "Guardar" está habilitado
9. [ ] Click "Guardar"
10. [ ] **VERIFICAR**: Modal de OCR se cierra
11. [ ] **VERIFICAR**: Sección "Estudios (OCR)" aparece en modal principal
12. [ ] **VERIFICAR**: Texto extraído se muestra formateado
13. [ ] Repetir proceso con segunda imagen
14. [ ] **VERIFICAR**: Nuevo texto se appendea con separador "--- Nuevo estudio ---"
15. [ ] Cerrar y reabrir modal
16. [ ] **VERIFICAR**: Texto OCR persiste

### Expected Result:
- ✅ OCR extrae texto correctamente
- ✅ Múltiples estudios se acumulan con separadores
- ✅ Texto persiste en campo `estudios_ocr`

---

## Test Suite 4: Botón "Ir al Evolucionador"

**Objetivo**: Verificar navegación desde Interconsultas al Evolucionador.

### Preparación:
- [ ] Interconsulta con datos completos (nombre, DNI, cama, relato_consulta)
- [ ] Opcionalmente: con imágenes y estudios OCR

### Steps:
1. [ ] Abrir modal detalle de interconsulta
2. [ ] **VERIFICAR**: Botón "➡️ Ir al Evolucionador" aparece (gradient purple-blue)
3. [ ] Click en botón "Ir al Evolucionador"
4. [ ] **VERIFICAR**: Modal se cierra
5. [ ] **VERIFICAR**: Tab cambia automáticamente a "Evolucionador/Diagnostic"
6. [ ] **VERIFICAR**: Sidebar se cierra en mobile (si aplica)

### Expected Result:
- ✅ Navegación funciona correctamente
- ✅ Tab switch automático
- ✅ Modal se cierra apropiadamente

---

## Test Suite 5: Pre-carga de Template en Evolucionador

**Objetivo**: Verificar que datos de interconsulta se cargan automáticamente en template estructurado.

### Steps (continuación del Test Suite 4):
1. [ ] Al llegar al Evolucionador, **VERIFICAR**: Indicador azul aparece arriba
   - Texto: "📋 Evolucionando interconsulta:"
   - Muestra: nombre, DNI, cama
   - Botón "Desconectar" visible
2. [ ] **VERIFICAR**: Campo de notas clínicas contiene template pre-cargado con:
   ```
   PACIENTE: [nombre de la interconsulta]
   DNI: [dni]
   EDAD: [edad o "No especificada"]
   CAMA: [cama]

   MOTIVO DE CONSULTA:
   [relato_consulta]

   [ESTUDIOS COMPLEMENTARIOS si había OCR]

   ANTECEDENTES:


   EXAMEN FÍSICO:


   DIAGNÓSTICO:


   PLAN:


   ```
3. [ ] **VERIFICAR**: Toast notification aparece: "📋 Datos de interconsulta cargados: [nombre]"
4. [ ] Completar cada sección del template:
   - [ ] ANTECEDENTES: "HTA, DBT2"
   - [ ] EXAMEN FÍSICO: "TA 140/90, Glasgow 15/15"
   - [ ] DIAGNÓSTICO: "Cefalea tensional"
   - [ ] PLAN: "Paracetamol 1g c/8h, control en 48h"
5. [ ] **VERIFICAR**: Secciones se completan sin perder formato

### Expected Result:
- ✅ Template se carga automáticamente con datos correctos
- ✅ Indicador visual muestra conexión activa
- ✅ Formato estructurado se mantiene
- ✅ Todas las secciones son editables

---

## Test Suite 6: Guardar Evolución y Modal de Confirmación

**Objetivo**: Verificar modal de confirmación "¿Agregar a Pase de Sala?"

### Steps (continuación del Test Suite 5):
1. [ ] Con template completado, click en botón "Guardar Paciente"
2. [ ] Esperar guardado en base de datos
3. [ ] **VERIFICAR**: Modal "¿Agregar a Pase de Sala?" aparece con:
   - Título: "¿Agregar a Pase de Sala?"
   - Mensaje: "La evolución se guardó correctamente..."
   - Dropdown: "Estado final de la interconsulta"
   - Opciones: Resuelta, En Proceso, Pendiente, Cancelada
   - Botones: "No, solo actualizar interconsulta" y "Sí, agregar a Pase de Sala"
4. [ ] **VERIFICAR**: Dropdown tiene "Resuelta" seleccionado por defecto
5. [ ] Cambiar dropdown a "En Proceso"
6. [ ] **VERIFICAR**: Valor cambia correctamente
7. [ ] Volver a "Resuelta"

### Path A: Solo actualizar interconsulta (sin agregar a pase)
1. [ ] Click en "No, solo actualizar interconsulta"
2. [ ] **VERIFICAR**: Modal se cierra
3. [ ] **VERIFICAR**: Toast: "Interconsulta actualizada"
4. [ ] **VERIFICAR**: Indicador azul desaparece (interconsulta desconectada)
5. [ ] Navegar de vuelta a Interconsultas
6. [ ] Buscar la interconsulta modificada
7. [ ] **VERIFICAR**: Status cambió a "Resuelta"
8. [ ] Abrir modal detalle
9. [ ] **VERIFICAR**: Campo "Respuesta" contiene TODO el contenido del evolucionador (template completo)
10. [ ] Navegar a Pase de Sala
11. [ ] **VERIFICAR**: Paciente NO aparece en la lista

### Path B: Agregar a Pase de Sala
1. [ ] Repetir Test Suite 4-6 con NUEVA interconsulta
2. [ ] En modal de confirmación, mantener "Resuelta" seleccionado
3. [ ] Click en "Sí, agregar a Pase de Sala"
4. [ ] **VERIFICAR**: Loading state (opcional)
5. [ ] **VERIFICAR**: Toast: "✅ Paciente agregado al Pase de Sala exitosamente"
6. [ ] **VERIFICAR**: Modal se cierra
7. [ ] **VERIFICAR**: Indicador azul desaparece

### Expected Result - Path A:
- ✅ Interconsulta se actualiza con respuesta completa
- ✅ Status cambia según selección
- ✅ NO se crea en Pase de Sala

### Expected Result - Path B:
- ✅ Interconsulta se actualiza
- ✅ Paciente se crea en Pase de Sala
- ✅ Confirmación visual clara

---

## Test Suite 7: Verificación de Mapeo de Datos en Pase de Sala

**Objetivo**: Verificar que datos se mapean correctamente de Interconsulta + Evolucionador → Pase de Sala.

### Steps (continuación del Test Suite 6 Path B):
1. [ ] Navegar al módulo "Pase de Sala / Ward Rounds"
2. [ ] **VERIFICAR**: Nuevo paciente aparece en la lista (al final)
3. [ ] Abrir card o modal detalle del paciente
4. [ ] **VERIFICAR mapeo de campos**:
   - [ ] **Nombre**: Coincide con interconsulta
   - [ ] **DNI**: Coincide con interconsulta
   - [ ] **Edad**: Coincide con interconsulta (o valor del evolucionador)
   - [ ] **Cama**: Coincide con interconsulta
   - [ ] **Fecha**: Fecha actual (hoy)
   - [ ] **Motivo de consulta**: Contenido de sección MOTIVO DE CONSULTA (o relato_consulta original)
   - [ ] **Estudios**: Texto OCR de interconsulta (si había)
   - [ ] **Antecedentes**: Sección ANTECEDENTES del evolucionador
   - [ ] **Examen físico**: Sección EXAMEN FÍSICO del evolucionador
   - [ ] **Diagnóstico**: Sección DIAGNÓSTICO del evolucionador
   - [ ] **Plan**: Sección PLAN del evolucionador
   - [ ] **Imágenes**: Arrays copiados desde interconsulta
   - [ ] **Hospital context**: "Posadas" (o contexto activo)
   - [ ] **Severidad**: "II" (default moderado)

5. [ ] Editar uno de los campos (ej: cambiar diagnóstico)
6. [ ] Guardar cambios
7. [ ] **VERIFICAR**: Edición funciona normalmente
8. [ ] **VERIFICAR**: Paciente es totalmente independiente de la interconsulta original

### Expected Result:
- ✅ Todos los campos se mapean correctamente
- ✅ Secciones estructuradas se extraen bien
- ✅ Imágenes se copian
- ✅ Paciente es totalmente editable en Pase de Sala

---

## Test Suite 8: Edge Cases y Validaciones

### Test 8.1: Interconsulta sin relato_consulta
1. [ ] Crear interconsulta sin relato (solo datos básicos)
2. [ ] "Ir al Evolucionador"
3. [ ] **VERIFICAR**: Template se carga sin sección MOTIVO DE CONSULTA
4. [ ] Guardar y agregar a Pase
5. [ ] **VERIFICAR**: No hay errores, campo queda vacío

### Test 8.2: Interconsulta sin imágenes ni OCR
1. [ ] Crear interconsulta limpia (sin imágenes)
2. [ ] Flujo completo → Pase de Sala
3. [ ] **VERIFICAR**: Arrays de imágenes están vacíos pero funcionales
4. [ ] **VERIFICAR**: Campo estudios está vacío

### Test 8.3: Duplicado de DNI en Pase de Sala
1. [ ] Completar flujo con interconsulta
2. [ ] Agregar a Pase de Sala (success)
3. [ ] Repetir con OTRA interconsulta pero MISMO DNI
4. [ ] Intentar agregar a Pase
5. [ ] **VERIFICAR**: Error aparece: "Ya existe un paciente con DNI..."
6. [ ] **VERIFICAR**: No se crea duplicado

### Test 8.4: Desconectar interconsulta activa
1. [ ] Cargar interconsulta en Evolucionador
2. [ ] NO completar template
3. [ ] Click en botón "Desconectar" del indicador azul
4. [ ] **VERIFICAR**: Confirmación: "¿Descartar conexión con interconsulta?"
5. [ ] Confirmar
6. [ ] **VERIFICAR**: Indicador desaparece
7. [ ] **VERIFICAR**: Notas clínicas se mantienen (no se borran)

### Test 8.5: Texto sin secciones estructuradas
1. [ ] Cargar interconsulta en Evolucionador
2. [ ] Borrar todo el template y escribir texto libre (sin headers de secciones)
3. [ ] Guardar y agregar a Pase
4. [ ] **VERIFICAR**: No crashea
5. [ ] Verificar en Pase de Sala que campos estructurados están vacíos (regex no match)

### Test 8.6: Hospital Context
1. [ ] Si usuario tiene privilegios, cambiar contexto a "Julian"
2. [ ] Crear interconsulta en contexto Julian
3. [ ] Flujo completo → Pase
4. [ ] **VERIFICAR**: Paciente se crea con `hospital_context = "Julian"`
5. [ ] Cambiar contexto a Posadas
6. [ ] **VERIFICAR**: Paciente NO aparece en lista de Pase de Sala

---

## Test Suite 9: Performance y UX

### Test 9.1: Tiempos de carga
1. [ ] Medir tiempo de carga de template en Evolucionador (< 1 segundo)
2. [ ] Medir tiempo de guardado de evolución (< 3 segundos)
3. [ ] Medir tiempo de creación en Pase de Sala (< 5 segundos)
4. [ ] **VERIFICAR**: No hay delays perceptibles

### Test 9.2: Feedback visual
1. [ ] Verificar que TODOS los procesos async tienen loading states
2. [ ] Verificar que TODOS los resultados muestran toast notifications
3. [ ] Verificar colores consistentes (success = green, error = red, info = blue)

### Test 9.3: Responsive design
1. [ ] Probar flujo completo en mobile (< 768px)
2. [ ] **VERIFICAR**: Modal de confirmación se adapta bien
3. [ ] **VERIFICAR**: Grid de imágenes funciona en mobile
4. [ ] **VERIFICAR**: Template es editable en mobile

---

## Test Suite 10: Dark Mode

1. [ ] Cambiar a dark theme
2. [ ] Repetir Test Suites 4-6 completos
3. [ ] **VERIFICAR**: Todos los modales tienen estilos dark correctos
4. [ ] **VERIFICAR**: Indicador azul se ve bien en dark mode
5. [ ] **VERIFICAR**: Texto es legible en todos los estados

---

## Post-Testing Cleanup

### Verificación final en Base de Datos
1. [ ] Abrir Supabase Table Editor
2. [ ] Verificar tabla `interconsultas`:
   - [ ] Status actualizado correctamente
   - [ ] Respuesta contiene texto del evolucionador
   - [ ] Arrays de imágenes poblados
3. [ ] Verificar tabla `diagnostic_assessments`:
   - [ ] `source_interconsulta_id` tiene UUID correcto
   - [ ] `response_sent` = true (si se agregó a pase)
4. [ ] Verificar tabla `ward_round_patients`:
   - [ ] Nuevos pacientes existen
   - [ ] Campos mapeados correctamente
   - [ ] Sin duplicados

### Limpieza de datos de testing
1. [ ] Borrar pacientes de prueba en Pase de Sala
2. [ ] Borrar interconsultas de prueba
3. [ ] Borrar imágenes de prueba en Supabase Storage (opcional)

---

## Summary Checklist

- [ ] **Database migrations ejecutadas exitosamente**
- [ ] **Filtro automático del día funciona**
- [ ] **Carga de imágenes funciona**
- [ ] **OCR extrae texto correctamente**
- [ ] **Navegación Interconsultas → Evolucionador funciona**
- [ ] **Pre-carga de template funciona**
- [ ] **Modal de confirmación aparece y funciona**
- [ ] **Path A (solo actualizar) funciona**
- [ ] **Path B (agregar a pase) funciona**
- [ ] **Mapeo de datos es correcto**
- [ ] **Edge cases manejados sin crashes**
- [ ] **Performance aceptable (< 5s operaciones críticas)**
- [ ] **UX/Feedback visual adecuado**
- [ ] **Dark mode funciona correctamente**
- [ ] **Verificación en BD correcta**

---

## Bugs Found

| # | Description | Severity | Status | Notes |
|---|-------------|----------|--------|-------|
| 1 |             |          |        |       |
| 2 |             |          |        |       |
| 3 |             |          |        |       |

---

## Known Limitations

1. Template estructurado usa regex - puede fallar si usuario modifica headers
2. OCR accuracy depende de calidad de imagen/PDF
3. No hay sincronización bidireccional (cambios en Pase no actualizan Interconsulta)
4. Cámara web no implementada aún en Interconsultas modal

---

## Next Steps (If All Tests Pass)

1. [ ] Deploy to production
2. [ ] Monitor error logs for 48 hours
3. [ ] Gather user feedback
4. [ ] Plan Sprint 5 (refinements and polish)

---

**Testing completed by**: _______________
**Date**: _______________
**Overall result**: ⬜ PASS / ⬜ FAIL
**Notes**:
