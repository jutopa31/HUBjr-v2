import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import PaperCard from './components/scientificPapers/PaperCard';
import PaperFormModal from './components/scientificPapers/PaperFormModal';
import type {
  ScientificPaper,
  ScientificPaperFormData,
  ScientificPaperUpdateData,
  PaperStatus,
  PaperType,
  PriorityLevel,
  CardColor
} from './types/scientificPapers';
import {
  PAPER_STATUS_LABELS,
  PAPER_TYPE_LABELS,
  PRIORITY_LABELS
} from './types/scientificPapers';
import {
  fetchScientificPapers,
  createScientificPaper,
  updateScientificPaper,
  deleteScientificPaper,
  changeStatus,
  uploadPaperFile,
  fetchResidentsForAssignment
} from './services/scientificPapersService';

interface ScientificPapersBoardProps {
  hospitalContext: 'Posadas' | 'Julian';
}

export default function ScientificPapersBoard({ hospitalContext }: ScientificPapersBoardProps) {
  const { user } = useAuth();
  const [papers, setPapers] = useState<ScientificPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<ScientificPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ScientificPaper | null>(null);
  const [residentOptions, setResidentOptions] = useState<Array<{ email: string; name: string }>>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaperStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PaperType | 'all'>('all');
  const [assignedFilter, setAssignedFilter] = useState<string | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');

  useEffect(() => {
    loadPapers();
  }, [hospitalContext]);

  useEffect(() => {
    loadResidents();
  }, []);

  const loadPapers = async () => {
    setLoading(true);
    const { data, error } = await fetchScientificPapers(hospitalContext);
    if (!error) {
      setPapers(data || []);
    } else {
      console.error('Error loading scientific papers:', error);
      setPapers([]);
    }
    setLoading(false);
  };

  const loadResidents = async () => {
    const { data, error } = await fetchResidentsForAssignment();
    if (!error) {
      setResidentOptions(data);
    } else {
      console.error('Error loading residents:', error);
      setResidentOptions([]);
    }
  };

  const residentNames = useMemo(() => {
    return residentOptions.reduce<Record<string, string>>((acc, resident) => {
      acc[resident.email] = resident.name;
      return acc;
    }, {});
  }, [residentOptions]);

  const getDeadlineValue = (deadline?: string | null) => {
    if (!deadline) return null;
    const [year, month, day] = deadline.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  useEffect(() => {
    let filtered = [...papers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((paper) => (
        paper.title.toLowerCase().includes(term) ||
        (paper.description || '').toLowerCase().includes(term) ||
        (paper.event_name || '').toLowerCase().includes(term)
      ));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((paper) => paper.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter((paper) => paper.paper_type === typeFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((paper) => paper.priority === priorityFilter);
    }
    if (assignedFilter !== 'all') {
      filtered = filtered.filter((paper) => paper.assigned_residents.includes(assignedFilter));
    }

    filtered.sort((a, b) => {
      const aDeadline = getDeadlineValue(a.deadline);
      const bDeadline = getDeadlineValue(b.deadline);
      if (aDeadline !== null && bDeadline !== null) {
        if (aDeadline !== bDeadline) return aDeadline - bDeadline;
      } else if (aDeadline !== null) {
        return -1;
      } else if (bDeadline !== null) {
        return 1;
      }

      const priorityOrder: Record<PriorityLevel, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setFilteredPapers(filtered);
  }, [papers, searchTerm, statusFilter, typeFilter, priorityFilter, assignedFilter]);

  const openCreateModal = () => {
    setEditingPaper(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingPaper(null);
    setIsModalOpen(false);
  };

  const handleEdit = (paper: ScientificPaper) => {
    setEditingPaper(paper);
    setIsModalOpen(true);
  };

  const handleDelete = async (paper: ScientificPaper) => {
    const confirmed = window.confirm(`Eliminar "${paper.title}"?`);
    if (!confirmed) return;

    const { success, error } = await deleteScientificPaper(paper.id);
    if (success) {
      setPapers((prev) => prev.filter((item) => item.id !== paper.id));
    } else {
      console.error('Error deleting paper:', error);
      alert('Error al eliminar trabajo. Intenta de nuevo.');
    }
  };

  const handleStatusChange = async (paper: ScientificPaper, newStatus: PaperStatus) => {
    const { success, error } = await changeStatus(paper.id, newStatus);
    if (success) {
      setPapers((prev) => prev.map((item) => (
        item.id === paper.id ? { ...item, status: newStatus } : item
      )));
    } else {
      console.error('Error changing status:', error);
      alert('Error al cambiar estado. Intenta de nuevo.');
    }
  };

  const handleColorChange = async (paper: ScientificPaper, newColor: CardColor) => {
    const { success, data, error } = await updateScientificPaper(paper.id, { color: newColor });
    if (success && data) {
      setPapers((prev) => prev.map((item) => (item.id === paper.id ? data : item)));
    } else if (error) {
      console.error('Error changing color:', error);
    }
  };

  const handleSave = async (
    data: ScientificPaperFormData,
    links: { abstractUrl?: string; draftUrl?: string },
    finalFile?: File
  ) => {
    if (!user?.email) {
      alert('Debes iniciar sesion para crear o editar trabajos.');
      return;
    }

    if (editingPaper) {
      const updates: ScientificPaperUpdateData = {
        ...data,
        abstract_url: links.abstractUrl || null,
        draft_url: links.draftUrl || null
      };

      const { success, data: updated, error } = await updateScientificPaper(editingPaper.id, updates);
      if (!success || !updated) {
        console.error('Error updating paper:', error);
        alert('Error al actualizar trabajo. Intenta de nuevo.');
        return;
      }

      if (finalFile) {
        await uploadPaperFile(editingPaper.id, finalFile, 'final');
      }

      await loadPapers();
      closeModal();
      return;
    }

    const { success, data: created, error } = await createScientificPaper({
      ...data,
      hospital_context: hospitalContext,
      created_by: user.email
    });

    if (!success || !created) {
      console.error('Error creating paper:', error);
      alert('Error al crear trabajo. Intenta de nuevo.');
      return;
    }

    const linkUpdates: ScientificPaperUpdateData = {};
    if (links.abstractUrl) linkUpdates.abstract_url = links.abstractUrl;
    if (links.draftUrl) linkUpdates.draft_url = links.draftUrl;
    if (Object.keys(linkUpdates).length > 0) {
      await updateScientificPaper(created.id, linkUpdates);
    }

    if (finalFile) {
      await uploadPaperFile(created.id, finalFile, 'final');
    }

    await loadPapers();
    closeModal();
  };

  const statusOptions: Array<{ value: PaperStatus | 'all'; label: string }> = [
    { value: 'all', label: 'Todos los estados' },
    ...((Object.keys(PAPER_STATUS_LABELS) as PaperStatus[]).map((status) => ({
      value: status,
      label: PAPER_STATUS_LABELS[status]
    })))
  ];

  const typeOptions: Array<{ value: PaperType | 'all'; label: string }> = [
    { value: 'all', label: 'Todos los tipos' },
    ...((Object.keys(PAPER_TYPE_LABELS) as PaperType[]).map((type) => ({
      value: type,
      label: PAPER_TYPE_LABELS[type]
    })))
  ];

  const priorityOptions: Array<{ value: PriorityLevel | 'all'; label: string }> = [
    { value: 'all', label: 'Todas las prioridades' },
    ...((Object.keys(PRIORITY_LABELS) as PriorityLevel[]).map((priority) => ({
      value: priority,
      label: PRIORITY_LABELS[priority]
    })))
  ];

  const totalCount = papers.filter((paper) => paper.hospital_context === hospitalContext).length;
  const pendingCount = papers.filter((paper) => paper.status === 'pending' && paper.hospital_context === hospitalContext).length;
  const inProgressCount = papers.filter((paper) => paper.status === 'in_progress' && paper.hospital_context === hospitalContext).length;
  const completedCount = papers.filter((paper) => paper.status === 'completed' && paper.hospital_context === hospitalContext).length;

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Trabajos Cientificos
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {totalCount} trabajos · {pendingCount} pendientes · {inProgressCount} en progreso · {completedCount} completados
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-md hover:bg-blue-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo trabajo
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <input
              type="text"
              placeholder="Buscar por titulo, descripcion o evento..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PaperStatus | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as PaperType | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as PriorityLevel | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={assignedFilter}
            onChange={(event) => setAssignedFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">Todos los residentes</option>
            {residentOptions.map((resident) => (
              <option key={resident.email} value={resident.email}>
                {resident.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium">Cargando trabajos...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No hay trabajos cientificos</p>
            <p className="mt-1 text-sm">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || assignedFilter !== 'all' || priorityFilter !== 'all'
                ? 'Ajusta los filtros para ver resultados'
                : 'Crea tu primer trabajo cientifico'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredPapers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onColorChange={handleColorChange}
                residentNames={residentNames}
              />
            ))}
          </div>
        )}
      </div>

      <PaperFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingPaper={editingPaper}
        residentOptions={residentOptions}
      />
    </div>
  );
}
