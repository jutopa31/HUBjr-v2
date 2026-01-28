/**
 * AcademiaSimplified.tsx
 * Sistema simplificado para que residentes se anoten para dar clases.
 * Tabs: Registro (tema + fecha + hora) y Calendario (clases futuras/pasadas).
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, User, Trash2, Edit3, X, BookOpen } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import QuizHub from './components/academia/QuizHub';
import WeeklyTopicBoard from './components/academia/WeeklyTopicBoard';
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
  activeTab: 'register' | 'calendar' | 'weekly' | 'quizzes';
  setActiveTab: (tab: 'register' | 'calendar' | 'weekly' | 'quizzes') => void;
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
  const [bibliographyLink, setBibliographyLink] = useState<string>('');

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
    const normalizedBibliography = bibliographyLink.trim();

    const classData = {
      topic_id: selectedTopicId,
      topic_name: selectedTopic.topic_name,
      class_date: classDate,
      class_time: normalizedTime,
      instructor_email: user.email,
      instructor_name: instructorName,
      created_by: userId,
      bibliography_url: normalizedBibliography || null
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
    setBibliographyLink(academicClass.bibliography_url || '');
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
    setBibliographyLink('');
    setEditingClass(null);
  };

  // Separar clases futuras y pasadas
  const futureClasses = classes.filter(c => isFutureClass(c.class_date, c.class_time));
  const pastClasses = classes.filter(c => !isFutureClass(c.class_date, c.class_time));
  const sortedFutureClasses = [...futureClasses].sort((a, b) => {
    const dateA = new Date(`${a.class_date}T${normalizeTimeValue(a.class_time)}`);
    const dateB = new Date(`${b.class_date}T${normalizeTimeValue(b.class_time)}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="pb-12">
      <div className="space-y-4">
        {/* Mensajes */}
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 shadow-sm ${
              message.type === 'success'
                ? 'border-emerald-200/70 bg-emerald-50 text-emerald-800'
                : 'border-rose-200/70 bg-rose-50 text-rose-800'
            } text-sm`}
          >
            {message.text}
          </div>
        )}

        {(activeTab === 'register' || activeTab === 'calendar') && (
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100 sm:p-5">
            {/* TAB 1: REGISTRO DE CLASE */}
            {activeTab === 'register' ? (
              <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <form onSubmit={handleRegisterClass} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Registro de clase
                    </p>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {editingClass ? 'Editando clase' : 'Registro de clase'}
                    </h2>
                  </div>
                  {editingClass && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      En edición
                    </span>
                  )}
                </div>

                {/* Campos en layout horizontal */}
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-[2fr,1.2fr,1fr,auto]">
                  {/* Columna 1: Tema */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Tema</label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      required
                    >
                      <option value="">Selecciona un tema</option>
                      {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.topic_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Columna 2: Fecha */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Fecha</label>
                    <input
                      type="date"
                      value={classDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setClassDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      required
                    />
                  </div>

                  {/* Columna 3: Hora */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Hora</label>
                    {showTimeInput ? (
                      <input
                        type="time"
                        value={classTime}
                        onChange={(e) => setClassTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      />
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                        <span className="text-xs">08:00</span>
                        <button
                          type="button"
                          onClick={() => setShowTimeInput(true)}
                          className="rounded p-0.5 hover:bg-slate-100"
                          title="Editar hora"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Columna 4: Botón Nuevo tema */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setShowAddTopicModal(true)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-600 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      title="Agregar nuevo tema"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Nuevo tema</span>
                      <span className="sm:hidden">Tema</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Link de bibliografA­a (opcional)</label>
                  <input
                    type="url"
                    value={bibliographyLink}
                    onChange={(e) => setBibliographyLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={savingClass}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-base font-medium text-white shadow-md transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {savingClass ? 'Guardando...' : editingClass ? 'Actualizar clase' : 'Registrar clase'}
                  </button>
                  {editingClass && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* Lateral: contexto y próximas clases */}
              <aside className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Agenda rápida
                  </p>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {futureClasses.length} próximas
                  </span>
                </div>

                <div className="space-y-3">
                  {sortedFutureClasses.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.topic_name}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {formatClassDateTime(item.class_date, item.class_time)}
                      </p>
                    </div>
                  ))}

                  {sortedFutureClasses.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
                      No hay clases futuras. Registra una para verla aquí.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Consejo rápido</p>
                  <p>Al editar una clase desde el calendario, regresarás aquí con los campos precargados.</p>
                </div>
              </aside>
            </div>
            ) : (
              /* TAB 2: CALENDARIO */
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Calendario de clases</h2>
                    <p className="hidden text-sm text-slate-500 sm:block">Próximas clases programadas y tu histórico.</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                    {classes.length} clases en total
                  </div>
                </div>

                {/* Clases futuras */}
                {futureClasses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Próximas clases ({futureClasses.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <h3 className="text-lg font-semibold text-slate-600">
                      Clases pasadas ({pastClasses.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500 sm:px-6 sm:py-12">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300 sm:h-14 sm:w-14" />
                    <p className="text-lg font-semibold text-slate-700">No hay clases programadas</p>
                    <p className="text-sm">Registra tu primera clase para llenar el calendario.</p>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-sky-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-200/40 transition hover:-translate-y-0.5 hover:bg-sky-800"
                    >
                      Programar clase
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'weekly' && <WeeklyTopicBoard />}
        {activeTab === 'quizzes' && <QuizHub />}

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
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition ${
        isPast
          ? 'border-slate-200 bg-slate-50'
          : 'border-sky-100 bg-gradient-to-br from-white to-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-slate-900 sm:text-xl line-clamp-2">{academicClass.topic_name}</h4>
            {isPast && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shrink-0">Pasada</span>}
          </div>

          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{formatClassDateTime(academicClass.class_date, academicClass.class_time)}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{academicClass.instructor_name || academicClass.instructor_email}</span>
            </div>

            {academicClass.bibliography_url && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                <a
                  href={academicClass.bibliography_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sky-700 underline decoration-sky-200 hover:text-sky-900"
                >
                  BibliografA­a
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción (solo si es el owner) */}
        {isOwner && !isPast && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(academicClass)}
              className="rounded-lg border border-slate-200 bg-white p-2.5 text-sky-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-sky-50 disabled:translate-y-0 disabled:opacity-60"
              title="Editar"
              aria-label="Editar clase"
              disabled={isDeleting}
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(academicClass.id)}
              className="rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-100 disabled:translate-y-0 disabled:opacity-60"
              title="Eliminar"
              aria-label="Eliminar clase"
              disabled={isDeleting}
            >
              {isDeleting ? <span className="text-xs font-semibold">Eliminando...</span> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademiaSimplified;
