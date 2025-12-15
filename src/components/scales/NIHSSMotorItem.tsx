import React from 'react';
import { ScaleItem } from '../../types';

interface NIHSSMotorItemProps {
  itemLeft: ScaleItem;
  itemRight: ScaleItem;
  pareticSide: 'left' | 'right' | null;
  scores: { [key: string]: number | string };
  onScoreChange: (itemId: string, score: string) => void;
  isIncomplete: boolean;
}

export const NIHSSMotorItem: React.FC<NIHSSMotorItemProps> = ({
  itemLeft,
  itemRight,
  pareticSide,
  scores,
  onScoreChange,
  isIncomplete
}) => {
  const leftIsParetic = pareticSide === 'left';
  const rightIsParetic = pareticSide === 'right';

  return (
    <div className={`border rounded-lg p-4 ${
      isIncomplete
        ? 'border-yellow-400 dark:border-yellow-500 border-2 bg-yellow-50/30 dark:bg-yellow-900/10'
        : 'border-[var(--border-secondary)]'
    }`}>
      <h4 className="font-medium mb-3 text-center text-[var(--text-primary)]">
        {itemLeft.label.includes('Brazo') ? 'Motor - Brazos' : 'Motor - Piernas'}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna Izquierda */}
        <div className={`p-3 rounded-lg transition-colors ${
          leftIsParetic
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-500'
            : pareticSide
            ? 'bg-green-50 dark:bg-green-900/10 border border-green-300 dark:border-green-600'
            : 'bg-[var(--bg-secondary)] border border-[var(--border-secondary)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">Izquierdo</span>
            {leftIsParetic && (
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                PARÉTICO
              </span>
            )}
          </div>

          <div className="space-y-1">
            {itemLeft.options.map((option, idx) => {
              const optionValue = option.split(' - ')[0];
              const isSelected = scores[itemLeft.id] === (optionValue === 'UN' ? 'UN' : parseInt(optionValue));

              return (
                <label key={idx} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white/50 dark:hover:bg-black/20">
                  <input
                    type="radio"
                    name={itemLeft.id}
                    value={optionValue}
                    checked={isSelected}
                    onChange={(e) => onScoreChange(itemLeft.id, e.target.value)}
                    className="cursor-pointer"
                  />
                  <span className="text-xs text-[var(--text-primary)]">{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={`p-3 rounded-lg transition-colors ${
          rightIsParetic
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-500'
            : pareticSide
            ? 'bg-green-50 dark:bg-green-900/10 border border-green-300 dark:border-green-600'
            : 'bg-[var(--bg-secondary)] border border-[var(--border-secondary)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">Derecho</span>
            {rightIsParetic && (
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                PARÉTICO
              </span>
            )}
          </div>

          <div className="space-y-1">
            {itemRight.options.map((option, idx) => {
              const optionValue = option.split(' - ')[0];
              const isSelected = scores[itemRight.id] === (optionValue === 'UN' ? 'UN' : parseInt(optionValue));

              return (
                <label key={idx} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-white/50 dark:hover:bg-black/20">
                  <input
                    type="radio"
                    name={itemRight.id}
                    value={optionValue}
                    checked={isSelected}
                    onChange={(e) => onScoreChange(itemRight.id, e.target.value)}
                    className="cursor-pointer"
                  />
                  <span className="text-xs text-[var(--text-primary)]">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
