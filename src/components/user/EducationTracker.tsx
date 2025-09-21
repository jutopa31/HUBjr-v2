import React, { useState } from 'react';
import { GraduationCap, Plus, Calendar, Clock, User, Award, BookOpen, Presentation, Users } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';
import { ClassFormData, UserClass } from '../../types/userTracking';

const EducationTracker: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, classesLoading, error } = useUserData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<UserClass | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    activity_type: 'class',
    title: '',
    description: '',
    date_attended: new Date().toISOString().split('T')[0],
    duration_hours: 1,
    instructor: '',
    topic: '',
    assessment_score: undefined,
    notes: ''
  });

  const ACTIVITY_TYPES = [
    { value: 'class', label: 'Clase', icon: BookOpen },
    { value: 'journal_review', label: 'Revisión de Revista', icon: BookOpen },
    { value: 'presentation', label: 'Presentación', icon: Presentation },
    { value: 'conference', label: 'Conferencia', icon: Users },
    { value: 'workshop', label: 'Taller', icon: Users }
  ] as const;

  const resetForm = () => {
    setFormData({
      activity_type: 'class',
      title: '',
      description: '',
      date_attended: new Date().toISOString().split('T')[0],
      duration_hours: 1,
      instructor: '',
      topic: '',
      assessment_score: undefined,
      notes: ''
    });
    setShowAddForm(false);
    setEditingClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClass) {
        await updateClass(editingClass.id!, formData);
      } else {
        await addClass(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleEdit = (classItem: UserClass) => {
    setFormData({
      activity_type: classItem.activity_type,
      title: classItem.title,
      description: classItem.description || '',
      date_attended: classItem.date_attended,
      duration_hours: classItem.duration_hours || 1,
      instructor: classItem.instructor || '',
      topic: classItem.topic || '',
      assessment_score: classItem.assessment_score || undefined,
      notes: classItem.notes || ''
    });
    setEditingClass(classItem);
    setShowAddForm(true);
  };

  const handleDelete = async (classId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta actividad educativa?')) {
      await deleteClass(classId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[0];
  };

  const getTotalHours = () => {
    return classes.reduce((sum, cls) => sum + (cls.duration_hours || 0), 0);
  };

  const getAverageScore = () => {
    const withScores = classes.filter(c => c.assessment_score !== undefined);
    if (withScores.length === 0) return null;
    return withScores.reduce((sum, c) => sum + (c.assessment_score || 0), 0) / withScores.length;
  };

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <GraduationCap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Educación y Formación</h2>
            <p className="text-sm text-gray-600">
              {getTotalHours()} horas totales • {classes.length} actividades registradas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Horas Totales</p>
              <p className="text-2xl font-semibold text-gray-900">{getTotalHours()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actividades</p>
              <p className="text-2xl font-semibold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getAverageScore() ? getAverageScore()!.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingClass ? 'Editar Actividad' : 'Nueva Actividad Educativa'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Actividad
                </label>
                <select
                  value={formData.activity_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Título de la actividad"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date_attended}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_attended: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (horas)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor/Profesor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nombre del instructor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema/Especialidad
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Neurología, Epilepsia, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.assessment_score || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessment_score: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Solo si hubo evaluación"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                placeholder="Descripción de la actividad educativa..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas/Aprendizajes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                placeholder="Puntos clave aprendidos, reflexiones..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={classesLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {editingClass ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-4">
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividades educativas registradas</h3>
            <p className="text-gray-600 mb-4">Comience a registrar sus actividades de formación académica.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Registrar Primera Actividad
            </button>
          </div>
        ) : (
          classes.map((classItem) => {
            const typeInfo = getActivityTypeInfo(classItem.activity_type);
            const Icon = typeInfo.icon;

            return (
              <div key={classItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">{classItem.title}</h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {typeInfo.label}
                        </span>
                        {classItem.assessment_score && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {classItem.assessment_score}/100
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(classItem.date_attended)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{classItem.duration_hours}h</span>
                        </div>
                        {classItem.instructor && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{classItem.instructor}</span>
                          </div>
                        )}
                        {classItem.topic && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{classItem.topic}</span>
                          </div>
                        )}
                      </div>

                      {classItem.description && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-700">{classItem.description}</p>
                        </div>
                      )}

                      {classItem.notes && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                          <p className="text-sm text-purple-700">
                            <strong>Aprendizajes:</strong> {classItem.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="p-2 text-gray-400 hover:text-purple-600 rounded-lg"
                      title="Editar actividad"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classItem.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                      title="Eliminar actividad"
                    >
                      <Calendar className="h-4 w-4" />
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
};

export default EducationTracker;