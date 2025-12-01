import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, User, Trash2, Edit3, Save, X, GraduationCap } from 'lucide-react';
import { supabase } from './utils/supabase';

interface AcademicClass {
  id?: string;
  title: string;
  start_date: string;
  end_date: string;
  type: 'magistral' | 'ateneo' | 'seminario' | 'examen' | 'taller' | 'rotacion';
  instructor?: string;
  location?: string;
  description?: string;
  materials_url?: string;
  is_mandatory?: boolean;
  max_attendees?: number;
  current_attendees?: number;
  created_by?: string;
  created_at?: string;
  _source?: 'calendar' | 'academic'; // To distinguish source
}

interface ClasesSchedulerProps {
  isAdminMode?: boolean;
  filterType?: 'clases' | 'rotaciones';
}

const ClasesScheduler: React.FC<ClasesSchedulerProps> = ({ isAdminMode = false, filterType = 'clases' }) => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);

  const [newClass, setNewClass] = useState<AcademicClass>({
    title: '',
    start_date: '',
    end_date: '',
    type: 'magistral',
    instructor: '',
    location: '',
    description: '',
    materials_url: '',
    is_mandatory: true,
    max_attendees: 20
  });

  // Fetch classes from both academic_classes and medical_events (academic type)
  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Fetch from academic_classes table
      const { data: academicClasses, error: academicError } = await supabase
        .from('academic_classes')
        .select('*')
        .order('start_date', { ascending: true });

      // Fetch academic events from medical_events table
      const { data: medicalEvents, error: medicalError } = await supabase
        .from('medical_events')
        .select('*')
        .eq('type', 'academic')
        .order('start_date', { ascending: true });

      if (academicError && !academicError.message?.includes('does not exist')) {
        console.error('Error fetching academic classes:', academicError);
      }

      if (medicalError && !medicalError.message?.includes('does not exist')) {
        console.error('Error fetching medical events:', medicalError);
      }

      // Combine and normalize the data
      const combinedClasses: AcademicClass[] = [];

      // Add academic_classes data
      if (academicClasses) {
        combinedClasses.push(...academicClasses);
      }

      // Add academic medical_events data (convert format)
      if (medicalEvents) {
        const convertedEvents = medicalEvents.map(event => ({
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          type: 'magistral' as const, // Default type for converted events
          instructor: '',
          location: event.location || '',
          description: event.description ? `📅 Del calendario: ${event.description}` : '📅 Evento del calendario principal',
          materials_url: '',
          is_mandatory: true,
          max_attendees: 20,
          current_attendees: 0,
          created_by: event.created_by,
          created_at: event.created_at,
          _source: 'calendar' as const // Add source identifier
        }));
        combinedClasses.push(...convertedEvents);
      }

      // Sort by start_date
      combinedClasses.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      setClasses(combinedClasses);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Mantener todos los tipos para compatibilidad con BD, pero unificar labels en UI
  const classTypeConfig = {
    magistral: { color: 'bg-blue-500', label: 'Clase', icon: GraduationCap },
    ateneo: { color: 'bg-blue-500', label: 'Clase', icon: GraduationCap },
    seminario: { color: 'bg-blue-500', label: 'Clase', icon: GraduationCap },
    examen: { color: 'bg-blue-500', label: 'Clase', icon: GraduationCap },
    taller: { color: 'bg-blue-500', label: 'Clase', icon: GraduationCap },
    rotacion: { color: 'bg-teal-500', label: 'Rotación', icon: Clock }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClass.title || !newClass.start_date || !newClass.end_date) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('academic_classes')
          .update({
            title: newClass.title,
            start_date: newClass.start_date,
            end_date: newClass.end_date,
            type: newClass.type,
            instructor: newClass.instructor,
            location: newClass.location,
            description: newClass.description,
            materials_url: newClass.materials_url,
            is_mandatory: newClass.is_mandatory,
            max_attendees: newClass.max_attendees
          })
          .eq('id', editingClass);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('academic_classes')
          .insert([{
            ...newClass,
            created_by: 'admin',
            current_attendees: 0
          }]);

        if (error) throw error;
      }

      await fetchClasses();
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error al guardar la clase');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewClass({
      title: '',
      start_date: '',
      end_date: '',
      type: 'magistral',
      instructor: '',
      location: '',
      description: '',
      materials_url: '',
      is_mandatory: true,
      max_attendees: 20
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleEdit = (classItem: AcademicClass) => {
    setNewClass(classItem);
    setEditingClass(classItem.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('academic_classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Error al eliminar la clase');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función helper para mapear tipos de BD a categorías UI
  const mapActivityType = (dbType: string): 'clases' | 'rotaciones' => {
    if (dbType === 'rotacion') return 'rotaciones';
    // magistral, ateneo, seminario, taller, examen → todos = 'clases'
    return 'clases';
  };

  const filteredClasses = classes.filter(classItem => {
    const mappedType = mapActivityType(classItem.type);
    return mappedType === filterType;
  });

  const upcomingClasses = filteredClasses.filter(classItem =>
    new Date(classItem.start_date) > new Date()
  ).slice(0, 5);

  return (
    <div className="p-6 space-y-4">
      {/* Admin actions */}
      {isAdminMode && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva {filterType === 'clases' ? 'Clase' : 'Rotación'}</span>
          </button>
        </div>
      )}

      {/* Upcoming Classes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Próximas {filterType === 'clases' ? 'Clases' : 'Rotaciones'}
          </h3>
        </div>
        <div className="p-4">
          {upcomingClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay {filterType === 'clases' ? 'clases' : 'rotaciones'} programadas próximamente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingClasses.map((classItem) => {
                const config = classTypeConfig[classItem.type];
                const Icon = config.icon;

                return (
                  <div key={classItem.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 ${config.color} text-white rounded-lg`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-semibold text-[var(--text-primary)]">{classItem.title}</h4>
                              {classItem._source === 'calendar' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  📅 Calendario
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} text-white`}>
                              {config.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(classItem.start_date)}</span>
                          </div>
                          {classItem.instructor && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{classItem.instructor}</span>
                            </div>
                          )}
                          {classItem.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{classItem.location}</span>
                            </div>
                          )}
                        </div>

                        {classItem.description && (
                          <p className="mt-2 text-sm text-gray-700">{classItem.description}</p>
                        )}

                        {classItem.max_attendees && (
                          <div className="mt-2 text-xs text-gray-500">
                            Cupos: {classItem.current_attendees || 0}/{classItem.max_attendees}
                          </div>
                        )}
                      </div>

                      {isAdminMode && classItem._source !== 'calendar' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id!)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {isAdminMode && classItem._source === 'calendar' && (
                        <div className="flex space-x-2 ml-4">
                          <span className="text-xs text-gray-500 p-2">
                            Editar en cronograma principal
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {editingClass ? 'Editar Clase' : 'Nueva Clase'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newClass.title}
                    onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={newClass.start_date}
                    onChange={(e) => setNewClass({...newClass, start_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={newClass.end_date}
                    onChange={(e) => setNewClass({...newClass, end_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de actividad
                  </label>
                  <select
                    value={newClass.type}
                    onChange={(e) => setNewClass({...newClass, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(classTypeConfig).map(([type, config]) => (
                      <option key={type} value={type}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={newClass.instructor}
                    onChange={(e) => setNewClass({...newClass, instructor: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={newClass.location}
                    onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupos máximos
                  </label>
                  <input
                    type="number"
                    value={newClass.max_attendees}
                    onChange={(e) => setNewClass({...newClass, max_attendees: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de materiales (Google Drive)
                  </label>
                  <input
                    type="url"
                    value={newClass.materials_url}
                    onChange={(e) => setNewClass({...newClass, materials_url: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--state-info)] focus:border-[var(--state-info)]"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newClass.is_mandatory}
                      onChange={(e) => setNewClass({...newClass, is_mandatory: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-700 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Asistencia obligatoria</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Guardando...' : (editingClass ? 'Actualizar' : 'Crear')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClasesScheduler;

