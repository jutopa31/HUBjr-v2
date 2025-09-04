import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  Clock, 
  Users, 
  Brain, 
  Activity, 
  ArrowRight,
  FileText,
  Stethoscope,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getDashboardMetrics, getTodayEvents, getScaleUsageStats, getWeeklyActivitySummary } from './utils/dashboardQueries';

interface DashboardInicioProps {
  setActiveTab: (tab: string) => void;
  openScaleModal: (scaleId: string) => void;
}

const DashboardInicio: React.FC<DashboardInicioProps> = ({ setActiveTab, openScaleModal }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState({
    patientsEvaluated: 0,
    scalesCompleted: 0,
    wardRounds: 0,
    monthlyActivities: 0
  });
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [scaleStats, setScaleStats] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    evaluations: 0,
    patients: 0,
    events: 0
  });

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Cargar métricas desde Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Cargar métricas principales
        const dashboardMetrics = await getDashboardMetrics();
        setMetrics(dashboardMetrics);

        // Cargar eventos de hoy
        const events = await getTodayEvents();
        setTodayEvents(events);

        // Cargar estadísticas de escalas
        const scales = await getScaleUsageStats();
        setScaleStats(scales);

        // Cargar resumen semanal
        const weekly = await getWeeklyActivitySummary();
        setWeeklyStats(weekly);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickAccessButtons = [
    {
      id: 'diagnostic',
      title: 'Nueva Evaluación',
      subtitle: 'Algoritmos Diagnósticos',
      icon: Brain,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => setActiveTab('diagnostic')
    },
    {
      id: 'ward-rounds',
      title: 'Agregar al Pase',
      subtitle: 'Pase de Sala',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => setActiveTab('ward-rounds')
    },
    {
      id: 'saved-patients',
      title: 'Ver Pacientes',
      subtitle: 'Pacientes Guardados',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => setActiveTab('saved-patients')
    },
    {
      id: 'schedule',
      title: 'Cronograma',
      subtitle: 'Eventos Programados',
      icon: Calendar,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => setActiveTab('schedule')
    }
  ];

  // Mapear colores para las escalas más usadas
  const getScaleColor = (index: number) => {
    const colors = ['text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600'];
    return colors[index % colors.length];
  };

  // Función para formatear hora desde evento
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const assignments = {
    morning: 'Consultorio Neurología General',
    afternoon: 'Interconsultas Piso 4-5',
    supervisor: 'Dr. García (R4)'
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header Principal */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <Home className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">¡Bienvenidos!</h1>
              <p className="text-blue-100 text-lg">Residencia de Neurología</p>
              <p className="text-blue-200 text-sm">Hospital Nacional Posadas - Servicio de Neurología</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
            <div className="text-blue-200 capitalize">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-6 space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pacientes Evaluados */}
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pacientes Evaluados</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.patientsEvaluated}</p>
                <p className="text-xs text-gray-500 mt-1">Este mes</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Escalas Completadas */}
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Escalas Completadas</p>
                <p className="text-3xl font-bold text-green-600">{metrics.scalesCompleted}</p>
                <p className="text-xs text-gray-500 mt-1">Total aplicadas</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pases de Sala */}
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pases de Sala</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.wardRounds}</p>
                <p className="text-xs text-gray-500 mt-1">Esta semana</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Stethoscope className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Actividades del Mes */}
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Actividades del Mes</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.monthlyActivities}</p>
                <p className="text-xs text-gray-500 mt-1">Eventos completados</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Fila Principal: Actividades de Hoy + Accesos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Actividades de Hoy */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Actividades de Hoy
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todo →
              </button>
            </div>

            {/* Asignaciones del día */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Asignaciones del Día</h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Mañana:</span> {assignments.morning}</div>
                <div><span className="font-medium">Tarde:</span> {assignments.afternoon}</div>
                <div><span className="font-medium">Supervisor:</span> {assignments.supervisor}</div>
              </div>
            </div>

            {/* Lista de actividades */}
            <div className="space-y-3">
              {todayEvents.length > 0 ? todayEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <div className="flex-shrink-0 w-16 text-sm font-medium text-blue-600">
                    {formatEventTime(event.start_date)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.location || 'Ubicación no especificada'}</div>
                    {event.description && (
                      <div className="text-xs text-gray-500 mt-1">{event.description}</div>
                    )}
                  </div>
                  <div className="p-1 bg-green-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay actividades programadas para hoy</p>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver cronograma completo →
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('diagnostic')}
              className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Nueva Evaluación
            </button>
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Accesos Rápidos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickAccessButtons.map((button) => {
                const IconComponent = button.icon;
                return (
                  <button
                    key={button.id}
                    onClick={button.action}
                    className={`p-4 ${button.color} text-white rounded-lg transition-colors text-left`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm mb-1">{button.title}</div>
                        <div className="text-xs opacity-90">{button.subtitle}</div>
                      </div>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fila Inferior: Escalas Frecuentes + Resumen Semanal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Escalas Más Usadas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Escalas Más Usadas
            </h3>
            <div className="space-y-3">
              {scaleStats.length > 0 ? scaleStats.map((scale, index) => (
                <div key={scale.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`font-semibold ${getScaleColor(index)}`}>{scale.name}</div>
                    <span className="text-sm text-gray-600">{scale.uses} usos</span>
                  </div>
                  <button
                    onClick={() => openScaleModal(scale.name.toLowerCase())}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Aplicar
                  </button>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No hay datos de escalas aún</p>
                  <button
                    onClick={() => setActiveTab('diagnostic')}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Realizar primera evaluación →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Actividad */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Resumen Semanal
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">Esta Semana</div>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">{weeklyStats.evaluations}</span> evaluaciones • 
                  <span className="font-medium"> {weeklyStats.patients}</span> pacientes • 
                  <span className="font-medium"> {weeklyStats.events}</span> eventos
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">12</div>
                  <div className="text-xs text-gray-600">Lun-Mié</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">8</div>
                  <div className="text-xs text-gray-600">Jue-Vie</div>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <div className="text-lg font-bold text-purple-600">4</div>
                  <div className="text-xs text-gray-600">Fin Semana</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInicio;