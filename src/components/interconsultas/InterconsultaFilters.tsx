import React, { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { InterconsultaFilters } from '../../services/interconsultasService';

interface InterconsultaFiltersProps {
  filters: InterconsultaFilters;
  onFiltersChange: (filters: InterconsultaFilters) => void;
  statusCounts?: {
    Pendiente: number;
    'En Proceso': number;
    Resuelta: number;
    Cancelada: number;
  };
}

const InterconsultaFiltersComponent: React.FC<InterconsultaFiltersProps> = ({
  filters,
  onFiltersChange,
  statusCounts,
}) => {
  const [searchText, setSearchText] = useState(filters.searchText || '');
  const [datePreset, setDatePreset] = useState<'all' | 'week' | 'month' | 'custom'>('all');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchText: searchText.trim() || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleDatePreset = (preset: 'all' | 'week' | 'month' | 'custom') => {
    setDatePreset(preset);

    if (preset === 'all') {
      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined });
    } else if (preset === 'week') {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      onFiltersChange({
        ...filters,
        dateFrom: weekAgo.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
      });
    } else if (preset === 'month') {
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      onFiltersChange({
        ...filters,
        dateFrom: monthAgo.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
      });
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setDatePreset('all');
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.searchText ||
    (filters.status && filters.status.length > 0) ||
    filters.dateFrom ||
    filters.dateTo;

  const allStatuses: Array<'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada'> = [
    'Pendiente',
    'En Proceso',
    'Resuelta',
    'Cancelada',
  ];

  return (
    <div className="medical-card p-4 mb-4 space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm btn-soft rounded-lg inline-flex items-center gap-2 whitespace-nowrap"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Status Filter Buttons */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Estado
        </label>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((status) => {
            const isActive = filters.status?.includes(status);
            const count = statusCounts?.[status] || 0;

            return (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <Calendar className="inline h-4 w-4 mr-1" />
          Fecha
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDatePreset('all')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              datePreset === 'all'
                ? 'bg-blue-600 text-white'
                : 'btn-soft'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleDatePreset('week')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              datePreset === 'week'
                ? 'bg-blue-600 text-white'
                : 'btn-soft'
            }`}
          >
            Última semana
          </button>
          <button
            onClick={() => handleDatePreset('month')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              datePreset === 'month'
                ? 'bg-blue-600 text-white'
                : 'btn-soft'
            }`}
          >
            Último mes
          </button>
          <button
            onClick={() => handleDatePreset('custom')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              datePreset === 'custom'
                ? 'bg-blue-600 text-white'
                : 'btn-soft'
            }`}
          >
            Personalizado
          </button>
        </div>

        {datePreset === 'custom' && (
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Desde</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
                }
                className="w-full px-3 py-2 text-sm border rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
                }
                className="w-full px-3 py-2 text-sm border rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterconsultaFiltersComponent;
