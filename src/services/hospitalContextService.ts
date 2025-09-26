import type { HospitalContext } from '../types';

export interface HospitalContextOption {
  value: HospitalContext;
  label: string;
  color: string;
  description: string;
}

export const DEFAULT_HOSPITAL_CONTEXT: HospitalContext = 'Posadas';

export const HOSPITAL_CONTEXT_OPTIONS: HospitalContextOption[] = [
  {
    value: 'Posadas',
    label: 'Hospital Posadas',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Pacientes del Hospital Nacional Posadas'
  },
  {
    value: 'Julian',
    label: 'Consultorios Julian',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Pacientes de consultorios particulares'
  }
];

export function getHospitalContextOption(context: HospitalContext): HospitalContextOption | undefined {
  return HOSPITAL_CONTEXT_OPTIONS.find((option) => option.value === context);
}
