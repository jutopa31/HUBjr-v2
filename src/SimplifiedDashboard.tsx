import React, { useState, useEffect } from 'react';
import { Calendar, Users, Syringe, CheckSquare, Activity, Clock, ChevronRight } from 'lucide-react';
import { useAuthContext } from './components/auth/AuthProvider';
import { HospitalContext } from './types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  hospitalContext: HospitalContext;
}

interface DashboardStats {
  todayPatients: number;
  pendingTasks: number;
  completedProcedures: number;
  recentActivity: Array<{
    id: string;
    type: 'patient' | 'procedure' | 'task';
    description: string;
    time: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

const SimplifiedDashboard: React.FC<DashboardProps> = ({ onNavigate, hospitalContext }) => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    todayPatients: 0,
    pendingTasks: 0,
    completedProcedures: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [hospitalContext, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual data loading from Supabase
      // For now, mock data to demonstrate the interface
      const mockStats: DashboardStats = {
        todayPatients: 3,
        pendingTasks: 2,
        completedProcedures: 1,
        recentActivity: [
          {
            id: '1',
            type: 'patient',
            description: 'Nueva evaluación: Juan P. - Cama 12',
            time: '10:30',
            priority: 'high'
          },
          {
            id: '2',
            type: 'procedure',
            description: 'Punción lumbar completada - María G.',
            time: '09:15',
            priority: 'medium'
          },
          {
            id: '3',
            type: 'task',
            description: 'Evaluación NIHSS pendiente - Carlos R.',
            time: '08:45',
            priority: 'medium'
          }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const StatCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: number;
    color: string;
    onClick?: () => void;
  }> = ({ icon: Icon, title, value, color, onClick }) => (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${onClick ? 'hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const ActivityItem: React.FC<{
    activity: DashboardStats['recentActivity'][0];
  }> = ({ activity }) => {
    const getPriorityColor = (priority?: string) => {
      switch (priority) {
        case 'high': return 'text-red-600 bg-red-50';
        case 'medium': return 'text-yellow-600 bg-yellow-50';
        case 'low': return 'text-green-600 bg-green-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'patient': return Users;
        case 'procedure': return Syringe;
        case 'task': return CheckSquare;
        default: return Activity;
      }
    };

    const Icon = getActivityIcon(activity.type);

    return (
      <div className="flex items-center py-3 px-4 hover:bg-gray-50 rounded-lg cursor-pointer">
        <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-900">{activity.description}</p>
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {activity.time}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, Dr. {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-600 mt-1">
            📅 {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            🏥 Hospital {hospitalContext}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Pacientes Hoy"
          value={stats.todayPatients}
          color="bg-blue-500"
          onClick={() => onNavigate('patients')}
        />
        <StatCard
          icon={CheckSquare}
          title="Pendientes"
          value={stats.pendingTasks}
          color="bg-yellow-500"
          onClick={() => onNavigate('patients')}
        />
        <StatCard
          icon={Syringe}
          title="Procedimientos"
          value={stats.completedProcedures}
          color="bg-green-500"
          onClick={() => onNavigate('patients')}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        {stats.recentActivity.length === 0 && (
          <div className="p-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">No hay actividad reciente</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('patients')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Ver Pacientes</span>
          </button>
          <button
            onClick={() => onNavigate('patients')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-sm font-medium">Nueva Evaluación</span>
          </button>
          <button
            onClick={() => onNavigate('resources')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Recursos</span>
          </button>
          <button
            onClick={() => onNavigate('patients')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Syringe className="h-8 w-8 text-red-500 mb-2" />
            <span className="text-sm font-medium">Procedimientos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedDashboard;