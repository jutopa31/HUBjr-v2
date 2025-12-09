import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
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
    <div className="mb-4">
      {/* Compact Horizontal Filters */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
      }}>
        {/* Search Input - Compact */}
        <div className="relative flex-shrink-0" style={{ minWidth: '200px', maxWidth: '240px' }}>
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs border rounded"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
          />
        </div>

        {/* Status Pills - Inline */}
        {allStatuses.map((status) => {
          const isActive = filters.status?.includes(status);
          const count = statusCounts?.[status] || 0;

          return (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`px-2 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status} {count > 0 && `(${count})`}
            </button>
          );
        })}

        {/* Date Preset Dropdown */}
        <div className="relative">
          <select
            value={datePreset}
            onChange={(e) => handleDatePreset(e.target.value as any)}
            className="pl-2 pr-7 py-1.5 text-xs border rounded appearance-none cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <option value="all">📅 Todas</option>
            <option value="week">📅 Última semana</option>
            <option value="month">📅 Último mes</option>
            <option value="custom">📅 Personalizado</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-2 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1 whitespace-nowrap"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Custom Date Range - Expandable */}
      {datePreset === 'custom' && (
        <div className="mt-2 flex gap-2 p-2 rounded-lg" style={{
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
              }
              className="w-full px-2 py-1.5 text-xs border rounded"
              style={{
                backgroundColor: 'var(--bg-primary)',
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
              className="w-full px-2 py-1.5 text-xs border rounded"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InterconsultaFiltersComponent;
