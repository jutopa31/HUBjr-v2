import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Calendar, Check, FileInput, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import ImportValidationResults from './ImportValidationResults';
import {
  convertToCSVExportURL,
  getHospitalContext,
  normalizeDateInput,
  parseCSVFile,
  parseCSVFromURL
} from '../../utils/csvParser';
import {
  processImport,
  validateCSVData,
  type ImportProcessResult,
  type ImportValidationResult
} from '../../services/wardRoundsImportService';
import { type HospitalContext } from '../../types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
  hospitalContext: HospitalContext;
}

type ImportTab = 'file' | 'url';

const today = new Date().toISOString().split('T')[0];

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  hospitalContext
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<ImportTab>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetsURL, setGoogleSheetsURL] = useState('');
  const [importDate, setImportDate] = useState(today);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResult, setImportResult] = useState<ImportProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('file');
      setSelectedFile(null);
      setGoogleSheetsURL('');
      setImportDate(today);
      setValidation(null);
      setIsValidating(false);
      setIsImporting(false);
      setImportComplete(false);
      setImportResult(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Selecciona un archivo .csv');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setValidation(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      const file = event.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Selecciona un archivo .csv');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setValidation(null);
    }
  };

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      setError(null);
      setValidation(null);
      setImportResult(null);

      const normalizedDate = normalizeDateInput(importDate, today);
      const context = getHospitalContext(hospitalContext);

      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Selecciona un archivo CSV para validar');
          return;
        }
        const parsed = await parseCSVFile(selectedFile);
        if (!parsed.rows.length) {
          setError('El CSV no contiene filas de datos');
          return;
        }
        if (parsed.errors?.length) {
          setError(`Errores al parsear CSV: ${parsed.errors[0]?.message || ''}`);
          return;
        }
        const result = await validateCSVData(parsed.rows, normalizedDate, context);
        setValidation(result);
      } else {
        const targetUrl = googleSheetsURL.trim();
        if (!targetUrl) {
          setError('Ingresa una URL de Google Sheets o CSV publico');
          return;
        }

        const parsed = await parseCSVFromURL(targetUrl);
        if (!parsed.rows.length) {
          setError('No se encontraron filas de datos en el CSV obtenido');
          return;
        }
        if (parsed.errors?.length) {
          setError(`Errores al parsear CSV: ${parsed.errors[0]?.message || ''}`);
          return;
        }
        const result = await validateCSVData(parsed.rows, normalizedDate, context);
        setValidation(result);
      }
    } catch (err: any) {
      console.error('[CSVImportModal] Validacion fallida:', err);
      setError(err?.message || 'No se pudo validar el CSV');
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validation) {
      setError('Valida el CSV antes de importar');
      return;
    }
    if (!validation.valid) {
      setError('Corrige los errores de validacion antes de importar');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setImportResult(null);

      const result = await processImport(validation.parsedData);
      setImportResult(result);

      if (result.imported > 0) {
        await onImportComplete();
      }

      if (result.success) {
        setImportComplete(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('[CSVImportModal] Importacion fallida:', err);
      setError(err?.message || 'No se pudo completar la importacion');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedFileLabel = selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Arrastra tu archivo .csv aqui';
  const canValidate = activeTab === 'file' ? Boolean(selectedFile) : Boolean(googleSheetsURL.trim());

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Importar Pacientes desde CSV</h2>
            <p className="text-sm text-[var(--text-secondary)]">Contexto: {hospitalContext}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex border rounded-lg overflow-hidden mb-4" style={{ borderColor: 'var(--border-secondary)' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('file');
                setValidation(null);
                setError(null);
                setImportResult(null);
              }}
              className={`flex-1 px-4 py-2 text-sm font-semibold flex items-center justify-center space-x-2 ${activeTab === 'file' ? 'bg-[var(--bg-secondary)]' : ''}`}
            >
              <FileInput className="h-4 w-4" />
              <span>Archivo Local (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('url');
                setValidation(null);
                setError(null);
                setImportResult(null);
              }}
              className={`flex-1 px-4 py-2 text-sm font-semibold flex items-center justify-center space-x-2 ${activeTab === 'url' ? 'bg-[var(--bg-secondary)]' : ''}`}
            >
              <LinkIcon className="h-4 w-4" />
              <span>Google Sheets</span>
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'file' ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                style={{ borderColor: 'var(--border-secondary)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-primary)] font-medium">{selectedFileLabel}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Las primeras 3 filas se omiten automaticamente</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">URL de Google Sheets</label>
                <input
                  type="text"
                  value={googleSheetsURL}
                  onChange={(e) => setGoogleSheetsURL(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  La URL se convertira automaticamente a formato CSV: {convertToCSVExportURL(googleSheetsURL || 'https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0')}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)] flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de pase de sala</span>
                </label>
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                />
              </div>

              <div className="md:col-span-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={!canValidate || isValidating}
                  className="btn-soft px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{isValidating ? 'Validando...' : 'Validar CSV'}</span>
                </button>
                {validation && (
                  <div className="text-sm text-[var(--text-secondary)]">
                    {validation.valid ? 'Listo para importar' : 'Corrige los errores para continuar'}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg flex items-start space-x-2" style={{ backgroundColor: 'color-mix(in srgb, var(--state-error) 12%, var(--bg-primary) 88%)', color: 'var(--state-error)' }}>
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            )}

            {validation && (
              <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
                <ImportValidationResults result={validation} />
              </div>
            )}

            {importResult && (
              <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="text-sm text-[var(--text-primary)] font-semibold">
                  Importados: {importResult.imported} {importResult.failed ? `(Fallidos: ${importResult.failed})` : ''}
                </div>
                {!!importResult.errors.length && (
                  <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                    {importResult.errors.map((err) => (
                      <li key={`${err.dni}-${err.row}`}>
                        Fila {err.row} (DNI {err.dni || 'sin DNI'}): {err.message}
                      </li>
                    ))}
                  </ul>
                )}
                {importComplete && (
                  <div className="text-sm text-[var(--state-success)] font-medium">
                    Importacion completada. Cerrando...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t mt-auto flex justify-end space-x-3" style={{ borderColor: 'var(--border-secondary)' }}>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            onClick={onClose}
            disabled={isImporting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-accent px-4 py-2 rounded-lg flex items-center space-x-2"
            onClick={handleImport}
            disabled={!validation?.valid || isImporting}
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{isImporting ? 'Importando...' : `Importar ${validation?.summary.totalRows ?? ''} pacientes`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
