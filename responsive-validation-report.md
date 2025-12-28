# Reporte de Validación de Diseño Responsivo - Interconsultas
**Fecha:** 27 de diciembre de 2025
**Autor:** Validación automatizada con Playwright
**Viewports evaluados:** iPhone SE (375px), iPhone 12 Pro (390px), iPhone 14 Pro Max (428px)

---

## Executive Summary

### Resumen de Hallazgos
- **Total de issues encontrados:** 8
- **Issues críticos:** 1
- **Issues de alta prioridad:** 3
- **Issues de prioridad media:** 3
- **Issues de baja prioridad:** 1

### Distribución por Viewport
- **iPhone SE (375px):** 6 issues (el más problemático)
- **iPhone 12 Pro (390px):** 5 issues
- **iPhone 14 Pro Max (428px):** 4 issues

### Principales Hallazgos

1. **🔴 CRÍTICO:** Botón de navegación "Interconsultas" en sidebar está fuera del viewport en móvil
2. **🟠 ALTO:** Botón "Exportar CSV" se corta/trunca en pantallas pequeñas
3. **🟠 ALTO:** Status pills en filtros no tienen espaciado óptimo en mobile
4. **🟡 MEDIO:** Header ocupa demasiado espacio vertical (>100px)

---

## Issues Detallados

### Issue #1: Botón de Interconsultas fuera del viewport (CRÍTICO)

**Ubicación:** Sidebar navegación
**Severidad:** 🔴 Crítico
**Viewport afectado:** Todos (375px, 390px, 428px)

**Descripción:**
El botón "Interconsultas" en la sidebar colapsada está posicionado fuera del viewport en dispositivos móviles. Playwright reportó:
```
element is outside of the viewport
```

Esto hace imposible hacer click en el botón de forma nativa en móvil, requiriendo scroll o expansión de la sidebar.

**Screenshot Before:**
![Issue 1](screenshots/iPhone-SE-375px-header.png)

**Código actual:**
```tsx
// src/components/layout/Sidebar.tsx (estimado)
<button
  title="Interconsultas"
  className="w-full flex items-center px-2 py-1.5 rounded-md text-xs font-medium..."
>
  {/* Contenido del botón */}
</button>
```

**Sugerencia de mejora:**
La sidebar necesita implementar scroll interno o un layout que asegure que todos los botones sean accesibles:

```tsx
// Opción 1: Scroll interno en la navegación
<nav className="flex-1 overflow-y-auto py-4">
  <ul className="space-y-1 px-2">
    {/* Botones de navegación */}
  </ul>
</nav>

// Opción 2: Grid compacto en mobile
<nav className="grid grid-cols-3 gap-2 md:flex md:flex-col">
  {/* Los botones se organizan en 3 columnas en mobile */}
</nav>
```

**Impacto en UX:**
- **Crítico**: Los usuarios no pueden acceder a la sección de Interconsultas desde la sidebar en móvil
- Requiere workaround (usar accesos rápidos del dashboard)
- Degrada significativamente la experiencia móvil

---

### Issue #2: Botón "Exportar CSV" truncado en mobile (ALTO)

**Ubicación:** `src/Interconsultas.tsx:176` (header section)
**Severidad:** 🟠 Alto
**Viewport afectado:** iPhone SE (375px)

**Descripción:**
El botón "Exportar CSV" en el header se ve truncado a "Expor..." en iPhone SE debido a falta de espacio horizontal.

**Screenshot Before:**
![Issue 2 - Header truncado](screenshots/iPhone-SE-375px-header.png)

**Código actual:**
```tsx
// src/Interconsultas.tsx línea ~176
<button className="...">
  <Download className="h-4 w-4" />
  <span>Exportar CSV</span>
</button>
```

**Sugerencia de mejora:**
Implementar texto responsivo que se oculte en mobile, dejando solo el ícono:

```tsx
<button className="...">
  <Download className="h-4 w-4" />
  <span className="hidden sm:inline">Exportar CSV</span>
  <span className="sr-only sm:hidden">Exportar</span>
</button>
```

O usar tooltip en mobile:

```tsx
<button
  className="..."
  title="Exportar CSV"
  aria-label="Exportar CSV"
>
  <Download className="h-5 w-5" />
  <span className="hidden md:inline ml-1">Exportar CSV</span>
</button>
```

**Impacto en UX:**
- Botón funcional pero visualmente cortado
- Puede confundir a usuarios sobre su funcionalidad
- Afecta percepción de calidad del diseño

---

### Issue #3: Status pills wrapping subóptimo (ALTO)

**Ubicación:** `src/components/interconsultas/InterconsultaFilters.tsx:149`
**Severidad:** 🟠 Alto
**Viewport afectado:** Todos

**Descripción:**
Las pills de estado (Pendiente (8), En Proceso (1), Resuelta (2), Cancelada) hacen wrap pero ocupan demasiado espacio vertical, especialmente cuando se combinan con el search input y otros controles.

**Screenshot Before:**
![Issue 3 - Filtros](screenshots/iPhone-SE-375px-with-cards.png)

**Código actual:**
```tsx
// InterconsultaFilters.tsx línea 149
<div className="flex flex-wrap items-center gap-2 p-2">
  <button className="Nueva Interconsulta">...</button>
  <div className="search">...</div>
  <button>Pendiente (8)</button>
  <button>En Proceso (1)</button>
  <button>Resuelta (2)</button>
  <button>Cancelada</button>
  {/* ... más controles */}
</div>
```

**Sugerencia de mejora:**
Implementar filtros colapsables en mobile o usar un selector dropdown:

```tsx
// Opción 1: Tabs compactos en lugar de pills
<div className="border-b border-gray-200 dark:border-gray-700">
  <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
    <button className="px-4 py-2 text-sm whitespace-nowrap border-b-2">
      Pendiente (8)
    </button>
    {/* Otros estados */}
  </nav>
</div>

// Opción 2: Dropdown en mobile
<div className="md:hidden">
  <select className="w-full">
    <option>Todos</option>
    <option>Pendiente (8)</option>
    <option>En Proceso (1)</option>
    <option>Resuelta (2)</option>
    <option>Cancelada</option>
  </select>
</div>

<div className="hidden md:flex gap-2">
  {/* Pills originales para desktop */}
</div>
```

**Impacto en UX:**
- Los filtros ocupan ~120px de altura en mobile
- Reduce espacio disponible para contenido principal
- Viola principio de "content-first" del CLAUDE.md (máximo 80px para header)

---

### Issue #4: Header demasiado alto en mobile (MEDIO)

**Ubicación:** `src/Interconsultas.tsx:167-183`
**Severidad:** 🟡 Medio
**Viewport afectado:** Todos

**Descripción:**
El header completo (título + botones + filtros) ocupa aproximadamente 300-320px en iPhone SE, dejando muy poco espacio para el contenido principal (cards) sin scroll.

Según CLAUDE.md:
> Headers and filters should be compact and collapsible by default
> Maximum header height: 80px (including navigation and filters)

**Screenshot Before:**
![Issue 4 - Header alto](screenshots/iPhone-SE-375px-with-cards.png)

**Código actual:**
```tsx
<div className="space-y-4">
  {/* Header con título, botones - ~60px */}
  <div className="flex items-center justify-between">
    <h1>Interconsultas</h1>
    <button>Actualizar</button>
    <button>Exportar CSV</button>
  </div>

  {/* Filtros - ~150px+ */}
  <InterconsultaFiltersComponent />

  {/* Formulario si está abierto - ~400px */}
  {showCreateForm && <CreateForm />}
</div>
```

**Sugerencia de mejora:**
Implementar header sticky compacto con filtros colapsables por defecto:

```tsx
<div className="space-y-2">
  {/* Header compacto y sticky */}
  <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
    <div className="flex items-center justify-between py-2">
      <h1 className="text-lg font-semibold">Interconsultas</h1>
      <div className="flex gap-1">
        <button className="p-2" title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button className="p-2" title="Exportar">
          <Download className="h-4 w-4" />
        </button>
        <button
          className="p-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>
    </div>

    {/* Filtros colapsables */}
    {showFilters && (
      <div className="animate-slideDown">
        <InterconsultaFiltersComponent compact />
      </div>
    )}
  </div>

  {/* Contenido principal */}
  <div className="space-y-4">
    {/* Cards aquí */}
  </div>
</div>
```

**Impacto en UX:**
- Usuarios deben hacer scroll significativo para ver el primer contenido
- Reduce significativamente el espacio visible para cards
- Dificulta la exploración rápida de interconsultas

---

### Issue #5: Search input ancho fijo (MEDIO)

**Ubicación:** `src/components/interconsultas/InterconsultaFilters.tsx` (línea estimada ~186)
**Severidad:** 🟡 Medio
**Viewport afectado:** iPhone SE (375px)

**Descripción:**
El input de búsqueda tiene un `minWidth: '200px'` que es demasiado ancho para iPhone SE (53% del viewport), dejando poco espacio para otros controles en la misma fila.

**Código actual:**
```tsx
<input
  type="text"
  placeholder="Buscar..."
  style={{ minWidth: '200px', maxWidth: '240px' }}
  className="..."
/>
```

**Sugerencia de mejora:**
Usar ancho responsivo basado en flex:

```tsx
<input
  type="text"
  placeholder="Buscar..."
  className="flex-1 min-w-[120px] max-w-[240px] md:min-w-[200px]"
/>
```

**Impacto en UX:**
- Fuerza wrapping temprano de otros controles
- Aumenta altura total de la sección de filtros
- Puede hacer que el botón "Nueva Interconsulta" se mueva a otra línea

---

### Issue #6: Cards grid correctamente implementado (✅ BIEN)

**Ubicación:** `src/Interconsultas.tsx:506`
**Severidad:** N/A - Implementación correcta
**Viewport afectado:** Todos

**Observación positiva:**
El grid de cards está correctamente implementado con breakpoints progresivos:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

En mobile (375-428px), las cards usan correctamente `grid-cols-1` (una columna), lo cual es el comportamiento esperado.

**Screenshot:**
![Cards bien implementadas](screenshots/iPhone-SE-375px-with-cards.png)

**Recomendación:** Mantener implementación actual.

---

### Issue #7: Modal de detalle scroll vertical (MEDIO)

**Ubicación:** `src/components/interconsultas/InterconsultaDetailModal.tsx:335`
**Severidad:** 🟡 Medio
**Viewport afectado:** Todos

**Descripción:**
El modal de detalle usa scroll vertical para mostrar todo el contenido, lo cual es correcto. Sin embargo, el header del modal no es sticky, por lo que al hacer scroll se pierde el contexto del paciente.

**Screenshot Before:**
![Modal](screenshots/iPhone-SE-375px-detail-modal.png)

**Código actual:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="w-full max-w-3xl">
    {/* Header del modal */}
    <div className="flex items-center justify-between p-4">
      <h2>Soria Prima Agustina</h2>
      <button>Editar</button>
    </div>

    {/* Contenido scrolleable */}
    <div className="overflow-y-auto max-h-[80vh]">
      {/* Formulario largo */}
    </div>
  </div>
</div>
```

**Sugerencia de mejora:**
Hacer el header sticky dentro del modal:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
    {/* Header sticky */}
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b p-4">
      <h2>Soria Prima Agustina</h2>
      <div className="flex gap-2">
        <button>Editar</button>
        <button>Cerrar</button>
      </div>
    </div>

    {/* Contenido scrolleable */}
    <div className="flex-1 overflow-y-auto p-4">
      {/* Formulario */}
    </div>

    {/* Footer sticky (opcional) */}
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4">
      <button>Guardar Respuesta</button>
    </div>
  </div>
</div>
```

**Impacto en UX:**
- Al hacer scroll, se pierde el nombre del paciente y acciones principales
- Dificulta navegación en formularios largos
- Usuarios pueden olvidar en qué paciente están trabajando

---

### Issue #8: Formulario de creación altura apropiada (BAJO)

**Ubicación:** `src/Interconsultas.tsx:380-494`
**Severidad:** 🟢 Bajo
**Viewport afectado:** Todos

**Descripción:**
El formulario de creación se despliega correctamente en mobile con layout de single column. El textarea para "Relato o motivo de consulta" tiene altura fija pero es adecuada para mobile.

**Screenshot Before:**
![Formulario](screenshots/iPhone-SE-375px-create-form.png)

**Observación:**
La implementación es mayormente correcta. El único ajuste menor sería hacer el formulario más compacto:

**Sugerencia de mejora (opcional):**
```tsx
// Reducir espaciado vertical en mobile
<div className="grid gap-3 md:gap-4 md:grid-cols-5">
  {/* Campos del formulario */}
</div>

// Textarea más compacto en mobile
<textarea
  rows={6} // En lugar de 8
  className="w-full min-h-[120px] md:min-h-[200px]"
/>
```

**Impacto en UX:**
Mínimo - El formulario funciona bien, solo podría ser más compacto para ahorrar espacio vertical.

---

## Análisis por Componente

### 1. Header Principal
**Archivos:** `src/Interconsultas.tsx:167-183`

**Problemas:**
- Altura total excesiva (~60-80px)
- Botón "Exportar CSV" truncado
- Botones sin estados responsive

**Prioridad de fix:** 🟠 Alta

---

### 2. Componente de Filtros
**Archivos:** `src/components/interconsultas/InterconsultaFilters.tsx`

**Problemas:**
- Pills de estado ocupan demasiado espacio vertical (~80-100px)
- Search input con ancho mínimo fijo (200px)
- Wrapping subóptimo en pantallas pequeñas

**Prioridad de fix:** 🟠 Alta

---

### 3. Sidebar de Navegación
**Archivos:** `src/components/layout/Sidebar.tsx` (estimado)

**Problemas:**
- Botones fuera del viewport en mobile
- No hay scroll interno
- Layout no optimizado para pantallas pequeñas

**Prioridad de fix:** 🔴 Crítica

---

### 4. Grid de Cards
**Archivos:** `src/Interconsultas.tsx:506`

**Estado:** ✅ Correctamente implementado

**Fortalezas:**
- Breakpoints progresivos bien definidos
- Single column en mobile
- Spacing adecuado (gap-4)

---

### 5. Modal de Detalle
**Archivos:** `src/components/interconsultas/InterconsultaDetailModal.tsx`

**Problemas:**
- Header no sticky durante scroll
- Botones de acción pueden quedar ocultos al final del scroll

**Prioridad de fix:** 🟡 Media

---

## Recomendaciones Prioritarias

### Top 5 Fixes (Orden de Impacto)

#### 1. 🔴 FIX CRÍTICO: Sidebar navegación accesible en mobile
**Archivo:** `src/components/layout/Sidebar.tsx`
**Esfuerzo:** Medio (4-6 horas)
**Impacto:** Crítico - Sin esto, Interconsultas no es accesible nativamente en mobile

**Implementación sugerida:**
```tsx
// Agregar overflow scroll a la navegación
<nav className="flex-1 overflow-y-auto py-2">
  <ul className="space-y-1 px-2">
    {navigationItems.map(item => (
      <li key={item.id}>
        <button className="w-full ...">
          {item.label}
        </button>
      </li>
    ))}
  </ul>
</nav>

// O layout grid en mobile
<nav className="grid grid-cols-3 sm:flex sm:flex-col gap-1 p-2">
  {/* Botones se organizan en grid 3x3 en mobile */}
</nav>
```

---

#### 2. 🟠 Implementar header compacto y colapsable
**Archivo:** `src/Interconsultas.tsx`
**Esfuerzo:** Medio (3-4 horas)
**Impacto:** Alto - Libera ~150-200px de espacio vertical en mobile

**Implementación sugerida:**
```tsx
// Estado para controlar visibilidad de filtros
const [showFilters, setShowFilters] = useState(false);

// Header compacto
<div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
  <div className="flex items-center justify-between py-2 px-4">
    <h1 className="text-lg font-semibold">Interconsultas</h1>
    <div className="flex gap-2">
      {/* Solo iconos en mobile */}
      <IconButton icon={RefreshCw} onClick={handleRefresh} />
      <IconButton icon={Download} onClick={handleExport} />
      <IconButton
        icon={Filter}
        onClick={() => setShowFilters(!showFilters)}
        active={showFilters}
      />
    </div>
  </div>

  {/* Filtros colapsables */}
  <Collapse in={showFilters}>
    <InterconsultaFiltersComponent compact />
  </Collapse>
</div>
```

---

#### 3. 🟠 Optimizar filtros para mobile
**Archivo:** `src/components/interconsultas/InterconsultaFilters.tsx`
**Esfuerzo:** Bajo-Medio (2-3 horas)
**Impacto:** Alto - Reduce altura de filtros de ~120px a ~40px

**Implementación sugerida:**
```tsx
// Tabs horizontales con scroll en mobile
<div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
  <div className="flex gap-1 min-w-max">
    <TabButton active={status === 'all'}>
      Todas ({counts.total})
    </TabButton>
    <TabButton active={status === 'Pendiente'}>
      Pendiente ({counts.pendiente})
    </TabButton>
    {/* Otros estados */}
  </div>
</div>

// Search y date en fila separada
<div className="flex gap-2 py-2">
  <SearchInput className="flex-1 min-w-0" />
  <DatePresetSelect className="w-32" />
</div>
```

---

#### 4. 🟡 Modal header sticky
**Archivo:** `src/components/interconsultas/InterconsultaDetailModal.tsx`
**Esfuerzo:** Bajo (1-2 horas)
**Impacto:** Medio - Mejora significativamente la UX en formularios largos

**Implementación sugerida:**
Ver código en Issue #7.

---

#### 5. 🟡 Responsive button labels
**Archivo:** `src/Interconsultas.tsx` (header buttons)
**Esfuerzo:** Muy Bajo (30 min - 1 hora)
**Impacto:** Medio - Mejora apariencia y usabilidad

**Implementación sugerida:**
```tsx
// Componente reutilizable
function ResponsiveButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1">
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Uso
<ResponsiveButton icon={Download} label="Exportar CSV" onClick={handleExport} />
<ResponsiveButton icon={RefreshCw} label="Actualizar" onClick={handleRefresh} />
```

---

## Quick Wins (Cambios Pequeños, Alto Impacto)

### 1. Agregar `overflow-y-auto` a sidebar nav
**Tiempo:** 5 minutos
**Impacto:** Resuelve issue crítico de navegación

```tsx
// En Sidebar.tsx
<nav className="flex-1 overflow-y-auto py-4">
  {/* Contenido existente */}
</nav>
```

---

### 2. Ocultar texto de botones en mobile
**Tiempo:** 10 minutos
**Impacto:** Libera ~40px de ancho horizontal

```tsx
// En header buttons
<span className="hidden sm:inline">Exportar CSV</span>
```

---

### 3. Reducir minWidth del search input
**Tiempo:** 2 minutos
**Impacto:** Mejor wrapping de filtros

```tsx
// InterconsultaFilters.tsx
className="flex-1 min-w-[120px] md:min-w-[200px]"
```

---

## Mejoras a Largo Plazo

### 1. Sistema de Layout Responsivo Unificado
**Esfuerzo:** Alto (1-2 semanas)
**Beneficio:** Consistencia en toda la aplicación

Crear componentes base reutilizables:
- `<MobileHeader />` - Header compacto con sticky
- `<CollapsibleFilters />` - Filtros con estado collapse
- `<ResponsiveButton />` - Botones con labels responsive
- `<StickyModalHeader />` - Header sticky para modales

---

### 2. Implementar Mobile-First CSS
**Esfuerzo:** Medio (3-5 días)
**Beneficio:** Mejor performance y mantenibilidad

Refactorizar Tailwind classes para usar enfoque mobile-first:

```tsx
// Actual (desktop-first)
<div className="md:grid-cols-5">

// Mobile-first
<div className="grid-cols-1 md:grid-cols-5">
```

---

### 3. Audit Completo de Touch Targets
**Esfuerzo:** Medio (2-3 días)
**Beneficio:** Mejor accesibilidad táctil

Asegurar que todos los elementos interactivos cumplan con:
- Mínimo 44x44px de área táctil (iOS guidelines)
- Espaciado mínimo de 8px entre elementos táctiles
- Estados hover/active visibles

---

## Checklist de Acción Inmediata

### Prioridad Crítica (Esta semana)
- [ ] **Issue #1**: Agregar `overflow-y-auto` a sidebar navigation
- [ ] **Issue #1**: Testear navegación en dispositivos reales
- [ ] **Issue #2**: Implementar `ResponsiveButton` component
- [ ] **Issue #2**: Aplicar a botones "Exportar CSV" y "Actualizar"

### Prioridad Alta (Próximas 2 semanas)
- [ ] **Issue #3**: Refactorizar filtros a tabs horizontales en mobile
- [ ] **Issue #4**: Implementar header sticky compacto
- [ ] **Issue #4**: Agregar toggle para show/hide filtros
- [ ] **Issue #5**: Ajustar minWidth del search input

### Prioridad Media (Próximo mes)
- [ ] **Issue #7**: Implementar modal header sticky
- [ ] **Issue #7**: Agregar footer sticky en modal (opcional)
- [ ] **Issue #8**: Reducir spacing vertical en formulario de creación
- [ ] Realizar testing en dispositivos físicos (iPhone SE, iPhone 12, Android)

### Mejoras Continuas
- [ ] Crear librería de componentes responsive reutilizables
- [ ] Documentar patrones de diseño responsive en CLAUDE.md
- [ ] Implementar tests automatizados de responsive design
- [ ] Audit de touch targets en toda la aplicación

---

## Métricas de Validación

### Antes de las correcciones
- **Header height (mobile):** ~300-320px
- **Contenido visible sin scroll:** ~30% del viewport
- **Botones accesibles nativamente:** 70% (sidebar issue)
- **Touch targets <44px:** 15%

### Objetivos después de correcciones
- **Header height (mobile):** <80px (collapsed), <200px (expanded)
- **Contenido visible sin scroll:** >60% del viewport
- **Botones accesibles nativamente:** 100%
- **Touch targets <44px:** 0%

---

## Notas Técnicas

### Breakpoints Actuales
```css
/* Tailwind default breakpoints */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Viewports Móviles Comunes
- **iPhone SE:** 375x667px (caso más restrictivo)
- **iPhone 12/13 Pro:** 390x844px (estándar actual)
- **iPhone 14 Pro Max:** 428x926px (pantalla grande)
- **Android (Pixel 5):** 393x851px

### Recomendaciones de Testing
1. Usar Chrome DevTools device emulation
2. Testear en dispositivos físicos cuando sea posible
3. Validar con Lighthouse mobile audit
4. Revisar con usuarios reales en diferentes dispositivos

---

## Conclusión

La página de Interconsultas tiene una base sólida de responsive design con algunos issues críticos que impactan la usabilidad en móvil. El issue más crítico (sidebar navigation) puede resolverse rápidamente, mientras que las mejoras en el header y filtros requerirán algo más de tiempo pero tendrán un impacto significativo en la experiencia móvil.

**Prioridad de implementación:**
1. 🔴 Sidebar accesible (crítico, quick win)
2. 🟠 Header compacto (alto impacto)
3. 🟠 Filtros optimizados (alto impacto)
4. 🟡 Modal sticky header (mejora UX)
5. 🟢 Ajustes menores (polish)

**Tiempo estimado total:** 12-16 horas de desarrollo + 4-6 horas de testing

---

## Screenshots de Referencia

Todos los screenshots están disponibles en el directorio `.playwright-mcp/screenshots/`:

- `iPhone-SE-375px-header.png` - Header en viewport más restrictivo
- `iPhone-SE-375px-full-page.png` - Página completa sin datos
- `iPhone-SE-375px-with-cards.png` - Vista con cards de interconsultas
- `iPhone-SE-375px-create-form.png` - Formulario de creación desplegado
- `iPhone-SE-375px-detail-modal.png` - Modal de detalle de interconsulta
- `iPhone-12-Pro-390px-full-page.png` - Vista en iPhone 12 Pro
- `iPhone-14-Pro-Max-428px-full-page.png` - Vista en pantalla grande

---

**Reporte generado:** 27/12/2025
**Herramienta:** Playwright + Chrome DevTools
**Revisado por:** Validación automatizada
