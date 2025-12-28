# Resident Workflow Issues & Suggested Fixes

Context for agents to reproduce and iteratively improve daily workflows (neurology resident). App running at `http://localhost:3000` with valid session available.

## Interconsultas → Evolucionador
- **Issue:** Going from a row to Evolucionador requires `Responder` → `Continuar`, then the note template loads but all sections are plain text; user rewrites basics.
- **Repro:** Interconsultas tab → click `Responder` on any row → `Continuar`.
- **Impact:** ~30–45 s extra per case.
- **Suggestions (ordered):**
  1. Skip modal or add “Ir al Evolucionador” 1-click from the row.
  2. Pre-fill structured sections (motivo, antecedentes, EF, plan) with placeholders so user edits instead of rewriting.

## Guardar paciente modal
- **Issue:** Modal opens empty (nombre/DNI/edad) even when data comes from interconsulta; save button disabled until manual entry.
- **Repro:** In Evolucionador, click `Guardar paciente` after preloaded interconsulta; note modal shows “Datos extraídos automáticamente: none”.
- **Impact:** +1–2 min; higher typo risk.
- **Suggestions:**
  1. Autocomplete with interconsulta data (nombre, DNI, cama, contexto hospitalario).
  2. Allow “guardar rápido” with minimal fields (e.g., DNI + notas) and mark incomplete fields to fill later.
  3. Persist interconsulta link to Pase for traceability.

## Escalas (NIHSS and others)
- **Issue:** NIHSS opens with all radios at 0; any non-normal case needs 15+ clicks. No presets or autofill from notes/EF.
- **Repro:** Evolucionador → `Mostrar escalas` → open NIHSS.
- **Impact:** +3–5 min per ACV; fatigue in guardia.
- **Suggestions:**
  1. Add presets: “todo normal”, “déficit izquierdo”, “déficit derecho”.
  2. Pre-suggest scores from existing exam text when present; highlight for confirmation.
  3. Keep total updated live and insert a summarized line into notas.

## Pase de Sala handoff
- **Issue:** No single action to push the just-saved evolución into Pase; requires re-entry.
- **Repro:** Save in Evolucionador → must navigate to Pase and add manually.
- **Impact:** +2–3 min/patient; risk of mismatch.
- **Suggestions:**
  1. Post-save dialog “Enviar al Pase ahora” that copies notas, estado final, contexto, and links interconsulta ID.
  2. In Pase, show badge “Desde interconsulta” with a link back to respuesta.

## Login/latency
- **Issue:** “Verificando autenticación…” spinner stays ~10–15 s; after login you’re sent to dashboard, losing the intended tab.
- **Repro:** Login from any protected tab; observe delay and redirect.
- **Impact:** ~30 s plus extra navigation.
- **Suggestions:**
  1. Preserve target route and return there after login.
  2. Investigate Supabase session check; show real progress indicator or cache session earlier.

## Insertar examen físico (clarification)
- **Behavior:** The “Insertar examen físico normal” works but inserts text a few lines below the cursor due to leading newlines; content may fall out of immediate view.
- **Suggestion:** Trim leading newlines or scroll to the insertion point so the user sees it immediately.

## Quick win checklist
1. Autocomplete save modal from interconsulta data.
2. Add “Enviar al Pase” post-save flow with status update.
3. Presets for NIHSS (normal/hemiparesia izq/der) + live total.
4. Remove extra modal hop in Interconsultas (direct-to-evolucionador).
5. Trim/scroll after inserting examen físico.
## Progress 2025-12-14
- Save modal now pulls nombre/DNI/edad/contexto desde interconsulta cuando existe y permite guardar si el DNI viene de cualquiera de las fuentes (cubre quick win #1).
- NIHSS aplica el preset sugerido auto al abrir cuando las notas indican normal/izq/der y no hay selecciones previas (quick win #3).
- Boton "Responder en Evolucionador" en InterconsultaDetail ahora va directo sin modal de confirmacion (quick win #4).
- Pase de sala: boton de "Agregar Paciente" crea registro vacio y abre edicion inmediata, reduciendo pasos para capturar datos rapidos.
