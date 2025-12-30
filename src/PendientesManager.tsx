import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Edit3, Save, X, Filter, Calendar, Users } from 'lucide-react';
import { supabase } from './utils/supabase.js';
import { syncAllPendientes, completeTaskAndClearPatientPendientes } from './utils/pendientesSync';
import { useAuthContext } from './components/auth/AuthProvider';

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

type ColumnConfig = {
  id: Task['status'];
  title: string;
  helper: string;
  accent: string;
  icon: typeof AlertCircle;
  iconColor: string;
  emptyText: string;
};

const PendientesManager: React.FC = () => {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<Task>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
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

  // Update complete task (all fields)
  const updateTask = async (taskId: string, updatedData: Partial<Task>) => {
    if (!user) {
      setError('Debe estar autenticado para actualizar tareas');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Validación: título no puede estar vacío
      if (updatedData.title !== undefined && !updatedData.title.trim()) {
        setError('El título no puede estar vacío');
        setLoading(false);
        return;
      }

      // Preparar datos con updated_at
      const dataToUpdate = {
        ...updatedData,
        updated_at: new Date().toISOString()
      };

      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('tasks')
        .update(dataToUpdate)
        .eq('id', taskId);

      if (updateError) {
        console.error('Error updating task:', updateError);
        if (updateError.code === '42501') {
          setError('Sin permisos para actualizar esta tarea');
        } else {
          setError(`Error al actualizar tarea: ${updateError.message}`);
        }
        setLoading(false);
        return;
      }

      // Actualizar estado local
      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, ...dataToUpdate }
          : task
      ));

      // Limpiar estado de edición
      setEditingTask(null);
      setEditedValues({});

    } catch (err) {
      console.error('Error updating task:', err);
      setError('Error de conexión al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };

  // Enter edit mode
  const startEditing = (task: Task) => {
    setEditingTask(task.id!);
    setEditedValues({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTask(null);
    setEditedValues({});
  };

  // Save edits
  const saveEdits = async (taskId: string) => {
    await updateTask(taskId, editedValues);
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

  const filteredCounts = {
    pending: filteredTasks.filter((task) => task.status === 'pending').length,
    inProgress: filteredTasks.filter((task) => task.status === 'in_progress').length,
    completed: filteredTasks.filter((task) => task.status === 'completed').length
  };

  const columns: ColumnConfig[] = [
    { id: 'pending', title: 'Pendientes', helper: 'Listas para asignar', accent: 'from-amber-50 via-white to-white', icon: AlertCircle, iconColor: 'text-amber-600', emptyText: 'Suelta tareas aquA- para iniciarlas.' },
    { id: 'in_progress', title: 'En progreso', helper: 'En marcha', accent: 'from-blue-50 via-white to-white', icon: Clock, iconColor: 'text-blue-600', emptyText: 'Nada en curso. Arrastra una tarea para comenzar.' },
    { id: 'completed', title: 'Completadas', helper: 'Cerradas recientemente', accent: 'from-emerald-50 via-white to-white', icon: CheckCircle, iconColor: 'text-emerald-600', emptyText: 'Aun no se han completado tareas.' }
  ];

  const statusCounts = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'completed').length
  };

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
    <div className="space-y-2">
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

      {/* Compact Header - Max 50px */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
            <CheckSquare className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Pendientes</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="text-xs px-2 py-1 bg-white rounded-full ring-1 ring-gray-200 text-[var(--text-secondary)]">
              {statusCounts.total} total
            </span>
            <span className="text-xs px-2 py-1 bg-amber-50 rounded-full ring-1 ring-amber-100 text-amber-800">
              {filteredCounts.pending}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100 text-blue-800">
              {filteredCounts.inProgress}
            </span>
            <span className="text-xs px-2 py-1 bg-emerald-50 rounded-full ring-1 ring-emerald-100 text-emerald-800">
              {filteredCounts.completed}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 btn-accent text-sm font-medium"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{showForm ? 'Cerrar' : 'Nueva'}</span>
          </button>
          <button
            onClick={handleSyncWithWardRounds}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 btn-soft text-sm font-medium"
            disabled={syncing || loading}
            title="Sincronizar con pase de sala"
          >
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">{syncing ? 'Sync...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Compact Horizontal Filters - Max 30px */}
      <div className="flex flex-wrap items-center gap-3 px-2 py-2">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">Filtros:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completadas</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5"
        >
          <option value="all">Todas las prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5"
        >
          <option value="all">Todos los orígenes</option>
          <option value="ward_rounds">Pase de Sala</option>
          <option value="manual">Manuales</option>
        </select>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          {filteredTasks.length} de {tasks.length} tareas
        </span>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="medical-card p-4">
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
      <div className="medical-card p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tablero ({filteredTasks.length})</h2>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {loading ? 'Sync...' : error ? 'Error' : ''}
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter(task => task.status === column.id);
              const ColumnIcon = column.icon;

              return (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOverColumn(e, column.id)}
                  onDrop={() => handleDropOnColumn(column.id)}
                  className={`group rounded-xl border border-gray-200 bg-gradient-to-br ${column.accent} p-4 shadow-sm transition duration-150 ${
                    dragOverColumn === column.id ? 'ring-2 ring-blue-200 scale-[1.01]' : ''
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ColumnIcon className={`h-5 w-5 ${column.iconColor}`} />
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{column.title}</h3>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{column.helper}</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--text-secondary)] shadow-sm ring-1 ring-gray-100">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 p-4 text-sm text-[var(--text-tertiary)] shadow-inner">
                        {column.emptyText}
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const isEditing = editingTask === task.id;
                        const currentValues = isEditing ? editedValues : task;
                        const priorityDisplay = getPriorityDisplay(currentValues.priority!);
                        const statusDisplay = getStatusDisplay(currentValues.status!);
                        const PriorityIcon = priorityDisplay.icon;
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                        const priorityAccent =
                          task.priority === 'high'
                            ? 'border-l-4 border-l-red-400'
                            : task.priority === 'medium'
                              ? 'border-l-4 border-l-amber-300'
                              : 'border-l-4 border-l-emerald-300';

                        return (
                          <div
                            key={task.id}
                            draggable={!isEditing}
                            onDragStart={() => !isEditing && handleDragStart(task.id!)}
                            onDragEnd={handleDragEnd}
                            className={`medical-card relative overflow-hidden p-4 shadow-sm transition-transform ${
                              isEditing ? 'ring-2 ring-blue-400' : 'hover:-translate-y-0.5'
                            } ${priorityAccent}`}
                          >
                            {isEditing ? (
                              // MODO EDICIÓN
                              <div className="flex flex-col gap-3">
                                {/* Input: Título */}
                                <div>
                                  <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    Título *
                                  </label>
                                  <input
                                    type="text"
                                    value={editedValues.title || ''}
                                    onChange={(e) => setEditedValues({ ...editedValues, title: e.target.value })}
                                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Título de la tarea"
                                  />
                                </div>

                                {/* Textarea: Descripción */}
                                <div>
                                  <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                    Descripción
                                  </label>
                                  <textarea
                                    value={editedValues.description || ''}
                                    onChange={(e) => setEditedValues({ ...editedValues, description: e.target.value })}
                                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 h-20 resize-none"
                                    placeholder="Descripción detallada (opcional)"
                                  />
                                </div>

                                {/* Grid: Prioridad, Estado, Fecha */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                      Prioridad
                                    </label>
                                    <select
                                      value={editedValues.priority || 'medium'}
                                      onChange={(e) => setEditedValues({ ...editedValues, priority: e.target.value as Task['priority'] })}
                                      className="w-full rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                      <option value="low">Baja</option>
                                      <option value="medium">Media</option>
                                      <option value="high">Alta</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                      Estado
                                    </label>
                                    <select
                                      value={editedValues.status || 'pending'}
                                      onChange={(e) => setEditedValues({ ...editedValues, status: e.target.value as Task['status'] })}
                                      className="w-full rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                      <option value="pending">Pendiente</option>
                                      <option value="in_progress">En Progreso</option>
                                      <option value="completed">Completada</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
                                      Fecha límite
                                    </label>
                                    <input
                                      type="date"
                                      value={editedValues.due_date || ''}
                                      onChange={(e) => setEditedValues({ ...editedValues, due_date: e.target.value })}
                                      className="w-full rounded-lg px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                  </div>
                                </div>

                                {/* Botones: Guardar y Cancelar */}
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => saveEdits(task.id!)}
                                    disabled={loading || !editedValues.title?.trim()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 btn-accent rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Save className="h-4 w-4" />
                                    <span>Guardar</span>
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 btn-soft rounded text-sm font-medium"
                                  >
                                    <X className="h-4 w-4" />
                                    <span>Cancelar</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // MODO VISTA
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-start gap-3 justify-between">
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => {
                                        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                        updateTaskStatus(task.id!, newStatus);
                                      }}
                                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                        task.status === 'completed'
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : 'border-gray-300 bg-white hover:border-emerald-400'
                                      }`}
                                    >
                                      {task.status === 'completed' && <CheckCircle className="h-3.5 w-3.5" />}
                                    </button>
                                    <div>
                                      <h3 className={`font-semibold ${
                                        task.status === 'completed' ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                                      }`}>
                                        {task.title}
                                      </h3>
                                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                        {task.source === 'ward_rounds' && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-800 ring-1 ring-blue-200">
                                            <Users className="h-3 w-3" />
                                            <span>Pase de Sala</span>
                                          </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[var(--text-secondary)] ring-1 ring-gray-200">
                                          <PriorityIcon className="h-3 w-3" />
                                          <span>{priorityDisplay.label}</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[var(--text-secondary)] ring-1 ring-gray-200">
                                          {statusDisplay.label}
                                        </span>
                                        {isOverdue && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700 ring-1 ring-red-100">
                                            Vencida
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 text-xs text-[var(--text-tertiary)]">
                                    {task.due_date && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 shadow-sm ring-1 ring-gray-100">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString('es-ES')}
                                      </span>
                                    )}
                                    {task.created_at && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 shadow-sm ring-1 ring-gray-100">
                                        <Clock className="h-3 w-3" />
                                        {new Date(task.created_at).toLocaleDateString('es-ES')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-[var(--text-secondary)]">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task.id!, e.target.value as Task['status'])}
                                    className="text-xs rounded-md border border-gray-200 bg-white px-3 py-1.5"
                                  >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                  </select>

                                  <button
                                    onClick={() => startEditing(task)}
                                    className="p-1.5 transition-colors btn-soft rounded"
                                    title="Editar tarea"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() => deleteTask(task.id!)}
                                    className="p-1.5 transition-colors btn-soft rounded"
                                    title="Eliminar tarea"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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
