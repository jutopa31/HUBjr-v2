import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Edit3, Save, X, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from './utils/supabase.js';
import { syncAllPendientes, completeTaskAndClearPatientPendientes } from './utils/pendientesSync';
import { useAuthContext } from './components/auth/AuthProvider';
import SectionHeader from './components/layout/SectionHeader';

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
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [_editingTask, setEditingTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: ''
  });

  // Apply section accent for this view
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = 'patients';
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete (document.body as any).dataset.section;
      }
    };
  }, []);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    if (!user) {
      console.log('No user authenticated, skipping task fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);

        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setError('La tabla de tareas no está configurada en la base de datos. Por favor, ejecute el script fix_tasks_table_security.sql');
          console.warn('La tabla tasks no existe en Supabase. Mostrando datos de ejemplo...');
          setTasks([
            {
              id: '1',
              title: 'Revisar protocolo de ACV',
              description: 'Actualizar protocolo según nuevas guías internacionales',
              priority: 'high',
              status: 'pending',
              due_date: '2025-01-15',
              created_at: new Date().toISOString(),
              created_by: user.id
            },
            {
              id: '2',
              title: 'Preparar presentación ateneo',
              description: 'Caso clínico de epilepsia refractaria',
              priority: 'medium',
              status: 'in_progress',
              due_date: '2025-01-10',
              created_at: new Date().toISOString(),
              created_by: user.id
            }
          ]);
        } else if (error.code === '42501') {
          setError('Sin permisos para acceder a las tareas. Verifique las políticas RLS.');
        } else {
          setError(`Error al cargar tareas: ${error.message}`);
        }
      } else {
        setTasks(tasks || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError('Error de conexión al cargar las tareas');
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
    if (!user) {
      setError('Debe estar autenticado para crear tareas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskData = {
        ...newTask,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();

      if (error) {
        console.error('Error adding task:', error);
        if (error.code === 'PGRST116') {
          setError('Tabla de tareas no configurada. Ejecute fix_tasks_table_security.sql');
        } else if (error.code === '42501') {
          setError('Sin permisos para crear tareas. Verifique las políticas RLS.');
        } else {
          setError(`Error al crear tarea: ${error.message}`);
        }

        // Fallback to local state if Supabase fails
        const localTask: Task = {
          id: Date.now().toString(),
          ...taskData
        };
        setTasks([localTask, ...tasks]);
      } else {
        setTasks([...data, ...tasks]);
        setError(null);
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
      setError('Error de conexión al crear la tarea');
    }
    setLoading(false);
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    if (!user) {
      setError('Debe estar autenticado para actualizar tareas');
      return;
    }

    try {
      setError(null);

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
          setError('Error al completar la tarea del pase de sala');
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
        if (error.code === '42501') {
          setError('Sin permisos para actualizar esta tarea');
        } else {
          setError(`Error al actualizar tarea: ${error.message}`);
        }
        return;
      }

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Error de conexión al actualizar la tarea');
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

  const columns: { id: Task['status']; title: string; helper: string }[] = [
    { id: 'pending', title: 'Pendientes', helper: 'Tareas por hacer' },
    { id: 'in_progress', title: 'En progreso', helper: 'Tareas en curso' }
  ];

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (event: React.DragEvent<HTMLDivElement>, columnId: Task['status']) => {
    event.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDropOnColumn = (columnId: Task['status']) => {
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, columnId);
    }
    setDragOverColumn(null);
    setDraggedTaskId(null);
  };

  // Get priority icon and color
  const getPriorityDisplay = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { icon: AlertCircle, color: 'text-gray-800 bg-red-50', label: 'Alta' };
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
        return { color: 'bg-green-100 text-gray-800', label: 'Completada' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', label: 'En Progreso' };
      case 'pending':
        return { color: 'bg-gray-100 text-gray-800', label: 'Pendiente' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Pendiente' };
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Autenticación Requerida</h3>
          <p className="text-gray-400">Debe iniciar sesión para ver y gestionar las tareas pendientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-700 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-gray-800">Error</h3>
              <p className="text-sm text-gray-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-blue-700 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <SectionHeader
        title="Pendientes"
        icon={<CheckSquare className="h-6 w-6 text-accent" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded-md transition-all text-white text-xs font-medium"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              <span>{showForm ? 'Cerrar' : 'Nueva Tarea'}</span>
            </button>
            <button
              onClick={handleSyncWithWardRounds}
              className="flex items-center space-x-1.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md transition-all text-white text-xs font-medium"
              disabled={syncing || loading}
            >
              <Users className="h-4 w-4" />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="medical-card">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Filter className="h-5 w-5" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className="text-sm font-medium text-blue-700"
          >
            {isFilterPanelOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div className={`${isFilterPanelOpen ? 'block' : 'hidden'} px-4 pb-4 md:block md:px-6 md:pb-6`}>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Filter className="hidden h-5 w-5 md:block" />
              <span className="hidden text-sm font-medium md:inline">Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Estado:</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded px-3 py-1 text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Prioridad:</label>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded px-3 py-1 text-sm"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Origen:</label>
              <select 
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded px-3 py-1 text-sm"
              >
                <option value="all">Todas</option>
                <option value="ward_rounds">Pase de Sala</option>
                <option value="manual">Manuales</option>
              </select>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filteredTasks.length} de {tasks.length} tareas
            </div>
          </div>
        </div>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold mb-4">Nueva Tarea</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Título *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full rounded-lg px-3 py-2 focus:outline-none ring-accent"
                placeholder="Ingresa el título de la tarea"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Descripción
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full rounded-lg px-3 py-2 focus:outline-none ring-accent h-24"
                placeholder="Descripción detallada (opcional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Prioridad
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none ring-accent"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Estado
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none ring-accent"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none ring-accent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <button
                onClick={addTask}
                disabled={loading || !newTask.title.trim()}
                className="flex items-center space-x-2 btn-accent px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Guardando...' : 'Guardar Tarea'}</span>
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center space-x-2 btn-soft px-4 py-2 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Board */}
      <div className="medical-card p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Lista de Tareas ({filteredTasks.length})</h2>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? 'Sincronizando...' : error ? 'Error de conexión' : 'Conectado a Supabase'}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>No hay tareas</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {tasks.length === 0 
                ? 'Agrega tu primera tarea para comenzar'
                : 'No hay tareas que coincidan con los filtros seleccionados'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {columns.map((column) => {
                const columnTasks = filteredTasks.filter(task => task.status === column.id);

                return (
                  <div
                    key={column.id}
                    onDragOver={(e) => handleDragOverColumn(e, column.id)}
                    onDrop={() => handleDropOnColumn(column.id)}
                    className={`rounded-lg border p-4 transition ${
                      dragOverColumn === column.id ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{column.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{column.helper}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-[var(--text-tertiary)]">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-200 bg-white p-3 text-sm text-[var(--text-tertiary)]">
                          Suelta tareas aquí para moverlas.
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const priorityDisplay = getPriorityDisplay(task.priority);
                          const statusDisplay = getStatusDisplay(task.status);
                          const PriorityIcon = priorityDisplay.icon;
                          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

                          return (
                            <div 
                              key={task.id}
                              draggable
                              onDragStart={() => handleDragStart(task.id!)}
                              onDragEnd={handleDragEnd}
                              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-2">
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
                                    task.status === 'completed' ? 'line-through' : ''
                                  }`}>
                                    {task.title}
                                  </h3>
                                  
                                  {task.source === 'ward_rounds' && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800">
                                      <Users className="h-3 w-3" />
                                      <span>Pase de Sala</span>
                                    </span>
                                  )}
                                  
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs btn-soft`} style={{ border: '1px solid var(--border-primary)' }}>
                                    <PriorityIcon className="h-3 w-3" />
                                    <span>{priorityDisplay.label}</span>
                                  </div>
                                  
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs btn-soft`} style={{ border: '1px solid var(--border-primary)' }}>
                                    {statusDisplay.label}
                                  </span>

                                  {isOverdue && (
                                    <span className="inline-block px-2 py-1 rounded-full text-xs btn-soft" style={{ border: '1px solid var(--border-primary)' }}>
                                      Vencida
                                    </span>
                                  )}
                                </div>
                                
                                {task.description && (
                                  <p className={`text-sm`} style={{ color: task.status === 'completed' ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
                              
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task.id!, e.target.value as Task['status'])}
                                    className="text-xs rounded px-2 py-1"
                                  >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                  </select>
                                  
                                  <button
                                    onClick={() => setEditingTask(task.id!)}
                                    className="p-1 transition-colors btn-soft"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => deleteTask(task.id!)}
                                    className="p-1 transition-colors btn-soft"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTasks.some((task) => task.status === 'completed') && (
              <div className="mt-6 rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Completadas</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Arrastra a otra columna para reabrir.</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-[var(--text-tertiary)]">
                    {filteredTasks.filter((task) => task.status === 'completed').length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filteredTasks
                    .filter((task) => task.status === 'completed')
                    .map((task) => {
                      const priorityDisplay = getPriorityDisplay(task.priority);
                      const PriorityIcon = priorityDisplay.icon;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task.id!)}
                          onDragEnd={handleDragEnd}
                          className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <h4 className="font-medium line-through text-[var(--text-secondary)]">{task.title}</h4>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs btn-soft`} style={{ border: '1px solid var(--border-primary)' }}>
                              <PriorityIcon className="h-3 w-3" />
                              <span>{priorityDisplay.label}</span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-[var(--text-tertiary)]">{task.description}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PendientesManager;
