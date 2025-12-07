import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  patientCountByDate: Record<string, number>;  // { '2024-01-15': 3 }
}

const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, onDateSelect, patientCountByDate }) => {
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

  // Get all weekdays (Mon-Fri) in the current month
  const getWeekdaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];

    // Add all days of the month, but only weekdays (Mon-Fri)
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const dayOfWeek = day.getDay();
      // Only include Monday (1) through Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(day);
      }
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    newDate.setDate(1);
    setCurrentDate(newDate);
  };

  const weekdays = getWeekdaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group days into weeks (5 days per week)
  const weeks: Date[][] = [];
  for (let i = 0; i < weekdays.length; i += 5) {
    weeks.push(weekdays.slice(i, i + 5));
  }

  const formatDateKey = (date: Date): string => {
    return date.toISOString().slice(0, 10);
  };

  const isSelected = (date: Date): boolean => {
    return formatDateKey(date) === formatDateKey(selectedDate);
  };

  const isToday = (date: Date): boolean => {
    return formatDateKey(date) === formatDateKey(today);
  };

  return (
    <div className="medical-card p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header: Month/Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        {weekdayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid - only weekdays */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-5 gap-2">
            {week.map((day, dayIndex) => {
              const dateKey = formatDateKey(day);
              const count = patientCountByDate[dateKey] || 0;
              const selected = isSelected(day);
              const todayClass = isToday(day);

              return (
                <button
                  key={dayIndex}
                  type="button"
                  onClick={() => onDateSelect(day)}
                  className={`
                    aspect-square p-2 rounded-md border transition-all
                    ${selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : todayClass
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    ${!selected && 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className={`
                      text-sm font-medium mb-1
                      ${selected
                        ? 'text-blue-700 dark:text-blue-300'
                        : todayClass
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }
                    `}>
                      {day.getDate()}
                    </div>
                    {count > 0 && (
                      <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
