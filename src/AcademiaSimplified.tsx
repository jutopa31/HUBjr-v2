/**
 * AcademiaSimplified.tsx
 * Sistema simplificado para que residentes se anoten para dar clases.
 * Tabs: Registro (tema + fecha + hora) y Calendario (clases futuras/pasadas).
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, User, Trash2, Edit3, X } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import {
  ClassTopic,
  AcademicClass,
  fetchTopics,
  addTopic,
  fetchClasses,
  addClass,
  updateClass,
  deleteClass,
  normalizeTimeValue,
  formatClassDateTime,
  isFutureClass,
  isClassOwner
} from './services/academiaService';

interface AcademiaSimplifiedProps {
  activeTab: 'register' | 'calendar';
  setActiveTab: (tab: 'register' | 'calendar') => void;
}

const AcademiaSimplified: React.FC<AcademiaSimplifiedProps> = ({
  activeTab,
  setActiveTab
}) => {
  const { user } = useAuth();
  const userId = user?.id;

  // Estado de datos
  const [topics, setTopics] = useState<ClassTopic[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);

  // Estado del formulario de registro
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [classDate, setClassDate] = useState<string>('');
  const [classTime, setClassTime] = useState<string>('08:00');
  const [showTimeInput, setShowTimeInput] = useState(false);

  // Estado del modal de agregar tema
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  // Estado de mensajes
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de edición/acciones
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);
  const [savingClass, setSavingClass] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadTopics();
    loadClasses();
  }, []);

  // Funciones de carga
  const loadTopics = async () => {
    const { data, error } = await fetchTopics();
    if (!error && data) {
      setTopics(data);
    } else {
      showMessage('error', error?.message || 'Error al cargar los temas');
    }
  };

  const loadClasses = async () => {
    const { data, error } = await fetchClasses();
    if (!error && data) {
      setClasses(data);
    } else {
      showMessage('error', error?.message || 'Error al cargar las clases');
    }
  };

  // Función helper para mostrar mensajes
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handler: Agregar nuevo tema
  const handleAddTopic = async () => {
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      showMessage('error', 'El nombre del tema no puede estar vacío');
      return;
    }

    if (!user?.email) {
      showMessage('error', 'Debe estar autenticado');
      return;
    }

    setSavingTopic(true);
    const { error } = await addTopic(trimmedName, user.email);
    setSavingTopic(false);

    if (error) {
      showMessage('error', error.message || 'Error al agregar el tema');
    } else {
      showMessage('success', `Tema "${trimmedName}" agregado correctamente`);
      setNewTopicName('');
      setShowAddTopicModal(false);
      loadTopics();
    }
  };

  // Handler: Registrar clase
  const handleRegisterClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email || !userId) {
      showMessage('error', 'Debe estar autenticado');
      return;
    }

    if (!selectedTopicId) {
      showMessage('error', 'Debe seleccionar un tema');
      return;
    }

    if (!classDate) {
      showMessage('error', 'Debe seleccionar una fecha');
      return;
    }

    if (!classTime) {
      showMessage('error', 'Debe ingresar una hora');
      return;
    }

    const normalizedTime = normalizeTimeValue(classTime);

    // Validar que la fecha no sea pasada
    const selectedDateTime = new Date(`${classDate}T${normalizedTime}`);
    if (selectedDateTime < new Date()) {
      showMessage('error', 'No puede programar una clase en el pasado');
      return;
    }

    const selectedTopic = topics.find(t => t.id === selectedTopicId);
    if (!selectedTopic) {
      showMessage('error', 'Tema no encontrado');
      return;
    }

    const instructorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

    const classData = {
      topic_id: selectedTopicId,
      topic_name: selectedTopic.topic_name,
      class_date: classDate,
      class_time: normalizedTime,
      instructor_email: user.email,
      instructor_name: instructorName,
      created_by: userId
    };

    setSavingClass(true);

    if (editingClass) {
      const { error } = await updateClass(editingClass.id, classData);
      setSavingClass(false);

      if (error) {
        showMessage('error', error.message || 'Error al actualizar la clase');
      } else {
        showMessage('success', 'Clase actualizada correctamente');
        resetForm();
        loadClasses();
        setActiveTab('calendar');
      }
    } else {
      const { error } = await addClass(classData);
      setSavingClass(false);

      if (error) {
        showMessage('error', error.message || 'Error al registrar la clase');
      } else {
        showMessage('success', 'Clase registrada correctamente');
        resetForm();
        loadClasses();
        setActiveTab('calendar');
      }
    }
  };

  // Handler: Editar clase
  const handleEditClass = (academicClass: AcademicClass) => {
    setEditingClass(academicClass);
    setSelectedTopicId(academicClass.topic_id || '');
    setClassDate(academicClass.class_date);
    setClassTime(academicClass.class_time.substring(0, 5)); // HH:MM
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Eliminar clase
  const handleDeleteClass = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
      return;
    }

    setDeletingClassId(id);
    const { error } = await deleteClass(id);
    setDeletingClassId(null);

    if (error) {
      showMessage('error', error.message || 'Error al eliminar la clase');
    } else {
      showMessage('success', 'Clase eliminada correctamente');
      loadClasses();
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedTopicId('');
    setClassDate('');
    setClassTime('08:00');
    setShowTimeInput(false);
    setEditingClass(null);
  };

  // Separar clases futuras y pasadas
  const futureClasses = classes.filter(c => isFutureClass(c.class_date, c.class_time));
  const pastClasses = classes.filter(c => !isFutureClass(c.class_date, c.class_time));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Mensajes */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* TAB 1: REGISTRO DE CLASE */}
          {activeTab === 'register' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {editingClass ? 'Editar clase' : 'Voy a dar clase de...'}
                  </h2>
                  <p className="text-gray-600">Selecciona un tema y programa tu clase</p>
                </div>

                <form onSubmit={handleRegisterClass} className="space-y-6 max-w-2xl mx-auto">
                  {/* Selector de tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema de la clase</label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        required
                      >
                        <option value="">-- Selecciona un tema --</option>
                        {topics.map(topic => (
                          <option key={topic.id} value={topic.id}>
                            {topic.topic_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddTopicModal(true)}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Agregar nuevo tema"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">El día...</label>
                    <input
                      type="date"
                      value={classDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setClassDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      required
                    />
                  </div>

                  {/* Hora (colapsable) */}
                  <div>
                    {!showTimeInput ? (
                      <button
                        type="button"
                        onClick={() => setShowTimeInput(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Cambiar hora (por defecto: 08:00 AM)
                      </button>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora de la clase</label>
                        <input
                          type="time"
                          value={classTime}
                          onChange={(e) => setClassTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={savingClass}
                      className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold transition-colors"
                    >
                      {savingClass ? 'Guardando...' : editingClass ? 'Actualizar Clase' : 'Registrar Clase'}
                    </button>
                    {editingClass && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
          ) : (
            /* TAB 2: CALENDARIO */
            <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Clases</h2>
                  <p className="text-gray-600">Próximas clases programadas</p>
                </div>

                {/* Clases futuras */}
                {futureClasses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Próximas Clases ({futureClasses.length})</h3>
                    <div className="space-y-3">
                      {futureClasses.map(academicClass => (
                        <ClassCard
                          key={academicClass.id}
                          academicClass={academicClass}
                          user={user}
                          onEdit={handleEditClass}
                          onDelete={handleDeleteClass}
                          isDeleting={deletingClassId === academicClass.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Clases pasadas */}
                {pastClasses.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-500 mb-3">Clases Pasadas ({pastClasses.length})</h3>
                    <div className="space-y-3 opacity-60">
                      {pastClasses.map(academicClass => (
                        <ClassCard
                          key={academicClass.id}
                          academicClass={academicClass}
                          user={user}
                          onEdit={handleEditClass}
                          onDelete={handleDeleteClass}
                          isPast
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin clases */}
                {classes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No hay clases programadas</p>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Programar mi primera clase
                    </button>
                  </div>
                )}
              </div>
          )}
        </div>

        {/* Modal: Agregar Tema */}
        {showAddTopicModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Agregar Nuevo Tema</h3>
                <button
                  onClick={() => setShowAddTopicModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del tema</label>
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Neurología Pediátrica"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddTopic}
                    disabled={savingTopic}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {savingTopic ? 'Agregando...' : 'Agregar'}
                  </button>
                  <button
                    onClick={() => setShowAddTopicModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Componente: Tarjeta de Clase
// =====================================================

interface ClassCardProps {
  academicClass: AcademicClass;
  user: any;
  onEdit: (academicClass: AcademicClass) => void;
  onDelete: (id: string) => void;
  isPast?: boolean;
  isDeleting?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({
  academicClass,
  user,
  onEdit,
  onDelete,
  isPast = false,
  isDeleting = false
}) => {
  const isOwner = user && isClassOwner(academicClass, user.id);

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isPast ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-xl font-bold text-gray-900 mb-2">{academicClass.topic_name}</h4>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{formatClassDateTime(academicClass.class_date, academicClass.class_time)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{academicClass.instructor_name || academicClass.instructor_email}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción (solo si es el owner) */}
        {isOwner && !isPast && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(academicClass)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-60"
              title="Editar"
              disabled={isDeleting}
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(academicClass.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
              title="Eliminar"
              disabled={isDeleting}
            >
              {isDeleting ? <span className="text-xs">Eliminando...</span> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademiaSimplified;
