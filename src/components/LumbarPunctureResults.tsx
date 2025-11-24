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
import { useLumbarPuncture, useLPStatistics, useLPFilters, useDepartmentLPStats } from '../hooks/useLumbarPuncture';
import { useAuthContext } from '../components/auth/AuthProvider';
import { awardPointsForLumbarPuncture } from '../services/rankingService';
import { LumbarPuncture, LPFilters, LPSearchParams } from '../types/lumbarPuncture';

interface LumbarPunctureResultsProps {
  onEdit?: (procedure: LumbarPuncture) => void;
  onView?: (procedure: LumbarPuncture) => void;
}

export default function LumbarPunctureResults({ onEdit, onView }: LumbarPunctureResultsProps) {
  const { user, hasPrivilege } = useAuthContext();
  const { procedures, loading, error, fetchProcedures, deleteProcedure } = useLumbarPuncture();
  const { stats, analytics, loading: statsLoading } = useLPStatistics();
  const { departmentStats, residentComparison, loading: deptStatsLoading } = useDepartmentLPStats();
  const { residents, supervisors, loading: filtersLoading } = useLPFilters();

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

  // Award points state for LP
  const [awardPointsMap, setAwardPointsMap] = useState<Record<string, number>>({});
  const [awardMsg, setAwardMsg] = useState<string | null>(null);
  const canAward = hasPrivilege('full_admin') || hasPrivilege('lumbar_puncture_admin');

  const handleAward = async (procedure: any) => {
    setAwardMsg(null);
    const pts = awardPointsMap[procedure.id] ?? 0;
    if (!procedure.resident_id) {
      setAwardMsg('No se encontró el usuario del residente en el registro.');
      return;
    }
    const res = await awardPointsForLumbarPuncture({ residentUserId: procedure.resident_id, points: Math.max(0, Number(pts) || 0), period: 'weekly' });
    setAwardMsg(res.success ? 'Puntos agregados' : res.error || 'No se pudieron agregar puntos');
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


  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'text-[var(--text-secondary)]';
    if (difficulty <= 2) return 'text-[var(--state-info)] font-medium';
    if (difficulty === 3) return 'text-[var(--state-warning)] font-medium';
    return 'text-[var(--state-error)] font-medium';
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

  const isInitialLoading = loading && procedures.length === 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="medical-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] flex items-center">
              <Stethoscope className="h-6 w-6 mr-2" style={{ color: 'var(--state-info)' }} />
              Registros de Punciones Lumbares
            </h2>
            <p className="text-gray-600">Seguimiento y análisis de sus procedimientos de punción lumbar</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 text-sm font-medium btn-soft rounded-lg flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? 'Ocultar Estadísticas' : 'Mostrar Estadísticas'}
            </button>
            <button
              onClick={exportToCsv}
              className="px-4 py-2 text-sm font-medium btn-soft rounded-lg flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Quick Filter Toggle */}
        <div className="mb-4 p-4 banner rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Vista de Procedimientos</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {searchParams.filters?.resident_id
                  ? `Mostrando procedimientos de: ${residents.find(r => r.id === searchParams.filters?.resident_id)?.name || 'Usuario seleccionado'}`
                  : 'Mostrando todos los procedimientos del departamento'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilter({ resident_id: undefined })}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  !searchParams.filters?.resident_id ? 'btn-accent' : 'btn-soft'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleFilter({ resident_id: user?.id })}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  searchParams.filters?.resident_id === user?.id ? 'btn-accent' : 'btn-soft'
                }`}
              >
                Solo Míos
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {((searchParams.filters?.resident_id && stats && !statsLoading) ||
          (!searchParams.filters?.resident_id && departmentStats && !deptStatsLoading)) && (
          <div className="space-y-4 mb-6">
            {!searchParams.filters?.resident_id && (
              <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-2">Estadísticas del Departamento</h3>
                <p className="text-sm text-gray-600">Vista general de todos los procedimientos del servicio</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="medical-card rounded-lg p-4">
                <div className="flex items-center">
                  <Target className="h-8 w-8" style={{ color: 'var(--state-info)' }} />
                  <div className="ml-3">
                    <p className="stat-label">Total de Procedimientos</p>
                    <p className="stat-value">
                      {searchParams.filters?.resident_id
                        ? stats?.total_procedures || 0
                        : departmentStats?.total_procedures || 0
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="medical-card rounded-lg p-4">
                <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-700" />
                  <div className="ml-3">
                    <p className="stat-label">Tasa de Éxito</p>
                    <p className="stat-value">
                      {searchParams.filters?.resident_id
                        ? (stats?.success_rate ?? 0).toFixed(1)
                        : (departmentStats?.success_rate ?? 0).toFixed(1)
                      }%
                    </p>
                  </div>
                </div>
              </div>

              <div className="medical-card card-warning rounded-lg p-4">
                <div className="flex items-center">
                <Activity className="h-8 w-8" style={{ color: 'var(--state-warning)' }} />
                  <div className="ml-3">
                  <p className="stat-label text-[var(--text-primary)]">
                      {searchParams.filters?.resident_id ? 'Intentos Promedio' : 'Residentes Activos'}
                    </p>
                  <p className="stat-value text-[var(--text-primary)]">
                      {searchParams.filters?.resident_id
                        ? (stats?.average_attempts ?? 0).toFixed(1)
                        : departmentStats?.total_residents || 0
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="medical-card card-error rounded-lg p-4">
                <div className="flex items-center">
                <AlertTriangle className="h-8 w-8" style={{ color: 'var(--state-error)' }} />
                  <div className="ml-3">
                  <p className="stat-label text-[var(--text-primary)]">
                      {searchParams.filters?.resident_id ? 'Complicaciones' : 'Promedio de Intentos'}
                    </p>
                  <p className="stat-value text-[var(--text-primary)]">
                      {searchParams.filters?.resident_id
                        ? stats?.complications_count || 0
                        : (departmentStats?.average_attempts ?? 0).toFixed(1)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department-wide resident comparison */}
            {!searchParams.filters?.resident_id && residentComparison.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="heading-md mb-4">Comparación entre Residentes</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Residente</th>
                        <th className="text-center py-2">Procedimientos</th>
                        <th className="text-center py-2">Éxito (%)</th>
                        <th className="text-center py-2">Promedio Intentos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residentComparison.slice(0, 10).map((resident, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium text-blue-700">
                            {resident.resident_name}
                          </td>
                          <td className="text-center py-2">{resident.total_procedures}</td>
                          <td className="text-center py-2">
                            <span className={`font-medium ${
                              resident.success_rate >= 80 ? 'text-[var(--state-success)]' :
                              resident.success_rate >= 60 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                            }`}>
                              {(resident.success_rate ?? 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center py-2">{(resident.average_attempts ?? 0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Analytics */}
        {showStats && analytics && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4">Análisis Detallado</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Indication Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium  mb-3">Indicaciones Más Comunes</h4>
                <div className="space-y-2">
                  {analytics.indication_breakdown.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.indication}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium ">{item.count}</span>
                        <span className="text-xs" style={{ color: 'var(--state-success)' }}>({(item.success_rate ?? 0).toFixed(0)}% éxito)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium  mb-3">Dificultad vs Tasa de Éxito</h4>
                <div className="space-y-2">
                  {analytics.difficulty_trends.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Dificultad {item.difficulty}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium ">{item.count} procedimientos</span>
                        <span className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                          {(item.success_rate ?? 0).toFixed(0)}% éxito
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Performance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium  mb-3">Supervisor Performance</h4>
                <div className="space-y-2">
                  {analytics.supervisor_stats.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.supervisor}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium ">{item.procedures}</span>
                        <span className="text-xs" style={{ color: 'var(--state-success)' }}>({(item.avg_success_rate ?? 0).toFixed(0)}% avg)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complication Rates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium  mb-3">Complication Types</h4>
                <div className="space-y-2">
                  {analytics.complication_rates.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">{item.complication_type.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium ">{item.count}</span>
                        <span className="text-xs text-gray-800">({(item.percentage ?? 0).toFixed(1)}%)</span>
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
      <div className="medical-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar procedimientos..."
                value={searchParams.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
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
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Resident</label>
                <select
                  value={searchParams.filters?.resident_id || ''}
                  onChange={(e) => handleFilter({ resident_id: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  disabled={filtersLoading}
                >
                  <option value="">All Residents</option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} {resident.level && `(${resident.level})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Supervisor</label>
                <select
                  value={searchParams.filters?.supervisor || ''}
                  onChange={(e) => handleFilter({ supervisor: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                  disabled={filtersLoading}
                >
                  <option value="">All Supervisors</option>
                  {supervisors.map(supervisor => (
                    <option key={supervisor} value={supervisor}>
                      {supervisor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Success Status</label>
                <select
                  value={searchParams.filters?.successful !== undefined ? searchParams.filters.successful.toString() : ''}
                  onChange={(e) => handleFilter({
                    successful: e.target.value ? e.target.value === 'true' : undefined
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                >
                  <option value="">All</option>
                  <option value="true">Successful</option>
                  <option value="false">Unsuccessful</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={searchParams.filters?.date_from || ''}
                  onChange={(e) => handleFilter({ date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={searchParams.filters?.date_to || ''}
                  onChange={(e) => handleFilter({ date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trainee Role</label>
                <select
                  value={searchParams.filters?.trainee_role || ''}
                  onChange={(e) => handleFilter({ trainee_role: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
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
        <div className="medical-card card-error rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: 'var(--state-error)' }} />
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Error</h4>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {awardMsg && (
        <div className="mt-2 text-sm">{awardMsg}</div>
      )}
      <div className="medical-card overflow-hidden">
        {isInitialLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : procedures.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-2">No procedures found</h3>
            <p className="text-gray-600">Start by recording your first lumbar puncture procedure.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Indicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Residente
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Intentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Complicaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Dificultad
                  </th>
                  <th className="px-6 py-3 text-right text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procedures.map((procedure) => (
                  <tr key={procedure.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(procedure.procedure_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <div>
                        <div className="font-medium">{procedure.patient_initials}</div>
                        {procedure.patient_age && (
                          <div className="text-[var(--text-secondary)]">{procedure.patient_age}y {procedure.patient_gender}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <div className="max-w-xs truncate">{procedure.indication}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        {procedure.supervisor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-blue-400 mr-2" />
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">
                            {procedure.resident_name || 'Desconocido'}
                          </div>
                          {procedure.resident_level && (
                            <div className="text-xs text-gray-500">{procedure.resident_level}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ">
                      <span className="capitalize">{procedure.trainee_role?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      <span
                        className={`badge ${procedure.successful ? 'badge-success' : 'badge-error'}`}
                        aria-label={procedure.successful ? 'Procedimiento exitoso' : 'Procedimiento fallido'}
                      >
                        {procedure.successful ? (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {procedure.successful ? 'Exitoso' : 'Fallido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base text-[var(--text-primary)]">
                      {procedure.attempts_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ">
                      {(() => {
                        const count = getComplicationCount(procedure);
                        const cls = count > 0 ? 'badge badge-error' : 'badge badge-success';
                        return (
                          <span className={cls} aria-label={`Complicaciones ${count}`}>
                            {count > 0 ? (
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            {count}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const lvl = procedure.technical_difficulty;
                        const label = lvl == null ? 'N/A' : (lvl <= 2 ? 'Baja' : (lvl === 3 ? 'Media' : 'Alta'));
                        const cls = lvl == null
                          ? 'badge'
                          : (lvl <= 2 ? 'badge badge-info' : (lvl === 3 ? 'badge badge-warning' : 'badge badge-error'));
                        return (
                          <span className={cls} aria-label={`Dificultad ${label}`}>
                            {label}{lvl ? ` · ${lvl}/5` : ''}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2 items-center">
                        <button
                          onClick={() => onView?.(procedure)}
                          className="text-blue-700 hover:"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(procedure)}
                          className="text-blue-700 hover:text-blue-900"
                          title="Edit procedure"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(procedure.id)}
                          className="text-blue-700 hover:text-blue-900"
                          title="Delete procedure"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {canAward && (
                          <div className="flex items-center gap-2 ml-2">
                            <input type="number" min="0" value={awardPointsMap[procedure.id] ?? 0}
                              onChange={e=>setAwardPointsMap(prev=>({ ...prev, [procedure.id]: Number(e.target.value) }))}
                              className="w-20 rounded border border-gray-300 dark:border-gray-600 p-1" />
                            <button onClick={() => handleAward(procedure)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Sumar pts</button>
                          </div>
                        )}
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



