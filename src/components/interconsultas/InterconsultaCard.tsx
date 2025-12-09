import React from 'react';
import { MessageCircle, MessageCircleOff, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { InterconsultaRow } from '../../services/interconsultasService';

interface InterconsultaCardProps {
  interconsulta: InterconsultaRow;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const InterconsultaCard: React.FC<InterconsultaCardProps> = ({
  interconsulta,
  onClick,
  isSelected = false,
  onToggleSelection,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const hasResponse = interconsulta.respuesta && interconsulta.respuesta.trim() !== '';

  const truncateText = (text: string | null | undefined, maxLength: number = 150) => {
    if (!text) return 'Sin relato';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="medical-card p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all relative">
      {/* Checkbox de selección - siempre visible en esquina superior izquierda */}
      {onToggleSelection && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(interconsulta.id!);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Botón de borrado individual - esquina superior derecha */}
      {onDelete && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(interconsulta.id!);
            }}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar interconsulta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Contenido clickeable de la tarjeta */}
      <div onClick={onClick} className="cursor-pointer">
        {/* Header: Patient name + Status badge - Ajustar padding para dejar espacio a los botones */}
        <div className="flex items-start justify-between mb-3 pl-8 pr-8">
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 line-clamp-1 flex-1">
            {interconsulta.nombre}
          </h3>
          <StatusBadge status={interconsulta.status} className="ml-2 flex-shrink-0" />
        </div>

      {/* Patient info: DNI and Cama */}
      <div className="flex items-center gap-3 mb-2 text-sm text-gray-600 dark:text-gray-400">
        <span>DNI: {interconsulta.dni}</span>
        <span>•</span>
        <span>Cama: {interconsulta.cama}</span>
      </div>

      {/* Fecha */}
      <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
        {formatDate(interconsulta.fecha_interconsulta)}
      </div>

      {/* Relato preview */}
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 min-h-[3rem]">
        {truncateText(interconsulta.relato_consulta)}
      </div>

      {/* Footer: Response indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          {hasResponse ? (
            <>
              <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 font-medium">Respondida</span>
            </>
          ) : (
            <>
              <MessageCircleOff className="h-4 w-4 text-gray-400 dark:text-gray-600" />
              <span className="text-gray-500 dark:text-gray-500">Sin respuesta</span>
            </>
          )}
        </div>
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Ver detalles
        </button>
      </div>
      </div>
    </div>
  );
};

export default InterconsultaCard;
