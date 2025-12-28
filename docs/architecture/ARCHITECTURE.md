# 🧠 HUBJR - Arquitectura del Sistema
**Mapa Maestro de Navegación para Código Médico**

---

## 🗺️ Vista General del Proyecto

**HUBJR** es un hub médico para residentes de neurología con arquitectura React/Next.js + Supabase, organizado en **contextos funcionales** para navegación eficiente.

### 📊 Métricas del Proyecto
- **Líneas de código**: ~15,000+ líneas TypeScript/React
- **Componentes principales**: 25+ componentes médicos
- **Tablas de BD**: 8+ tablas con RLS
- **Escalas médicas**: 15+ implementadas
- **Contextos hospitalarios**: 2 (Posadas + Julian)

---

## 🎯 Puntos de Entrada Críticos

### 🏠 **Aplicación Principal**
```
src/neurology_residency_hub.tsx (1,700+ líneas)
├── Sidebar navegación (10+ módulos médicos)
├── Sistema de tabs con estado
├── Integración contexto hospitalario
└── Router principal de características
```

### 🔗 **Entry Points Secundarios**
- `pages/index.js` → Carga el hub principal
- `src/neurology_residency_hub_v3.tsx` → Arquitectura experimental (NO usar en producción)

---

## 🧩 Arquitectura por Contextos Funcionales

### 🩺 **CONTEXTO MÉDICO-CLÍNICO**
*Cuando trabajes en funcionalidad médica/escalas/diagnósticos*

#### Componentes Core
```
src/DiagnosticAlgorithmContent.tsx    # Evolucionador - AI diagnóstico
├── Integración escalas médicas
├── Guardar pacientes con contexto hospitalario  
└── Notas clínicas con IA

src/ScaleModal.tsx                    # Modal de escalas neurológicas
├── 15+ escalas implementadas (NIHSS, Glasgow, UPDRS)
├── Cálculos automáticos
└── Integración con notas de paciente

src/calculateScaleScore.ts            # Lógica de cálculo de escalas
├── Funciones null-safe para cada escala
├── Interpretaciones clínicas
└── Validaciones médicas
```

#### Servicios Médicos
```
src/services/
├── neurologicalExamService.ts        # Exámenes neurológicos
├── patients.ts                       # Gestión de pacientes
└── lumbarPunctureService.ts          # Punciones lumbares
```

#### Comandos Claude Code para Contexto Médico
```bash
# Encontrar escalas médicas
rg "NIHSS|Glasgow|UPDRS|mRS|ASPECTS" src/ --type ts

# Localizar servicios de pacientes
find src/services -name "*patient*" -o -name "*medical*"

# Buscar cálculos de escalas
rg "calculateScore|interpretation" src/ --type ts
```

### 🔐 **CONTEXTO ADMINISTRATIVO**
*Para privilegios, autenticación, contexto hospitalario*

#### Componentes Core
```
src/components/auth/
├── AuthProvider.tsx                  # Proveedor de autenticación
├── AuthModal.tsx                     # Modal de login
├── SessionGuard.tsx                  # Protección de sesiones
└── ProtectedRoute.tsx               # Protección de rutas

src/AdminAuthModal.tsx               # Autenticación admin con privilegios
├── Auto-login para usuarios privilegiados
├── Integración sistema de privilegios
└── UI diferenciada por nivel de acceso
```

#### Sistema de Privilegios
```
src/utils/diagnosticAssessmentDB.ts  # CORE - Gestión de privilegios
├── checkUserPrivilege()              # Función principal de verificación
├── Tipos: hospital_context_access, full_admin, etc.
└── Integración con RLS de Supabase

src/services/hospitalContextService.ts # Gestión contexto hospitalario
├── Posadas (público) vs Julian (privilegiado)
├── Separación segura de datos
└── Filtrado por contexto
```

#### Setup de Base de Datos
```
database/
├── setup_admin_privileges.sql       # EJECUTAR PRIMERO - Sistema privilegios
├── supabase_diagnostic_assessments.sql # Tablas de pacientes
├── setup_ward_round_patients.sql    # Pase de sala
└── interconsultas_setup.txt         # Interconsultas
```

#### Comandos Claude Code para Contexto Admin
```bash
# Encontrar verificaciones de privilegios
rg "checkUserPrivilege|admin.*access" src/ --type ts

# Localizar configuración de autenticación
rg "auth|Auth" src/components/ --type tsx

# Buscar contexto hospitalario
rg "hospital.*context|Posadas|Julian" src/ --type ts
```

### 🎨 **CONTEXTO UI/UX**
*Para cambios de interfaz, tema, diseño*

#### Componentes de Layout
```
src/components/layout/
└── Sidebar.tsx                      # Navegación principal
    ├── Toggle colapsible manual
    ├── Búsqueda de secciones
    ├── Tooltips nativos
    └── Footer con menú de usuario

src/contexts/ThemeContext.tsx         # Contexto de tema oscuro/claro
├── Detección automática sistema
├── Persistencia localStorage
└── Aplicación global
```

#### Sistema de Estilos
```
src/index.css                        # Variables CSS globales
├── --bg-primary: #1a1a1a (tema oscuro)
├── --text-primary: #e5e5e5
├── Custom scrollbar styling
└── Estilos globales para inputs
```

#### Comandos Claude Code para Contexto UI
```bash
# Encontrar componentes de layout
find src/components -name "*Layout*" -o -name "*Sidebar*"

# Buscar estilos y temas
rg "className|bg-|text-" src/ --type tsx | head -20

# Localizar variables CSS
rg "--bg-|--text-|--border-" src/ --type css
```

### 📅 **CONTEXTO DATOS/EVENTOS**
*Para base de datos, eventos, sincronización*

#### Gestión de Datos
```
src/EventManagerSupabase.tsx         # Gestión eventos en tiempo real
├── CRUD completo con Supabase
├── Categorización de eventos médicos
├── Validación DateTime
└── UI inline editing

src/WardRounds.tsx                   # Pase de sala diario
├── Tracking pacientes
├── Estados de progreso
└── Integración con turnos
```

#### Configuración Supabase
```
src/utils/supabase.js                # Cliente Supabase
├── Configuración servidor y cliente
├── Variables de entorno requeridas
└── Inicialización de conexión
```

#### Comandos Claude Code para Contexto Datos
```bash
# Encontrar operaciones de base de datos
rg "supabase.*from|supabase.*select" src/ --type ts

# Buscar gestión de eventos
rg "event.*management|calendar" src/ --type tsx

# Localizar configuración de BD
find . -name "*supabase*" -o -name "*database*"
```

---

## 🔍 Patrones de Navegación Específicos

### 🚀 **Flujos de Trabajo Comunes**

#### 1. **Agregar Nueva Escala Médica**
```
Ruta: ScaleModal.tsx → calculateScaleScore.ts → types.ts
1. Definir interfaz en types.ts
2. Implementar cálculo en calculateScaleScore.ts  
3. Agregar UI en ScaleModal.tsx
4. Integrar en DiagnosticAlgorithmContent.tsx
```

#### 2. **Modificar Privilegios de Usuario**
```
Ruta: diagnosticAssessmentDB.ts → AdminAuthModal.tsx → RLS Policies
1. Verificar función checkUserPrivilege()
2. Actualizar lógica en AdminAuthModal.tsx
3. Modificar políticas RLS si es necesario
4. Probar con usuarios privilegiados y estándar
```

#### 3. **Agregar Funcionalidad Médica**
```
Ruta: services/ → components/ → neurology_residency_hub.tsx
1. Crear servicio en src/services/[feature]Service.ts
2. Desarrollar componente en src/components/[feature]/
3. Integrar en hub principal con tab de navegación
4. Configurar RLS en base de datos
```

### 🎯 **Comandos de Navegación Rápida**

```bash
# Vista general de la estructura
tree src/ -I node_modules -L 3

# Encontrar todos los servicios
find src/services -name "*.ts" | head -10

# Buscar componentes por funcionalidad
rg "export.*Component|export default.*function" src/components --type tsx

# Localizar configuraciones críticas  
rg "supabase|auth|privilege" src/utils --type ts

# Encontrar definiciones de tipos
rg "interface|type.*=" src/types.ts

# Buscar integraciones de escalas
rg "ScaleModal|calculateScore" src/ --type tsx
```

---

## 🏗️ Arquitectura Técnica

### 📦 **Stack Tecnológico**
- **Frontend**: React 18.2.0 + TypeScript 5.2.2
- **Framework**: Next.js 14.2.31 (hybrid SSR/SPA)
- **Base de Datos**: Supabase (PostgreSQL con RLS)
- **Estilos**: Tailwind CSS 3.4.4 + CSS Variables
- **Build**: Vite 5.2.0 (dev) + Next.js (prod)
- **Deploy**: Vercel con serverless functions

### 🔒 **Seguridad (RLS Pattern)**
```sql
-- Patrón para nuevas tablas
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (
  auth.uid()::text = user_id AND
  hospital_context IN (
    SELECT accessible_context 
    FROM user_contexts 
    WHERE user_id = auth.uid()
  )
);
```

### ⚡ **Performance Patterns**
```typescript
// Patrón de timeout para queries
const { data, error } = await Promise.race([
  supabase.from('table').select('*'),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 12000)
  )
]);
```

---

## 🚨 **Zonas Críticas - ¡Cuidado!**

### ⚠️ **NO TOCAR sin verificar**
1. **`neurology_residency_hub.tsx`** → Aplicación principal en producción
2. **`setup_admin_privileges.sql`** → Sistema de privilegios en BD
3. **`diagnosticAssessmentDB.ts`** → Lógica core de privilegios
4. **Variables de entorno** → Supabase keys en producción

### ⚠️ **Dependencias Críticas**
- **`calculateScaleScore.ts`** → 15+ escalas dependen de este archivo
- **`hospitalContextService.ts`** → Separación de datos crítica
- **RLS Policies** → Seguridad a nivel de base de datos

---

## 🎯 **Comandos Específicos por Tarea**

### 🔍 **Debugging de Producción**
```bash
# Verificar configuración de autenticación
rg "SUPABASE_.*KEY|auth.*uid" . --type env

# Encontrar logs de error
rg "console\.error|🔴.*Error" src/ --type ts

# Verificar privilegios de usuario
rg "julian\.martin\.alonso|checkUserPrivilege" src/ --type ts
```

### 🧪 **Testing de Funcionalidad**
```bash
# Probar escalas médicas
rg "test.*scale|scale.*test" --type ts

# Verificar operaciones CRUD
rg "insert|update|delete.*supabase" src/services --type ts

# Encontrar validaciones de entrada
rg "validation|validate" src/ --type ts
```

### 🚀 **Deploy y Build**
```bash
# Verificar configuración de build
cat next.config.js vite.config.ts

# Revisar variables de entorno requeridas
rg "NEXT_PUBLIC|process\.env" . --type ts --type js

# Verificar scripts de package.json
jq '.scripts' package.json
```

---

## 📋 **Checklist de Desarrollo**

### ✅ **Antes de Modificar Código**
- [ ] Leer documentación en `CLAUDE.md` para contexto específico
- [ ] Verificar privilegios de usuario si afecta autenticación
- [ ] Revisar políticas RLS si tocas base de datos
- [ ] Ejecutar `npx tsc --noEmit` para verificar tipos

### ✅ **Antes de Deploy**
- [ ] Ejecutar `npm run lint`
- [ ] Verificar variables de entorno en Vercel
- [ ] Probar con usuario admin y usuario estándar
- [ ] Verificar contexto hospitalario (Posadas + Julian)

### ✅ **Después de Agregar Funcionalidad**
- [ ] Actualizar `types.ts` si es necesario
- [ ] Documentar nuevos privilegios requeridos
- [ ] Agregar validaciones de entrada
- [ ] Implementar timeout protection para Supabase

---

## 🎯 **Próximos Pasos Sugeridos**

1. **Configurar MCP servers** para navegación automatizada
2. **Crear shortcuts** para operaciones comunes
3. **Implementar testing** sistemático
4. **Documentar APIs** en detalle

---

**📍 Ubicación**: Raíz del proyecto  
**🔄 Actualizado**: Diciembre 2025  
**👨‍⚕️ Mantenido por**: Dr. Julián Alonso - Jefe de Residentes Neurología
