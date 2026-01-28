import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ClassTopic, fetchTopics } from '../../services/academiaService';
import {
  WeeklyTopic,
  WeeklyTopicStatus,
  createWeeklyTopic,
  fetchWeeklyTopics,
  updateWeeklyTopic
} from '../../services/academiaWeeklyService';

type WeekSelector = 'current' | 'next';

const getWeekStart = (baseDate: Date) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const formatShortDate = (isoDate: string) => {
  try {
    const parsed = new Date(`${isoDate}T00:00:00`);
    return parsed.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  } catch {
    return isoDate;
  }
};

const formatWeekRange = (isoDate: string) => {
  const start = new Date(`${isoDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${formatShortDate(toISODate(start))} -> ${formatShortDate(toISODate(end))}`;
};

const WeeklyTopicBoard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [weeklyTopics, setWeeklyTopics] = useState<WeeklyTopic[]>([]);
  const [topicOptions, setTopicOptions] = useState<ClassTopic[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekSelector>('current');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicSummary, setTopicSummary] = useState('');
  const [topicStatus, setTopicStatus] = useState<WeeklyTopicStatus>('proposed');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const nextWeekStart = useMemo(() => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    return next;
  }, [weekStart]);

  const selectedWeekStartDate = selectedWeek === 'current' ? weekStart : nextWeekStart;
  const selectedWeekISO = toISODate(selectedWeekStartDate);

  const currentWeekISO = toISODate(weekStart);
  const nextWeekISO = toISODate(nextWeekStart);

  const currentWeekTopic = useMemo(
    () => weeklyTopics.find(topic => topic.week_start_date === currentWeekISO),
    [weeklyTopics, currentWeekISO]
  );
  const nextWeekTopic = useMemo(
    () => weeklyTopics.find(topic => topic.week_start_date === nextWeekISO),
    [weeklyTopics, nextWeekISO]
  );

  const reminderDate = useMemo(() => {
    const nextReminder = new Date();
    const nextWeek = getWeekStart(nextReminder);
    if (toISODate(nextWeek) === currentWeekISO && currentWeekTopic) {
      nextWeek.setDate(nextWeek.getDate() + 7);
    }
    return toISODate(nextWeek);
  }, [currentWeekISO, currentWeekTopic]);

  useEffect(() => {
    const loadData = async () => {
      const [{ data: topicsData }, { data: weeklyData }] = await Promise.all([
        fetchTopics(),
        fetchWeeklyTopics()
      ]);
      if (topicsData) setTopicOptions(topicsData);
      if (weeklyData) setWeeklyTopics(weeklyData);
    };
    loadData();
  }, []);

  useEffect(() => {
    const existing = weeklyTopics.find(topic => topic.week_start_date === selectedWeekISO);
    if (existing) {
      setTopicTitle(existing.topic_title);
      setTopicSummary(existing.summary || '');
      setTopicStatus((existing.status as WeeklyTopicStatus) || 'proposed');
    } else {
      setTopicTitle('');
      setTopicSummary('');
      setTopicStatus('proposed');
    }
  }, [selectedWeekISO, weeklyTopics]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSuggestTopic = () => {
    if (!topicOptions.length) return;
    const randomTopic = topicOptions[Math.floor(Math.random() * topicOptions.length)];
    if (randomTopic) setTopicTitle(randomTopic.topic_name);
  };

  const handlePickTopic = (topicId: string) => {
    const selected = topicOptions.find(topic => topic.id === topicId);
    if (selected) setTopicTitle(selected.topic_name);
  };

  const handleSave = async () => {
    if (!userId || !user?.email) {
      showMessage('error', 'Debes iniciar sesion para guardar el tema semanal');
      return;
    }

    if (!topicTitle.trim()) {
      showMessage('error', 'El tema semanal no puede estar vacio');
      return;
    }

    setSaving(true);
    const existing = weeklyTopics.find(topic => topic.week_start_date === selectedWeekISO);
    const payload = {
      week_start_date: selectedWeekISO,
      topic_title: topicTitle.trim(),
      summary: topicSummary.trim() || null,
      status: topicStatus,
      created_by: userId
    };

    const result = existing
      ? await updateWeeklyTopic(existing.id, payload)
      : await createWeeklyTopic(payload);
    setSaving(false);

    if (result.error) {
      showMessage('error', result.error.message || 'No pudimos guardar el tema');
      return;
    }

    showMessage('success', existing ? 'Tema semanal actualizado' : 'Tema semanal propuesto');
    const { data } = await fetchWeeklyTopics();
    if (data) setWeeklyTopics(data);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 shadow-sm ${
            message.type === 'success'
              ? 'border-emerald-200/70 bg-emerald-50 text-emerald-800'
              : 'border-rose-200/70 bg-rose-50 text-rose-800'
          } text-sm`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Tema semanal</p>
              <h2 className="text-2xl text-slate-900 font-semibold">Agenda de repaso</h2>
              <p className="text-sm text-slate-500">
                Define un foco semanal y manten alineadas las clases y revisiones.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white text-xs font-semibold">
              <CalendarClock className="h-4 w-4" />
              {formatWeekRange(selectedWeekISO)}
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <p className="text-sm text-slate-600 font-semibold">Semana actual</p>
                </div>
                {currentWeekTopic ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] text-emerald-700 font-semibold">
                    Confirmado
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-700 font-semibold">
                    Pendiente
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-base text-slate-900 font-semibold">
                  {currentWeekTopic?.topic_title || 'Definir tema de repaso'}
                </p>
                <p className="text-sm text-slate-500">
                  {currentWeekTopic?.summary || 'Propone el tema para coordinar recursos y clases.'}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm text-slate-600 font-semibold">Proxima semana</p>
                </div>
                {nextWeekTopic ? (
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] text-sky-700 font-semibold">
                    Propuesto
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 font-semibold">
                    Sin definir
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-base text-slate-900 font-semibold">
                  {nextWeekTopic?.topic_title || 'Anticipar repaso'}
                </p>
                <p className="text-sm text-slate-500">
                  {nextWeekTopic?.summary || 'Reserva un tema con tiempo para armar bibliografia.'}
                </p>
              </div>
            </article>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg text-slate-900 font-semibold">Proponer tema de repaso</h3>
                <p className="text-sm text-slate-500">
                  Configura un tema por semana y manten la continuidad del aprendizaje.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 font-semibold">
                <Wand2 className="h-3.5 w-3.5 text-slate-400" />
                Recordatorio: lunes {formatShortDate(reminderDate)}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700 font-medium">
                    Semana objetivo
                    <select
                      value={selectedWeek}
                      onChange={(event) => setSelectedWeek(event.target.value as WeekSelector)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-semibold shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="current">Semana actual</option>
                      <option value="next">Proxima semana</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm text-slate-700 font-medium">
                    Estado
                    <select
                      value={topicStatus}
                      onChange={(event) => setTopicStatus(event.target.value as WeeklyTopicStatus)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-semibold shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="proposed">Propuesto</option>
                      <option value="confirmed">Confirmado</option>
                    </select>
                  </label>
                </div>

                <label className="space-y-1 text-sm text-slate-700 font-medium">
                  Tema semanal
                  <input
                    value={topicTitle}
                    onChange={(event) => setTopicTitle(event.target.value)}
                    placeholder="Ej: Neurovascular agudo"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-semibold shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="space-y-1 text-sm text-slate-700 font-medium">
                  Resumen / objetivos
                  <textarea
                    value={topicSummary}
                    onChange={(event) => setTopicSummary(event.target.value)}
                    rows={3}
                    placeholder="Objetivo, bibliografia base, actividades clave..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Sugerencias</p>
                <button
                  type="button"
                  onClick={handleSuggestTopic}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
                >
                  Sugerir tema aleatorio
                </button>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Elegir de la lista</p>
                  <select
                    onChange={(event) => handlePickTopic(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Seleccionar tema</option>
                    {topicOptions.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.topic_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                >
                  {saving ? 'Guardando...' : 'Guardar tema semanal'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 font-semibold">Recordatorio activo</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-base text-slate-900 font-semibold">
              {currentWeekTopic ? 'Tema semanal definido' : 'Tema pendiente esta semana'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {currentWeekTopic
                ? 'Ya esta listo el foco de repaso. Avanza con bibliografia o mini-quiz.'
                : 'Faltan detalles para alinear las clases. Propon un tema y compartilo.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-900 px-5 py-5 shadow-sm text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300 font-semibold">Historico</p>
            <div className="mt-3 space-y-3">
              {weeklyTopics.slice(0, 5).map((topic) => (
                <div key={topic.id} className="rounded-2xl bg-white/5 px-4 py-3">
                  <p className="text-sm text-white font-semibold">{topic.topic_title}</p>
                  <p className="text-xs text-slate-300">{formatWeekRange(topic.week_start_date)}</p>
                </div>
              ))}
              {weeklyTopics.length === 0 && (
                <p className="text-sm text-slate-300">Aun no hay semanas registradas.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WeeklyTopicBoard;
