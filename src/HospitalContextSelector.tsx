import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { HospitalContext } from './types';
import { useAuthContext } from './components/auth/AuthProvider';
import {
  HOSPITAL_CONTEXT_OPTIONS,
  getHospitalContextOption
} from './services/hospitalContextService';

interface HospitalContextSelectorProps {
  currentContext: HospitalContext;
  onContextChange: (context: HospitalContext) => void;
  isAdminMode: boolean;
}

const HospitalContextSelector: React.FC<HospitalContextSelectorProps> = ({
  currentContext,
  onContextChange,
  isAdminMode
}) => {
  const { hasPrivilege, hasHospitalContextAccess } = useAuthContext();

  // Solo mostrar si tiene privilegios o esta en modo admin
  const canAccessHospitalSelector = hasPrivilege('full_admin') || hasHospitalContextAccess || isAdminMode;

  if (!canAccessHospitalSelector) {
    return null;
  }

  const currentOption = getHospitalContextOption(currentContext);

  return (
    <div className="mb-4 bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Contexto de Hospital</h3>
        </div>

        <div className="relative">
          <select
            value={currentContext}
            onChange={(e) => onContextChange(e.target.value as HospitalContext)}
            className={`
              appearance-none pr-8 pl-3 py-2 text-sm font-medium rounded-lg border cursor-pointer
              ${currentOption?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
              hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            `}
          >
            {HOSPITAL_CONTEXT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default HospitalContextSelector;
