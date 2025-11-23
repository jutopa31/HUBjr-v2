import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  FolderOpen,
  MessageSquare
} from 'lucide-react';
import { getTodayEvents } from './utils/dashboardQueries';
import PendientesResumidos from './components/PendientesResumidos';
import SectionHeader from './components/layout/SectionHeader';

interface DashboardInicioProps {
  setActiveTab: (tab: string) => void;
  openScaleModal: (scaleId: string) => void;
}

const DashboardInicio: React.FC<DashboardInicioProps> = ({ setActiveTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayEvents, setTodayEvents] = useState<any[]>([]);

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Cargar eventos de hoy
  useEffect(() => {
    const loadTodayEvents = async () => {
      try {
        const events = await getTodayEvents();
        setTodayEvents(events);
      } catch (error) {
        console.error('Error loading today events:', error);
      }
    };

    loadTodayEvents();
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
      id: 'ward-rounds',
      title: 'Pase',
      icon: Users,
      color: 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-700',
      iconColor: 'text-blue-600 dark:text-blue-300',
      action: () => setActiveTab('ward-rounds')
    },
    {
      id: 'diagnostic',
      title: 'Evolución',
      icon: FileText,
      color: 'bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-900/60 border border-green-200 dark:border-green-700',
      iconColor: 'text-green-600 dark:text-green-300',
      action: () => setActiveTab('diagnostic')
    },
    {
      id: 'saved-patients',
      title: 'Base de datos',
      icon: FolderOpen,
      color: 'bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-700',
      iconColor: 'text-purple-700 dark:text-purple-300',
      action: () => setActiveTab('saved-patients')
    },
    {
      id: 'interconsultas',
      title: 'Interconsultas',
      icon: MessageSquare,
      color: 'bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-700',
      iconColor: 'text-orange-600 dark:text-orange-300',
      action: () => setActiveTab('interconsultas')
    }
  ];

  // Función para formatear hora desde evento
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-[#1a1a1a]">
      {/* Header Principal */}
      <SectionHeader
        title={"A�Bienvenidos!"}
        icon={<Home className="h-6 w-6 text-accent" />}
        actions={
          <div className="text-right">
            <div className="text-lg font-semibold">{formatTime(currentTime)}</div>
            <div className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{formatDate(currentTime)}</div>
          </div>
        }
      />
      {false && (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-10 rounded-lg">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">¡Bienvenidos!</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{formatTime(currentTime)}</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs capitalize">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>) }

      {/* Contenido Principal */}
      <div className="p-4 space-y-4">
        {/* Fila Principal: Accesos Rápidos + Actividades de Hoy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Accesos Rápidos */}
          <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-700 dark:text-blue-400" />
              Accesos Rápidos
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {quickAccessButtons.map((button) => {
                const IconComponent = button.icon;
                return (
                  <button
                    key={button.id}
                    onClick={button.action}
                    className={`p-3 ${button.color} rounded-lg transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 group`}
                  >
                    <IconComponent className={`h-6 w-6 ${button.iconColor} group-hover:scale-110 transition-transform`} />
                    <span className={`font-medium text-sm ${button.iconColor}`}>
                      {button.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Actividades de Hoy */}
          <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                Actividades de Hoy
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium"
              >
                Ver todo →
              </button>
            </div>


            {/* Lista de actividades */}
            <div className="space-y-2">
              {todayEvents.length > 0 ? todayEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-md">
                  <div className="flex-shrink-0 w-14 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {formatEventTime(event.start_date)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-200">{event.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-500">{event.location || 'Ubicación no especificada'}</div>
                    {event.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">{event.description}</div>
                    )}
                  </div>
                  <div className="p-1 rounded-full" style={{
                    backgroundColor: 'color-mix(in srgb, var(--state-success) 20%, var(--bg-primary) 80%)'
                  }}>
                    <CheckCircle className="h-3 w-3" style={{ color: 'var(--state-success)' }} />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">No hay actividades programadas para hoy</p>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="mt-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Ver cronograma completo →
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('diagnostic')}
              className="w-full mt-3 bg-gray-100 dark:bg-[#3a3a3a] hover:bg-gray-200 dark:hover:bg-[#444444] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-2 px-3 rounded-md font-medium text-sm transition-colors"
            >
              Nueva Evaluación
            </button>
          </div>
        </div>

        {/* Fila Inferior: Pendientes Resumidos */}
        <PendientesResumidos setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default DashboardInicio;
