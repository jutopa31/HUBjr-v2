import React from 'react';
import { Calendar, Phone, FileText, AlertCircle, MessageCircle } from 'lucide-react';
import { PacientePostAltaRow } from '../../services/pacientesPostAltaService';

// Utility: Format phone for WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Add Argentina country code (+54) and mobile prefix (9)
  // Format: +54 9 [area code] [number] → +5491112345678
  return `+549${cleaned}`;
};

// Utility: Format phone for tel: protocol
const formatPhoneForTel = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Add Argentina country code
  return `+54${cleaned}`;
};

// Utility: Detect if user is on mobile device
const isMobileDevice = (): boolean => {
  // Use matchMedia for responsive detection
  return window.matchMedia('(max-width: 768px)').matches;
};

interface ContactButtonProps {
  phone: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContactButton: React.FC<ContactButtonProps> = ({ phone }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect device type on mount and window resize
  React.useEffect(() => {
    const checkDevice = () => setIsMobile(isMobileDevice());

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent card onClick from firing
    e.stopPropagation();

    // Open appropriate link based on device
    const url = isMobile
      ? `tel:${formatPhoneForTel(phone)}`
      : `https://wa.me/${formatPhoneForWhatsApp(phone).replace('+', '')}`;

    window.location.href = url;
  };

  // Dynamic icon based on device
  const Icon = isMobile ? Phone : MessageCircle;
  const iconColor = isMobile ? 'text-green-500' : 'text-green-600';

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded px-2 py-1 hover:bg-green-50 dark:hover:bg-green-900/20"
      title={isMobile ? 'Llamar' : 'Abrir en WhatsApp'}
    >
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <span className="font-medium">{phone}</span>
    </button>
  );
};

interface PatientCardProps {
  patient: PacientePostAltaRow;
  onClick: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasNotas = patient.notas_evolucion && patient.notas_evolucion.trim() !== '';
  const hasPendiente = patient.pendiente && patient.pendiente.trim() !== '';

  return (
    <div
      onClick={onClick}
      className="medical-card p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header: Patient name + DNI */}
      <div className="mb-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
          {patient.nombre}
          {patient.dni && (
            <span className="font-normal text-sm text-gray-600 dark:text-gray-400 ml-2">
              ({patient.dni})
            </span>
          )}
        </h3>
      </div>

      {/* Diagnosis */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {truncateText(patient.diagnostico, 60)}
        </p>
      </div>

      {/* Date + Phone */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>{formatDate(patient.fecha_visita)}</span>
        </div>
        {patient.telefono && <ContactButton phone={patient.telefono} />}
      </div>

      {/* Indicators: Notes + Pending */}
      <div className="flex items-center gap-3 mb-3">
        {hasNotas && (
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span>Notas</span>
          </div>
        )}
        {hasPendiente && (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <AlertCircle className="h-4 w-4" />
            <span>Pendiente</span>
          </div>
        )}
      </div>

      {/* Action link */}
      <div className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
        Ver detalles →
      </div>
    </div>
  );
};

export default PatientCard;
