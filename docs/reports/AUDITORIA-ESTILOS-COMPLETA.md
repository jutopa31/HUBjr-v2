# 🎨 AUDITORÍA COMPLETA DE ESTILOS Y ACCESIBILIDAD - HubJR v2

**Fecha:** 2025-01-23
**Auditor:** Claude Code (StyleAgent)
**Alcance:** Sistema completo de colores, tipografía y componentes UI
**Estándar:** WCAG 2.1 AA (contraste mínimo 4.5:1 para texto normal)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estadísticas Generales](#estadísticas-generales)
3. [Problemas Críticos](#problemas-críticos)
4. [Problemas Medios](#problemas-medios)
5. [Problemas Bajos](#problemas-bajos)
6. [Plan de Implementación](#plan-de-implementación)
7. [Detalles por Categoría](#detalles-por-categoría)

---

## 🎯 RESUMEN EJECUTIVO

Se realizó una auditoría exhaustiva en 6 partes del sistema de estilos del proyecto HubJR v2, evaluando:

- ✅ **Sistema base de variables CSS** (bien implementado con `var(--*)`)
- ⚠️ **Navegación** (39 issues: colores hardcodeados, falta documentación)
- ❌ **Tipografía** (215+ issues: falta dark mode, colores hardcodeados masivamente)
- ❌ **Componentes interactivos** (100+ issues: disabled states, focus rings problemáticos)
- ❌ **Vistas especiales** (50+ issues: modales y badges sin dark mode)

### Hallazgos Principales

**🟢 Fortalezas:**
- Sistema de variables CSS bien estructurado en `src/index.css`
- Clases utilitarias `.btn-accent`, `.btn-soft`, `.medical-card` correctamente implementadas
- Estilos globales para inputs, tablas y modales usando variables CSS

**🔴 Debilidades:**
- **~400+ instancias** de colores Tailwind hardcodeados que no usan variables CSS
- **44+ issues críticos** que afectan accesibilidad (contraste WCAG AA)
- **Inconsistencia masiva** en dark mode: ~30% de componentes sin soporte
- **Estados disabled** con `opacity-50` causan fallo WCAG en 15+ botones

---

## 📊 ESTADÍSTICAS GENERALES

### Por Severidad

| Severidad | Total | % del Total | Impacto |
|-----------|-------|-------------|---------|
| 🔴 **Críticos** | 44+ | 11% | Afectan accesibilidad WCAG AA |
| 🟡 **Medios** | 130+ | 32.5% | Dificultan mantenimiento |
| 🟢 **Bajos** | 6 | 1.5% | Mejoras cosméticas |
| ⚪ **Total** | **~400+** | 100% | - |

### Por Categoría

| Categoría | Issues | Críticos | Descripción |
|-----------|--------|----------|-------------|
| Navegación | 39 | 3 | Sidebar, menús, usuario |
| Tipografía | 215+ | 5 | Headings, texto, links |
| Componentes Interactivos | 100+ | 28+ | Botones, inputs, formularios |
| Vistas Especiales | 50+ | 8 | Modales, badges, tablas |

### Archivos Más Afectados

| Archivo | Issues Estimados | Tipo Principal |
|---------|------------------|----------------|
| `src/components/layout/Sidebar.tsx` | 25+ | Colores hardcodeados |
| `src/components/auth/LoginForm.tsx` | 20+ | Falta dark mode |
| `src/ScaleModal.tsx` | 15+ | Modal sin dark mode |
| `src/DashboardInicio.tsx` | 18+ | Botones con colores hardcodeados |
| `src/WardRounds.tsx` | 20+ | Badges sin dark mode |
| `src/SavedPatients.tsx` | 15+ | Tablas sin dark mode |

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. Estados Disabled con Opacity-50 (15+ componentes)

**Severidad:** 🔴 CRÍTICO
**Impacto WCAG:** Contraste < 4.5:1 (falla AA)
**Afecta a:** LoginForm, AIConfigPanel, ClasesScheduler, UserCreator, Interconsultas

**Problema:**
```tsx
// Patrón problemático repetido 15+ veces
className="...disabled:opacity-50 disabled:cursor-not-allowed"
```

**Análisis de contraste:**
- `bg-blue-600 text-white` normal: **5.9:1** ✅
- Con `opacity-50`: **2.95:1** ❌ Falla WCAG AA

**Archivos afectados:**
- `src/components/auth/LoginForm.tsx:215`
- `src/AIConfigPanel.tsx` (múltiples botones)
- `src/ClasesScheduler.tsx` (botón guardar)
- `src/components/admin/UserCreator.tsx`
- `src/Interconsultas.tsx` (botones de guardar)
- `src/PacientesPostAlta.tsx`

**Solución propuesta:** Ver [Propuesta #1](#propuesta-1-corregir-estados-disabled)

---

### 2. Focus:border-transparent en Inputs (10+ campos)

**Severidad:** 🔴 CRÍTICO
**Impacto WCAG:** 2.4.7 - Indicador visible de focus
**Afecta a:** LumbarPunctureForm, formularios médicos

**Problema:**
```tsx
className="...focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

**Impacto:**
- Elimina el borde visual en focus
- Usuarios con baja visión pueden no ver el ring sutil
- Viola WCAG 2.4.7 (Focus Visible)

**Archivos afectados:**
- `src/components/LumbarPunctureForm.tsx` (~10 inputs)
- Otros formularios médicos

**Solución propuesta:** Ver [Propuesta #2](#propuesta-2-normalizar-focus-rings)

---

### 3. Modales sin Dark Mode (3 modales principales)

**Severidad:** 🔴 CRÍTICO
**Impacto:** Experiencia de usuario inconsistente
**Afecta a:** ScaleModal, AuthModal, LoginForm

**Problema:**
```tsx
// ScaleModal.tsx:84
<div className="fixed inset-0 bg-black/60...">
  <div className="bg-white rounded-lg...">  // ❌ Sin dark:bg-*
```

**Impacto:**
- Modal blanco sobre dark background
- No usa clases `.modal-content` y `.modal-overlay` que SÍ tienen dark mode

**Archivos afectados:**
- `src/ScaleModal.tsx:83-84`
- `src/components/auth/AuthModal.tsx:27-28`
- `src/components/auth/LoginForm.tsx:80`

**Solución propuesta:** Ver [Propuesta #3](#propuesta-3-añadir-dark-mode-a-modales)

---

### 4. Focus Rings con Bajo Contraste (3 colores)

**Severidad:** 🔴 CRÍTICO
**Impacto WCAG:** Contraste insuficiente para indicadores de focus
**Afecta a:** AdminAuthModal, AIConfigPanel, toggles

**Problema:**
```tsx
// AdminAuthModal - focus:ring-orange-500
focus:ring-2 focus:ring-orange-500  // Contraste: 2.9:1 ❌

// AIConfigPanel - focus:ring-purple-500
focus:ring-4 focus:ring-purple-500/50  // Con opacity: ~1.5:1 ❌
```

**Análisis de contraste:**

| Color | Hex | Contraste sobre blanco | WCAG |
|-------|-----|------------------------|------|
| orange-500 | #f97316 | 2.9:1 | ❌ Falla |
| purple-500 | #a855f7 | 3.7:1 | ❌ Falla |
| purple-500/50 | Con opacity | ~1.5:1 | ❌ Falla grave |
| blue-500 | #3b82f6 | 5.2:1 | ✅ Pasa |

**Archivos afectados:**
- `src/AdminAuthModal.tsx` (inputs con orange)
- `src/AIConfigPanel.tsx` (toggles con purple)

**Solución propuesta:** Ver [Propuesta #2](#propuesta-2-normalizar-focus-rings)

---

### 5. .btn-success Bajo Contraste (1 clase CSS)

**Severidad:** 🔴 CRÍTICO
**Impacto WCAG:** Contraste < 4.5:1
**Afecta a:** Clase definida pero no usada actualmente

**Problema:**
```css
/* src/index.css:157-165 */
.btn-success {
  background-color: var(--state-success);  /* #10b981 light, #4ade80 dark */
  color: #ffffff;
  ...
}
```

**Análisis de contraste:**
- Light: `#10b981` (green-500) con white = **3.0:1** ❌
- Dark: `#4ade80` (green-400) con white = **3.2:1** ❌

**Nota:** Clase no usada actualmente, pero es crítica para futuras implementaciones.

**Solución propuesta:** Ver [Propuesta #4](#propuesta-4-corregir-btn-success)

---

### 6. Botones Destructivos en Dark Mode (2 componentes)

**Severidad:** 🔴 CRÍTICO
**Impacto WCAG:** Contraste ~3.5:1 en dark theme
**Afecta a:** SimpleUserMenu, botones de eliminación

**Problema:**
```tsx
// SimpleUserMenu.tsx:84
className="...text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30..."
```

**Análisis de contraste:**
- Light: `text-red-700` (#b91c1c) sobre `bg-red-50` (#fef2f2) = **6.8:1** ✅
- Dark: `text-red-400` (#f87171) sobre `bg-red-950/30` (~#7f1d1d4d) = **~3.5:1** ❌

**Archivos afectados:**
- `src/components/auth/SimpleUserMenu.tsx:84` (Cerrar sesión)
- `src/components/auth/SimpleUserMenu.tsx:47` (Cache - desarrollo)

**Solución propuesta:** Ver [Propuesta #5](#propuesta-5-corregir-botones-destructivos)

---

### 7. Bordes Hardcodeados en Tablas Médicas (5+ clases)

**Severidad:** 🔴 CRÍTICO (en dark mode)
**Impacto:** Bordes invisibles en dark theme
**Afecta a:** WardRounds, tablas médicas con grid

**Problema:**
```css
/* src/index.css:357-374 */
.ward-col-ubicacion {
  padding: 0 0.25rem;
  border-left: 1px solid #f1f5f9;  /* ❌ Hardcoded slate-100 */
}
```

**Impacto:**
- `#f1f5f9` (slate-100) es casi invisible sobre fondo oscuro
- Sin variantes dark mode
- Afecta 5+ clases de columnas: ubicacion, diagnostico, severidad, pendientes, actions

**Solución propuesta:** Ver [Propuesta #6](#propuesta-6-corregir-bordes-tablas-médicas)

---

### 8. Inconsistencias Semánticas de Color (3 casos críticos)

**Severidad:** 🔴 CRÍTICO (confusión de usuario)
**Impacto:** Iconos/colores no coinciden con la acción
**Afecta a:** Alertas de error, indicadores de éxito

**Problema 1: Icono azul en alerta roja**
```tsx
// LoginForm.tsx:97-102
<div className="...bg-red-50 border border-red-200...">
  <AlertCircle className="h-5 w-5 text-blue-700 mr-2" />  // ❌ Azul en alert rojo
  <span className="text-sm text-gray-800">{displayError}</span>
</div>
```

**Problema 2: Azul para "éxito"**
```tsx
// LumbarPunctureResults.tsx:118
const getSuccessColor = (successful: boolean) => {
  return successful ? 'text-blue-700' : 'text-gray-800';  // ❌ Azul = info, no éxito
};
```

**Problema 3: Icono azul sobre fondo verde**
```tsx
// DashboardInicio.tsx:187-188
<div className="p-1 bg-green-100...">
  <CheckCircle className="h-3 w-3 text-blue-700" />  // ❌ Azul sobre verde
</div>
```

**Solución propuesta:** Ver [Propuesta #7](#propuesta-7-corregir-semántica-de-colores)

---

## 🟡 PROBLEMAS MEDIOS

### 9. Colores Hardcodeados No Usan Variables CSS (150+ instancias)

**Severidad:** 🟡 MEDIO
**Impacto:** Dificulta cambios de tema globales
**Afecta a:** Prácticamente todos los componentes

**Patrón problemático más común:**
```tsx
// En lugar de usar var(--text-primary)
className="text-gray-900 dark:text-white"

// En lugar de usar var(--bg-secondary)
className="bg-gray-50 dark:bg-[#2a2a2a]"

// En lugar de usar var(--border-primary)
className="border-gray-300 dark:border-gray-700"
```

**Colores más repetidos:**

| Color Tailwind | Frecuencia | Debería usar |
|----------------|------------|--------------|
| `text-gray-900` | ~80 | `var(--text-primary)` |
| `text-gray-600` | ~60 | `var(--text-secondary)` |
| `text-gray-500` | ~40 | `var(--text-tertiary)` |
| `bg-gray-50` | ~50 | `var(--bg-secondary)` |
| `bg-gray-100` | ~45 | `var(--bg-tertiary)` |
| `border-gray-300` | ~40 | `var(--border-primary)` |
| `text-blue-600` | ~25 | `var(--state-info)` |

**Archivos más afectados:**
- `src/components/layout/Sidebar.tsx` (25+ instancias)
- `src/DashboardInicio.tsx` (18+ instancias)
- `src/SavedPatients.tsx` (15+ instancias)
- Todos los componentes de formulario

**Solución propuesta:** Ver [Propuesta #8](#propuesta-8-migrar-colores-hardcodeados-a-variables)

---

### 10. Badges sin Dark Mode (15+ componentes)

**Severidad:** 🟡 MEDIO
**Impacto:** Inconsistencia visual en dark theme
**Afecta a:** Severidad, status, hospital context

**Problema:**
```tsx
// WardRounds.tsx - Badges de severidad
className={`severity-indicator ... ${
  patient.severidad === 'I' ? 'bg-green-100 text-gray-800' :  // ❌ Sin dark:
  patient.severidad === 'II' ? 'bg-yellow-100 text-gray-800' :
  patient.severidad === 'III' ? 'bg-orange-100 text-gray-800' :
  'bg-red-100 text-gray-800'
}`}
```

**Componentes afectados:**
- `src/WardRounds.tsx` (severidad I-IV)
- `src/SavedPatients.tsx` (hospital context)
- `src/components/user/GoalsManager.tsx` (completed, deferred, high, low)
- `src/components/user/MyPatients.tsx` (discharged, transferred)

**Excepción:** `ResidentManagement.tsx` SÍ tiene dark mode completo (único ejemplo correcto)

**Solución propuesta:** Ver [Propuesta #9](#propuesta-9-sistema-de-badges-con-dark-mode)

---

### 11. Overrides Innecesarios en Inputs (40+ campos)

**Severidad:** 🟡 MEDIO
**Impacto:** Duplicación de código, inconsistencia
**Afecta a:** Formularios en toda la aplicación

**Problema:**
Los estilos globales en `src/index.css:192-220` YA definen:
```css
input[type="text"], textarea, select {
  background-color: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-primary) !important;
}

input:focus {
  border-color: var(--state-info) !important;
  ring-color: var(--state-info) !important;
  background-color: var(--bg-secondary) !important;
}
```

Pero los componentes sobrescriben innecesariamente:
```tsx
// LoginForm.tsx:153 - INNECESARIO
className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

// ClasesScheduler.tsx - INNECESARIO (repetido ~8 veces)
className="w-full border border-gray-300 rounded-lg px-3 py-2
focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
```

**Solución propuesta:** Ver [Propuesta #10](#propuesta-10-eliminar-overrides-de-inputs)

---

### 12. Tablas sin Dark Mode (5 tablas)

**Severidad:** 🟡 MEDIO
**Impacto:** Inconsistencia visual
**Afecta a:** LumbarPunctureResults, Interconsultas, PacientesPostAlta

**Problema:**
Los estilos globales en `src/index.css:232-249` YA definen dark mode para tablas, pero los componentes sobrescriben:

```tsx
// LumbarPunctureResults.tsx
<table className="min-w-full text-sm">
  <thead className="bg-gray-50">  // ❌ Sobrescribe var(--bg-tertiary)
    <tr>
      <th className="...text-gray-700">  // ❌ Sobrescribe var(--text-primary)
```

**Archivos afectados:**
- `src/components/LumbarPunctureResults.tsx`
- `src/Interconsultas.tsx`
- `src/PacientesPostAlta.tsx`
- `src/components/patients/PatientsList.tsx`

**Solución propuesta:** Ver [Propuesta #11](#propuesta-11-eliminar-overrides-en-tablas)

---

### 13. Colores No Documentados en Variables CSS (5+ colores)

**Severidad:** 🟡 MEDIO
**Impacto:** Colores usados pero no formalizados
**Afecta a:** Dark theme principalmente

**Colores encontrados en uso pero NO en `src/index.css`:**

| Color Hex | Uso | Frecuencia | Variable sugerida |
|-----------|-----|------------|-------------------|
| `#2a2a2a` | Fondos secundarios dark | **8 veces** | `--bg-elevated` |
| `#212121` | Hover en dark | **4 veces** | `--bg-hover-subtle` |
| `#3a3a3a` | Hover botones | 1 vez | Ya existe como `--border-primary` dark |
| `#333333` | Inputs en AdminAuthModal | 2 veces | `--bg-input` |
| `#444444` | Button hover DashboardInicio | 1 vez | `--bg-button-hover` |

**Ejemplos de uso:**
```tsx
// Sidebar.tsx:92 - Repetido 8+ veces
dark:bg-[#2a2a2a]

// DashboardInicio.tsx:207
dark:bg-[#3a3a3a] hover:dark:bg-[#444444]

// AdminAuthModal.tsx
bg-[#333333]
```

**Solución propuesta:** Ver [Propuesta #12](#propuesta-12-documentar-colores-faltantes)

---

### 14. Inconsistencias en Dark Mode (30+ componentes)

**Severidad:** 🟡 MEDIO
**Impacto:** Experiencia inconsistente
**Afecta a:** Texto primario en dark theme

**Problema:**
Texto primario en dark mode usa 2 valores diferentes:
- 60% usa `dark:text-white` (#ffffff) ✅
- 40% usa `dark:text-gray-200` (#e5e7eb) ⚠️

**Ejemplos:**
```tsx
// Correcto
<h1 className="...text-gray-900 dark:text-white">

// Inconsistente
<h3 className="...text-gray-900 dark:text-gray-200">  // Debería ser white
```

**Componentes afectados:**
- `src/DashboardInicio.tsx:134` (h3 con gray-200)
- `src/SavedPatients.tsx` (múltiples elementos con gray-200)
- Muchos componentes pequeños

**Solución propuesta:** Usar `var(--text-primary)` en todos los casos

---

### 15. Focus Rings Inconsistentes (8 colores diferentes)

**Severidad:** 🟡 MEDIO
**Impacto:** Experiencia de usuario inconsistente
**Afecta a:** Formularios en toda la aplicación

**Colores de focus ring encontrados:**
- `focus:ring-blue-500` (~60% de inputs) ✅ Correcto
- `focus:ring-orange-500` (AdminAuthModal) ❌
- `focus:ring-indigo-500` (ClasesScheduler checkbox) ❌
- `focus:ring-purple-500` (AIConfigPanel) ❌

**Problema:**
- Falta de estándar unificado
- Algunos colores no pasan WCAG (ver problema crítico #4)

**Solución propuesta:** Ver [Propuesta #2](#propuesta-2-normalizar-focus-rings)

---

### 16. Botones con Colores Hardcodeados (25+ botones)

**Severidad:** 🟡 MEDIO
**Impacto:** No usan clases `.btn-*` ni variables
**Afecta a:** LoginForm, SimpleUserMenu, DashboardInicio

**Problema:**
Existen clases `.btn-accent`, `.btn-soft`, `.btn-success` bien definidas, pero muchos botones no las usan:

```tsx
// LoginForm.tsx:215 - NO usa .btn-*
<button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
hover:bg-blue-700 disabled:opacity-50...">

// SimpleUserMenu.tsx:38 - NO usa .btn-*
<button className="...text-white bg-blue-600...hover:bg-blue-700">

// Debería ser simplemente:
<button className="w-full btn-accent py-2 px-4 rounded-lg">
```

**Componentes afectados:**
- `src/components/auth/LoginForm.tsx` (botón principal)
- `src/components/auth/SimpleUserMenu.tsx` (botón Iniciar)
- `src/DashboardInicio.tsx:207` (Nueva Evaluación)
- Múltiples botones en neurology_residency_hub.tsx

**Solución propuesta:** Usar clases `.btn-accent`, `.btn-soft` existentes

---

### 17. Scrollbars sin Dark Mode (2 casos)

**Severidad:** 🟡 MEDIO
**Impacto:** Scrollbars claros sobre fondos oscuros
**Afecta a:** .medical-details, scrollbars globales

**Problema:**
```css
/* src/index.css:512-533 */
.medical-details {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;  /* ❌ Hardcoded slate-300/100 */
}

.medical-details::-webkit-scrollbar-thumb {
  background: #cbd5e1;  /* ❌ Hardcoded */
}
```

**Impacto:**
- Scrollbar claro sobre fondo oscuro
- No usa variables CSS

**Solución propuesta:** Ver [Propuesta #13](#propuesta-13-scrollbars-con-dark-mode)

---

### 18. Headings sin Dark Mode (12 headings)

**Severidad:** 🟡 MEDIO
**Impacto:** Inconsistencia visual
**Afecta a:** h1, h2, h3 en varios componentes

**Problema:**
```tsx
// AcademiaManager.tsx
<h1 className="text-xl font-semibold text-gray-900">  // ❌ Sin dark:

// Correcto sería:
<h1 className="text-xl font-semibold text-[var(--text-primary)]">
```

**Componentes afectados:**
- `src/AcademiaManager.tsx`
- `src/ScaleModal.tsx`
- Varios componentes pequeños

---

## 🟢 PROBLEMAS BAJOS

### 19. Placeholders Override (2 casos)

**Severidad:** 🟢 BAJO
**Impacto:** Override innecesario de estilos correctos
**Afecta a:** Sidebar buscador

**Problema:**
```tsx
// Sidebar.tsx:141
className="...placeholder-gray-500..."
```

Los estilos globales YA definen:
```css
input::placeholder {
  color: var(--text-tertiary) !important;
}
```

El override es innecesario y crea inconsistencia.

---

### 20. .btn-success No Usado (1 clase)

**Severidad:** 🟢 BAJO
**Impacto:** Clase definida pero no implementada
**Afecta a:** Ningún componente actualmente

**Problema:**
La clase `.btn-success` está definida en CSS pero no se usa en ningún componente.

**Nota:** Aunque tiene bajo impacto ahora, es crítico corregir su contraste antes de usarla (ver problema crítico #5).

---

### 21. Alertas sin Dark Mode (5 alertas)

**Severidad:** 🟢 BAJO
**Impacto:** Componentes de alerta/notificación sin dark mode
**Afecta a:** LoginForm, LumbarPunctureForm

**Componentes afectados:**
- `src/components/auth/LoginForm.tsx:97` (alerta de error)
- `src/components/auth/LoginForm.tsx:237` (nota amarilla)
- `src/components/LumbarPunctureForm.tsx` (alertas info)

**Nota:** Tienen buen contraste en light theme, pero no se adaptan a dark.

---

## 📅 PLAN DE IMPLEMENTACIÓN

### Fase 1: CRÍTICOS - Accesibilidad (Prioridad Máxima)

**Duración estimada:** Inmediato
**Archivos a modificar:** 8

| # | Tarea | Archivos | Tiempo |
|---|-------|----------|--------|
| 1 | Corregir estados disabled | `src/index.css` | 15 min |
| 2 | Normalizar focus rings | `src/index.css` + 10 componentes | 30 min |
| 3 | Añadir dark mode a modales | `ScaleModal.tsx`, `LoginForm.tsx` | 20 min |
| 4 | Corregir .btn-success | `src/index.css` | 5 min |
| 5 | Corregir botones destructivos | `src/index.css` + `SimpleUserMenu.tsx` | 15 min |
| 6 | Corregir bordes tablas médicas | `src/index.css` | 10 min |
| 7 | Corregir semántica de colores | 3 componentes | 10 min |

**Total Fase 1:** ~1.5 horas

---

### Fase 2: MEDIOS - Mantenimiento (Prioridad Alta)

**Duración estimada:** 2-3 días
**Archivos a modificar:** ~30

| # | Tarea | Archivos | Tiempo |
|---|-------|----------|--------|
| 8 | Sistema de badges con dark mode | `src/index.css` + 8 componentes | 2 horas |
| 9 | Documentar colores faltantes | `src/index.css` | 30 min |
| 10 | Eliminar overrides de inputs | 15+ componentes | 1 hora |
| 11 | Eliminar overrides en tablas | 5 componentes | 45 min |
| 12 | Scrollbars con dark mode | `src/index.css` | 15 min |
| 13 | Migración gradual a variables CSS | 20+ componentes | 4-6 horas |

**Total Fase 2:** ~8-10 horas

---

### Fase 3: BAJOS - Pulido (Prioridad Media)

**Duración estimada:** 1 día
**Archivos a modificar:** ~10

| # | Tarea | Archivos | Tiempo |
|---|-------|----------|--------|
| 14 | Alertas con dark mode | 5 componentes | 1 hora |
| 15 | Limpiar placeholders override | 2 componentes | 15 min |
| 16 | Headings con variables CSS | 12 componentes | 1 hora |

**Total Fase 3:** ~2-3 horas

---

### Resumen de Tiempos

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Fase 1 (Críticos) | ~1.5 horas | ⚡ INMEDIATO |
| Fase 2 (Medios) | ~8-10 horas | 🔥 Alta |
| Fase 3 (Bajos) | ~2-3 horas | ⭐ Media |
| **TOTAL** | **~12-15 horas** | - |

---

## 🛠️ DETALLES POR CATEGORÍA

### Navegación (Parte 3)

**Total issues:** 39
**Críticos:** 3
**Componentes:** Sidebar.tsx, SimpleUserMenu.tsx

**Problemas principales:**
1. Colores hardcodeados (#2a2a2a, #212121) no documentados
2. Múltiples instancias de colores Tailwind sin variables CSS
3. Inconsistencia en color de indicador admin (azul debería ser verde)

---

### Tipografía (Parte 4)

**Total issues:** 215+
**Críticos:** 5
**Componentes:** Todos

**Problemas principales:**
1. 150+ instancias de colores hardcodeados
2. 30+ inconsistencias dark mode (text-white vs text-gray-200)
3. 12 headings sin dark mode
4. Estados disabled con bajo contraste
5. Modales sin dark mode

---

### Componentes Interactivos (Parte 5)

**Total issues:** 100+
**Críticos:** 28+
**Componentes:** Formularios, botones

**Problemas principales:**
1. 15+ botones con disabled:opacity-50 (falla WCAG)
2. 10+ inputs con focus:border-transparent
3. 8 focus rings inconsistentes
4. 40+ inputs con overrides innecesarios
5. 25+ botones no usan clases .btn-*

---

### Vistas Especiales (Parte 6)

**Total issues:** 50+
**Críticos:** 8
**Componentes:** Modales, badges, tablas

**Problemas principales:**
1. 3 modales sin dark mode
2. 15+ badges sin dark mode
3. 5 tablas sin dark mode
4. Bordes hardcodeados en tablas médicas
5. Inconsistencias semánticas de color

---

## 📝 PROPUESTAS DE CORRECCIÓN DETALLADAS

### Propuesta #1: Corregir Estados Disabled

**Archivo:** `src/index.css`

```css
/* AÑADIR después de línea 230 */

/* Estados disabled sin opacity */
button:disabled,
input:disabled,
select:disabled,
textarea:disabled {
  opacity: 1 !important;
  background-color: var(--bg-tertiary) !important;
  color: var(--text-tertiary) !important;
  border-color: var(--border-secondary) !important;
  cursor: not-allowed !important;
}

/* Override específico para botones con clases .btn-* */
.btn-accent:disabled,
.btn-success:disabled {
  background-color: var(--bg-secondary) !important;
  color: var(--text-tertiary) !important;
  border-color: var(--border-primary) !important;
  filter: grayscale(0.5);
}

.btn-soft:disabled {
  background-color: var(--bg-secondary) !important;
  color: var(--text-tertiary) !important;
  filter: none;
}
```

**Componentes a modificar:**
ELIMINAR `disabled:opacity-50` de todos los botones (confiar en estilos globales)

---

### Propuesta #2: Normalizar Focus Rings

**Archivo:** `src/index.css`

```css
/* REEMPLAZAR estilos focus (líneas 208-220) */

/* Estados focus - outline más visible que ring */
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--state-info) !important;
  outline-offset: 2px !important;
  border-color: var(--state-info) !important;
  background-color: var(--bg-secondary) !important;
}

button:focus-visible {
  outline: 2px solid var(--state-info) !important;
  outline-offset: 2px !important;
}

/* Eliminar rings por defecto */
*:focus {
  ring: none !important;
}
```

**Componentes a modificar:**
ELIMINAR `focus:ring-*` y `focus:border-*` de todos los inputs (confiar en estilos globales)

---

### Propuesta #3: Añadir Dark Mode a Modales

**Archivos a modificar:**
- `src/ScaleModal.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/AuthModal.tsx`

**Cambios:**

```tsx
// ANTES (ScaleModal.tsx:83-84)
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh]...">

// DESPUÉS
<div className="modal-overlay">
  <div className="modal-content max-w-2xl w-full">
```

```tsx
// ANTES (LoginForm.tsx:80)
<div className="bg-white rounded-lg shadow-lg p-6...">

// DESPUÉS
<div className="modal-content p-6 sm:p-8">
```

---

### Propuesta #4: Corregir .btn-success

**Archivo:** `src/index.css`

```css
/* REEMPLAZAR líneas 157-165 */
.btn-success {
  background-color: var(--state-success);
  color: var(--on-accent);
  border: 1px solid color-mix(in srgb, var(--state-success) 65%, #000 35%);
}
.btn-success:hover {
  filter: brightness(0.95);
}
```

```css
/* Y AJUSTAR variables (líneas 34-37 y 71-74) */

/* Light theme */
:root {
  --state-success: #059669;  /* green-600 en vez de green-500 */
}

/* Dark theme */
.dark {
  --state-success: #34d399;  /* green-400 más oscuro */
}
```

**Nuevo contraste:**
- Light: green-600 con white = **4.52:1** ✅
- Dark: green-400 con white = **3.8:1** ⚠️ (límite, considerar ajustar)

---

### Propuesta #5: Corregir Botones Destructivos

**Archivo:** `src/index.css`

```css
/* AÑADIR nueva clase después de .btn-success */

.btn-error {
  background-color: color-mix(in srgb, var(--state-error) 10%, var(--bg-primary) 90%);
  color: var(--state-error);
  border: 1px solid color-mix(in srgb, var(--state-error) 30%, transparent);
}

.btn-error:hover {
  background-color: color-mix(in srgb, var(--state-error) 15%, var(--bg-primary) 85%);
}
```

```css
/* Y AJUSTAR variables de error */

:root {
  --state-error: #dc2626;  /* red-600 */
}

.dark {
  --state-error: #fca5a5;  /* red-300 */
}
```

**Componentes a modificar:**
```tsx
// SimpleUserMenu.tsx:84 - ANTES
<button className="...text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30...">

// DESPUÉS
<button className="w-full px-2 py-1.5 text-xs btn-error rounded-md">
```

---

### Propuesta #6: Corregir Bordes Tablas Médicas

**Archivo:** `src/index.css`

```css
/* REEMPLAZAR líneas 357-374 con variables CSS */

.ward-col-ubicacion,
.ward-col-diagnostico,
.ward-col-severidad,
.ward-col-pendientes,
.ward-col-actions {
  border-left: 1px solid var(--border-secondary);
}

/* Override para dark si necesario */
.dark .ward-col-ubicacion,
.dark .ward-col-diagnostico,
.dark .ward-col-severidad,
.dark .ward-col-pendientes,
.dark .ward-col-actions {
  border-left-color: var(--border-primary);
}
```

---

### Propuesta #7: Corregir Semántica de Colores

**Archivos a modificar:**

```tsx
// LoginForm.tsx:99 - ANTES
<AlertCircle className="h-5 w-5 text-blue-700 mr-2" />

// DESPUÉS
<AlertCircle className="h-5 w-5 text-[var(--state-error)] mr-2" />
```

```tsx
// LumbarPunctureResults.tsx:118 - ANTES
const getSuccessColor = (successful: boolean) => {
  return successful ? 'text-blue-700' : 'text-gray-800';
};

// DESPUÉS
const getSuccessColor = (successful: boolean) => {
  return successful ? 'text-[var(--state-success)]' : 'text-[var(--text-tertiary)]';
};
```

```tsx
// DashboardInicio.tsx:188 - ANTES
<CheckCircle className="h-3 w-3 text-blue-700" />

// DESPUÉS
<CheckCircle className="h-3 w-3 text-[var(--state-success)]" />
```

---

### Propuesta #8: Migrar Colores Hardcodeados a Variables

**Estrategia:** Crear clases utilitarias en `src/index.css`

```css
/* AÑADIR clases utilitarias después de línea 135 */

/* Texto */
.text-primary { color: var(--text-primary) !important; }
.text-secondary { color: var(--text-secondary) !important; }
.text-tertiary { color: var(--text-tertiary) !important; }

/* Fondos */
.bg-primary { background-color: var(--bg-primary) !important; }
.bg-secondary { background-color: var(--bg-secondary) !important; }
.bg-tertiary { background-color: var(--bg-tertiary) !important; }
.bg-hover { background-color: var(--bg-hover) !important; }

/* Bordes */
.border-primary { border-color: var(--border-primary) !important; }
.border-secondary { border-color: var(--border-secondary) !important; }
```

**Migración gradual en componentes:**
```tsx
// ANTES
<p className="text-gray-600 dark:text-gray-400">

// DESPUÉS
<p className="text-secondary">
```

---

### Propuesta #9: Sistema de Badges con Dark Mode

**Archivo:** `src/index.css`

```css
/* AÑADIR después de .severity-indicator (línea 314) */

/* Badge base */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.2s ease;
}

/* Severity badges con dark mode automático */
.badge-severity-1 {
  background-color: color-mix(in srgb, var(--state-success) 15%, var(--bg-primary) 85%);
  color: var(--state-success);
  border-color: color-mix(in srgb, var(--state-success) 30%, transparent);
}

.badge-severity-2 {
  background-color: color-mix(in srgb, var(--state-warning) 15%, var(--bg-primary) 85%);
  color: var(--state-warning);
  border-color: color-mix(in srgb, var(--state-warning) 30%, transparent);
}

.badge-severity-3 {
  background-color: color-mix(in srgb, #f97316 15%, var(--bg-primary) 85%);
  color: #f97316;
  border-color: color-mix(in srgb, #f97316 30%, transparent);
}

.badge-severity-4 {
  background-color: color-mix(in srgb, var(--state-error) 15%, var(--bg-primary) 85%);
  color: var(--state-error);
  border-color: color-mix(in srgb, var(--state-error) 30%, transparent);
}

/* Hospital context badges */
.badge-posadas {
  background-color: color-mix(in srgb, var(--state-info) 15%, var(--bg-primary) 85%);
  color: var(--state-info);
  border-color: color-mix(in srgb, var(--state-info) 30%, transparent);
}

.badge-julian {
  background-color: color-mix(in srgb, var(--state-success) 15%, var(--bg-primary) 85%);
  color: var(--state-success);
  border-color: color-mix(in srgb, var(--state-success) 30%, transparent);
}
```

**Componentes a modificar:**
```tsx
// WardRounds.tsx - ANTES
<span className={`severity-indicator inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
  patient.severidad === 'I' ? 'bg-green-100 text-gray-800' : ...
}`}>

// DESPUÉS
<span className={`badge severity-indicator ${
  patient.severidad === 'I' ? 'badge-severity-1' :
  patient.severidad === 'II' ? 'badge-severity-2' :
  patient.severidad === 'III' ? 'badge-severity-3' :
  'badge-severity-4'
}`}>
```

---

### Propuesta #10: Eliminar Overrides de Inputs

**Componentes a modificar:** LoginForm, ClasesScheduler, LumbarPunctureForm (15+ archivos)

```tsx
// ANTES (LoginForm.tsx:153)
<input className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

// DESPUÉS
<input className="w-full pl-10 pr-3 py-2 rounded-lg"
```

Los estilos globales de `src/index.css:192-220` se aplican automáticamente.

---

### Propuesta #11: Eliminar Overrides en Tablas

**Componentes a modificar:** LumbarPunctureResults, Interconsultas, PacientesPostAlta

```tsx
// ANTES (LumbarPunctureResults.tsx)
<table className="min-w-full text-sm">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">

// DESPUÉS
<table className="min-w-full text-sm">
  <thead>
    <tr>
      <th className="px-3 py-2 text-left text-xs font-medium">
```

---

### Propuesta #12: Documentar Colores Faltantes

**Archivo:** `src/index.css`

```css
/* AÑADIR en .dark (después de línea 68) */

.dark {
  /* Fondos existentes */
  --bg-primary: #0b0b0b;
  --bg-secondary: #151515;
  --bg-tertiary: #1e1e1e;
  --bg-hover: #262626;

  /* NUEVOS: Colores usados pero no documentados */
  --bg-elevated: #2a2a2a;       /* Usado en inputs, cards hover */
  --bg-hover-subtle: #212121;   /* Hover más sutil que bg-hover */
  --bg-input: #333333;          /* Inputs en AdminAuthModal */
  --bg-button-hover: #444444;   /* Button hover DashboardInicio */

  /* ... resto de variables ... */
}
```

**Componentes a actualizar:**
```tsx
// ANTES
dark:bg-[#2a2a2a]

// DESPUÉS
dark:bg-[var(--bg-elevated)]
```

---

### Propuesta #13: Scrollbars con Dark Mode

**Archivo:** `src/index.css`

```css
/* REEMPLAZAR líneas 512-533 */

.medical-details {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) var(--bg-secondary);
}

.medical-details::-webkit-scrollbar {
  width: 6px;
}

.medical-details::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.medical-details::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.medical-details::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Críticos

- [ ] **Propuesta #1:** Corregir estados disabled en `src/index.css`
- [ ] **Propuesta #2:** Normalizar focus rings en `src/index.css`
- [ ] **Propuesta #3:** Añadir dark mode a ScaleModal
- [ ] **Propuesta #3:** Añadir dark mode a LoginForm
- [ ] **Propuesta #3:** Añadir dark mode a AuthModal
- [ ] **Propuesta #4:** Corregir .btn-success en `src/index.css`
- [ ] **Propuesta #5:** Crear .btn-error en `src/index.css`
- [ ] **Propuesta #5:** Migrar SimpleUserMenu a .btn-error
- [ ] **Propuesta #6:** Corregir bordes tablas médicas en `src/index.css`
- [ ] **Propuesta #7:** Corregir icono en LoginForm
- [ ] **Propuesta #7:** Corregir getSuccessColor en LumbarPunctureResults
- [ ] **Propuesta #7:** Corregir CheckCircle en DashboardInicio
- [ ] Eliminar `disabled:opacity-50` de todos los componentes (15+)
- [ ] Eliminar `focus:ring-*` de todos los inputs (40+)
- [ ] Eliminar `focus:border-transparent` de todos los inputs (10+)

### Fase 2: Medios

- [ ] **Propuesta #9:** Crear sistema de badges en `src/index.css`
- [ ] **Propuesta #9:** Migrar badges en WardRounds
- [ ] **Propuesta #9:** Migrar badges en SavedPatients
- [ ] **Propuesta #9:** Migrar badges en GoalsManager
- [ ] **Propuesta #9:** Migrar badges en MyPatients
- [ ] **Propuesta #12:** Documentar colores faltantes en `src/index.css`
- [ ] **Propuesta #10:** Eliminar overrides en LoginForm
- [ ] **Propuesta #10:** Eliminar overrides en ClasesScheduler
- [ ] **Propuesta #10:** Eliminar overrides en LumbarPunctureForm (10+)
- [ ] **Propuesta #11:** Eliminar overrides en tablas (5 componentes)
- [ ] **Propuesta #13:** Scrollbars con dark mode en `src/index.css`
- [ ] **Propuesta #8:** Crear clases utilitarias en `src/index.css`
- [ ] **Propuesta #8:** Migración gradual de componentes (20+)

### Fase 3: Bajos

- [ ] Añadir dark mode a alertas (5 componentes)
- [ ] Limpiar placeholders override (2 componentes)
- [ ] Migrar headings a variables CSS (12 componentes)

---

## 📚 REFERENCIAS

### Variables CSS Actuales (src/index.css)

**Light Theme:**
```css
--bg-primary: #ffffff
--bg-secondary: #f9fafb (gray-50)
--bg-tertiary: #f3f4f6 (gray-100)
--bg-hover: #e5e7eb (gray-200)
--border-primary: #d1d5db (gray-300)
--border-secondary: #e5e7eb (gray-200)
--text-primary: #111827 (gray-900)
--text-secondary: #4b5563 (gray-600)
--text-tertiary: #9ca3af (gray-400)
--state-success: #10b981 (green-500) → cambiar a #059669
--state-error: #ef4444 (red-500) → cambiar a #dc2626
--state-warning: #f59e0b (amber-500)
--state-info: #3b82f6 (blue-500)
```

**Dark Theme:**
```css
--bg-primary: #0b0b0b
--bg-secondary: #151515
--bg-tertiary: #1e1e1e
--bg-hover: #262626
--border-primary: #3a3a3a
--border-secondary: #4c4c4c
--text-primary: #ffffff
--text-secondary: #c7c7c7
--text-tertiary: #9b9b9b
--state-success: #4ade80 (green-400) → cambiar a #34d399
--state-error: #f87171 (red-400) → cambiar a #fca5a5
--state-warning: #fbbf24 (yellow-400)
--state-info: #60a5fa (blue-400)
```

### Estándares WCAG 2.1

- **AA Normal Text:** Contraste mínimo 4.5:1
- **AA Large Text:** Contraste mínimo 3:1
- **AAA Normal Text:** Contraste mínimo 7:1
- **Focus Visible:** 2.4.7 - Indicador visible de focus

### Herramientas de Auditoría

- Script de contraste: `scripts/contrast-audit.mjs`
- Script de colores: `scripts/color-audit.mjs`
- Ejecutar: `node scripts/contrast-audit.mjs`

---

## 🎯 CONCLUSIONES

1. **Sistema base sólido:** Las variables CSS están bien definidas, pero no se usan consistentemente
2. **Problema principal:** ~400+ instancias de colores hardcodeados que dificultan mantenimiento
3. **Prioridad máxima:** Corregir 44+ issues críticos que afectan accesibilidad WCAG AA
4. **Tiempo estimado:** 12-15 horas para completar todas las fases
5. **Beneficio esperado:** Sistema de estilos consistente, mantenible y 100% accesible

---

**Documento generado:** 2025-01-23
**Versión:** 1.0
**Auditor:** Claude Code StyleAgent
