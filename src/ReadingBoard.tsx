import React, { useEffect, useMemo, useState } from 'react';
import ReadingCard from './components/reading/ReadingCard';
import { ReadingItem, ReadingLevel, READING_LEVEL_LABELS } from './types/reading';
import {
  createReadingItem,
  deleteReadingItem,
  fetchReadingItems,
  ReadingItemEntry,
  updateReadingItem
} from './services/readingService';

const sortItems = (list: ReadingItemEntry[]) =>
  [...list].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return a.title.localeCompare(b.title);
  });

const CATEGORY_OPTIONS = [
  'All',
  'Stroke',
  'Epilepsy',
  'Neuroinfeccion',
  'Neuromuscular',
  'Movement',
  'Headache',
  'Neurocritical',
  'Cognitive'
] as const;

export default function ReadingBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<ReadingLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_OPTIONS)[number]>('All');
  const [items, setItems] = useState<ReadingItemEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ReadingItemEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    category: '',
    tags: '',
    level: 'core' as ReadingLevel,
    source: '',
    year: '',
    readingTime: '',
    link: ''
  });

  useEffect(() => {
    let isMounted = true;

    const loadReadings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await fetchReadingItems();
      if (!isMounted) return;

      if (error) {
        setItems([]);
        setErrorMessage(error.message);
      } else {
        setItems(sortItems(data || []));
      }

      setIsLoading(false);
    };

    loadReadings();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      category: '',
      tags: '',
      level: 'core',
      source: '',
      year: '',
      readingTime: '',
      link: ''
    });
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    resetForm();
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleForm = () => {
    if (isFormOpen) {
      setIsFormOpen(false);
      setEditingItem(null);
      resetForm();
      setFormError(null);
      return;
    }

    handleOpenCreate();
  };

  const handleEdit = (item: ReadingItem) => {
    const entry = items.find((candidate) => candidate.id === item.id);
    if (!entry) return;

    setEditingItem(entry);
    setFormData({
      title: entry.title,
      summary: entry.summary,
      category: entry.category,
      tags: entry.tags.join(', '),
      level: entry.level,
      source: entry.source,
      year: entry.year.toString(),
      readingTime: entry.readingTime,
      link: entry.link || ''
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: ReadingItem) => {
    const entry = items.find((candidate) => candidate.id === item.id);
    if (!entry) return;

    const confirmed = window.confirm('¿Eliminar esta lectura?');
    if (!confirmed) return;

    setErrorMessage(null);
    const { error } = await deleteReadingItem(entry.dbId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setItems((prev) => prev.filter((candidate) => candidate.dbId !== entry.dbId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrorMessage(null);

    const title = formData.title.trim();
    const summary = formData.summary.trim();
    const category = formData.category.trim();
    const source = formData.source.trim();
    const readingTime = formData.readingTime.trim();
    const yearValue = Number(formData.year);

    if (!title || !summary || !category || !source || !readingTime || !Number.isFinite(yearValue)) {
      setFormError('Completa todos los campos obligatorios con datos validos.');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsSaving(true);

    const payload = {
      title,
      summary,
      category,
      tags,
      level: formData.level,
      source,
      year: yearValue,
      readingTime,
      link: formData.link.trim() || null
    };

    const result = editingItem
      ? await updateReadingItem(editingItem.dbId, payload)
      : await createReadingItem(payload);

    setIsSaving(false);

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (!result.data) {
      setFormError('No se pudo guardar la lectura.');
      return;
    }

    setItems((prev) => {
      const without = editingItem
        ? prev.filter((candidate) => candidate.dbId !== editingItem.dbId)
        : prev;
      return sortItems([result.data, ...without]);
    });

    setIsFormOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTerm =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesTerm && matchesLevel && matchesCategory;
    });
  }, [searchTerm, levelFilter, categoryFilter, items]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lectura</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredItems.length} lecturas disponibles
            </p>
            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
                {errorMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Curado para residentes de neurologia</span>
            <button
              type="button"
              onClick={handleToggleForm}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {isFormOpen ? 'Cerrar' : 'Agregar lectura'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] max-w-md">
            <input
              type="text"
              placeholder="Buscar por tema, tag o resumen..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
            />
          </div>
          <div className="min-w-[180px]">
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value as ReadingLevel | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
            >
              <option value="all">Todos los niveles</option>
              <option value="core">{READING_LEVEL_LABELS.core}</option>
              <option value="recommended">{READING_LEVEL_LABELS.recommended}</option>
              <option value="optional">{READING_LEVEL_LABELS.optional}</option>
            </select>
          </div>
          <div className="min-w-[200px]">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as (typeof CATEGORY_OPTIONS)[number])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category === 'All' ? 'Todas las categorias' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isFormOpen && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Titulo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Categoria</label>
                <input
                  type="text"
                  list="reading-categories"
                  value={formData.category}
                  onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Nivel</label>
                <select
                  value={formData.level}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, level: event.target.value as ReadingLevel }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="core">{READING_LEVEL_LABELS.core}</option>
                  <option value="recommended">{READING_LEVEL_LABELS.recommended}</option>
                  <option value="optional">{READING_LEVEL_LABELS.optional}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Fuente</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(event) => setFormData((prev) => ({ ...prev, source: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Ano</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(event) => setFormData((prev) => ({ ...prev, year: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  min={1900}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-300">Tiempo estimado</label>
                <input
                  type="text"
                  value={formData.readingTime}
                  onChange={(event) => setFormData((prev) => ({ ...prev, readingTime: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="10 min"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">Resumen</label>
                <textarea
                  value={formData.summary}
                  onChange={(event) => setFormData((prev) => ({ ...prev, summary: event.target.value }))}
                  className="min-h-[90px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">Tags (separados por coma)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(event) => setFormData((prev) => ({ ...prev, tags: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="acv, guardia"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-600 dark:text-gray-300">Link</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(event) => setFormData((prev) => ({ ...prev, link: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="https://"
                />
              </div>
              {formError && (
                <div className="text-xs text-rose-600 dark:text-rose-300 md:col-span-2">
                  {formError}
                </div>
              )}
              <div className="flex items-center gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isSaving ? 'Guardando...' : editingItem ? 'Actualizar lectura' : 'Crear lectura'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                    resetForm();
                    setFormError(null);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </form>
            <datalist id="reading-categories">
              {CATEGORY_OPTIONS.filter((category) => category !== 'All').map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            Cargando lecturas...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No hay lecturas que coincidan con los filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <ReadingCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
