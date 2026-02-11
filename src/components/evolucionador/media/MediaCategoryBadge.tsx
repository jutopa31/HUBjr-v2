import React from 'react';
import type { MediaCategory } from '../../../types/evolucionadorStructured';

const categoryStyles: Record<MediaCategory, string> = {
  Estudio: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  'Examen fisico': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  Procedimiento: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  Otro: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
};

interface MediaCategoryBadgeProps {
  category: MediaCategory;
}

const MediaCategoryBadge: React.FC<MediaCategoryBadgeProps> = ({ category }) => (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryStyles[category]}`}>
    {category}
  </span>
);

export default MediaCategoryBadge;
