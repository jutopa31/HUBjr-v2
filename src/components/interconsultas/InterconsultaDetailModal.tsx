import React, { useState, useEffect } from 'react';
import { X, Save, Copy, Check, FileText, Upload, MessageSquare, Edit2, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { InterconsultaRow } from '../../services/interconsultasService';
import { updateStatus, updateRespuestaWithStatus, uploadImageToInterconsulta, removeImageFromInterconsulta, appendOCRTextToInterconsulta, updateInterconsultaData } from '../../services/interconsultasService';
import { saveToWardRounds, saveToSavedPatients } from '../../utils/interconsultasUtils';
import { useAuthContext } from '../auth/AuthProvider';
import ConfirmacionEvolucionadorModal from './ConfirmacionEvolucionadorModal';

interface InterconsultaDetailModalProps {
  interconsulta: InterconsultaRow;
  onClose: () => void;
  onUpdate: (updated: InterconsultaRow) => void;
  onGoToEvolucionador?: (interconsulta: InterconsultaRow) => void;
}

const InterconsultaDetailModal: React.FC<InterconsultaDetailModalProps> = ({
  interconsulta,
  onClose,
  onUpdate,
  onGoToEvolucionador,
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

  // Estados para manejo de imágenes y OCR
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [processingOCR, setProcessingOCR] = useState(false);

  // Estado para modal de confirmación de ir al Evolucionador
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Estados para edición de datos básicos
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedNombre, setEditedNombre] = useState(interconsulta.nombre);
  const [editedDni, setEditedDni] = useState(interconsulta.dni);
  const [editedCama, setEditedCama] = useState(interconsulta.cama);
  const [editedRelato, setEditedRelato] = useState(interconsulta.relato_consulta || '');
  const [editedEdad, setEditedEdad] = useState(interconsulta.edad || '');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setCurrentStatus(interconsulta.status);
    setRespuesta(interconsulta.respuesta || '');
    setRespuestaDirty(false);
    setEditedNombre(interconsulta.nombre);
    setEditedDni(interconsulta.dni);
    setEditedCama(interconsulta.cama);
    setEditedRelato(interconsulta.relato_consulta || '');
    setEditedEdad(interconsulta.edad || '');
    setIsEditMode(false);
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

  // ============ HANDLERS DE IMÁGENES Y OCR ============

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !interconsulta.id) return;

    if (!user) {
      setError('Debes iniciar sesión para subir imágenes');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const result = await uploadImageToInterconsulta(interconsulta.id, file);
        if (!result) {
          throw new Error('Error al subir imagen');
        }
      }

      // Recargar interconsulta para obtener las nuevas URLs
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeño delay para asegurar que la BD se actualizó
      window.location.reload(); // Por ahora recargamos la página (ideal sería recargar solo el modal)
      setSuccessMessage(`${files.length} imagen(es) subida(s) correctamente`);
    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      setError('Error al subir imágenes');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!interconsulta.id) return;
    if (!confirm('¿Eliminar esta imagen?')) return;

    const success = await removeImageFromInterconsulta(interconsulta.id, index);
    if (success) {
      window.location.reload(); // Recargar para mostrar cambios
      setSuccessMessage('Imagen eliminada');
    } else {
      setError('Error al eliminar imagen');
    }
  };

  const handleOCRComplete = async () => {
    if (!interconsulta.id || !ocrText.trim()) return;

    setProcessingOCR(true);
    setError(null);

    const success = await appendOCRTextToInterconsulta(interconsulta.id, ocrText);
    setProcessingOCR(false);

    if (success) {
      window.location.reload(); // Recargar para mostrar cambios
      setSuccessMessage('Texto OCR agregado correctamente');
      setShowOCRModal(false);
      setOcrText('');
    } else {
      setError('Error al guardar texto OCR');
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancelar edición - revertir cambios
      setEditedNombre(interconsulta.nombre);
      setEditedDni(interconsulta.dni);
      setEditedCama(interconsulta.cama);
      setEditedRelato(interconsulta.relato_consulta || '');
      setEditedEdad(interconsulta.edad || '');
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveEdit = async () => {
    if (!interconsulta.id) return;

    // Validación básica
    if (!editedNombre.trim() || !editedDni.trim() || !editedCama.trim()) {
      setError('Nombre, DNI y Cama son campos requeridos');
      return;
    }

    setSavingEdit(true);
    setError(null);

    const updates = {
      nombre: editedNombre.trim(),
      dni: editedDni.trim(),
      cama: editedCama.trim(),
      relato_consulta: editedRelato.trim(),
      edad: editedEdad.trim()
    };

    const { success, data, error: updateError } = await updateInterconsultaData(interconsulta.id, updates);
    setSavingEdit(false);

    if (!success) {
      setError(updateError || 'Error al guardar cambios');
      return;
    }

    if (data) {
      onUpdate(data);
      setIsEditMode(false);
      setSuccessMessage('Interconsulta actualizada correctamente');
    }
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
                disabled={updatingStatus || !user || isEditMode}
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
          <div className="flex items-center gap-2 ml-4">
            {isEditMode ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleEditToggle}
                  disabled={savingEdit}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                disabled={!user}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                title="Editar datos de la interconsulta"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
          {/* Grid horizontal: Datos del paciente (izquierda) + Relato (derecha) */}
          <div className="grid md:grid-cols-5 gap-4">
            {/* Columna izquierda: 2/5 (40%) - Datos del paciente */}
            <div className="md:col-span-2 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre {isEditMode && <span className="text-red-500">*</span>}
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedNombre}
                    onChange={(e) => setEditedNombre(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Nombre del paciente"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">
                    {interconsulta.nombre}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  DNI {isEditMode && <span className="text-red-500">*</span>}
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedDni}
                    onChange={(e) => setEditedDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="DNI"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{interconsulta.dni}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Cama {isEditMode && <span className="text-red-500">*</span>}
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedCama}
                    onChange={(e) => setEditedCama(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Cama"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{interconsulta.cama}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Edad
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedEdad}
                    onChange={(e) => setEditedEdad(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Edad (opcional)"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{interconsulta.edad || 'No especificada'}</p>
                )}
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

            {/* Columna derecha: 3/5 (60%) - Relato */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Relato o motivo de la consulta
                </label>
                {!isEditMode && (
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
                )}
              </div>
              {isEditMode ? (
                <textarea
                  value={editedRelato}
                  onChange={(e) => setEditedRelato(e.target.value)}
                  className="w-full h-[200px] px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
                  placeholder="Relato o motivo de la consulta"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
                    {interconsulta.relato_consulta || 'Sin relato'}
                  </p>
                </div>
              )}
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

          {/* Sección de Imágenes y Estudios */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Imágenes y Estudios
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOCRModal(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs inline-flex items-center gap-1.5"
                  title="Extraer texto de PDF/imagen"
                >
                  <FileText className="h-3.5 w-3.5" />
                  OCR
                </button>
                <input
                  type="file"
                  id="image-upload-interconsulta-detail"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="image-upload-interconsulta-detail"
                  className={`px-3 py-1.5 ${uploadingImage ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded text-xs cursor-pointer inline-flex items-center gap-1.5`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImage ? 'Subiendo...' : 'Subir'}
                </label>
              </div>
            </div>

            {/* Grid de imágenes */}
            {interconsulta.image_full_url && interconsulta.image_full_url.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {interconsulta.image_full_url.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={interconsulta.image_thumbnail_url?.[idx] || url}
                      alt={`Imagen ${idx + 1}`}
                      className="w-full h-24 object-cover rounded cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Eliminar imagen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Texto OCR */}
            {interconsulta.estudios_ocr && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Estudios (OCR):</p>
                <pre className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">{interconsulta.estudios_ocr}</pre>
              </div>
            )}

            {/* Mensaje si no hay imágenes ni OCR */}
            {(!interconsulta.image_full_url || interconsulta.image_full_url.length === 0) && !interconsulta.estudios_ocr && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No hay imágenes o estudios cargados
              </p>
            )}
          </div>

          {/* Modal simple de OCR */}
          {showOCRModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Agregar texto OCR</h3>
                  <button onClick={() => setShowOCRModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Pega aquí el texto extraído de estudios (TC, RMN, análisis de laboratorio, etc.)"
                  rows={10}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowOCRModal(false);
                      setOcrText('');
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOCRComplete}
                    disabled={!ocrText.trim() || processingOCR}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingOCR ? 'Guardando...' : 'Agregar a Estudios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Acciones rápidas
            </label>

            {/* Botón destacado para Responder en Evolucionador */}
            {onGoToEvolucionador && (
              <div className="mb-4">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold inline-flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageSquare className="h-5 w-5" />
                  Responder en Evolucionador
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Completa la evolución del paciente y genera la respuesta
                </p>
              </div>
            )}

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

      {/* Modal de confirmación para ir al Evolucionador */}
      {showConfirmModal && onGoToEvolucionador && (
        <ConfirmacionEvolucionadorModal
          interconsulta={interconsulta}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            onGoToEvolucionador(interconsulta);
            onClose(); // Cerrar modal de detalles
            setShowConfirmModal(false);
          }}
        />
      )}
    </div>
  );
};

export default InterconsultaDetailModal;
