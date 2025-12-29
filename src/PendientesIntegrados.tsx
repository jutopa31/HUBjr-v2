import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { supabase } from './utils/supabase.js';
import { completeTaskAndClearPatientPendientes, syncAllPendientes } from './utils/pendientesSync';
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

interface MedicalEvent {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  type?: string;
  location?: string;
  description?: string;
}

const PendientesIntegrados: React.FC = () => {
  const { user, loading: authLoading } = useAuthContext();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setDate(1);
    return today;
  });
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: ''
  });

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('medical_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (eventsError) {
        console.error('Supabase fetch error:', eventsError);
      } else {
        setEvents(eventsData || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) {
      return;
    }

    setLoadingTasks(true);
    setError(null);

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Supabase fetch error:', tasksError);

        if (
          tasksError.code === 'PGRST116' ||
          tasksError.message?.includes('relation') ||
          tasksError.message?.includes('does not exist')
        ) {
          setError(
            'La tabla de tareas no está configurada en la base de datos. Por favor, ejecute el script fix_tasks_table_security.sql'
          );
          setTasks([]);
        } else if (tasksError.code === '42501') {
          setError('Sin permisos para acceder a las tareas. Verifique las políticas RLS.');
          setTasks([]);
        } else {
          setError(`Error al cargar tareas: ${tasksError.message}`);
          setTasks([]);
        }
      } else {
        setTasks(tasksData || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError('Error de conexión al cargar las tareas');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    if (!user) {
      setError('Debe estar autenticado para crear tareas');
      return;
    }

    setLoadingTasks(true);
    setError(null);

    try {
      const taskData = {
        ...newTask,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();

      if (insertError) {
        console.error('Error adding task:', insertError);
        setError(`Error al crear tarea: ${insertError.message}`);
      } else {
        setTasks([...(data || []), ...tasks]);
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
    } finally {
      setLoadingTasks(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    if (!user) {
      setError('Debe estar autenticado para actualizar tareas');
      return;
    }

    try {
      setError(null);

      const task = tasks.find((taskItem) => taskItem.id === taskId);
      if (newStatus === 'completed' && task?.source === 'ward_rounds') {
        const success = await completeTaskAndClearPatientPendientes(taskId, true);
        if (success) {
          setTasks((prev) =>
            prev.map((taskItem) =>
              taskItem.id === taskId
                ? { ...taskItem, status: newStatus, updated_at: new Date().toISOString() }
                : taskItem
            )
          );
        } else {
          setError('Error al completar la tarea del pase de sala');
        }
        return;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Error updating task:', updateError);
        setError(`Error al actualizar tarea: ${updateError.message}`);
        return;
      }

      setTasks((prev) =>
        prev.map((taskItem) =>
          taskItem.id === taskId
            ? { ...taskItem, status: newStatus, updated_at: new Date().toISOString() }
            : taskItem
        )
      );
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Error de conexión al actualizar la tarea');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        console.error('Error deleting task:', deleteError);
      }

      setTasks((prev) => prev.filter((taskItem) => taskItem.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleSyncWithWardRounds = async () => {
    setSyncing(true);
    try {
      const success = await syncAllPendientes();
      if (success) {
        await fetchTasks();
        alert('Sincronización completada exitosamente');
      } else {
        alert('Error durante la sincronización');
      }
    } catch (err) {
      console.error('Error syncing:', err);
      alert('Error durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
      if (user) {
        fetchTasks();
      }
    }
  }, [authLoading, user]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      newDate.setDate(1);
      return newDate;
    });
  };

  const normalizeDateToStartOfDay = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i += 1) {
      const day = new Date(year, month, i);
      const dayOfWeek = day.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(day);
      }
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return events.filter((event) => new Date(event.start_date).toDateString() === dateStr);
  };

  const statusOrder: Record<Task['status'], number> = {
    pending: 0,
    in_progress: 1,
    completed: 2
  };

  const eventsToday = useMemo(() => {
    const today = normalizeDateToStartOfDay(new Date());
    return events
      .filter((event) => normalizeDateToStartOfDay(new Date(event.start_date)).getTime() === today.getTime())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = normalizeDateToStartOfDay(new Date());
    const upcomingLimit = new Date(today);
    upcomingLimit.setDate(upcomingLimit.getDate() + 7);

    return events
      .filter((event) => {
        const startDate = normalizeDateToStartOfDay(new Date(event.start_date));
        return startDate > today && startDate <= upcomingLimit;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const tasksWithDate = useMemo(() => {
    return tasks
      .filter((task) => task.due_date)
      .sort((a, b) => {
        const dateDiff = new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
        if (dateDiff !== 0) return dateDiff;
        return statusOrder[a.status] - statusOrder[b.status];
      });
  }, [tasks]);

  const tasksWithoutDate = useMemo(() => {
    return tasks
      .filter((task) => !task.due_date)
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [tasks]);

  const getPriorityDisplay = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { color: 'text-gray-800 bg-red-50', label: 'Alta' };
      case 'medium':
        return { color: 'text-yellow-600 bg-yellow-50', label: 'Media' };
      case 'low':
        return { color: 'text-green-600 bg-green-50', label: 'Baja' };
      default:
        return { color: 'text-gray-600 bg-gray-50', label: 'Media' };
    }
  };

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

  if (!user && !authLoading) {
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

  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const isLoading = loadingEvents || loadingTasks;

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
            <CalendarDays className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Pendientes</h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block capitalize">
              {monthLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center h-10 rounded-full border border-gray-200 bg-gray-50 shadow-inner">
            <button
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-full transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{monthLabel}</div>
            <button
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-full transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            disabled={loadingTasks}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{showForm ? 'Cerrar' : 'Nueva tarea'}</span>
          </button>
          <button
            onClick={handleSyncWithWardRounds}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            disabled={syncing || loadingTasks}
            title="Sincronizar con pase de sala"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{syncing ? 'Sync...' : 'Sync'}</span>
          </button>
        </div>
      </div>

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
                disabled={loadingTasks || !newTask.title.trim()}
                className="flex items-center space-x-2 btn-accent px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{loadingTasks ? 'Guardando...' : 'Guardar Tarea'}</span>
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center space-x-2 btn-soft px-4 py-2 rounded-lg transition-colors"
              >
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="hidden lg:block rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Vista mensual compacta</h3>
            <div className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Contenido prioritario</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-5 auto-rows-[120px] gap-1.5 sm:gap-2 md:gap-3">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-md"
                >
                  {day}
                </div>
              ))}

              {getMonthDays(currentDate).map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={index}
                    className={`rounded-md border p-1.5 flex flex-col gap-1 ${
                      isCurrentMonth ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-300'
                    } ${isToday ? 'ring-1 ring-blue-500' : ''}`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {day.getDate()}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-[11px] px-1.5 py-0.5 rounded truncate font-semibold flex items-center space-x-1 bg-blue-100 text-gray-800 border border-blue-300"
                            title={event.title}
                          >
                            <Users className="w-2 h-2 flex-shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[11px] text-blue-600">+{dayEvents.length - 3} más</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Agenda integrada</h2>
                <p className="text-xs text-gray-500">
                  {eventsToday.length + upcomingEvents.length} eventos en foco
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                isLoading ? 'border-yellow-400 text-yellow-700' : 'border-green-500 text-green-600'
              }`}
            >
              {isLoading ? 'Sincronizando' : 'Al día'}
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] lg:max-h-[60vh] overflow-y-auto pr-1">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Eventos de hoy</h3>
                <span className="text-[11px] text-gray-500">{eventsToday.length}</span>
              </div>
              {eventsToday.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200 p-3">
                  No hay eventos programados para hoy.
                </div>
              ) : (
                eventsToday.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h4>
                      <span className="text-[11px] text-gray-500">
                        {new Date(event.start_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.start_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Próximos 7 días</h3>
                <span className="text-[11px] text-gray-500">{upcomingEvents.length}</span>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200 p-3">
                  No hay eventos próximos en los próximos 7 días.
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 bg-white flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h4>
                      <span className="text-[11px] text-gray-500">
                        {new Date(event.start_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.start_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pendientes con fecha</h3>
                <span className="text-[11px] text-gray-500">{tasksWithDate.length}</span>
              </div>
              {tasksWithDate.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200 p-3">
                  No hay pendientes con fecha.
                </div>
              ) : (
                tasksWithDate.map((task) => {
                  const priorityDisplay = getPriorityDisplay(task.priority);
                  const statusDisplay = getStatusDisplay(task.status);
                  const isOverdue =
                    task.due_date &&
                    new Date(task.due_date) < new Date() &&
                    task.status !== 'completed';

                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {task.source === 'ward_rounds' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-800 ring-1 ring-blue-200">
                                <Users className="h-3 w-3" />
                                <span>Pase de Sala</span>
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ring-gray-200 ${priorityDisplay.color}`}
                            >
                              <span>{priorityDisplay.label}</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700 ring-1 ring-red-100">
                                Vencida
                              </span>
                            )}
                          </div>
                        </div>
                        {task.due_date && (
                          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                            {new Date(task.due_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2">
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
                          onClick={() => deleteTask(task.id!)}
                          className="p-1.5 transition-colors btn-soft rounded"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pendientes sin fecha</h3>
                <span className="text-[11px] text-gray-500">{tasksWithoutDate.length}</span>
              </div>
              {tasksWithoutDate.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200 p-3">
                  No hay pendientes sin fecha.
                </div>
              ) : (
                tasksWithoutDate.map((task) => {
                  const priorityDisplay = getPriorityDisplay(task.priority);
                  const statusDisplay = getStatusDisplay(task.status);

                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {task.source === 'ward_rounds' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-800 ring-1 ring-blue-200">
                                <Users className="h-3 w-3" />
                                <span>Pase de Sala</span>
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ring-gray-200 ${priorityDisplay.color}`}
                            >
                              <span>{priorityDisplay.label}</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2">
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
                          onClick={() => deleteTask(task.id!)}
                          className="p-1.5 transition-colors btn-soft rounded"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendientesIntegrados;
