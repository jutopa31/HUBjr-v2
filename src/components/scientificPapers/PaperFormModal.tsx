import React, { useEffect, useState } from 'react';
import type {
  ScientificPaper,
  ScientificPaperFormData,
  PaperStatus,
  PaperType,
  PriorityLevel,
  CardColor
} from '../../types/scientificPapers';
import {
  PAPER_STATUS_LABELS,
  PAPER_TYPE_LABELS,
  PRIORITY_LABELS,
  CARD_COLORS
} from '../../types/scientificPapers';

interface PaperFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: ScientificPaperFormData,
    links: { abstractUrl?: string; draftUrl?: string },
    finalFile?: File
  ) => void;
  editingPaper?: ScientificPaper | null;
  residentOptions: Array<{ email: string; name: string }>;
}

const DEFAULT_FORM_DATA: ScientificPaperFormData = {
  title: '',
  description: '',
  paper_type: 'abstract',
  event_name: '',
  deadline: '',
  status: 'pending',
  assigned_residents: [],
  pending_tasks: [],
  color: 'default',
  priority: 'medium'
};

export default function PaperFormModal({
  isOpen,
  onClose,
  onSave,
  editingPaper,
  residentOptions
}: PaperFormModalProps) {
  const [formData, setFormData] = useState<ScientificPaperFormData>(DEFAULT_FORM_DATA);
  const [abstractLink, setAbstractLink] = useState('');
  const [draftLink, setDraftLink] = useState('');
  const [finalFile, setFinalFile] = useState<File | undefined>();
  const [residentInput, setResidentInput] = useState('');
  const [pendingInput, setPendingInput] = useState('');

  useEffect(() => {
    if (editingPaper) {
      setFormData({
        title: editingPaper.title,
        description: editingPaper.description || '',
        paper_type: editingPaper.paper_type,
        event_name: editingPaper.event_name || '',
        deadline: editingPaper.deadline || '',
        status: editingPaper.status,
        assigned_residents: editingPaper.assigned_residents || [],
        pending_tasks: editingPaper.pending_tasks || [],
        color: editingPaper.color,
        priority: editingPaper.priority
      });
    } else {
      setFormData({ ...DEFAULT_FORM_DATA });
    }
    setAbstractLink(editingPaper?.abstract_url || '');
    setDraftLink(editingPaper?.draft_url || '');
    setFinalFile(undefined);
    setResidentInput('');
    setPendingInput('');
  }, [editingPaper, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    onSave(
      {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        event_name: formData.event_name?.trim() || undefined,
        deadline: formData.deadline || undefined,
        pending_tasks: (formData.pending_tasks || []).map((task) => task.trim()).filter(Boolean)
      },
      {
        abstractUrl: abstractLink.trim() || undefined,
        draftUrl: draftLink.trim() || undefined
      },
      finalFile
    );
  };

  const toggleResident = (email: string) => {
    setFormData((prev) => {
      const exists = prev.assigned_residents.includes(email);
      return {
        ...prev,
        assigned_residents: exists
          ? prev.assigned_residents.filter((resident) => resident !== email)
          : [...prev.assigned_residents, email]
      };
    });
  };

  const addResidentEmail = () => {
    const email = residentInput.trim();
    if (!email) return;
    if (formData.assigned_residents.includes(email)) {
      setResidentInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      assigned_residents: [...prev.assigned_residents, email]
    }));
    setResidentInput('');
  };

  const addPendingTask = () => {
    const task = pendingInput.trim();
    if (!task) return;
    if (formData.pending_tasks?.includes(task)) {
      setPendingInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      pending_tasks: [...(prev.pending_tasks || []), task]
    }));
    setPendingInput('');
  };

  const removePendingTask = (task: string) => {
    setFormData((prev) => ({
      ...prev,
      pending_tasks: (prev.pending_tasks || []).filter((item) => item !== task)
    }));
  };

  const statusOptions = Object.keys(PAPER_STATUS_LABELS) as PaperStatus[];
  const typeOptions = Object.keys(PAPER_TYPE_LABELS) as PaperType[];
  const priorityOptions = Object.keys(PRIORITY_LABELS) as PriorityLevel[];
  const colorOptions = Object.keys(CARD_COLORS) as CardColor[];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {editingPaper ? 'Editar trabajo cientifico' : 'Nuevo trabajo cientifico'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Titulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as PaperStatus })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {PAPER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tipo
              </label>
              <select
                value={formData.paper_type}
                onChange={(event) => setFormData({ ...formData, paper_type: event.target.value as PaperType })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {PAPER_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Evento o congreso
              </label>
              <input
                type="text"
                value={formData.event_name}
                onChange={(event) => setFormData({ ...formData, event_name: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Descripcion
              </label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                rows={4}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Pendientes del trabajo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pendingInput}
                  onChange={(event) => setPendingInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addPendingTask())}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Agregar pendiente..."
                />
                <button
                  type="button"
                  onClick={addPendingTask}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>
              {(formData.pending_tasks || []).length > 0 && (
                <div className="mt-3 space-y-2">
                  {(formData.pending_tasks || []).map((task) => (
                    <div
                      key={task}
                      className="flex items-center justify-between rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <span className="truncate">{task}</span>
                      <button
                        type="button"
                        onClick={() => removePendingTask(task)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Fecha limite
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(event) => setFormData({ ...formData, deadline: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(event) => setFormData({ ...formData, priority: event.target.value as PriorityLevel })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Color de tarjeta
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-9 w-9 rounded border-2 ${CARD_COLORS[color].light} ${
                      formData.color === color ? 'border-blue-500' : 'border-transparent'
                    }`}
                    title={CARD_COLORS[color].name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Residentes asignados
              </label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {residentOptions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay residentes disponibles. Agrega emails manualmente.
                  </p>
                ) : (
                  residentOptions.map((resident) => (
                    <label key={resident.email} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={formData.assigned_residents.includes(resident.email)}
                        onChange={() => toggleResident(resident.email)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span>{resident.name}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={residentInput}
                  onChange={(event) => setResidentInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addResidentEmail())}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Agregar email de residente..."
                />
                <button
                  type="button"
                  onClick={addResidentEmail}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Abstract (link Google Docs)
              </label>
              <input
                type="url"
                value={abstractLink}
                onChange={(event) => setAbstractLink(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://docs.google.com/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Borrador (link Google Docs)
              </label>
              <input
                type="url"
                value={draftLink}
                onChange={(event) => setDraftLink(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="https://docs.google.com/..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Version final (PDF/DOCX)
              </label>
              {editingPaper?.final_url && (
                <a
                  href={editingPaper.final_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 inline-flex text-xs text-blue-600 hover:underline"
                >
                  Ver archivo actual
                </a>
              )}
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setFinalFile(event.target.files?.[0])}
                className="w-full text-sm text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {editingPaper ? 'Guardar cambios' : 'Crear trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
