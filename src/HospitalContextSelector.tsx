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
    <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-5 w-5 text-gray-500" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Contexto de Hospital</h3>
            <p className="text-xs text-gray-500">
              {hasPrivilege('full_admin')
                ? 'Acceso de administrador completo'
                : hasHospitalContextAccess
                ? 'Acceso autorizado a contextos hospitalarios'
                : 'Solo disponible en modo administrador'}
            </p>
          </div>
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

      {/* Descripcion del contexto actual */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Contexto actual:</span> {currentOption?.description}
        </p>
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          <span> Solo visible en modo administrador</span>
          <span> Los datos se filtran automaticamente</span>
          <span> Por defecto: Hospital Posadas</span>
        </div>
      </div>
    </div>
  );
};

export default HospitalContextSelector;
