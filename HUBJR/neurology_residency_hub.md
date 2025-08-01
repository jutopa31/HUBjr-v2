# HUBJR - Neurology Residency Hub
**Plataforma Integral para la Educación y Gestión de Residencias de Neurología**

---

## 1. Descripción General del Proyecto

### Visión
HUBJR es una plataforma digital integral diseñada para mejorar la experiencia educativa de los residentes de neurología mientras optimiza los procesos administrativos del servicio hospitalario. Actúa como centro unificado de recursos, herramientas clínicas, gestión académica y comunicación.

### Objetivos Principales

#### 1.1 Gestión Centralizada del Aprendizaje
- Acceso unificado a materiales educativos, guías clínicas y casos de estudio
- Biblioteca digital organizada por especialidades neurológicas
- Sistema de búsqueda avanzada para recursos académicos

#### 1.2 Herramientas de Evaluación Clínica
- **Algoritmos Diagnósticos**: Implementación de escalas neurológicas estandarizadas
- **Escalas Especializadas**: NIHSS, Glasgow, UPDRS I-IV, criterios diagnósticos de Parkinson
- **Sistema de Notas**: Integración automática de resultados en registros clínicos

#### 1.3 Programación y Gestión Académica
- **Tablón de Clase**: Calendario interactivo de actividades académicas
- **Asignaciones Semanales**: Dashboard de rotaciones y responsabilidades
- **Seguimiento de Asistencia**: Registro automático de participación en actividades

#### 1.4 Comunicación y Colaboración
- Sistema de mensajería integrado
- Notificaciones de eventos y anuncios
- Herramientas colaborativas para discusión de casos

## 2. Arquitectura Técnica Actual

### 2.1 Stack Tecnológico
- **Frontend**: React 18.2.0 con TypeScript
- **UI Framework**: Tailwind CSS 3.4.4
- **Icons**: Lucide React 0.400.0
- **Build Tool**: Vite 5.2.0
- **Linting**: ESLint con reglas TypeScript

### 2.2 Estructura de Componentes

```
src/
├── main.tsx                           # Punto de entrada de la aplicación
├── neurology_residency_hub.tsx        # Componente principal (1747 líneas)
├── DiagnosticAlgorithmContent.tsx     # Módulo de escalas médicas
├── ScaleModal.tsx                     # Modal para evaluaciones
├── types.ts                           # Definiciones de tipos TypeScript
└── calculateScaleScore.ts             # Lógica de cálculo de escalas
```

### 2.3 Funcionalidades Implementadas

#### Módulo de Algoritmos Diagnósticos
- **Escalas Neurológicas**:
  - NIHSS (National Institutes of Health Stroke Scale) - 15 ítems
  - Escala de Coma de Glasgow - 3 componentes
  - UPDRS I-IV (Unified Parkinson's Disease Rating Scale) - 4 secciones completas
  - Criterios Diagnósticos MDS 2015 para Parkinson

- **Interfaz de Usuario**:
  - Sidebar con escalas organizadas por categorías
  - Área de notas del paciente con integración automática
  - Sistema de modales para completar evaluaciones
  - Funcionalidad de copia al portapapeles

#### Tablón de Clase
- **Calendario de Eventos**:
  - Vista expandible de actividades académicas
  - Categorización por tipo (clínico, teórico, taller, investigación)
  - Información detallada: presentador, ubicación, duración

- **Asignaciones Semanales**:
  - Dashboard visual de rotaciones por día
  - Diferenciación entre residentes e internos
  - Código de colores por especialidad

- **Panel de Resumen**:
  - Métricas diarias de actividades
  - Accesos rápidos a otras secciones
  - Notificaciones importantes

#### Dashboard Principal
- **Métricas de Rendimiento**:
  - Actividades completadas: 24
  - Horas clínicas acumuladas: 156
  - Casos presentados: 8
  - Porcentaje de evaluaciones: 90%

- **Progreso Académico**:
  - Visualización circular de progreso por área
  - Teórico: 85%, Clínico: 78%, Investigación: 60%, Evaluaciones: 90%

#### Registro Asistencial
- Tracking de horas por modalidad (consultorio, sala, interconsultas)
- Registro histórico de actividades
- Métricas semanales consolidadas

## 3. Datos y Contenido del Sistema

### 3.1 Información de Usuario
- **Perfil**: Dr. Julián Alonso - R2
- **Institución**: Hospital Nacional Posadas
- **Servicio**: Neurología

### 3.2 Escalas Médicas Implementadas

#### NIHSS (National Institutes of Health Stroke Scale)
- 15 ítems de evaluación neurológica
- Puntuación: 0-42 puntos
- Uso: Evaluación de accidente cerebrovascular agudo

#### Escala de Coma de Glasgow
- 3 componentes: apertura ocular, respuesta verbal, respuesta motora
- Puntuación: 3-15 puntos
- Uso: Evaluación del nivel de conciencia

#### UPDRS (Unified Parkinson's Disease Rating Scale)
- **Parte I**: Estado Mental (4 ítems)
- **Parte II**: Actividades de la Vida Diaria (13 ítems)
- **Parte III**: Examen Motor (17 ítems)
- **Parte IV**: Complicaciones del Tratamiento (11 ítems)

#### Criterios Diagnósticos de Parkinson MDS 2015
- Criterios de inclusión y exclusión
- Elementos de apoyo diagnóstico
- Banderas rojas para diagnósticos alternativos

### 3.3 Actividades Académicas

#### Eventos Programados
- **Ateneo Clínico - Esclerosis Múltiple**: 24/07/2025, 14:00
- **Clase Teórica - Epilepsias Focales**: 25/07/2025, 10:00
- **Taller NIHSS**: 26/07/2025, 15:00
- **Ateneo Bibliográfico - Migrañas**: 28/07/2025, 16:00
- **Reunión de Servicio**: 29/07/2025, 08:00

#### Asignaciones por Día
- **Lunes**: Dr. García (R3) - Consultorio General / Dr. Alonso (R2) - Interconsultas
- **Martes**: Dra. López (R4) - Consultorio Epilepsias / Dra. Martín (R1) - Sala
- **Miércoles**: Dr. Pérez (R2) - EEG / Dr. González (R3) - Consultorio Cefaleas
- **Jueves**: Dra. Fernández (R4) - Demencias / Dr. Alonso (R2) - EEG
- **Viernes**: Dr. Silva (R1) - Neuroimágenes / Dra. Torres (R4) - Supervisión

## 4. Características de Usabilidad

### 4.1 Navegación
- **Menú Lateral**: 10 secciones principales con iconografía intuitiva
- **Estados Activos**: Indicación visual de sección actual
- **Notificaciones**: Sistema de badges para comunicaciones

### 4.2 Diseño Responsive
- **Layout Adaptivo**: Grid system con Tailwind CSS
- **Componentes Móviles**: Optimización para diferentes dispositivos
- **Accesibilidad**: Contraste adecuado y navegación por teclado

### 4.3 Experiencia de Usuario
- **Feedback Visual**: Estados hover y transiciones suaves
- **Carga de Contenido**: Lazy loading para componentes pesados
- **Persistencia**: Manejo de estado local para preferencias

## 5. Aspectos de Desarrollo

### 5.1 Patrones de Código
- **Hooks Personalizados**: useCallback para optimización de rendimiento
- **Componentización**: Separación clara de responsabilidades
- **TypeScript**: Tipado estricto para escalabilidad

### 5.2 Gestión de Estado
- **Estado Local**: useState para UI y preferencias
- **Props Drilling**: Paso de datos entre componentes padre-hijo
- **Memoización**: React.memo para componentes optimizados

### 5.3 Integración de Datos
- **Datos Estáticos**: Arrays de configuración para escalas y eventos
- **Cálculos Dinámicos**: Funciones para scoring automático
- **Validación**: Checks de integridad en formularios

## 6. Próximos Desarrollos Recomendados

### 6.1 Backend y Persistencia
- Implementación de API REST para datos
- Base de datos para usuarios y registros
- Sistema de autenticación y autorización

### 6.2 Funcionalidades Avanzadas
- **Reportes**: Generación de PDFs con resultados
- **Analytics**: Dashboard de métricas del servicio
- **Integración**: Conexión con sistemas hospitalarios (HIS)

### 6.3 Módulos Adicionales
- **Telemedicina**: Consultas remotas
- **Biblioteca Digital**: Gestión de recursos bibliográficos
- **Evaluaciones**: Sistema de exámenes online

### 6.4 Cumplimiento y Seguridad
- **HIPAA Compliance**: Cifrado de datos médicos
- **Auditoría**: Logs de acceso y modificaciones
- **Backup**: Estrategias de respaldo automático

## 7. Tecnologías y Estándares

### 7.1 Cumplimiento Médico
- Escalas validadas internacionalmente
- Nomenclatura estándar (ICD-10, SNOMED)
- Guías de práctica clínica actualizadas

### 7.2 Estándares de Desarrollo
- **ESLint**: Configuración con reglas médicas específicas
- **Prettier**: Formateo consistente de código
- **Git Hooks**: Validación pre-commit

### 7.3 Documentación
- **JSDoc**: Comentarios para funciones médicas
- **README**: Instrucciones de instalación y uso
- **Changelog**: Registro de versiones y cambios

---

**Última actualización**: 24 de Julio, 2025  
**Versión del proyecto**: 0.1.0  
**Estado**: En desarrollo activo  
**Mantenedor**: Equipo de Desarrollo HUBJR 