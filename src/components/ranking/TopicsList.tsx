import React from 'react';
import { Edit2, Trash2, Award, X } from 'lucide-react';
import type { Topic } from '../../services/rankingService';

type Props = {
  topics: Topic[];
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onAddPoints: (topic: Topic) => void;
  onClose?: (topic: Topic) => void;
  showCloseButton?: boolean;
};

const TopicsList: React.FC<Props> = ({ topics, onEdit, onDelete, onAddPoints, onClose, showCloseButton }) => {
  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No hay temas en esta categoría
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {topics.map(topic => (
        <div
          key={topic.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#141414] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {topic.title}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  topic.period === 'weekly'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                }`}>
                  {topic.period === 'weekly' ? 'Semanal' : 'Mensual'}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                <div>Inicio: {new Date(topic.startDate).toLocaleDateString('es-AR', { dateStyle: 'medium' })}</div>
                <div>Fin: {new Date(topic.endDate).toLocaleDateString('es-AR', { dateStyle: 'medium' })}</div>
              </div>

              {topic.objectives && (
                <details className="mt-2">
                  <summary className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    Ver objetivos
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                    {topic.objectives}
                  </p>
                </details>
              )}

              {topic.materials && topic.materials.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Materiales:</div>
                  <ul className="text-xs list-disc pl-5 text-blue-600 dark:text-blue-400">
                    {topic.materials.map((m, i) => (
                      <li key={i}>
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {m.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => onEdit(topic)}
                className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Editar tema"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddPoints(topic)}
                className="p-2 rounded-md border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                title="Agregar puntos manualmente"
              >
                <Award className="h-4 w-4" />
              </button>
              {showCloseButton && onClose && (
                <button
                  onClick={() => onClose(topic)}
                  className="p-2 rounded-md border border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                  title="Cerrar tema anticipadamente"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(topic)}
                className="p-2 rounded-md border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Eliminar tema"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopicsList;
