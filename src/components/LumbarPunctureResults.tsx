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
  Trash2
} from 'lucide-react';
import { useLumbarPuncture, useLPFilters } from '../hooks/useLumbarPuncture';
import { useAuthContext } from '../components/auth/AuthProvider';
import { awardPointsForLumbarPuncture } from '../services/rankingService';
import { LumbarPuncture, LPFilters, LPSearchParams } from '../types/lumbarPuncture';

interface LumbarPunctureResultsProps {
  onEdit?: (procedure: LumbarPuncture) => void;
  onView?: (procedure: LumbarPuncture) => void;
}

export default function LumbarPunctureResults({ onEdit, onView }: LumbarPunctureResultsProps) {
  const { hasPrivilege } = useAuthContext();
  const { procedures, loading, error, fetchProcedures, deleteProcedure } = useLumbarPuncture();
  const { residents, supervisors, loading: filtersLoading } = useLPFilters();

  const [searchParams, setSearchParams] = useState<LPSearchParams>({
    search: '',
    filters: {},
    sort_by: 'procedure_date',
    sort_order: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);

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
    <div className="space-y-4">

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
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Indicación
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Residente
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Intentos
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Complicaciones
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dificultad
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {procedures.map((procedure) => (
                  <tr key={procedure.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        <span className="font-medium">{new Date(procedure.procedure_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-semibold text-gray-900">{procedure.patient_initials}</div>
                        {procedure.patient_age && (
                          <div className="text-xs text-gray-500">{procedure.patient_age}a · {procedure.patient_gender}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="max-w-xs truncate">{procedure.indication}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                        {procedure.supervisor}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {procedure.resident_name || 'Desconocido'}
                          </div>
                          {procedure.resident_level && (
                            <div className="text-xs text-gray-500">{procedure.resident_level}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      <span className="capitalize">{procedure.trainee_role?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                      {procedure.attempts_count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-1 items-center">
                        <button
                          onClick={() => onView?.(procedure)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(procedure)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(procedure.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {canAward && (
                          <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
                            <input type="number" min="0" value={awardPointsMap[procedure.id] ?? 0}
                              onChange={e=>setAwardPointsMap(prev=>({ ...prev, [procedure.id]: Number(e.target.value) }))}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs" />
                            <button onClick={() => handleAward(procedure)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">+Pts</button>
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



