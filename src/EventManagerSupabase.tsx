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
}

const EventManagerSupabase: React.FC = () => {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
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

    setLoading(true);
    try {
      const eventData = {
        title: newEvent.title.trim(),
        start_date: new Date(newEvent.start_date).toISOString(),
        end_date: new Date(newEvent.end_date).toISOString(),
        type: newEvent.type || 'clinical',
        location: newEvent.location?.trim() || '',
        description: newEvent.description?.trim() || '',
        created_by: 'res_chief_julian'
      };

      const { error } = await supabase
        .from('medical_events')
        .insert([eventData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert('Error al crear evento: ' + error.message);
      } else {
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
      clinical: 'bg-blue-100 text-blue-800 border-blue-200',
      academic: 'bg-green-100 text-green-800 border-green-200',
      administrative: 'bg-purple-100 text-purple-800 border-purple-200',
      social: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      emergency: 'bg-red-100 text-red-800 border-red-200',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Gestor de Eventos</h1>
              <p className="text-green-100 text-lg">Calendario médico con Supabase</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
            disabled={loading}
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Evento</span>
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
                  onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
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

      {/* Events List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarDays className="h-6 w-6 mr-2 text-blue-600" />
            Eventos Médicos ({events.length})
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
            {events.map((event) => {
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