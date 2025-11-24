# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-10-30

### 🎨 Transformación Completa a Tema Oscuro

Esta versión representa una refactorización completa de la interfaz de usuario hacia un tema oscuro profesional inspirado en ChatGPT.

### Added

#### Componentes Nuevos
- **Sidebar Component** (`src/components/layout/Sidebar.tsx`)
  - Sidebar colapsable con toggle manual (no hover)
  - Estados: colapsado (56px) y expandido (224px)
  - Búsqueda de secciones integrada
  - Tooltips nativos en estado colapsado
  - Indicador visual de sección activa
  - Footer con menú de usuario y logout

#### Sistema de Temas
- **Variables CSS Globales** (`src/index.css`)
  - `--bg-primary`: #1a1a1a (fondo principal)
  - `--bg-secondary`: #2a2a2a (fondo secundario)
  - `--bg-tertiary`: #333333 (fondo terciario)
  - `--bg-hover`: #3a3a3a (estado hover)
  - `--border-primary`: #3f3f3f (bordes)
  - `--text-primary`: #e5e5e5 (texto principal)
  - `--text-secondary`: #a3a3a3 (texto secundario)
  - Estilos globales para inputs, selects, textareas
  - Custom scrollbar styling oscuro

### Changed

#### Componentes Principales Transformados

##### 1. Dashboard Principal (`src/neurology_residency_hub.tsx`)
- Integración del nuevo Sidebar component
- Eliminación de sidebar anterior inline
- Background principal: `bg-[#1a1a1a]`
- Layout optimizado para sidebar colapsable

##### 2. Dashboard Inicio (`src/DashboardInicio.tsx`)
- Header: gradient de grises (from-gray-900 to-gray-800)
- Tipografía reducida: `text-3xl` → `text-xl`
- Cards de acceso rápido: `bg-[#3a3a3a]` con hover `bg-[#444444]`
- Sección de próximos eventos con tema oscuro
- Bordes sutiles: `border-gray-700`

##### 3. Evolucionador (`src/DiagnosticAlgorithmContent.tsx`)
- **Botones principales transformados:**
  - Guardar Paciente: `bg-blue-900` hover `bg-blue-800` (más oscuro por pedido del usuario)
  - Generar Nota: `bg-purple-900` hover `bg-purple-800`
  - Botones secundarios: `bg-[#3a3a3a]` hover `bg-[#444444]`
- Formularios: fondo `bg-[#2a2a2a]` con inputs oscuros
- Tabs y navegación con tema oscuro
- Reducción de padding y tipografía

##### 4. Cronograma (`src/EventManagerSupabase.tsx`)
- **Nueva función getEventTypeColor** con colores oscuros mejorados:
  - Academic: `bg-emerald-950/40 text-emerald-300 border-emerald-700`
  - Clinical: `bg-blue-950/40 text-blue-300 border-blue-700`
  - Administrative: `bg-purple-950/40 text-purple-300 border-purple-700`
  - Emergency: `bg-red-950/40 text-red-300 border-red-700`
  - Social: `bg-orange-950/40 text-orange-300 border-orange-700`
- Formularios de eventos con fondo oscuro
- Calendario con mejor contraste
- Lista de eventos transformada

##### 5. Gestión de Residentes (`src/components/ResidentManagement.tsx`)
- Panel administrativo completamente oscuro
- Cards de estadísticas: `bg-{color}-950/40` con bordes `border-{color}-800`
- Tabla con fondo `bg-[#2a2a2a]` y header `bg-[#333333]`
- Formularios modales oscuros
- Reducción de tipografía: `text-2xl` → `text-xl`

##### 6. Configuración de IA (`src/AIConfigPanel.tsx`)
- Header gradient: `from-gray-900 to-gray-800`
- Cards de estado con colores semitransparentes
- Selectores de proveedor con estados visuales claros
- Formularios oscuros con bordes sutiles
- Toggles personalizados con tema púrpura

##### 7. Modal de Autenticación Admin (`src/AdminAuthModal.tsx`)
- **Fix crítico**: Eliminado fondo blanco en panel de admin
- Botones de funcionalidades:
  - Configuración IA: `bg-purple-950/40 border-purple-800`
  - Examen Neurológico: `bg-blue-950/40 border-blue-800`
- Panel de información con `bg-[#333333]`
- Formulario de contraseña oscuro

##### 8. Componentes Menores
- **PendientesResumidos.tsx**: Cards de tareas con prioridades en tema oscuro
- **SimpleUserMenu.tsx**: Menú de usuario reducido para footer del sidebar

### Typography Changes

**Reducciones globales de tamaño:**
- `text-3xl` → `text-xl` (títulos principales)
- `text-2xl` → `text-lg` o `text-base` (subtítulos)
- `text-xl` → `text-base` (texto destacado)
- `text-lg` → `text-sm` (texto normal)
- Padding reducido: `p-6` → `p-4` en la mayoría de contenedores

### Color Palette

**Backgrounds:**
- Principal: `#1a1a1a`
- Secundario: `#2a2a2a`
- Terciario: `#333333`
- Hover: `#3a3a3a`, `#444444`

**Borders:**
- Primario: `border-gray-700` / `border-gray-800`
- Estados: `border-{color}-700` / `border-{color}-800`

**Text:**
- Principal: `text-gray-200`, `text-gray-100`
- Secundario: `text-gray-400`
- Terciario: `text-gray-500`

**Semantic Colors (oscuros):**
- Blue: `bg-blue-950/40`, `text-blue-300`, `border-blue-800`
- Green: `bg-green-950/40`, `text-green-300`, `border-green-800`
- Purple: `bg-purple-950/40`, `text-purple-300`, `border-purple-800`
- Red: `bg-red-950/40`, `text-red-300`, `border-red-800`
- Orange: `bg-orange-950/40`, `text-orange-300`, `border-orange-800`

### Fixed

1. **Tooltip Glitch en Sidebar**
   - Problema: Glitch visual al hacer hover sobre iconos
   - Solución: Uso de atributo HTML `title` nativo en lugar de tooltips custom

2. **Contraste Insuficiente en Eventos del Cronograma**
   - Problema: Eventos con colores muy claros difíciles de leer
   - Solución: Nueva función `getEventTypeColor` con colores semitransparentes oscuros

3. **Botón "Guardar Paciente" Muy Claro**
   - Problema: Color azul demasiado brillante
   - Solución: Cambio a `bg-blue-900` hover `bg-blue-800`

4. **Fondo Blanco en AdminAuthModal**
   - Problema: Panel de administración con fondo blanco y texto blanco
   - Solución: Transformación completa a `bg-[#2a2a2a]` con bordes oscuros

### Developer Notes

**Patrones de Transformación Establecidos:**
```tsx
// Headers importantes
<div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">

// Containers principales
<div className="bg-[#2a2a2a] border border-gray-800">

// Cards secundarios
<div className="bg-[#333333] border border-gray-700">

// Botones primarios (acción importante)
<button className="bg-blue-900 hover:bg-blue-800 text-white border border-blue-800">

// Botones secundarios (navegación)
<button className="bg-[#3a3a3a] hover:bg-[#444444] text-gray-200 border border-gray-700">

// Cards de estado/estadísticas
<div className="bg-{color}-950/40 border border-{color}-800">
  <span className="text-{color}-300">Título</span>
  <p className="text-{color}-400">Descripción</p>
</div>
```

### Files Modified

**24 archivos modificados:** +3,286 inserciones, -788 eliminaciones

**Componentes Principales:**
- `src/neurology_residency_hub.tsx`
- `src/DashboardInicio.tsx`
- `src/DiagnosticAlgorithmContent.tsx`
- `src/EventManagerSupabase.tsx`

**Componentes Nuevos:**
- `src/components/layout/Sidebar.tsx` ✨

**Componentes Admin:**
- `src/AdminAuthModal.tsx`
- `src/AIConfigPanel.tsx`
- `src/components/ResidentManagement.tsx`

**Componentes Auxiliares:**
- `src/components/PendientesResumidos.tsx`
- `src/components/auth/SimpleUserMenu.tsx`

**Estilos:**
- `src/index.css` (extensivo)

### Breaking Changes

⚠️ **Ninguno** - La transformación es puramente visual y no afecta la funcionalidad existente.

### Migration Guide

No se requiere migración. Los cambios son retrocompatibles y puramente estéticos.

### Performance

- CSS Variables mejoran la consistencia del tema
- Componente Sidebar optimizado con useState para toggle
- Sin impacto negativo en performance

### Accessibility

- Contraste mejorado en todos los componentes (cumple WCAG AA)
- Tooltips nativos preservan accesibilidad del navegador
- Focus states preservados en todos los elementos interactivos

---

## [2025-10-23]

### Fixed
- **Hospital Context Synchronization in Evolucionador (Diagnostic Algorithm)**: Resolved critical issue where patients were not being saved to the correct hospital context
  - Fixed `SavePatientModal` to properly sync with global hospital context using `useEffect`
  - Eliminated duplicate hospital context selectors causing state desynchronization
  - Implemented single global hospital context selector in main layout
  - Removed redundant selectors from `SavedPatients` component
  - Removed hospital context selector from `SavePatientModal` to prevent user confusion
  - Added visual banner in save modal clearly indicating target hospital context
  - **Impact**: Patients now save correctly to selected hospital context (Posadas/Julian)
  - **Root Cause**: Modal had independent state that didn't update when global context changed
  - **Solution**: Centralized hospital context management with single source of truth

### Changed
- Increased privilege check timeout from 3 to 10 seconds to handle multiple sequential database calls
  - Prevents "Privilege check timeout" errors during authentication
  - Improves reliability of hospital context access verification
- Enhanced logging for hospital context operations with clear emoji indicators (🏥)
  - `[SavePatientModal]` logs now show context updates and save operations
  - `[SavedPatients]` logs track context synchronization
  - `[DiagnosticAlgorithm]` logs display context when opening save modal
- Success messages now include hospital context name for clarity
  - "Paciente guardado exitosamente en Hospital Posadas"
  - "Paciente guardado exitosamente en Consultorios Julian"

### Removed
- Duplicate hospital context selectors across multiple components
- `isAdminMode` prop from `SavePatientModal` (no longer needed)
- `useAuthContext` import from `DiagnosticAlgorithmContent` (unused after refactor)

## [2025-09-30]

### Fixed
- **Ward Rounds (Pase de Sala) bootloop issue**: Resolved infinite loading state when browser had stale/expired JWT tokens
  - Added session clear guard in `useAuth` hook to prevent authentication state loops
  - Implemented auth initialization guard to prevent duplicate initialization
  - Added detailed logging for auth state transitions for better debugging
  - Prevented `onAuthStateChange` updates during session clearing operations
  - Added 10-second safety timeout in WardRounds component as ultimate fallback
  - Ensured loading state properly transitions to `false` after stale session clearing
  - **Impact**: Ward Rounds now loads correctly in all scenarios:
    - Normal browser mode with stale/expired sessions
    - Incognito mode (fresh state)
    - After logout/login (refreshed state)
  - **Commits**: `61d9e6c`, `dcfbaf4`

### Changed
- Optimized session checks to be non-blocking in patient update operations
- Removed manual Promise.race timeouts that were causing stuck operations
- Simplified archive, task deletion, and patient deletion processes

## [2025-09-23]

### Added
- Admin privileges implementation with database-level access control
- Hospital context system (Posadas/Julian) with privilege-based access
- Resident profiles table and management system

### Changed
- Migrated from password-based admin access to database privilege system
- Enhanced security with Row Level Security (RLS) policies

## Previous Changes

See git history for changes prior to September 2025.

---

## How to Use This Changelog

### For Developers
When making changes:
1. Add entries under `[Unreleased]` section
2. Use categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. Include commit references when relevant
4. Move to dated section when releasing

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
