import React, { useState, useEffect } from 'react';
import { X, Save, Copy, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { InterconsultaRow } from '../../services/interconsultasService';
import { updateStatus, updateRespuestaWithStatus } from '../../services/interconsultasService';
import { saveToWardRounds, saveToSavedPatients } from '../../utils/interconsultasUtils';
import { useAuthContext } from '../auth/AuthProvider';

interface InterconsultaDetailModalProps {
  interconsulta: InterconsultaRow;
  onClose: () => void;
  onUpdate: (updated: InterconsultaRow) => void;
}

const InterconsultaDetailModal: React.FC<InterconsultaDetailModalProps> = ({
  interconsulta,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuthContext();
  const [currentStatus, setCurrentStatus] = useState(interconsulta.status);
  const [respuesta, setRespuesta] = useState(interconsulta.respuesta || '');
  const [respuestaDirty, setRespuestaDirty] = useState(false);
  const [savingRespuesta, setSavingRespuesta] = useState(false);
  const [savingPase, setSavingPase] = useState(false);
  const [savingPacientes, setSavingPacientes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentStatus(interconsulta.status);
    setRespuesta(interconsulta.respuesta || '');
    setRespuestaDirty(false);
  }, [interconsulta]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusChange = async (newStatus: string) => {
    if (!interconsulta.id) return;

    setUpdatingStatus(true);
    setError(null);

    const previousStatus = currentStatus;
    setCurrentStatus(newStatus as any);

    const { success, error: updateError, data } = await updateStatus(interconsulta.id, newStatus);

    setUpdatingStatus(false);

    if (!success) {
      setCurrentStatus(previousStatus);
      setError(updateError || 'Error al actualizar estado');
      return;
    }

    if (data) {
      onUpdate(data);
    }
    setSuccessMessage('Estado actualizado correctamente');
  };

  const handleSaveRespuesta = async () => {
    if (!interconsulta.id || !user) {
      setError('Debes iniciar sesión para guardar la respuesta');
      return;
    }

    setSavingRespuesta(true);
    setError(null);

    const { success, error: updateError, data } = await updateRespuestaWithStatus(
      interconsulta.id,
      respuesta,
      currentStatus
    );

    setSavingRespuesta(false);

    if (!success) {
      setError(updateError || 'Error al guardar respuesta');
      return;
    }

    if (data) {
      setCurrentStatus(data.status);
      onUpdate(data);
    }

    setRespuestaDirty(false);
    setSuccessMessage('Respuesta guardada correctamente');
  };

  const handleSaveToPase = async () => {
    if (!user) {
      setError('Debes iniciar sesión para guardar en Pase de Sala');
      return;
    }

    setSavingPase(true);
    setError(null);

    const { success, error: saveError } = await saveToWardRounds({
      nombre: interconsulta.nombre,
      dni: interconsulta.dni,
      cama: interconsulta.cama,
      relato_consulta: interconsulta.relato_consulta || '',
      fecha_interconsulta: interconsulta.fecha_interconsulta,
      respuesta: respuesta || '',
    });

    setSavingPase(false);

    if (!success) {
      setError(saveError || 'No se pudo guardar en Pase de Sala');
    } else {
      setSuccessMessage(`Paciente "${interconsulta.nombre}" guardado en Pase de Sala`);
    }
  };

  const handleSaveToPacientes = async () => {
    if (!user) {
      setError('Debes iniciar sesión para guardar en Pacientes');
      return;
    }

    setSavingPacientes(true);
    setError(null);

    const { success, error: saveError } = await saveToSavedPatients({
      nombre: interconsulta.nombre,
      dni: interconsulta.dni,
      cama: interconsulta.cama,
      relato_consulta: interconsulta.relato_consulta || '',
      fecha_interconsulta: interconsulta.fecha_interconsulta,
      respuesta: respuesta || '',
    });

    setSavingPacientes(false);

    if (!success) {
      setError(saveError || 'No se pudo guardar en Pacientes');
    } else {
      setSuccessMessage(`Paciente "${interconsulta.nombre}" guardado en base de pacientes`);
    }
  };

  const handleCopyRelato = async () => {
    if (interconsulta.relato_consulta) {
      await navigator.clipboard.writeText(interconsulta.relato_consulta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="medical-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 medical-card border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {interconsulta.nombre}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus || !user}
                className="px-3 py-1 text-sm border rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Resuelta">Resuelta</option>
                <option value="Cancelada">Cancelada</option>
              </select>
              <StatusBadge status={currentStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
            {successMessage}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Patient Info Section */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                DNI
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{interconsulta.dni}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Cama
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{interconsulta.cama}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Fecha de Interconsulta
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(interconsulta.fecha_interconsulta)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Creado
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatTimestamp(interconsulta.created_at)}
              </p>
            </div>
          </div>

          {/* Relato Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Relato o motivo de la consulta
              </label>
              <button
                onClick={handleCopyRelato}
                className="text-xs btn-soft px-2 py-1 rounded inline-flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
                {interconsulta.relato_consulta || 'Sin relato'}
              </p>
            </div>
          </div>

          {/* Respuesta Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Respuesta
            </label>
            <textarea
              value={respuesta}
              onChange={(e) => {
                setRespuesta(e.target.value);
                setRespuestaDirty(true);
              }}
              placeholder="Escribe la respuesta a la interconsulta..."
              rows={6}
              className="w-full px-4 py-3 text-sm border rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)',
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {interconsulta.updated_at && `Última actualización: ${formatTimestamp(interconsulta.updated_at)}`}
              </p>
              <button
                onClick={handleSaveRespuesta}
                disabled={!respuestaDirty || savingRespuesta || !user}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  respuestaDirty && !savingRespuesta ? 'btn-accent' : 'btn-soft'
                } disabled:cursor-not-allowed`}
              >
                <Save className="h-4 w-4" />
                {savingRespuesta ? 'Guardando...' : 'Guardar Respuesta'}
              </button>
            </div>
            {currentStatus === 'Pendiente' && respuesta.trim() !== '' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Al guardar la respuesta, el estado cambiará automáticamente a "En Proceso"
              </p>
            )}
          </div>

          {/* Actions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Acciones rápidas
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveToPase}
                disabled={savingPase || !user}
                className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                  savingPase ? 'btn-accent' : 'btn-soft'
                } disabled:cursor-not-allowed`}
              >
                {savingPase ? 'Guardando...' : 'Guardar en Pase de Sala'}
              </button>
              <button
                onClick={handleSaveToPacientes}
                disabled={savingPacientes || !user}
                className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                  savingPacientes ? 'btn-accent' : 'btn-soft'
                } disabled:cursor-not-allowed`}
              >
                {savingPacientes ? 'Guardando...' : 'Guardar en Pacientes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterconsultaDetailModal;
