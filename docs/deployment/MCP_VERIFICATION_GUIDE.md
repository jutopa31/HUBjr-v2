# Guía de Verificación MCP y Uso de Herramientas

## 🔍 ¿Cómo saber si Claude Code está usando MCP y herramientas inteligentes?

Esta guía te ayuda a verificar que Claude Code está aprovechando al máximo las herramientas de arquitectura, MCP servers y refactoreo.

---

## 1. Verificar que MCP Servers estén activos

### Método 1: Comando de verificación
```bash
# En la terminal de Claude Code, ejecuta:
/tasks
```

Si MCP está activo, verás los servidores listados en las herramientas disponibles.

### Método 2: Buscar indicadores en respuestas
Cuando Claude usa MCP, verás mensajes como:
- "Usando mcp__filesystem__read_text_file..."
- "Con ripgrep MCP encontré..."
- "Navegando con filesystem MCP..."

### Método 3: Verificar logs
```bash
# Directorio de logs de Claude Code (Windows)
%USERPROFILE%\.claude\logs\

# Buscar mensajes de MCP servers
type %USERPROFILE%\.claude\logs\mcp.log | findstr "filesystem ripgrep shadcn supabase"
```

---

## 2. Servidores MCP Configurados

Tu proyecto tiene 4 MCP servers activos:

| Server | Función | Estado |
|--------|---------|--------|
| **filesystem** | Navegación inteligente de archivos | ✅ Activo |
| **ripgrep** | Búsqueda avanzada en código | ✅ Activo |
| **shadcn** | Integración de componentes UI | ✅ Activo |
| **supabase** | Contexto de base de datos | ✅ Activo |

---

## 3. Cómo forzar el uso de herramientas específicas

### Para navegación de código (filesystem):
```
📝 Prompt ejemplo:
"Usando el MCP filesystem, muéstrame la estructura completa del directorio src/components/"

"Navega por docs/database/ y dame un resumen de los archivos de setup SQL"
```

### Para búsqueda de código (ripgrep):
```
📝 Prompt ejemplo:
"Usa ripgrep MCP para buscar todas las funciones que usan supabase.from('diagnostic_assessments')"

"Con ripgrep, encuentra todos los lugares donde se importa 'hospitalContextService'"
```

### Para exploración arquitectural (Task + Explore):
```
📝 Prompt ejemplo:
"Usa el agente Explore para mapear cómo funciona el sistema de privilegios admin"

"Explora en paralelo (usando múltiples agentes) la arquitectura de autenticación y hospital context"
```

### Para refactoreo inteligente (Task + Plan):
```
📝 Prompt ejemplo:
"Usa el agente Plan para diseñar cómo refactorizar el sistema de escalas médicas"

"Entra en plan mode y analiza la mejor forma de extraer la lógica de WardRounds a un servicio"
```

---

## 4. Indicadores de que Claude está usando herramientas avanzadas

### ✅ Señales POSITIVAS (está usando herramientas):

1. **Menciona agentes específicos:**
   - "Voy a usar el agente Explore para..."
   - "Lanzaré el agente Plan en paralelo..."
   - "Usando el Task tool con subagent_type=Explore..."

2. **Muestra uso de MCP:**
   - "Usando mcp__filesystem__search_files..."
   - "Con ripgrep MCP encontré..."
   - "Navegando con filesystem MCP..."

3. **Usa herramientas en paralelo:**
   - "Voy a lanzar 3 agentes Explore en paralelo..."
   - "Ejecutando múltiples tool calls simultáneos..."

4. **Entra en plan mode:**
   - "Voy a entrar en plan mode para diseñar..."
   - "Creando plan en archivo .md..."

### ❌ Señales NEGATIVAS (no está usando herramientas):

1. **Usa comandos bash para buscar:**
   - "Ejecutando grep para buscar..."
   - "Usando find para localizar archivos..."
   - ⚠️ Debería usar Grep tool o ripgrep MCP

2. **Lee archivos uno por uno sin exploración:**
   - Lee 10+ archivos secuencialmente sin usar Explore
   - No menciona agentes ni MCP

3. **Hace cambios sin planear:**
   - Edita código inmediatamente sin EnterPlanMode
   - No usa TodoWrite para trackear tareas

---

## 5. Prompts "Mágicos" para maximizar uso de herramientas

### 🎯 Para tareas de exploración:
```
"Antes de empezar, usa agentes Explore en paralelo para entender:
1. La arquitectura actual de [feature]
2. Los patrones de código existentes
3. Las dependencias y servicios relacionados"
```

### 🎯 Para refactoreo complejo:
```
"Entra en plan mode y:
1. Explora la arquitectura actual con agentes Explore
2. Diseña el refactoreo con agente Plan
3. Presenta el plan para mi aprobación antes de implementar"
```

### 🎯 Para debugging con contexto:
```
"Usa ripgrep MCP para encontrar todos los usos de [función/componente]
y luego explica el flujo completo de datos"
```

### 🎯 Para verificación de uso de herramientas:
```
"Muéstrame explícitamente qué herramientas y agentes vas a usar para esta tarea,
y luego procede con la implementación"
```

---

## 6. Configuración MCP en tu proyecto

### Archivo: `.mcp.json`
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {}
    },
    "ripgrep": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-ripgrep"],
      "env": {}
    },
    "shadcn": {
      "command": "cmd",
      "args": ["/c", "npx", "shadcn@latest", "mcp"]
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

### Verificar configuración:
```bash
# Ver configuración actual
type .mcp.json

# Verificar que los paquetes MCP estén disponibles
npx @modelcontextprotocol/server-filesystem --version
npx @modelcontextprotocol/server-ripgrep --version
```

---

## 7. Checklist de verificación antes de cada tarea

Antes de empezar una tarea compleja, verifica:

- [ ] **MCP activo**: Claude menciona usar filesystem/ripgrep MCP
- [ ] **Agentes disponibles**: Claude puede lanzar Explore/Plan agents
- [ ] **Plan mode**: Claude puede entrar en plan mode para diseño
- [ ] **Parallel tools**: Claude ejecuta múltiples herramientas en paralelo
- [ ] **TodoWrite**: Claude usa TodoWrite para trackear tareas complejas

### Prompt de verificación rápida:
```
"Lista las herramientas y agentes que tienes disponibles para ayudarme con [tarea]"
```

---

## 8. Troubleshooting MCP

### Si Claude no usa MCP:

1. **Reinicia Claude Code:**
   ```bash
   # Cierra y reabre la sesión de Claude Code
   exit
   claude code
   ```

2. **Verifica .mcp.json:**
   ```bash
   # Asegúrate de que existe en la raíz del proyecto
   ls -la .mcp.json
   ```

3. **Verifica permisos:**
   ```bash
   # En Windows, asegúrate de que npx puede ejecutarse
   npx --version
   ```

4. **Fuerza el uso explícitamente:**
   ```
   "Usa ESPECÍFICAMENTE el MCP filesystem para leer docs/database/"
   ```

---

## 9. Mejores prácticas para desarrolladores

### ✅ DO (Hacer):
1. Pedir explícitamente uso de agentes para tareas complejas
2. Solicitar plan mode antes de refactoreos grandes
3. Verificar que Claude use MCP en lugar de bash grep/find
4. Revisar que Claude trackee tareas con TodoWrite

### ❌ DON'T (No hacer):
1. Asumir que las herramientas se usan automáticamente
2. Dejar que Claude use bash para búsquedas complejas
3. Permitir ediciones directas sin plan mode en refactoreos grandes
4. Ignorar cuando Claude no usa herramientas en paralelo

---

## 10. Comandos rápidos de verificación

### Verificar herramientas MCP disponibles
Pregunta a Claude:
```
"¿Qué herramientas MCP tienes disponibles en este proyecto?"
```

### Forzar uso de agentes
```
"Usa el agente Explore para analizar [componente/feature]"
"Entra en plan mode para diseñar [refactoreo/feature]"
```

### Verificar que use herramientas en paralelo
```
"Explora en paralelo (lanzando múltiples agentes) la arquitectura de [sistema]"
```

---

## 11. Plantilla de inicio de tarea óptima

Usa esta plantilla para asegurarte de que Claude use todas las herramientas disponibles:

```
Necesito [descripción de la tarea].

Antes de empezar:
1. Usa agentes Explore para entender la arquitectura actual
2. Usa ripgrep MCP para buscar código relacionado
3. Entra en plan mode si es una tarea compleja
4. Muéstrame qué herramientas vas a usar
5. Procede con la implementación usando TodoWrite para trackear

¿Entendido?
```

---

## Resumen

**Para asegurarte de que Claude use herramientas avanzadas:**

1. ✅ **Pide explícitamente** - No asumas uso automático
2. ✅ **Verifica indicadores** - Busca menciones de MCP y agentes
3. ✅ **Usa prompts mágicos** - Las plantillas de arriba fuerzan el uso
4. ✅ **Corrige cuando no use** - Di "usa agente Explore en lugar de grep"
5. ✅ **Revisa plan mode** - Para tareas complejas, insiste en planificación

**Tu configuración actual está LISTA ✓** - Solo necesitas pedirlo explícitamente en tus prompts.
