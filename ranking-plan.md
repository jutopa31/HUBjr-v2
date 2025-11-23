# Ranking — Plan de Diseño Técnico, Producto y UX

> Sección nueva para motivar y visibilizar la participación académica de los residentes con temas semanales y mensuales, puntajes claros y rankings justos. Plan de alto nivel; no incluye implementación.

## Tabla de contenidos
- 1. Introducción y contexto del proyecto
- 2. Objetivos de la sección “Ranking”
- 3. Roles y permisos
- 4. Historias de usuario clave
- 5. Propuesta de UX/UI (flujos + pantallas)
- 6. Modelo conceptual de datos
- 7. Sistema de puntajes y reglas
- 8. Roadmap por fases (implementación incremental)
- 9. Consideraciones de motivación (gamificación)
- Apéndices: Análisis del código existente, Flujo de trabajo, Seguridad/Privacidad, Abiertos para aprobación

## Principios de diseño (guía maestra)
- Motivación y claridad ante todo: reglas simples, feedback inmediato y metas visibles.
- Simplicidad operativa para Jefatura: publicar temas, validar aportes y cerrar rankings en pocos pasos.
- Incremental y seguro: empezar con MVP útil y robusto, ampliar luego sin romper datos ni UX.
- Justicia y ética: segmentación por nivel, anti-gaming, sin PHI ni outcomes como métrica de competencia.

## 1. Introducción y contexto del proyecto
- Proyecto: Hub de Residencia de Neurología con módulos clínicos (pase de sala, interconsultas, pacientes) y educativos (clases, objetivos, evaluaciones).
- Stack: Next.js (pages) + React/TypeScript, Tailwind CSS, Supabase (Auth + Postgres + RLS + RPC). Hooks y context propios para estado.
- Oportunidad: consolidar un espacio “Ranking” para organizar desafíos semanales/mensuales, incentivar aportes (artículos, clases, revisiones) y dar retroalimentación motivadora sin exponer PHI.

## 2. Objetivos de la sección “Ranking”
- Motivar: aumentar participación académica con metas semanales/mensuales y reconocimiento visible.
- Claridad y justicia: reglas públicas, segmentación por nivel (R1–R5/fellow), anti‑gaming, privacidad.
- Operabilidad: que el Jefe publique temas, valide aportes y publique rankings con mínimo fricción.
- Escalabilidad: agregación y ranking en SQL (RPC/Views), snapshots históricos, UI paginada.

## 3. Roles y permisos (Jefe de Residentes, Residentes)
- Jefe de Residentes
  - Crear/editar/publicar/cerrar temas (semanal y mensual) por hospital/contexto.
  - Subir/asignar materiales (PDFs, links, slides) y dirigir a niveles específicos.
  - Revisar/validar participaciones, asignar calidad y puntos; aplicar ajustes justificados (ledger).
  - Ver ranking semanal/mensual, estadísticas básicas y publicar snapshots.
  - Configurar reglas/pesos/horarios (fechas de corte, bonos) del módulo.
- Residentes
  - Ver temas activos (semanal y mensual), reglas y materiales.
  - Enviar participaciones (artículo, clase, revisión) con links/adjuntos.
  - Consultar puntaje semanal/mensual, posición y su historial; recibir feedback motivador.
- Autorización técnica
  - Cliente: `AuthProvider` (src/components/auth/AuthProvider.tsx) + `useAuth` (src/hooks/useAuth.ts). Privilegios existentes (`AdminPrivilegeType`) reutilizables/extendibles.
  - Servidor/DB: RLS en tablas por usuario; RPC con SECURITY DEFINER para agregados y validaciones.

## 4. Historias de usuario clave (para jefe y residentes)
- Jefe: “Como Jefe, quiero crear un tema semanal con materiales y publicarlo para que los residentes sepan qué estudiar y cómo participar”.
- Jefe: “Como Jefe, quiero validar las participaciones, asignar calidad y puntos para mantener criterios consistentes y justos”.
- Jefe: “Como Jefe, quiero ver el ranking y estadísticas básicas para reconocer aportes y ajustar reglas si es necesario”.
- Residente: “Como Residente, quiero ver el tema semanal y las reglas para entender cómo sumar puntos”.
- Residente: “Como Residente, quiero cargar mi aporte y recibir feedback inmediato (puntos sugeridos/estado)”.
- Residente: “Como Residente, quiero ver mi puntaje y posición (semana/mes) y mi historial para medir mi progreso”.

## 5. Propuesta de UX/UI (flujos + estructura de pantallas)
- Ubicación natural en UI
  - Nueva pestaña “Ranking” en el hub principal (`src/neurology_residency_hub.tsx`, array `menuItems`). Alternativa futura: ruta `pages/ranking`.
- Estructura de la vista “Ranking”
  1) Banner de temas: muestra tema semanal y mensual con objetivos, materiales destacados y CTA “Participar”.
  2) Leaderboard: podio Top‑3 y tabla ordenable/paginable con filtros (periodo, nivel, hospital) y búsqueda.
  3) Mi posición: panel o modal con puntaje personal, progreso (semanal/mensual) y próximos hitos.
  4) Panel del Jefe: solo para privilegiados; bandeja de validación, configuración de reglas/horarios y publicación de snapshots.
- Flujos UX
  - Jefe: Lista de temas → Editor semanal/mensual → Materiales → Bandeja de validación → Ranking/Estadísticas → Publicar snapshot.
  - Residente: Ranking → Ver temas/reglas → Formulario de participación → Feedback inmediato → Ver progreso/posición.
- Componentes principales (concepto, sin implementar)
  - ThemesBanner, FiltersBar, Podium, LeaderboardTable, MyPosition, ContributionForm, ParticipationQueue, ValidationPanel, StatsCards, ScoreRulesDialog.
- Elementos motivadores
  - Feedback: toasts “+X puntos (en revisión)” y “+Y puntos validados; subiste N posiciones”.
  - Progreso: barras semanales/mensuales, medallas por hitos (streaks, cantidad de aportes, horas de docencia).
  - Claridad: tooltips con reglas, fechas de corte y desempates.
  - Accesibilidad: tabla semántica, foco visible, contraste en dark/light, navegación por teclado.

## 6. Modelo conceptual de datos (entidades y relaciones)
- Theme (weekly_themes, monthly_themes)
  - Campos: id, scope ('weekly'|'monthly'), week_start/week_end o month (YYYY‑MM), hospital_context, title, description, learning_goals[], status (draft/published/closed), created_by, published_at.
- ThemeMaterial (theme_materials)
  - Campos: id, theme_scope, theme_id, type ('article'|'pdf'|'link'|'slides'|'guideline'), title, url/storage_path, assigned_by, assigned_to_level?, created_at.
- Participation (participations)
  - Campos: id, user_id, theme_scope, theme_id, kind ('article'|'class'|'review'), title, description, link/storage_path, submitted_at, status ('submitted'|'validated'|'rejected'), validated_by, validated_at, quality_level, suggested_points, awarded_points.
- PointsLedger (points_ledger, inmutable)
  - Campos: id, user_id, theme_scope, theme_id, participation_id, points, reason ('base'|'quality_bonus'|'weekly_bonus'|'monthly_bonus'|'manual_adjustment'), awarded_by, awarded_at, metadata jsonb.
- ScoringRule (scoring_rules)
  - Campos: id, hospital_context, kind, base_points, quality_modifiers {basic,standard,advanced,outstanding}, weekly_bonus, monthly_bonus, active_from, active_to.
- Settings & Snapshots
  - ranking_settings (pesos, caps, horarios de corte) y rankings_snapshots (históricos firmados por Jefe).
- Relaciones
  - Theme 1—N ThemeMaterial y 1—N Participation; Participation 1—N PointsLedger; ScoringRule aplica por contexto/kind y vigencia.

## 7. Sistema de puntajes y reglas de ranking
- Puntos base (v1 sugerido)
  - Artículo comentado: 8 pts
  - Clase: 12 pts
  - Revisión de tema: 15 pts
- Calidad (quality_level)
  - basic: +0; standard: +2; advanced: +4; outstanding: +6
- Bonificaciones
  - Puntualidad (≤48h de iniciado el periodo semanal): +2 pts
  - Consistencia mensual (≥1 aporte por semana del mes): +5 pts al cierre
- Caps/anti‑gaming
  - Máximo 2 aportes por semana suman 100%; desde el 3º aporta 50%.
  - Duplicados/plagio: 0 pts y flag; requieren revisión.
- Ranking
  - Semanal: suma de puntos validados del tema semanal.
  - Mensual: acumulado del mes + bonos de consistencia.
- Desempates
  - Orden por: puntos → nº de aportes validados → calidad media → nombre asc.

## 8. Roadmap de implementación por fases
- Fase 1 — Infraestructura de datos
  - Tablas: themes/materials/participations/points_ledger/scoring_rules/settings/snapshots.
  - RPC mínimos: submit_participation, validate_participation, get_weekly_ranking, get_monthly_ranking.
  - Entrada UI: pestaña “Ranking” placeholder (sin lógica).
- Fase 2 — UI mínima del Jefe
  - Crear/publicar temas semanal/mensual y gestionar materiales.
  - Bandeja de participaciones (listar/filtrar) y validación básica.
- Fase 3 — UI mínima de Residentes
  - Ver temas y reglas; cargar participaciones con adjuntos/links; ver estado.
- Fase 4 — Cálculo de puntos y ranking
  - Ledger, rankings semanal/mensual, “Mi posición”, snapshots de cierre.
- Fase 5 — UX y gamificación
  - Badges, barras de progreso, toasts motivadores, caps anti‑gaming, reporting básico; ajustes por feedback.
- Dependencias
  - F2 y F3 dependen de F1; F4 depende de F2–F3; optimizaciones (MV) pueden quedar post‑F4 según volumen.

### Criterios de aceptación por fase (implementación incremental)
- Fase 1 (Infra de datos)
  - Se pueden crear temas (draft/published) y registrar participaciones (submitted).
  - Existe ledger de puntos y RPC para ranking semanal/mensual (retorna agregados, aunque vacíos).
  - Pestaña “Ranking” aparece en el hub con estado placeholder.
- Fase 2 (Jefatura mínima)
  - Jefe publica/edita/cierra temas y adjunta materiales.
  - Jefe valida participaciones (status→validated) y asigna calidad/puntos (ledger registra eventos).
  - Se listan participaciones con filtros básicos.
- Fase 3 (Residentes mínima)
  - Residente ve temas y reglas, envía participación y ve “en revisión”.
  - Puede consultar su acumulado semanal/mensual y un histórico básico.
- Fase 4 (Ranking operativo)
  - Leaderboard semanal y mensual visibles, con filtros por nivel y hospital.
  - “Mi posición” muestra progreso y desgloses; se generan snapshots al cierre.
- Fase 5 (Motivación y pulido)
  - Se muestran medallas/hitos, barras de progreso y toasts; caps anti‑gaming activos.
  - Reportes simples para Jefatura (participaciones por semana, tiempo medio de validación).

### Definiciones operativas (claridad para implementación)
- “Tema semanal”: conjunto curado de objetivos y materiales con fechas semana (lun–dom o configurado) que habilita aportes y puntajes.
- “Participación”: aporte de residente a un tema (artículo/clase/revisión) con estado de validación.
- “Puntos semanales vs mensuales”: los semanales pertenecen al tema actual; los mensuales son el acumulado de semanas del mes + bonos.
- “Cierre”: momento de corte configurable por hospital; a partir de allí se emite snapshot y se reinicia meta semanal/mensual.

## 9. Consideraciones para motivar a los residentes (gamificación, engagement)
- Feedback inmediato (toasts) y progreso visible (barras, metas claras).
- Reconocimientos: medallas por hitos y streaks; comunicación de cierres y podios.
- Claridad de reglas: pesos, caps y fechas de corte visibles con tooltips/FAQ.
- Justicia: segmentación por nivel, anonimización para no‑admins; validación de calidad.

---

# Análisis del código existente (resumen técnico)
- Autenticación/roles: `AuthProvider` + `useAuth` (Supabase). Privilegios (`AdminPrivilegeType`) consultados por RPC (has_admin_privilege) en `src/utils/diagnosticAssessmentDB.ts`.
- Navegación/layout: `pages/index.js` monta `src/neurology_residency_hub.tsx`, que define `menuItems` y `activeTab`; sidebar en `src/components/layout/Sidebar`.
- Datos educativos/usuarios: tablas `user_*` (procedures, patients, classes, goals, reviews) y `resident_profiles` con RLS (database/*.sql). LP con patrón de RPC/Views.
- Ubicación de “Ranking”: nueva pestaña en `src/neurology_residency_hub.tsx`; alternativo futuro `pages/ranking`.

---

# Flujo de trabajo esperado (alto nivel)
1) Jefe publica tema semanal/mensual con materiales → residentes participan.
2) Sistema registra participación (en revisión) y sugiere puntos → Jefe valida/ajusta → ledger.
3) Ranking semanal/mensual se actualiza con puntos validados → al cierre se genera snapshot.
4) Residentes ven “Mi posición”, progreso e historial; Jefe ve ranking y métricas básicas.

---

# Notas de seguridad y privacidad
- Sin PHI: sólo agregados por usuario; participaciones y materiales no incluyen identificadores de pacientes.
- RLS y RPC SECURITY DEFINER para validación/lectura de agregados; anonimización de terceros para no‑admins.

---

# Abiertos para aprobación
- Pesos/bonos por defecto y caps de anti‑gaming.
- Política de anonimización (no‑admin vs admin/jefatura) y visibilidad inter‑niveles.
- Semántica de cierres (semana lun‑dom) y hora de corte por hospital/contexto.
- Activación de MV (materialized views) según volumen/latencia.
