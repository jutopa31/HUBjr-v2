import React from 'react';

interface StepNavigationProps {
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  nextLabel = 'Siguiente'
}) => {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className={`rounded-lg border px-4 py-2 font-semibold text-sm ${
          canGoBack
            ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Anterior
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={`rounded-lg px-4 py-2 font-semibold text-sm ${
          canGoNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
};

export default React.memo(StepNavigation);
