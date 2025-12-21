import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const percentage = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-gray-500 text-xs">
        <span>
          Paso {currentStep + 1} de {totalSteps}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);
