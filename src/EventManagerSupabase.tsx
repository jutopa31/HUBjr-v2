import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit3,
  Save,
  X,
  CalendarDays,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from './utils/supabase.js';
import { useAuthContext } from './components/auth/AuthProvider';

interface MedicalEvent {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  type?: string;
  location?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_end?: string;
}

const EventManagerSupabase: React.FC = () => {
  const { loading: authLoading } = useAuthContext();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setDate(1); // primer día del mes en curso
    return today;
  });
  const [newEvent, setNewEvent] = useState<MedicalEvent>({
    title: '',
    start_date: '',
    end_date: '',
    type: 'clinical',
    location: '',
    description: '',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end: ''
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('medical_events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Supabase fetch error:', error);
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('La tabla medical_events no existe en Supabase');
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Sin permisos para acceder a la tabla medical_events');
        }
      } else {
        setEvents(events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new event
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_date || !newEvent.end_date) {
      alert('Por favor completa título, fecha de inicio y fecha de fin');
      return;
    }

    if (newEvent.is_recurring && !newEvent.recurrence_end) {
      alert('Por favor selecciona la fecha de fin para eventos recurrentes');
      return;
    }

    setLoading(true);
    try {
      const baseEventData = {
        title: newEvent.title.trim(),
        start_date: new Date(newEvent.start_date).toISOString(),
        end_date: new Date(newEvent.end_date).toISOString(),
        type: newEvent.type || 'clinical',
        location: newEvent.location?.trim() || '',
        description: newEvent.description?.trim() || '',
        created_by: 'res_chief_julian'
      };

      if (newEvent.is_recurring) {
        // Generate all recurring events
        const recurringEvents = generateRecurringEvents(baseEventData);
        
        // Insert all events
        const eventsToInsert = recurringEvents.map(event => ({
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          type: event.type,
          location: event.location || '',
          description: event.description || '',
          created_by: 'res_chief_julian'
        }));

        const { error } = await supabase
          .from('medical_events')
          .insert(eventsToInsert);

        if (error) {
          console.error('Supabase error:', error);
          alert('❌ Error al crear eventos recurrentes: ' + error.message + '\n\nVerifica que tu conexión a Supabase esté funcionando.');
        } else {
          alert(`✅ ${recurringEvents.length} eventos creados exitosamente`);
        }
      } else {
        // Single event
        const { error } = await supabase
          .from('medical_events')
          .insert([baseEventData]);

        if (error) {
          console.error('Supabase error:', error);
          alert('❌ Error al crear evento: ' + error.message + '\n\nVerifica que tu conexión a Supabase esté funcionando.');
        } else {
          alert(`✅ Evento "${newEvent.title}" creado exitosamente`);
        }
      }

      // Reset form and refresh events after successful creation
      setNewEvent({
        title: '',
        start_date: '',
        end_date: '',
        type: 'clinical',
        location: '',
        description: '',
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end: ''
      });
      setShowForm(false);
      await fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  // Update event
  const updateEvent = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('medical_events')
        .update({ [field]: value })
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        alert('Error al actualizar evento: ' + error.message);
      } else {
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error al actualizar evento');
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medical_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        alert('Error al eliminar evento: ' + error.message);
      } else {
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error al eliminar evento');
    } finally {
      setLoading(false);
    }
  };

  // Get event type color
  const getEventTypeColor = () => 'bg-blue-100 text-gray-800 border-blue-300 dark:bg-blue-950/40 dark:text-gray-200 dark:border-blue-700';

  // Get event type icon
  const getEventTypeIcon = () => Users;

  // Wait for auth to be ready before loading data
  useEffect(() => {
    if (!authLoading) {
      console.log('[EventManager] Auth ready, session validated');
      setAuthReady(true);
    }
  }, [authLoading]);

  // Safety timeout: if auth doesn't become ready in 10 seconds, force proceed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authReady) {
        console.warn('[EventManager] Auth timeout after 10s, forcing data load');
        setAuthReady(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [authReady]);

  // Load events only after auth is ready
  useEffect(() => {
    if (authReady) {
      console.log('[EventManager] Loading events after auth ready');
      fetchEvents();
    }
  }, [authReady]);

  // Helper functions for calendar views
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    // Add all days of the month, but only weekdays (Mon-Fri)
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const dayOfWeek = day.getDay();
      // Only include Monday (1) through Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(day);
      }
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === dateStr;
    });
    return getFilteredEvents(dayEvents);
  };

  const handleQuickAddEvent = (day: Date) => {
    const startTime = new Date(day);
    startTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 5); // Add 5 minutes
    
    setNewEvent({
      title: '',
      start_date: startTime.toISOString().slice(0, 16), // Format for datetime-local input
      end_date: endTime.toISOString().slice(0, 16),
      type: 'clinical',
      location: '',
      description: '',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      recurrence_end: ''
    });
    setShowForm(true);
  };

  const handleStartDateChange = (newStartDate: string) => {
    const startTime = new Date(newStartDate);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 5); // Automatically add 5 minutes

    setNewEvent({
      ...newEvent,
      start_date: newStartDate,
      end_date: endTime.toISOString().slice(0, 16)
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      newDate.setDate(1); // Ensure we're on the first day of the month
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(1);
    setCurrentDate(today);
  };

  const generateRecurringEvents = (baseEvent: MedicalEvent) => {
    if (!baseEvent.is_recurring || !baseEvent.recurrence_pattern || !baseEvent.recurrence_end) {
      return [baseEvent];
    }

    const events = [baseEvent];
    const startDate = new Date(baseEvent.start_date);
    const endDate = new Date(baseEvent.end_date);
    const recurrenceEndDate = new Date(baseEvent.recurrence_end);
    
    let currentStartDate = new Date(startDate);
    let currentEndDate = new Date(endDate);

    while (currentStartDate < recurrenceEndDate) {
      // Calculate next occurrence
      switch (baseEvent.recurrence_pattern) {
        case 'daily':
          currentStartDate.setDate(currentStartDate.getDate() + 1);
          currentEndDate.setDate(currentEndDate.getDate() + 1);
          break;
        case 'weekly':
          currentStartDate.setDate(currentStartDate.getDate() + 7);
          currentEndDate.setDate(currentEndDate.getDate() + 7);
          break;
        case 'monthly':
          currentStartDate.setMonth(currentStartDate.getMonth() + 1);
          currentEndDate.setMonth(currentEndDate.getMonth() + 1);
          break;
      }

      if (currentStartDate <= recurrenceEndDate) {
        events.push({
          ...baseEvent,
          id: undefined, // New event, no ID
          start_date: currentStartDate.toISOString(),
          end_date: currentEndDate.toISOString()
        });
      }
    }

    return events;
  };

  const normalizeDateToStartOfDay = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const isWithinTimeFilter = (date: Date) => {
    if (timeFilter === 'all') return true;

    const today = normalizeDateToStartOfDay(new Date());

    if (timeFilter === 'today') {
      return normalizeDateToStartOfDay(date).getTime() === today.getTime();
    }

    if (timeFilter === 'week') {
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      return date >= today && date <= weekAhead;
    }

    if (timeFilter === 'month') {
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    }

    return true;
  };

  const getFilteredEvents = (events: MedicalEvent[]) => {
    const query = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType = typeFilter === 'all' || (event.type ?? 'other') === typeFilter;
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        (event.location && event.location.toLowerCase().includes(query));
      const startDate = event.start_date ? new Date(event.start_date) : null;
      const matchesTime = startDate ? isWithinTimeFilter(startDate) : true;

      return matchesType && matchesSearch && matchesTime;
    });
  };

  // Delete events in bulk by title pattern
  const deleteEventsByTitle = async (titlePattern: string) => {
    if (!titlePattern.trim()) {
      alert('Por favor ingresa un patrón de título para buscar');
      return;
    }

    const confirmation = window.confirm(
      `¿Estás seguro de que quieres eliminar TODOS los eventos que contengan "${titlePattern}" en el título?\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmation) return;

    setLoading(true);
    try {
      const { data: eventsToDelete, error: fetchError } = await supabase
        .from('medical_events')
        .select('id, title')
        .ilike('title', `%${titlePattern}%`);

      if (fetchError) {
        console.error('Error fetching events:', fetchError);
        alert('Error al buscar eventos: ' + fetchError.message);
        return;
      }

      if (!eventsToDelete || eventsToDelete.length === 0) {
        alert(`No se encontraron eventos con el patrón "${titlePattern}"`);
        return;
      }

      const finalConfirmation = window.confirm(
        `Se encontraron ${eventsToDelete.length} eventos que coinciden.\n¿Continuar con la eliminación?`
      );

      if (!finalConfirmation) return;

      const { error: deleteError } = await supabase
        .from('medical_events')
        .delete()
        .ilike('title', `%${titlePattern}%`);

      if (deleteError) {
        console.error('Error deleting events:', deleteError);
        alert('Error al eliminar eventos: ' + deleteError.message);
      } else {
        alert(`${eventsToDelete.length} eventos eliminados exitosamente`);
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Error en la eliminación masiva');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = getFilteredEvents(events);
  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const eventTypeOptions = Array.from(new Set(events.map((event) => event.type).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      {/* Header Principal - Estilo Ward Rounds */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Icono circular con sombra */}
          <div className="rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <CalendarDays className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>

          {/* Título y subtítulo */}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cronograma - Neurología</h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block capitalize">
              {monthLabel}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626] shadow-inner">
            <button
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {monthLabel}
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center"
            title="Ir a hoy"
          >
            Hoy
          </button>
          <button
            onClick={() => setFiltersOpen((open) => !open)}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Filtros"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{filtersOpen ? 'Ocultar' : 'Filtros'}</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            disabled={loading}
            title="Nuevo evento"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
          <button
            onClick={() => {
              const pattern = window.prompt('Ingresa parte del título de los eventos a eliminar:');
              if (pattern) deleteEventsByTitle(pattern);
            }}
            className="h-8 w-8 flex items-center justify-center rounded border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs"
            disabled={loading}
            title="Eliminar eventos por título"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Contenedor del calendario */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] shadow-sm">

        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tipo</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] text-sm px-3 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos</option>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type as string}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Rango</span>
              <div className="flex items-center bg-gray-100 dark:bg-[#262626] rounded-full p-1 border border-gray-200 dark:border-gray-700">
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: '7 dias' },
                  { id: 'month', label: 'Mes' },
                  { id: 'all', label: 'Todo' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTimeFilter(id as 'today' | 'week' | 'month' | 'all')}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      timeFilter === id
                        ? 'bg-white dark:bg-[#1f1f1f] text-blue-600 dark:text-blue-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar titulo o lugar"
                className="h-9 w-48 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] text-sm px-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>
          </div>
        ) : null}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#1f1f1f] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-4 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-200">
              <Plus className="h-4 w-4 mr-2 text-blue-500" />
              Nuevo evento rápido
            </h3>
            <form onSubmit={createEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Guardia, ateneo, reunión..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Inicio</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Fin</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                    className="w-full bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Recurrente</label>
                <input
                  type="checkbox"
                  checked={newEvent.is_recurring}
                  onChange={(e) => setNewEvent({ ...newEvent, is_recurring: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                {newEvent.is_recurring && (
                  <input
                    type="date"
                    value={newEvent.recurrence_end}
                    onChange={(e) => setNewEvent({ ...newEvent, recurrence_end: e.target.value })}
                    className="bg-white dark:bg-[#2c2c2c] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Fin de la recurrencia"
                    required
                  />
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200">Vista mensual compacta</h3>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Contenido prioritario</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-5 auto-rows-[120px] gap-1.5 sm:gap-2 md:gap-3">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie'].map((day) => (
                <div key={day} className="p-2 text-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#333333] rounded-md">
                  {day}
                </div>
              ))}

              {getMonthDays(currentDate).map((day, index) => {
                if (!day) {
                  return <div key={index} className="rounded-md bg-gray-100 dark:bg-[#333333]" />;
                }

                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={index}
                    className={`rounded-md border p-1.5 flex flex-col gap-1 ${
                      isCurrentMonth ? 'bg-white dark:bg-[#262626] border-gray-300 dark:border-gray-700' : 'bg-gray-100 dark:bg-[#333333] border-gray-300 dark:border-gray-800'
                    } ${isToday ? 'ring-1 ring-blue-500 dark:ring-blue-500/70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div
                        className={`text-xs font-semibold ${
                          isToday
                            ? 'text-blue-600 dark:text-blue-300'
                            : isCurrentMonth
                              ? 'text-gray-900 dark:text-gray-200'
                              : 'text-gray-500 dark:text-gray-500'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddEvent(day);
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
                        title="Agregar evento rapido"
                      >
                        +
                      </button>
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-[11px] px-1.5 py-0.5 rounded truncate font-semibold flex items-center space-x-1 ${getEventTypeColor()}`}
                            title={event.title}
                          >
                            {React.createElement(getEventTypeIcon(), { className: 'w-2 h-2 flex-shrink-0' })}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-300">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] p-3 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-200">Agenda filtrada</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredEvents.length} eventos visibles
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                loading
                  ? 'border-yellow-400 text-yellow-700 dark:text-yellow-300'
                  : 'border-green-500 text-green-600 dark:text-green-300'
              }`}
            >
              {loading ? 'Sincronizando' : 'Al dia'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Cargando eventos desde Supabase...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#262626] rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-500 dark:text-gray-600" />
              <p className="text-sm font-semibold mb-1">Sin eventos en este rango</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Activa filtros o crea el primer evento.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo evento
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredEvents.map((event) => {
                const Icon = getEventTypeIcon();
                const isExpanded = expandedEvent === event.id;
                const isEditing = editingEvent === event.id;

                return (
                  <div
                    key={event.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-200 dark:hover:border-blue-700 transition-colors bg-gray-50 dark:bg-[#262626]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div
                          className="cursor-pointer"
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id!)}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                            {isEditing ? (
                              <input
                                type="text"
                                value={event.title}
                                onChange={(e) => {
                                  const updatedEvents = events.map(ev =>
                                    ev.id === event.id ? {...ev, title: e.target.value} : ev
                                  );
                                  setEvents(updatedEvents);
                                }}
                                className="font-semibold text-sm text-gray-900 dark:text-gray-200 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-200 truncate">{event.title}</h4>
                            )}
                            <span className={`px-2 py-0.5 text-[11px] rounded-full border flex items-center space-x-1 ${getEventTypeColor()}`}>
                              {React.createElement(getEventTypeIcon(), { className: "w-3 h-3" })}
                              <span className="font-medium">Evento</span>
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <input
                                    type="datetime-local"
                                    value={event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => {
                                      const updatedEvents = events.map(ev =>
                                        ev.id === event.id ? {...ev, start_date: e.target.value} : ev
                                      );
                                      setEvents(updatedEvents);
                                    }}
                                    className="text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span>-</span>
                                  <input
                                    type="datetime-local"
                                    value={event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => {
                                      const updatedEvents = events.map(ev =>
                                        ev.id === event.id ? {...ev, end_date: e.target.value} : ev
                                      );
                                      setEvents(updatedEvents);
                                    }}
                                    className="text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              ) : (
                                <span>
                                  {new Date(event.start_date).toLocaleString('es-ES', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })} - {new Date(event.end_date).toLocaleString('es-ES', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={event.location}
                                    onChange={(e) => {
                                      const updatedEvents = events.map(ev => 
                                        ev.id === event.id ? {...ev, location: e.target.value} : ev
                                      );
                                      setEvents(updatedEvents);
                                    }}
                                    className="text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="truncate">{event.location}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {isExpanded && event.description && (
                          <div className="mt-3 pt-3 border-t bg-gray-100 dark:bg-[#1f1f1f] rounded-lg p-3 ml-6">
                            <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                              <User className="w-4 h-4" />
                              {isEditing ? (
                                <textarea
                                  value={event.description}
                                  onChange={(e) => {
                                    const updatedEvents = events.map(ev => 
                                      ev.id === event.id ? {...ev, description: e.target.value} : ev
                                    );
                                    setEvents(updatedEvents);
                                  }}
                                  className="w-full text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1 resize-none focus:ring-2 focus:ring-blue-500"
                                  rows={2}
                                />
                              ) : (
                                <span>{event.description}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                await updateEvent(event.id!, 'title', event.title);
                                await updateEvent(event.id!, 'start_date', new Date(event.start_date).toISOString());
                                await updateEvent(event.id!, 'end_date', new Date(event.end_date).toISOString());
                                if (event.location) await updateEvent(event.id!, 'location', event.location);
                                if (event.description) await updateEvent(event.id!, 'description', event.description);
                                setEditingEvent(null);
                              }}
                              className="p-2 text-blue-700 hover:bg-green-50 rounded-full transition-colors"
                              title="Guardar cambios"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingEvent(null);
                                fetchEvents();
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                              title="Cancelar edición"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingEvent(event.id!)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Editar evento"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id!)}
                              className="p-2 text-blue-700 hover:bg-red-50 rounded-full transition-colors"
                              title="Eliminar evento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 border-t border-gray-200 dark:border-gray-800 pt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Conectado a Supabase - Base de datos en tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagerSupabase;


