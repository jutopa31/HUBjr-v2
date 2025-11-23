import React, { useState } from 'react';
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, Flag, Edit, Trash2 } from 'lucide-react';
import { useUserData } from '../../hooks/useUserData';
import { GoalFormData, UserGoal } from '../../types/userTracking';

const GoalsManager: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, updateGoalProgress, goalsLoading, error } = useUserData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed' | 'deferred'>('all');

  const [formData, setFormData] = useState<GoalFormData>({
    goal_type: 'procedure',
    title: '',
    description: '',
    target_date: '',
    priority: 'medium'
  });

  const GOAL_TYPES = [
    { value: 'procedure', label: 'Procedimiento', icon: Target },
    { value: 'knowledge', label: 'Conocimiento', icon: Target },
    { value: 'research', label: 'Investigación', icon: Target },
    { value: 'clinical', label: 'Clínico', icon: Target },
    { value: 'professional', label: 'Profesional', icon: Target }
  ] as const;

  const resetForm = () => {
    setFormData({
      goal_type: 'procedure',
      title: '',
      description: '',
      target_date: '',
      priority: 'medium'
    });
    setShowAddForm(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id!, formData);
      } else {
        await addGoal(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal: UserGoal) => {
    setFormData({
      goal_type: goal.goal_type,
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date || '',
      priority: goal.priority
    });
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  const handleDelete = async (goalId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este objetivo?')) {
      await deleteGoal(goalId);
    }
  };

  const handleProgressUpdate = async (goal: UserGoal, newProgress: number) => {
    await updateGoalProgress(goal.id!, newProgress);
  };

  const handleStatusUpdate = async (goal: UserGoal, newStatus: UserGoal['status']) => {
    await updateGoal(goal.id!, { status: newStatus });
  };

  const filteredGoals = goals.filter(goal =>
    filterStatus === 'all' || goal.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-gray-800';
      case 'deferred': return 'bg-yellow-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'No iniciado';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completado';
      case 'deferred': return 'Pospuesto';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-gray-800';
      case 'medium': return 'bg-orange-100 text-gray-800';
      case 'low': return 'bg-green-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const isOverdue = (targetDate?: string) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date() && new Date(targetDate).toDateString() !== new Date().toDateString();
  };

  const getGoalStats = () => {
    return {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      overdue: goals.filter(g => g.status !== 'completed' && isOverdue(g.target_date)).length
    };
  };

  const stats = getGoalStats();

  if (goalsLoading) {
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
          <div className="p-2 bg-orange-100 rounded-lg">
            <Target className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Objetivos y Metas</h2>
            <p className="text-sm text-gray-600">
              {stats.completed}/{stats.total} completados • {stats.inProgress} en progreso
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Objetivo</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="not_started">No iniciado</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completado</option>
          <option value="deferred">Pospuesto</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-800">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingGoal ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Objetivo
                </label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  {GOAL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Objetivo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej: Realizar 10 punciones lumbares exitosas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Meta
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Describa el objetivo en detalle..."
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
                disabled={goalsLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {editingGoal ? 'Actualizar' : 'Crear Objetivo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay objetivos registrados</h3>
            <p className="text-gray-600 mb-4">Establezca objetivos para hacer seguimiento de su progreso profesional.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Crear Primer Objetivo
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => (
            <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                      {getStatusLabel(goal.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(goal.priority)}`}>
                      {getPriorityLabel(goal.priority)}
                    </span>
                    {goal.target_date && isOverdue(goal.target_date) && goal.status !== 'completed' && (
                      <span className="px-2 py-1 bg-red-100 text-gray-800 text-xs rounded-full">
                        Vencido
                      </span>
                    )}
                  </div>

                  {goal.description && (
                    <p className="text-sm text-gray-700 mb-3">{goal.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Flag className="h-4 w-4" />
                      <span>Tipo: {GOAL_TYPES.find(t => t.value === goal.goal_type)?.label}</span>
                    </div>
                    {goal.target_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Meta: {formatDate(goal.target_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Progreso</span>
                      <span className="text-sm text-gray-600">{goal.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          goal.status === 'completed' ? 'bg-green-500' :
                          goal.progress_percentage > 75 ? 'bg-blue-500' :
                          goal.progress_percentage > 50 ? 'bg-yellow-500' :
                          goal.progress_percentage > 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress Controls */}
                  {goal.status !== 'completed' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress_percentage}
                        onChange={(e) => handleProgressUpdate(goal, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusUpdate(goal, e.target.value as any)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="not_started">No iniciado</option>
                        <option value="in_progress">En progreso</option>
                        <option value="completed">Completado</option>
                        <option value="deferred">Pospuesto</option>
                      </select>
                    </div>
                  )}

                  {goal.completion_date && (
                    <div className="text-sm text-gray-800">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Completado el {formatDate(goal.completion_date)}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-gray-400 hover:text-blue-700 rounded-lg"
                    title="Editar objetivo"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id!)}
                    className="p-2 text-gray-400 hover:text-blue-700 rounded-lg"
                    title="Eliminar objetivo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsManager;
