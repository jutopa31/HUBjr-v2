import React, { useState } from 'react';
import { Calendar, Users, BookOpen, FileText, MessageSquare, Activity, Settings, Bell, Home, Search, Plus, Download, Clock, User, Award, Brain, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

const NeurologyResidencyHub = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Panel Principal' },
    { id: 'academics', icon: BookOpen, label: 'Actividades Académicas' },
    { id: 'clinical', icon: Activity, label: 'Registro Asistencial' },
    { id: 'evaluations', icon: Award, label: 'Evaluaciones' },
    { id: 'resources', icon: FileText, label: 'Recursos' },
    { id: 'communication', icon: MessageSquare, label: 'Comunicación' },
    { id: 'schedule', icon: Calendar, label: 'Cronograma' },
    { id: 'profile', icon: User, label: 'Mi Perfil' }
  ];

  const upcomingActivities = [
    { title: 'Ateneo Clínico - Esclerosis Múltiple', date: '2025-07-23', time: '14:00', type: 'clinical' },
    { title: 'Clase Teórica - Epilepsias', date: '2025-07-24', time: '10:00', type: 'theory' },
    { title: 'Rotación Externa - Neuroimágenes', date: '2025-07-25', time: '08:00', type: 'rotation' },
    { title: 'Taller NIHSS', date: '2025-07-26', time: '15:00', type: 'workshop' }
  ];

  const recentAnnouncements = [
    { title: 'Nuevo protocolo de ACV agudo', date: '2025-07-20', priority: 'high' },
    { title: 'Jornadas SNA - Inscripción abierta', date: '2025-07-19', priority: 'medium' },
    { title: 'Actualización biblioteca digital', date: '2025-07-18', priority: 'low' }
  ];

  const academicProgress = {
    theoretical: 85,
    clinical: 78,
    research: 60,
    evaluations: 90
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, Dr. Julián Alonso</h1>
            <p className="text-blue-100">Residencia de Neurología - R2 | Hospital Nacional Posadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actividades Completadas</p>
              <p className="text-2xl font-bold text-green-600">24</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Clínicas</p>
              <p className="text-2xl font-bold text-blue-600">156</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Casos Presentados</p>
              <p className="text-2xl font-bold text-purple-600">8</p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Evaluaciones</p>
              <p className="text-2xl font-bold text-orange-600">90%</p>
            </div>
            <Award className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Próximas Actividades
          </h2>
          <div className="space-y-3">
            {upcomingActivities.map((activity, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  activity.type === 'clinical' ? 'bg-red-500' :
                  activity.type === 'theory' ? 'bg-blue-500' :
                  activity.type === 'rotation' ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.date} - {activity.time}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Anuncios
          </h2>
          <div className="space-y-3">
            {recentAnnouncements.map((announcement, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{announcement.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{announcement.date}</p>
                  </div>
                  <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                    announcement.priority === 'high' ? 'bg-red-500' :
                    announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Progreso Académico</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(academicProgress).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#e5e7eb" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - value / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{value}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 capitalize">
                {key === 'theoretical' ? 'Teórico' :
                 key === 'clinical' ? 'Clínico' :
                 key === 'research' ? 'Investigación' : 'Evaluaciones'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AcademicsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actividades Académicas</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            Todas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Clases Teóricas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Ateneos Clínicos
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Ateneos Bibliográficos
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
            Talleres
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Clase Teórica
              </span>
              <span className="text-sm text-gray-500">Lunes 14:00</span>
            </div>
            <h3 className="font-medium mb-2">Trastornos del Movimiento</h3>
            <p className="text-sm text-gray-600 mb-3">Dr. García - R3 y R4</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Material
              </button>
              <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                Unirse
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                Ateneo Clínico
              </span>
              <span className="text-sm text-gray-500">Miércoles 15:00</span>
            </div>
            <h3 className="font-medium mb-2">Caso: Encefalopatía Metabólica</h3>
            <p className="text-sm text-gray-600 mb-3">Residente R2 - Todos los años</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Historia
              </button>
              <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
                Preparar
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                Taller Práctico
              </span>
              <span className="text-sm text-gray-500">Viernes 16:00</span>
            </div>
            <h3 className="font-medium mb-2">Evaluación Cognitiva - MMSE</h3>
            <p className="text-sm text-gray-600 mb-3">Dra. López - R1 y R2</p>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                Protocolo
              </button>
              <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
                Inscribirse
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Mi Registro de Asistencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-gray-600">Clases Teóricas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">88%</p>
              <p className="text-gray-600">Ateneos Clínicos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">95%</p>
              <p className="text-gray-600">Talleres</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ClinicalContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Registro Asistencial</h2>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>Nueva Actividad</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Consultorio</p>
            <p className="text-2xl font-bold text-blue-800">12h</p>
            <p className="text-xs text-blue-600">Esta semana</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Sala</p>
            <p className="text-2xl font-bold text-green-800">8h</p>
            <p className="text-xs text-green-600">Esta semana</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Interconsultas</p>
            <p className="text-2xl font-bold text-orange-800">15</p>
            <p className="text-xs text-orange-600">Esta semana</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Procedimientos</p>
            <p className="text-2xl font-bold text-purple-800">3</p>
            <p className="text-xs text-purple-600">Esta semana</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-lg">Actividades Recientes</h3>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Consultorio Neurología</span>
              </div>
              <span className="text-sm text-gray-500">22/07/2025 - 14:00-18:00</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">4 pacientes atendidos - Seguimiento de epilepsias</p>
            <div className="flex space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Consultorio</span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">4 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'academics':
        return <AcademicsContent />;
      case 'clinical':
        return <ClinicalContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg">Neurología</h1>
              <p className="text-sm text-gray-600">Hospital Posadas</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.id === 'communication' && notifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default NeurologyResidencyHub;