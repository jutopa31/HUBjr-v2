import React from 'react';
import { ReadingItem, READING_LEVEL_LABELS, READING_LEVEL_STYLES } from '../../types/reading';

interface ReadingCardProps {
  item: ReadingItem;
  onEdit?: (item: ReadingItem) => void;
  onDelete?: (item: ReadingItem) => void;
}

export default function ReadingCard({ item, onEdit, onDelete }: ReadingCardProps) {
  const levelStyle = READING_LEVEL_STYLES[item.level];

  return (
    <article
      className={`border-2 ${levelStyle.accent} border-l-4 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200`}
    >
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {item.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {item.category} - {item.source} - {item.year}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${levelStyle.badge}`}>
          {READING_LEVEL_LABELS[item.level]}
        </span>
      </header>

      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 mb-3">
        {item.summary}
      </p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Tiempo estimado: {item.readingTime}
        </span>
        <div className="flex items-center gap-2">
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
            >
              Abrir lectura
            </a>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">Sin link</span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

