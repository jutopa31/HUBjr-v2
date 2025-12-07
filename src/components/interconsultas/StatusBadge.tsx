import React from 'react';

interface StatusBadgeProps {
  status: 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Pendiente':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'En Proceso':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'Resuelta':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'Cancelada':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${getStatusStyles()} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
