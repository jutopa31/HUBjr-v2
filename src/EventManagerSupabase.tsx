import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, User, Trash2, Edit3, Save, X, CalendarDays } from 'lucide-react';
import { supabase } from './utils/supabase.js';

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
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showClases, setShowClases] = useState(true);
  const [showTareas, setShowTareas] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<MedicalEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
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
          alert('Error al crear eventos recurrentes: ' + error.message);
        } else {
          alert(`${recurringEvents.length} eventos creados exitosamente`);
        }
      } else {
        // Single event (remove recurrence fields for DB)
        const { is_recurring, recurrence_pattern, recurrence_end, ...eventForDB } = baseEventData;
        const { error } = await supabase
          .from('medical_events')
          .insert([eventForDB]);

        if (error) {
          console.error('Supabase error:', error);
          alert('Error al crear evento: ' + error.message);
        }
      }

      if (!loading) {
        // Reset form and refresh events
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
      }
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
  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      // Clases (Academic) - Verde
      academic: 'bg-green-100 text-green-800 border-green-300',
      // Tareas - Azul
      clinical: 'bg-blue-100 text-blue-800 border-blue-300',
      administrative: 'bg-blue-100 text-blue-800 border-blue-300',
      emergency: 'bg-red-100 text-red-800 border-red-300',
      social: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[type] || colors.clinical;
  };

  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    const icons: { [key: string]: React.FC<any> } = {
      clinical: User,
      academic: Calendar,
      administrative: CalendarDays,
      social: MapPin,
      emergency: Clock,
    };
    return icons[type] || User;
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Helper functions for calendar views
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    // Find Monday of the week
    const dayOfWeek = start.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so distance is 6
    start.setDate(start.getDate() - distanceToMonday);
    
    const days = [];
    // Only generate Monday to Friday (5 days)
    for (let i = 0; i < 5; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const handleQuickAddEvent = (day: Date) => {
    const startTime = new Date(day);
    startTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 5); // Add 5 minutes
    
    setSelectedDay(day);
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

  const isClaseEvent = (type: string) => {
    return type === 'academic';
  };

  const isTareaEvent = (type: string) => {
    return ['clinical', 'administrative', 'emergency', 'social'].includes(type);
  };

  const getFilteredEvents = (events: MedicalEvent[]) => {
    return events.filter(event => {
      const eventType = event.type || 'clinical';
      const isClase = isClaseEvent(eventType);
      const isTarea = isTareaEvent(eventType);
      
      if (isClase && !showClases) return false;
      if (isTarea && !showTareas) return false;
      
      return true;
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

  const openEventDetails = (event: MedicalEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Cronograma Neurología</h1>
              <p className="text-green-100 text-lg">Calendario de residentes - Hospital Posadas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === 'week' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                5 Días
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === 'month' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Mes
              </button>
            </div>

            {/* Event Filters */}
            <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
              <button
                onClick={() => setShowClases(!showClases)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  showClases 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Clases
              </button>
              <button
                onClick={() => setShowTareas(!showTareas)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  showTareas 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Tareas
              </button>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
              disabled={loading}
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Evento</span>
            </button>
            
            <button
              onClick={() => {
                const pattern = window.prompt('Ingresa parte del título de los eventos a eliminar:');
                if (pattern) {
                  deleteEventsByTitle(pattern);
                }
              }}
              className="flex items-center space-x-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-all text-red-100"
              disabled={loading}
              title="Eliminar eventos por título"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>←</span>
            <span>{viewMode === 'week' ? 'Semana Anterior' : 'Mes Anterior'}</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `Semana del ${currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              }
            </h2>
            <p className="text-sm text-gray-500">
              {viewMode === 'week' ? 'Vista semanal' : 'Vista mensual'}
            </p>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>{viewMode === 'week' ? 'Semana Siguiente' : 'Mes Siguiente'}</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Quick Event Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Crear Nuevo Evento Médico
          </h3>
          <form onSubmit={createEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Rounds Matutinos, Ateneo Clínico"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="clinical">Clínico</option>
                  <option value="academic">Académico</option>
                  <option value="administrative">Administrativo</option>
                  <option value="social">Social</option>
                  <option value="emergency">Emergencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.start_date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora Fin *
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Sala de Neurología, Aula Magna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales del evento"
                />
              </div>

              {/* Recurring Event Fields */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={newEvent.is_recurring}
                    onChange={(e) => setNewEvent({...newEvent, is_recurring: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_recurring" className="ml-2 text-sm font-medium text-gray-700">
                    Evento Recurrente
                  </label>
                </div>

                {newEvent.is_recurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frecuencia
                      </label>
                      <select
                        value={newEvent.recurrence_pattern}
                        onChange={(e) => setNewEvent({...newEvent, recurrence_pattern: e.target.value as 'daily' | 'weekly' | 'monthly'})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Repetir hasta
                      </label>
                      <input
                        type="date"
                        value={newEvent.recurrence_end}
                        onChange={(e) => setNewEvent({...newEvent, recurrence_end: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Guardando...' : 'Guardar Evento'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow p-6">
        {viewMode === 'week' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista Semanal</h3>
            <div className="grid grid-cols-5 gap-6">
              {getWeekDays(currentDate).map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const dayName = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][index];
                
                return (
                  <div key={index} className="min-h-[200px]">
                    <div className={`p-3 rounded-lg border-2 h-full ${
                      isToday 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                          <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                            {dayName}
                          </div>
                          <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                            {day.getDate()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddEvent(day);
                          }}
                          className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
                          title="Agregar evento"
                        >
                          +
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => {
                          const Icon = getEventTypeIcon(event.type || 'clinical');
                          const startTime = new Date(event.start_date).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          
                          return (
                            <div 
                              key={event.id}
                              className="bg-white p-2 rounded border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDetails(event);
                              }}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <Icon className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">{startTime}</span>
                              </div>
                              <div className="text-xs text-gray-800 line-clamp-2">
                                {event.title}
                              </div>
                              {event.location && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  <MapPin className="h-2 w-2 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-4">
                            Sin eventos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista Mensual</h3>
            <div className="grid grid-cols-5 gap-1">
              {/* Week headers */}
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-100">
                  {day}
                </div>
              ))}
              
              {/* Month days */}
              {getMonthDays(currentDate).map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square bg-gray-50"></div>;
                }
                
                const dayEvents = getEventsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                
                return (
                  <div 
                    key={index} 
                    className={`aspect-square border border-gray-200 p-1 relative ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    <div className={`text-xs font-medium ${
                      isToday 
                        ? 'text-blue-600' 
                        : isCurrentMonth 
                          ? 'text-gray-700' 
                          : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {dayEvents.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div 
                            key={event.id}
                            className="text-xs bg-blue-100 text-blue-800 px-1 rounded truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarDays className="h-6 w-6 mr-2 text-blue-600" />
            Lista de Eventos ({events.length})
          </h2>
          <div className="text-sm text-gray-500">
            {loading ? 'Sincronizando...' : 'Conectado a Supabase'}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500 flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Cargando eventos desde Supabase...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No hay eventos programados</p>
            <p className="text-sm">¡Crea el primer evento médico para tu servicio!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getFilteredEvents(events).map((event) => {
              const Icon = getEventTypeIcon(event.type || 'clinical');
              const isExpanded = expandedEvent === event.id;
              const isEditing = editingEvent === event.id;

              return (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div 
                        className="cursor-pointer"
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id!)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
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
                              className="font-semibold text-lg text-gray-900 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <h4 className="font-semibold text-lg text-gray-800">{event.title}</h4>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full border ${getEventTypeColor(event.type || 'clinical')}`}>
                            {event.type === 'clinical' ? 'Clínico' :
                             event.type === 'academic' ? 'Académico' :
                             event.type === 'administrative' ? 'Admin' :
                             event.type === 'social' ? 'Social' : 'Emergencia'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 ml-8">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
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
                                  className="text-sm bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
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
                                  className="text-sm bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
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
                              <MapPin className="w-4 h-4" />
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
                                  className="text-sm bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
                                />
                              ) : (
                                <span>{event.location}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && event.description && (
                        <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-3 ml-8">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
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
                                className="w-full text-sm bg-yellow-50 border border-yellow-200 rounded px-2 py-1 resize-none"
                                rows={2}
                              />
                            ) : (
                              <span>{event.description}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={async () => {
                              // Save all changes
                              await updateEvent(event.id!, 'title', event.title);
                              await updateEvent(event.id!, 'start_date', new Date(event.start_date).toISOString());
                              await updateEvent(event.id!, 'end_date', new Date(event.end_date).toISOString());
                              if (event.location) await updateEvent(event.id!, 'location', event.location);
                              if (event.description) await updateEvent(event.id!, 'description', event.description);
                              setEditingEvent(null);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Guardar cambios"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEvent(null);
                              fetchEvents(); // Reload original data
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
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Evento</h3>
              <button
                onClick={() => setShowEventDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{selectedEvent.title}</span>
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getEventTypeColor(selectedEvent.type || 'clinical')}`}>
                    {selectedEvent.type === 'clinical' ? 'Clínico' :
                     selectedEvent.type === 'academic' ? 'Académico' :
                     selectedEvent.type === 'administrative' ? 'Admin' :
                     selectedEvent.type === 'social' ? 'Social' : 'Emergencia'}
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {new Date(selectedEvent.start_date).toLocaleString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {new Date(selectedEvent.end_date).toLocaleString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-900">{selectedEvent.location}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{selectedEvent.description}</span>
                  </div>
                </div>
              )}

              {/* Created by and date */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <User className="h-3 w-3 mr-1" />
                  <span>Creado por: {selectedEvent.created_by || 'Usuario'}</span>
                  {selectedEvent.created_at && (
                    <span className="ml-4">
                      {new Date(selectedEvent.created_at).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEventDetails(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowEventDetails(false);
                  setEditingEvent(selectedEvent.id!);
                }}
                className="px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Footer */}
      <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Conectado a Supabase - Base de datos en tiempo real</span>
        </div>
        <p className="mt-1 text-xs">
          Los eventos se sincronizan automáticamente con la base de datos
        </p>
      </div>
    </div>
  );
};

export default EventManagerSupabase;