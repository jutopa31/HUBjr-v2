import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SectionAccordionProps {
  title: string;
  icon?: React.ReactNode;
  isRequired?: boolean;
  isComplete?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const SectionAccordion: React.FC<SectionAccordionProps> = ({
  title,
  icon,
  isRequired = false,
  isComplete = false,
  defaultOpen = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              {icon}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              {isRequired && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                  Obligatoria
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Completa</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pendiente</span>
                </>
              )}
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">{children}</div>}
    </div>
  );
};

export default SectionAccordion;
