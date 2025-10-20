import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthContext } from './auth/AuthProvider';

interface Task {
  id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  patient_id?: string;
  source?: string;
  created_by?: string;
  created_at?: string;
}

interface PendientesResumidosProps {
  setActiveTab: (tab: string) => void;
}

const PendientesResumidos: React.FC<PendientesResumidosProps> = ({ setActiveTab }) => {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingTasks();
    }
  }, [user]);

  const fetchPendingTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching tasks:', error);
        // Mostrar datos de ejemplo si hay error
        setTasks([
          {
            id: '1',
            title: 'Revisar protocolo de ACV',
            priority: 'high',
            status: 'pending',
            due_date: '2025-01-15'
          },
          {
            id: '2',
            title: 'Preparar presentación ateneo',
            priority: 'medium',
            status: 'in_progress',
            due_date: '2025-01-10'
          }
        ]);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
      setTasks([]);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <CheckSquare className="h-5 w-5 mr-2 text-indigo-600" />
          Pendientes
        </h3>
        <button
          onClick={() => setActiveTab('pendientes')}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
        >
          Ver todos
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">Cargando pendientes...</p>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate text-sm">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                {task.due_date && (
                  <span className="text-xs text-gray-500">
                    {formatDate(task.due_date)}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No hay pendientes activos</p>
          <p className="text-xs text-gray-400 mt-1">
            Todas las tareas están completadas
          </p>
          <button
            onClick={() => setActiveTab('pendientes')}
            className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Crear nueva tarea →
          </button>
        </div>
      )}

      <button
        onClick={() => setActiveTab('pendientes')}
        className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
      >
        Gestionar Pendientes
      </button>
    </div>
  );
};

export default PendientesResumidos;
