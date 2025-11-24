# 🧠 CLAUDE-MINIMAL.md - Guía Esencial para Agente IA (HUBJR)

## 🎯 1. Arquitectura & Stack
| Atributo | Valor | Base de Datos | Archivo Principal |
| :--- | :--- | :--- | :--- |
| **Tecnología** | Next.js 14, React 18, **TypeScript** | Supabase (PostgreSQL) | `src/neurology_residency_hub.tsx` |
| **Regla de Código**| **TypeScript-Only** (Strict Mode). Componentes **PascalCase**. | **RLS (Row-Level Security) Obligatorio.** | Lógica en `src/services/` y `src/hooks/`. |

---

## 🔐 2. Seguridad y Contexto (Prioridad Máxima)

### A. Contexto Hospitalario
* **Separación de Datos:** Los pacientes se aíslan por el campo `hospital_context` ('Posadas' o 'Julian').
* **Acceso Privilegiado:** El contexto 'Julian' solo es accesible con el permiso **`hospital_context_access`**.
* **Implementación:** El flujo de datos **DEBE** respetar el contexto activo.

### B. Sistema de Privilegios
* **Mecanismo:** Uso de la tabla **`admin_privileges`** de la DB (no por contraseña).
* **Verificación:** Implementado en **`src/hooks/useAuth.ts`**. Siempre verificar los permisos antes de CRUD.

---

## 🛠️ 3. Módulos y Flujos Clave
* **Gestión de Pacientes:** CRUD completo sobre **`patient_records`** y **`patient_notes`**. Se usa una vista de tabla **expandible/comprimida** (`WardRounds.tsx`, `SavedPatients.tsx`).
* **Escalas Médicas:** Más de 15 escalas (NIHSS, mRS, etc.). Ubicación: `src/ScaleModal.tsx`.
* **Sistema de Tareas:** Sincronización entre Pase de Sala y la tabla **`tasks`** (requiere setup SQL).
* **Integración IA (Futuro):** Implementación planeada de APIs reales (**GPT-4, Claude 3.5, Gemini Pro**) para análisis de texto médico avanzado, limitado a modo **`full_admin`**.

---

## 🚧 4. Debugging y Comandos Esenciales

### Comandos
```bash
npm run dev              # Iniciar servidor Next.js
npm run build            # Build de Producción
npx tsc --noEmit         # CRÍTICO: Verificación de tipos TypeScript
npm run lint             # Linting y estándares de código
npm run test             # Ejecutar tests (Prioridad: CRUD, Escalas, Navegación)