# Plantillas de Prompts para Maximizar Uso de Herramientas

Copia y pega estos prompts para asegurarte de que Claude Code use MCP servers, agentes y herramientas avanzadas.

---

## 🔍 Verificación de Herramientas

### Listar herramientas disponibles
```
¿Qué herramientas MCP y agentes tienes disponibles en este proyecto?
```

### Verificar configuración MCP
```
Muéstrame la configuración actual de MCP servers en .mcp.json y confirma cuáles están activos.
```

---

## 🔎 Exploración de Código

### Exploración básica con agente Explore
```
Usa el agente Explore para mapear cómo funciona [nombre del sistema/feature].
Quiero entender la arquitectura, componentes principales y flujo de datos.
```

### Exploración en paralelo (múltiples aspectos)
```
Usa múltiples agentes Explore en paralelo para analizar:
1. La arquitectura de [sistema A]
2. Los patrones de código en [sistema B]
3. Las dependencias y servicios relacionados con [sistema C]
```

### Búsqueda con ripgrep MCP
```
Usa ripgrep MCP para buscar todos los lugares donde se usa [función/componente/variable].
Muéstrame el contexto de cada uso y explica el flujo.
```

### Navegación con filesystem MCP
```
Usando el MCP filesystem, explora la estructura completa de [directorio]
y dame un resumen de la organización y propósito de cada subdirectorio.
```

---

## 🏗️ Planificación y Diseño

### Entrar en plan mode para refactoreo
```
Entra en plan mode para diseñar el refactoreo de [componente/sistema].

Proceso:
1. Explora con agentes Explore la arquitectura actual
2. Diseña el plan de refactoreo con agente Plan
3. Presenta el plan para mi aprobación antes de implementar
```

### Diseño de nueva feature
```
Necesito implementar [descripción de la feature].

Antes de empezar:
1. Usa agentes Explore para entender patrones existentes similares
2. Entra en plan mode para diseñar la arquitectura
3. Muéstrame el plan completo con archivos críticos a modificar
4. Espera mi aprobación antes de implementar
```

### Análisis de impacto de cambios
```
Usa el agente Explore para analizar el impacto de cambiar [componente/función].
Muéstrame:
- Qué archivos dependen de esto
- Qué otros sistemas se verían afectados
- Riesgos potenciales del cambio
```

---

## 🐛 Debugging y Análisis

### Debugging con contexto completo
```
Tengo un bug en [descripción del bug].

Proceso de debugging:
1. Usa ripgrep MCP para encontrar código relacionado
2. Usa agente Explore para entender el flujo completo
3. Identifica la causa raíz
4. Propón solución y muestra plan antes de implementar
```

### Análisis de flujo de datos
```
Usa ripgrep MCP y agente Explore para trazar el flujo completo de datos
desde [punto A] hasta [punto B]. Muéstrame cada paso del proceso.
```

### Encontrar código duplicado
```
Usa ripgrep MCP para buscar código duplicado o similar a [patrón].
Identifica oportunidades de refactoreo para eliminar duplicación.
```

---

## 📝 Tareas Complejas

### Plantilla de inicio óptimo (COPIAR Y PEGAR)
```
Necesito [descripción detallada de la tarea].

Requisitos de proceso:
1. ✅ Usa agentes Explore para entender arquitectura actual
2. ✅ Usa ripgrep MCP para buscar código relacionado
3. ✅ Entra en plan mode si la tarea es compleja
4. ✅ Usa TodoWrite para trackear subtareas
5. ✅ Muéstrame qué herramientas vas a usar antes de empezar
6. ✅ Ejecuta herramientas en paralelo cuando sea posible

¿Entendido? Procede con el análisis.
```

### Refactoreo grande
```
Necesito refactorizar [descripción del código/sistema].

Proceso obligatorio:
1. Entra en plan mode
2. Lanza agentes Explore en paralelo para:
   - Mapear dependencias
   - Identificar patrones de uso
   - Encontrar código relacionado con ripgrep MCP
3. Diseña el plan de refactoreo con agente Plan
4. Muestra el plan completo con:
   - Archivos a modificar
   - Orden de cambios
   - Riesgos identificados
5. Espera mi aprobación
6. Implementa usando TodoWrite para trackear

Empieza con la exploración.
```

### Migración de código
```
Necesito migrar [código/feature] de [ubicación A] a [ubicación B].

Antes de empezar:
1. Usa agente Explore para entender [código actual]
2. Usa ripgrep MCP para encontrar todas las dependencias
3. Entra en plan mode para diseñar la migración
4. Muéstrame el plan con lista completa de archivos a modificar
5. Implementa solo después de mi aprobación
```

---

## 🔄 Corrección cuando Claude NO usa herramientas

### Si usa bash grep en lugar de herramientas
```
❌ No uses comandos bash grep/find.
✅ Usa ripgrep MCP o la herramienta Grep de Claude Code.

Reintenta la búsqueda usando las herramientas correctas.
```

### Si lee archivos secuencialmente sin explorar
```
❌ No leas archivos uno por uno manualmente.
✅ Usa el agente Explore para mapear la arquitectura primero.

Reintenta usando agente Explore.
```

### Si edita directamente sin planear
```
❌ No hagas cambios directamente sin planificación.
✅ Entra en plan mode primero para diseñar los cambios.

Detente y entra en plan mode antes de continuar.
```

### Si no usa herramientas en paralelo
```
Veo que estás ejecutando herramientas secuencialmente.
✅ Usa múltiples tool calls en paralelo para mayor eficiencia.

Reintenta lanzando [X] agentes Explore en paralelo.
```

---

## 🎯 Prompts Específicos para HUBJR

### Explorar sistema de privilegios admin
```
Usa el agente Explore para mapear completamente el sistema de privilegios admin.

Incluye:
- Archivo: utils/diagnosticAssessmentDB.ts
- Función checkUserPrivilege()
- Componentes que usan privilegios
- Tabla admin_privileges en base de datos
- Flujo completo de autenticación admin
```

### Explorar Hospital Context System
```
Usa agentes Explore en paralelo para analizar:
1. HospitalContextSelector.tsx y su integración
2. hospitalContextService.ts y su lógica
3. Uso de ripgrep MCP para encontrar todos los lugares con "hospital_context"
4. RLS policies que implementan separación de contextos

Dame un mapa completo del sistema.
```

### Explorar flujo de Evolucionador
```
Necesito entender el flujo completo del Evolucionador.

Usa agentes Explore para mapear:
1. DiagnosticAlgorithmContent.tsx (componente principal)
2. diagnosticAssessmentDB.ts (operaciones DB)
3. Servicios relacionados
4. Componentes de UI que usa
5. Flujo de datos desde input hasta guardado

Muestra diagrama de flujo textual.
```

### Buscar todas las tablas Supabase usadas
```
Usa ripgrep MCP para buscar todos los usos de "supabase.from()"
en el proyecto. Agrúpalos por tabla y muéstrame:
- Nombre de tabla
- Archivos que la usan
- Tipo de operaciones (SELECT, INSERT, UPDATE, DELETE)
```

---

## 📚 Prompts de Aprendizaje

### Entender un componente desconocido
```
Necesito entender completamente [nombre del componente].

Proceso:
1. Usa agente Explore para analizar el archivo principal
2. Usa ripgrep MCP para encontrar dónde se usa
3. Identifica sus dependencias y componentes relacionados
4. Explícame su propósito y funcionamiento

Dame un resumen ejecutivo al final.
```

### Documentar una feature
```
Necesito documentar [nombre de la feature].

Usa agentes Explore para:
1. Mapear la arquitectura completa
2. Identificar componentes principales
3. Entender flujo de datos
4. Encontrar casos de uso con ripgrep MCP

Genera documentación en formato markdown.
```

---

## ✅ Checklist Pre-Tarea

Antes de empezar cualquier tarea compleja, usa este prompt:

```
Checklist de herramientas para esta tarea:

Confirma que vas a usar:
- [ ] Agente Explore (si necesitas entender arquitectura)
- [ ] Agente Plan (si necesitas diseñar implementación)
- [ ] Plan mode (si es refactoreo complejo)
- [ ] ripgrep MCP (si necesitas buscar en código)
- [ ] filesystem MCP (si necesitas navegar directorios)
- [ ] TodoWrite (si hay múltiples subtareas)
- [ ] Herramientas en paralelo (cuando sea posible)

Muéstrame el checklist marcado antes de empezar.
```

---

## 💡 Tips Finales

### Para maximizar eficiencia:
1. **Siempre pide explícitamente** el uso de agentes y MCP
2. **Verifica** que Claude mencione las herramientas que usa
3. **Corrige** cuando use bash en lugar de herramientas nativas
4. **Insiste** en plan mode para cambios complejos
5. **Exige** uso de TodoWrite para trackear tareas

### Prompt genérico de verificación:
```
Antes de continuar, muéstrame:
1. Qué agentes vas a usar
2. Qué herramientas MCP vas a ejecutar
3. Si vas a usar plan mode
4. Cómo vas a trackear las subtareas

Luego procede con la implementación.
```

---

## 🚀 Uso de Estas Plantillas

1. **Copia el prompt** de la sección relevante
2. **Personaliza** [los campos entre corchetes]
3. **Pégalo** en tu conversación con Claude Code
4. **Verifica** que Claude mencione usar las herramientas
5. **Corrige** si no usa las herramientas adecuadas

**Tu configuración MCP está lista** - solo necesitas usar estos prompts! ✨
