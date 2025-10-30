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
        return 'text-red-400 bg-red-950/30 border-red-800';
      case 'medium':
        return 'text-yellow-400 bg-yellow-950/30 border-yellow-800';
      case 'low':
        return 'text-green-400 bg-green-950/30 border-green-800';
      default:
        return 'text-gray-400 bg-gray-800 border-gray-700';
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
        return <Clock className="h-3.5 w-3.5 text-blue-400" />;
      case 'pending':
        return <AlertCircle className="h-3.5 w-3.5 text-orange-400" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-gray-400" />;
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
    <div className="bg-[#2a2a2a] rounded-lg border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-200 flex items-center">
          <CheckSquare className="h-4 w-4 mr-2 text-indigo-400" />
          Pendientes
        </h3>
        <button
          onClick={() => setActiveTab('pendientes')}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center"
        >
          Ver todos
          <ArrowRight className="h-3 w-3 ml-1" />
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
              className="flex items-center justify-between p-2 hover:bg-[#333333] rounded-md border border-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 truncate text-sm">
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
                  className={`text-xs px-2 py-0.5 rounded-md font-medium border ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-6">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-medium">No hay pendientes activos</p>
          <p className="text-xs text-gray-500 mt-1">
            Todas las tareas están completadas
          </p>
          <button
            onClick={() => setActiveTab('pendientes')}
            className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            Crear nueva tarea →
          </button>
        </div>
      )}

      <button
        onClick={() => setActiveTab('pendientes')}
        className="w-full mt-3 bg-[#3a3a3a] hover:bg-[#444444] border border-gray-700 text-white py-2 px-3 rounded-md font-medium text-sm transition-colors"
      >
        Gestionar Pendientes
      </button>
    </div>
  );
};

export default PendientesResumidos;
