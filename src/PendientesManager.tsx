import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Edit3, Save, X, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from './utils/supabase.js';
import { syncAllPendientes, completeTaskAndClearPatientPendientes } from './utils/pendientesSync';

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
  updated_at?: string;
}

const PendientesManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [_editingTask, setEditingTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: ''
  });

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase fetch error:', error);
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('La tabla tasks no existe en Supabase. Creando estructura de ejemplo...');
          setTasks([
            {
              id: '1',
              title: 'Revisar protocolo de ACV',
              description: 'Actualizar protocolo según nuevas guías internacionales',
              priority: 'high',
              status: 'pending',
              due_date: '2025-01-15',
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Preparar presentación ateneo',
              description: 'Caso clínico de epilepsia refractaria',
              priority: 'medium',
              status: 'in_progress',
              due_date: '2025-01-10',
              created_at: new Date().toISOString()
            }
          ]);
        }
      } else {
        setTasks(tasks || []);
      }
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setTasks([]);
    }
    setLoading(false);
  };

  // Sync with ward rounds
  const handleSyncWithWardRounds = async () => {
    setSyncing(true);
    try {
      const success = await syncAllPendientes();
      if (success) {
        await fetchTasks(); // Refresh the task list
        alert('Sincronización completada exitosamente');
      } else {
        alert('Error durante la sincronización');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Error durante la sincronización');
    }
    setSyncing(false);
  };

  // Add new task
  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Error adding task:', error);
        // Fallback to local state if Supabase fails
        const localTask: Task = {
          id: Date.now().toString(),
          ...newTask,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTasks([localTask, ...tasks]);
      } else {
        setTasks([...data, ...tasks]);
      }
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error adding task:', err);
    }
    setLoading(false);
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      // Si la tarea se está marcando como completada y es del pase de sala, usar la función especializada
      const task = tasks.find(t => t.id === taskId);
      if (newStatus === 'completed' && task?.source === 'ward_rounds') {
        const success = await completeTaskAndClearPatientPendientes(taskId, true);
        if (success) {
          // Update local state
          setTasks(tasks.map(t => 
            t.id === taskId 
              ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
              : t
          ));
        } else {
          alert('Error al completar la tarea del pase de sala');
        }
        return;
      }

      // Para tareas normales, actualización estándar
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) {
        console.error('Error updating task:', error);
      }
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) {
        console.error('Error deleting task:', error);
      }
      
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };


  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    const sourceMatch = filterSource === 'all' || 
      (filterSource === 'ward_rounds' && task.source === 'ward_rounds') ||
      (filterSource === 'manual' && task.source !== 'ward_rounds');
    return statusMatch && priorityMatch && sourceMatch;
  });

  // Get priority icon and color
  const getPriorityDisplay = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Alta' };
      case 'medium':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Media' };
      case 'low':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Baja' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-50', label: 'Media' };
    }
  };

  // Get status display
  const getStatusDisplay = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completada' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', label: 'En Progreso' };
      case 'pending':
        return { color: 'bg-gray-100 text-gray-800', label: 'Pendiente' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Pendiente' };
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Pendientes</h1>
              <p className="text-purple-100 text-lg">Lista de tareas y recordatorios</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-white bg-opacity-20 px-4 py-2 transition-all hover:bg-opacity-30 sm:w-auto"
              disabled={loading}
            >
              <Plus className="h-5 w-5" />
              <span>{showForm ? 'Cerrar formulario' : 'Nueva Tarea'}</span>
            </button>
            <button
              onClick={handleSyncWithWardRounds}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 bg-opacity-80 px-4 py-2 text-white transition-all hover:bg-opacity-100 sm:w-auto"
              disabled={syncing || loading}
            >
              <Users className="h-5 w-5" />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Pase'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className="text-sm font-medium text-purple-600"
          >
            {isFilterPanelOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className={`${isFilterPanelOpen ? 'block' : 'hidden'} px-4 pb-4 md:block md:px-6 md:pb-6`}>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="hidden h-5 w-5 text-gray-500 md:block" />
              <span className="hidden text-sm font-medium md:inline">Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Estado:</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Prioridad:</label>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Origen:</label>
              <select 
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="all">Todas</option>
                <option value="ward_rounds">Pase de Sala</option>
                <option value="manual">Manuales</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {filteredTasks.length} de {tasks.length} tareas
            </div>
          </div>
        </div>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Tarea</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Ingresa el título de la tarea"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 h-24"
                placeholder="Descripción detallada (opcional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <button
                onClick={addTask}
                disabled={loading || !newTask.title.trim()}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Guardando...' : 'Guardar Tarea'}</span>
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center space-x-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Lista de Tareas ({filteredTasks.length})</h2>
          <div className="text-sm text-gray-500">{loading ? 'Sincronizando...' : 'Conectado a Supabase'}</div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No hay tareas</h3>
            <p className="text-gray-400">
              {tasks.length === 0 
                ? 'Agrega tu primera tarea para comenzar'
                : 'No hay tareas que coincidan con los filtros seleccionados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const priorityDisplay = getPriorityDisplay(task.priority);
              const statusDisplay = getStatusDisplay(task.status);
              const PriorityIcon = priorityDisplay.icon;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

              return (
                <div 
                  key={task.id}
                  className={`border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md ${
                    task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white'
                  } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                            updateTaskStatus(task.id!, newStatus);
                          }}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            task.status === 'completed' 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        </button>
                        
                        <h3 className={`font-medium ${
                          task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        
                        {task.source === 'ward_rounds' && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800">
                            <Users className="h-3 w-3" />
                            <span>Pase de Sala</span>
                          </span>
                        )}
                        
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityDisplay.color}`}>
                          <PriorityIcon className="h-3 w-3" />
                          <span>{priorityDisplay.label}</span>
                        </div>
                        
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>

                        {isOverdue && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Vencida
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-2 ${
                          task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                        {task.created_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Creada: {new Date(task.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-0 flex flex-wrap items-center gap-2 md:ml-4 md:flex-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id!, e.target.value as Task['status'])}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completada</option>
                      </select>
                      
                      <button
                        onClick={() => setEditingTask(task.id!)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteTask(task.id!)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendientesManager;