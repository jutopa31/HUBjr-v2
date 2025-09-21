import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  Activity,
  Target,
  BarChart3
} from 'lucide-react';
import { useLumbarPuncture, useLPStatistics } from '../hooks/useLumbarPuncture';
import { LumbarPuncture, LPFilters, LPSearchParams } from '../types/lumbarPuncture';

interface LumbarPunctureResultsProps {
  onEdit?: (procedure: LumbarPuncture) => void;
  onView?: (procedure: LumbarPuncture) => void;
}

export default function LumbarPunctureResults({ onEdit, onView }: LumbarPunctureResultsProps) {
  const { procedures, loading, error, fetchProcedures, deleteProcedure } = useLumbarPuncture();
  const { stats, analytics, loading: statsLoading } = useLPStatistics();

  const [searchParams, setSearchParams] = useState<LPSearchParams>({
    search: '',
    filters: {},
    sort_by: 'procedure_date',
    sort_order: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchProcedures(searchParams);
  }, [fetchProcedures, searchParams]);

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({
      ...prev,
      search
    }));
  };

  const handleFilter = (filters: Partial<LPFilters>) => {
    setSearchParams(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...filters
      }
    }));
  };

  const handleSort = (sort_by: 'procedure_date' | 'created_at' | 'success_rate' | 'technical_difficulty', sort_order: 'asc' | 'desc') => {
    setSearchParams(prev => ({
      ...prev,
      sort_by,
      sort_order
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lumbar puncture record?')) {
      await deleteProcedure(id);
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Fecha',
      'Paciente',
      'Indicación',
      'Supervisor',
      'Rol',
      'Exitoso',
      'Intentos',
      'Complicaciones',
      'Dificultad Técnica'
    ];

    const csvData = procedures.map(proc => [
      proc.procedure_date,
      proc.patient_initials,
      proc.indication,
      proc.supervisor,
      proc.trainee_role,
      proc.successful ? 'Sí' : 'No',
      proc.attempts_count,
      [proc.headache_post_lp, proc.bleeding, proc.infection].filter(Boolean).length,
      proc.technical_difficulty || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumbar_punctures_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSuccessColor = (successful: boolean) => {
    return successful ? 'text-green-600' : 'text-red-600';
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-gray-500';
    if (difficulty <= 2) return 'text-green-600';
    if (difficulty <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplicationCount = (procedure: LumbarPuncture) => {
    return [
      procedure.headache_post_lp,
      procedure.bleeding,
      procedure.infection,
      procedure.nausea_vomiting,
      procedure.back_pain
    ].filter(Boolean).length;
  };

  if (loading && procedures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
              Registros de Punciones Lumbares
            </h2>
            <p className="text-gray-600">Seguimiento y análisis de sus procedimientos de punción lumbar</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? 'Ocultar Estadísticas' : 'Mostrar Estadísticas'}
            </button>
            <button
              onClick={exportToCsv}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Total de Procedimientos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total_procedures}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-green-900">{stats.success_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Intentos Promedio</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.average_attempts.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Complicaciones</p>
                  <p className="text-2xl font-bold text-red-900">{stats.complications_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Analytics */}
        {showStats && analytics && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis Detallado</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Indication Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Indicaciones Más Comunes</h4>
                <div className="space-y-2">
                  {analytics.indication_breakdown.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.indication}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        <span className="text-xs text-green-600">({item.success_rate.toFixed(0)}% éxito)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Dificultad vs Tasa de Éxito</h4>
                <div className="space-y-2">
                  {analytics.difficulty_trends.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Dificultad {item.difficulty}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.count} procedimientos</span>
                        <span className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                          {item.success_rate.toFixed(0)}% éxito
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Performance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Supervisor Performance</h4>
                <div className="space-y-2">
                  {analytics.supervisor_stats.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.supervisor}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.procedures}</span>
                        <span className="text-xs text-blue-600">({item.avg_success_rate.toFixed(0)}% avg)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complication Rates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Complication Types</h4>
                <div className="space-y-2">
                  {analytics.complication_rates.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">{item.complication_type.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        <span className="text-xs text-red-600">({item.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar procedimientos..."
                value={searchParams.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>

            <select
              value={`${searchParams.sort_by}-${searchParams.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                handleSort(sort_by as 'procedure_date' | 'created_at' | 'success_rate' | 'technical_difficulty', sort_order as 'asc' | 'desc');
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="procedure_date-desc">Fecha (Más reciente)</option>
              <option value="procedure_date-asc">Fecha (Más antigua)</option>
              <option value="created_at-desc">Creado (Más reciente)</option>
              <option value="successful-desc">Tasa de éxito</option>
              <option value="technical_difficulty-desc">Dificultad (Alta)</option>
              <option value="technical_difficulty-asc">Dificultad (Baja)</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={searchParams.filters?.date_from || ''}
                  onChange={(e) => handleFilter({ date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={searchParams.filters?.date_to || ''}
                  onChange={(e) => handleFilter({ date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Success Status</label>
                <select
                  value={searchParams.filters?.successful !== undefined ? searchParams.filters.successful.toString() : ''}
                  onChange={(e) => handleFilter({
                    successful: e.target.value ? e.target.value === 'true' : undefined
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Successful</option>
                  <option value="false">Unsuccessful</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trainee Role</label>
                <select
                  value={searchParams.filters?.trainee_role || ''}
                  onChange={(e) => handleFilter({ trainee_role: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="observer">Observer</option>
                  <option value="assisted">Assisted</option>
                  <option value="performed_supervised">Performed Supervised</option>
                  <option value="performed_independent">Performed Independent</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {procedures.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No procedures found</h3>
            <p className="text-gray-600">Start by recording your first lumbar puncture procedure.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Éxito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complicaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dificultad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procedures.map((procedure) => (
                  <tr key={procedure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(procedure.procedure_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{procedure.patient_initials}</div>
                        {procedure.patient_age && (
                          <div className="text-gray-500">{procedure.patient_age}y {procedure.patient_gender}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate">{procedure.indication}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        {procedure.supervisor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="capitalize">{procedure.trainee_role?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {procedure.successful ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <span className={getSuccessColor(procedure.successful)}>
                          {procedure.successful ? 'Exitoso' : 'Fallido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {procedure.attempts_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {getComplicationCount(procedure) > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        )}
                        {getComplicationCount(procedure)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getDifficultyColor(procedure.technical_difficulty)}>
                        {procedure.technical_difficulty ? `${procedure.technical_difficulty}/5` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onView?.(procedure)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(procedure)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit procedure"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(procedure.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete procedure"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && procedures.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}