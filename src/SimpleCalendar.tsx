import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, User, Trash2 } from 'lucide-react';
import { supabase } from './utils/supabase.js';

interface MedicalEvent {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  type?: string;
  location?: string;
  description?: string;
}

const SimpleCalendar: React.FC = () => {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<MedicalEvent>({
    title: '',
    start_date: '',
    end_date: '',
    type: 'clinical',
    location: '',
    description: ''
  });

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: events, error } = await supabase
        .from('medical_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase fetch error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Show user-friendly error
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          alert('Error: La tabla medical_events no existe en Supabase. Por favor, crea la tabla primero.');
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          alert('Error: Sin permisos para acceder a la tabla medical_events. Revisa las políticas RLS en Supabase.');
        } else {
          alert('Error conectando con Supabase: ' + error.message);
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

    setLoading(true);
    try {
      const eventData = {
        title: newEvent.title.trim(),
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        type: newEvent.type || 'clinical',
        location: newEvent.location?.trim() || '',
        description: newEvent.description?.trim() || '',
        created_by: 'res_chief_julian'
      };

      const { data, error } = await supabase
        .from('medical_events')
        .insert([eventData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert('Error al crear evento: ' + error.message);
      } else {
        console.log('Evento creado:', data[0]);
        
        // Reset form and refresh events
        setNewEvent({
          title: '',
          start_date: '',
          end_date: '',
          type: 'clinical',
          location: '',
          description: ''
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

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="banner rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Calendario Médico Simple</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>

      {/* Quick Event Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Crear Evento Rápido</h3>
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 "
                  placeholder="Ej: Rounds Matutinos"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Sala de Neurología"
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar Evento'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-4">
          Próximos Eventos ({events.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay eventos programados. ¡Crea el primero!
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg text-gray-800">{event.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.type === 'clinical' ? 'bg-blue-100 text-gray-800' :
                      event.type === 'academic' ? 'bg-green-100 text-gray-800' :
                      event.type === 'administrative' ? 'bg-purple-100 text-gray-800' :
                      event.type === 'social' ? 'bg-yellow-100 text-gray-800' :
                      'bg-red-100 text-gray-800'
                    }`}>
                      {event.type === 'clinical' ? 'Clínico' :
                       event.type === 'academic' ? 'Académico' :
                       event.type === 'administrative' ? 'Admin' :
                       event.type === 'social' ? 'Social' : 'Emergencia'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleString('es-ES')} - {new Date(event.end_date).toLocaleString('es-ES')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteEvent(event.id!)}
                  className="p-2 text-gray-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Eliminar evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleCalendar;

