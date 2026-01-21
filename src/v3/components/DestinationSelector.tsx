import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientDestination } from '../types/v3.types';

interface DestinationSelectorProps {
  selected: PatientDestination;
  onChange: (destination: PatientDestination) => void;
  disabled?: boolean;
}

const destinations: { id: PatientDestination; label: string; icon: string }[] = [
  { id: 'interconsulta', label: 'Interconsulta', icon: '📋' },
  { id: 'pase_sala', label: 'Pase Sala', icon: '🏥' },
  { id: 'post_alta', label: 'Post-Alta', icon: '📅' },
  { id: 'ambulatorio', label: 'Ambulatorio', icon: '🚶' },
];

export default function DestinationSelector({
  selected,
  onChange,
  disabled = false,
}: DestinationSelectorProps) {
  const { theme } = useTheme();

  return (
    <div className="flex gap-1">
      {destinations.map((dest) => {
        const isSelected = selected === dest.id;
        return (
          <button
            key={dest.id}
            type="button"
            onClick={() => onChange(dest.id)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? theme === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="mr-1">{dest.icon}</span>
            {dest.label}
          </button>
        );
      })}
    </div>
  );
}
