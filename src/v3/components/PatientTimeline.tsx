import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PatientV3, PatientDestination } from '../types/v3.types';

interface PatientTimelineProps {
  patient: PatientV3;
}

const destinationLabels: Record<PatientDestination, string> = {
  interconsulta: 'Interconsulta',
  pase_sala: 'Pase de Sala',
  post_alta: 'Post-Alta',
  ambulatorio: 'Ambulatorio',
};

const destinationIcons: Record<PatientDestination, string> = {
  interconsulta: '📋',
  pase_sala: '🏥',
  post_alta: '📅',
  ambulatorio: '🚶',
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function PatientTimeline({ patient }: PatientTimelineProps) {
  const { theme } = useTheme();

  const hasHistory =
    patient.destinations_history && patient.destinations_history.length > 0;
  const hasEvolutions = patient.evoluciones && patient.evoluciones.length > 0;

  if (!hasHistory && !hasEvolutions) {
    return (
      <div
        className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
        }`}
      >
        <p
          className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Sin historial disponible
        </p>
      </div>
    );
  }

  // Combine and sort all timeline events
  type TimelineEvent = {
    type: 'destination' | 'evolution';
    date: string;
    data: {
      destination?: PatientDestination;
      entered_at?: string;
      exited_at?: string;
      id?: string;
      nota?: string;
      ai_assisted?: boolean;
      created_by?: string;
    };
  };

  const events: TimelineEvent[] = [];

  // Add destination history entries
  if (hasHistory) {
    patient.destinations_history.forEach((entry) => {
      events.push({
        type: 'destination',
        date: entry.entered_at,
        data: entry,
      });
    });
  }

  // Add evolution notes
  if (hasEvolutions) {
    patient.evoluciones.forEach((evo) => {
      events.push({
        type: 'evolution',
        date: evo.fecha,
        data: evo,
      });
    });
  }

  // Sort by date (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div
      className={`rounded-lg ${
        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}
    >
      <h3
        className={`p-3 text-sm font-semibold border-b ${
          theme === 'dark'
            ? 'text-gray-200 border-gray-600'
            : 'text-gray-800 border-gray-200'
        }`}
      >
        Historial del paciente
      </h3>

      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={`${event.type}-${index}`}
            className={`flex gap-3 ${
              index < events.length - 1
                ? `pb-3 border-b ${
                    theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                  }`
                : ''
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {event.type === 'destination' ? (
                <span className="text-lg">
                  {destinationIcons[event.data.destination as PatientDestination]}
                </span>
              ) : (
                <span className="text-lg">
                  {event.data.ai_assisted ? '🤖' : '📝'}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {event.type === 'destination' ? (
                <>
                  <p
                    className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    {destinationLabels[event.data.destination as PatientDestination]}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Ingreso: {formatDate(event.data.entered_at!)}
                    {event.data.exited_at && (
                      <> | Salida: {formatDate(event.data.exited_at)}</>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={`text-sm ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    } line-clamp-2`}
                  >
                    {event.data.nota}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {formatDate(event.date)}
                    {event.data.created_by && <> | {event.data.created_by}</>}
                    {event.data.ai_assisted && (
                      <span className="ml-1 text-purple-500">(AI)</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
