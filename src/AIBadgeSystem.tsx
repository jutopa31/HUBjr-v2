import React, { useMemo } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { AISuggestion } from './types';

interface AIBadgeSystemProps {
  scaleId: string;
  suggestions: AISuggestion[];
  onScaleClick: (scaleId: string) => void;
}

const AIBadgeSystem: React.FC<AIBadgeSystemProps> = ({ 
  scaleId, 
  suggestions, 
  onScaleClick 
}) => {
  const suggestion = useMemo(() => 
    suggestions.find(s => s.scaleId === scaleId), 
    [suggestions, scaleId]
  );

  if (!suggestion || suggestion.confidence < 0.1) {
    return null;
  }

  const getBadgeColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-red-500 text-white';
    if (confidence >= 0.4) return 'bg-orange-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getBadgeIcon = (confidence: number) => {
    if (confidence >= 0.7) return <AlertTriangle className="h-3 w-3" />;
    return <Brain className="h-3 w-3" />;
  };

  const handleClick = () => {
    onScaleClick(scaleId);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`absolute -top-1 -right-1 flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getBadgeColor(suggestion.confidence)} animate-pulse hover:animate-none hover:scale-110 transition-all duration-200 shadow-lg z-10`}
        title={`IA sugiere: ${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% confianza)`}
      >
        {getBadgeIcon(suggestion.confidence)}
        <span className="font-medium">
          {Math.round(suggestion.confidence * 100)}%
        </span>
      </button>
    </div>
  );
};

export default React.memo(AIBadgeSystem);