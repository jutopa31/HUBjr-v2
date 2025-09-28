# 🧠 Hub Médico - Backend Mínimo con Next.js + Vercel

## 🎯 Objetivo
Backend mínimo funcional para el Hub de Neurología usando **Next.js + Vercel Serverless Functions**.

## 🏗️ Arquitectura

### Frontend (Next.js)
- **Página principal**: `/pages/index.js` - Interfaz para crear y ver eventos
- **Estilos**: Tailwind CSS integrado desde `src/index.css`

### Backend (Serverless API)
- **API Events**: `/pages/api/events.js` - CRUD de eventos médicos
- **Almacenamiento**: En memoria (temporal, para pruebas)
- **CORS**: Configurado para desarrollo y producción

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local (Next.js)
npm run dev                    # → http://localhost:3000

# Desarrollo Vite (original)
npm run dev:vite              # → http://localhost:5173

# Producción
npm run build                 # Build para Vercel
npm start                     # Start servidor de producción

# Linting
npm run lint                  # ESLint para Next.js
```

## 📡 API Endpoints

### GET `/api/events`
Obtener eventos guardados con filtros opcionales.

**Query Parameters:**
- `category` - Filtrar por categoría (Clinical, Education, etc.)
- `limit` - Limitar número de resultados

**Respuesta:**
```json
{
  "events": [...],
  "total": 5,
  "filtered": 3,
  "categories": ["Clinical", "Education", "General"]
}
```

### POST `/api/events`
Crear nuevo evento médico.

**Body:**
```json
{
  "title": "Morning Rounds - Neurology",
  "link": "https://hospital.gov.ar/rounds",
  "category": "Clinical"
}
```

**Respuesta:**
```json
{
  "success": true,
  "event": {
    "id": "evt_1722484800_abc123",
    "title": "Morning Rounds - Neurology",
    "link": "https://hospital.gov.ar/rounds",
    "category": "Clinical",
    "createdAt": "2025-08-01T12:00:00.000Z"
  },
  "message": "Event created successfully"
}
```

## 🧪 Pruebas Locales

### 1. Iniciar servidor local
```bash
npm run dev
```

### 2. Abrir navegador
http://localhost:3000

### 3. Probar funcionalidad
- **Crear evento**: Completar formulario y enviar
- **Ver eventos**: Lista actualizada automáticamente
- **Filtrar**: Usar dropdown de categorías

### 4. Probar API directamente
```bash
# GET - Obtener eventos
curl http://localhost:3000/api/events

# POST - Crear evento
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","link":"https://test.com","category":"Test"}'
```

## 🌐 Desplegar en Vercel

### Opción 1: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login y deploy
vercel login
vercel --prod
```

### Opción 2: GitHub Integration
1. **Push a GitHub**:
   ```bash
   git add .
   git commit -m "feat: Next.js backend con API events"
   git push origin main
   ```

2. **Conectar en Vercel**:
   - Ir a [vercel.com](https://vercel.com)
   - Import Project desde GitHub
   - Seleccionar repositorio `hubjr`
   - Deploy automático

3. **URL de producción**:
   ```
   https://hubjr-neurology.vercel.app
   ```

## 📁 Estructura del Proyecto

```
hubjr/
├── pages/
│   ├── _app.js              # App wrapper para Next.js
│   ├── index.js             # Frontend principal
│   └── api/
│       └── events.js        # API serverless
├── src/                     # Componentes React originales
├── next.config.js           # Configuración Next.js
├── vercel.json             # Configuración Vercel
├── package.json            # Dependencies y scripts
└── README-BACKEND.md       # Esta documentación
```

## ⚡ Características Implementadas

### ✅ Frontend
- **Formulario reactivo** para crear eventos
- **Lista dinámica** de eventos guardados
- **Filtros por categoría** en tiempo real
- **Validación de URLs** en el cliente
- **Estados de carga** y manejo de errores
- **Diseño responsive** con CSS inline

### ✅ Backend API
- **CRUD completo** para eventos
- **Validación de datos** en servidor
- **Manejo de errores** robusto
- **CORS configurado** para desarrollo y producción
- **IDs únicos** generados automáticamente
- **Timestamps** de creación automáticos

### ✅ DevOps
- **Scripts duales** (Next.js + Vite)
- **Configuración Vercel** optimizada
- **Gitignore** actualizado
- **Hot reload** en desarrollo
- **Deploy automático** con git push

## 🔄 Migración Gradual

Este backend convive con tu aplicación Vite existente:

- **Desarrollo Next.js**: `npm run dev` → localhost:3000
- **Desarrollo Vite original**: `npm run dev:vite` → localhost:5173
- **APIs disponibles** en ambos entornos via proxy/CORS

## 🚀 Próximas Implementaciones Prioritarias

### 🧠 Sistema de Análisis IA Avanzado (Implementación Inmediata)
1. **APIs de IA reales**: Integración con OpenAI, Claude, Gemini
2. **Análisis de texto largo**: Procesamiento de documentos médicos extensos
3. **Resúmenes estructurados**: Generación automática de reportes médicos
4. **Modo administrativo**: Funciones avanzadas restringidas

### 📄 Sistema OCR Completo (Implementación Inmediata)  
1. **Extracción PDF**: Texto directo y OCR para documentos escaneados
2. **Procesamiento imágenes**: OCR para JPG, PNG, TIFF médicas
3. **Pipeline integrado**: OCR → IA → Resultados estructurados
4. **Validación segura**: Control estricto de archivos médicos

### 🔧 Implementaciones Backend Tradicionales
1. **Base de datos**: PostgreSQL/MongoDB completa
2. **Autenticación**: JWT + middleware de seguridad
3. **Más endpoints**: Expansión API médica
4. **Testing**: Unit tests para las APIs

## 🏥 Específico para Neurología

### Eventos Pre-configurados
- Morning Rounds - Neurology Ward
- NIHSS Training Session

### Categorías Médicas
- **Clinical**: Rounds, consultas, procedimientos
- **Education**: Entrenamientos, conferencias, seminarios
- **Research**: Estudios, publicaciones, análisis
- **Administrative**: Reuniones, reportes, documentación

---

**Desarrollado por**: Dr. Julián Alonso, Jefe de Residentes  
**Institución**: Hospital Nacional Posadas - Servicio de Neurología  
**Tecnología**: Next.js 14 + Vercel Serverless Functions