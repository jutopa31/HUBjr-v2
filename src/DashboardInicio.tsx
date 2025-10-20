import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  Users,
  Brain,
  FileText,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { getTodayEvents } from './utils/dashboardQueries';
import PendientesResumidos from './components/PendientesResumidos';

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
      subtitle: 'Pacientes ambulatorio',
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

  // Función para formatear hora desde evento
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {/* Fila Principal: Accesos Rápidos + Actividades de Hoy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>

        {/* Fila Inferior: Pendientes Resumidos */}
        <PendientesResumidos setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default DashboardInicio;
