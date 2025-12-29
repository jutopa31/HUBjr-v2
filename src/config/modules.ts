// Manifest de visibilidad de módulos para la migración del hub.
// Centraliza qué módulos permanecen en el núcleo y cuáles se exponen vía rutas/links auxiliares.

export type ModuleId =
  | 'inicio'
  | 'schedule'
  | 'pendientes'
  | 'ward-rounds'
  | 'interconsultas'
  | 'pacientes-post-alta'
  | 'saved-patients'
  | 'user-dashboard'
  | 'lumbar-punctures'
  | 'diagnostic'
  | 'academia'
  | 'ranking'
  | 'resident-management';

export type ModuleAudience = 'core' | 'auxiliary';

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  audience: ModuleAudience; // Qué público debe ver este módulo en el core
  corePath?: string; // Ruta dentro de la app original (si se mantiene o redirige)
  auxiliaryPath?: string; // Ruta o URL del namespace auxiliar si se mueve fuera del core
  notes?: string;
}

export const MODULES: Record<ModuleId, ModuleConfig> = {
  inicio: {
    id: 'inicio',
    label: 'Inicio',
    audience: 'core',
    corePath: '/',
    notes: 'Tab de aterrizaje actual; mantener mientras existan dependencias.'
  },
  'ward-rounds': {
    id: 'ward-rounds',
    label: 'Pase de Sala',
    audience: 'core',
    corePath: '/pase-de-sala'
  },
  pendientes: {
    id: 'pendientes',
    label: 'Pendientes',
    audience: 'core',
    corePath: '/pendientes'
  },
  schedule: {
    id: 'schedule',
    label: 'Cronograma',
    audience: 'core',
    corePath: '/cronograma'
  },
  interconsultas: {
    id: 'interconsultas',
    label: 'Interconsultas',
    audience: 'core',
    corePath: '/interconsultas'
  },
  'pacientes-post-alta': {
    id: 'pacientes-post-alta',
    label: 'Post alta',
    audience: 'core',
    corePath: '/post-alta'
  },
  'saved-patients': {
    id: 'saved-patients',
    label: 'Base de pacientes',
    audience: 'auxiliary',
    corePath: '/pacientes-guardados',
    auxiliaryPath: '/aux/pacientes-guardados',
    notes: 'Ocultar en core; mantener deep links o redirigir al namespace auxiliar.'
  },
  'user-dashboard': {
    id: 'user-dashboard',
    label: 'Mi Panel',
    audience: 'auxiliary',
    corePath: '/mi-panel',
    auxiliaryPath: '/aux/mi-panel'
  },
  'lumbar-punctures': {
    id: 'lumbar-punctures',
    label: 'Punciones Lumbares',
    audience: 'core',
    corePath: '/punciones-lumbares',
    auxiliaryPath: '/aux/punciones-lumbares'
  },
  diagnostic: {
    id: 'diagnostic',
    label: 'Evolucionador',
    audience: 'core',
    corePath: '/evolucionador',
    auxiliaryPath: '/aux/evolucionador'
  },
  academia: {
    id: 'academia',
    label: 'Academia',
    audience: 'core',
    corePath: '/academia',
    auxiliaryPath: '/aux/academia'
  },
  ranking: {
    id: 'ranking',
    label: 'Ranking',
    audience: 'auxiliary',
    corePath: '/ranking',
    auxiliaryPath: '/aux/ranking'
  },
  'resident-management': {
    id: 'resident-management',
    label: 'Gestión de Residentes',
    audience: 'auxiliary',
    corePath: '/gestion-residentes',
    auxiliaryPath: '/aux/gestion-residentes',
    notes: 'Requiere guard de admin; mover completo a namespace auxiliar.'
  }
};

export const CORE_MODULE_IDS: ModuleId[] = [
  'inicio',
  'ward-rounds',
  'pendientes',
  'interconsultas',
  'diagnostic',
  'pacientes-post-alta',
  'lumbar-punctures',
  'academia'
];

export const AUXILIARY_MODULE_IDS: ModuleId[] = [
  'saved-patients',
  'resident-management',
  'user-dashboard',
  'ranking'
];

export const DEFAULT_AUXILIARY_NAMESPACE = '/aux';
