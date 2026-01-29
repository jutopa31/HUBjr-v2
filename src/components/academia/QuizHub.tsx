import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Eye, EyeOff, FileQuestion, PencilLine, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionInput,
  QuizStatus,
  createQuiz,
  createQuizQuestions,
  deleteQuiz,
  deleteQuizQuestions,
  fetchQuizAttemptsForUser,
  fetchQuizQuestions,
  fetchQuizzes,
  recordQuizAttempt,
  updateQuiz
} from '../../services/academiaQuizService';

type QuizFormQuestion = {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
};

const emptyQuestion = (): QuizFormQuestion => ({
  question_text: '',
  options: ['', ''],
  correct_option_index: 0,
  explanation: ''
});

const QuizHub: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<QuizStatus>('draft');
  const [formQuestions, setFormQuestions] = useState<QuizFormQuestion[]>([emptyQuestion()]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const publishedQuizzes = useMemo(
    () => quizzes.filter(quiz => quiz.status === 'published'),
    [quizzes]
  );

  const myDraftQuizzes = useMemo(
    () => quizzes.filter(quiz => quiz.status === 'draft' && quiz.created_by === userId),
    [quizzes, userId]
  );

  const myPublishedQuizzes = useMemo(
    () => quizzes.filter(quiz => quiz.status === 'published' && quiz.created_by === userId),
    [quizzes, userId]
  );

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadQuizzes = async () => {
    const { data, error } = await fetchQuizzes();
    if (error) {
      showMessage('error', error.message || 'No pudimos cargar los cuestionarios');
      return;
    }
    if (data) setQuizzes(data);
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    const loadActiveQuiz = async () => {
      if (!activeQuiz) return;
      setLoadingQuiz(true);
      const [{ data: questionsData }, { data: attemptsData }] = await Promise.all([
        fetchQuizQuestions(activeQuiz.id),
        userId ? fetchQuizAttemptsForUser(activeQuiz.id, userId) : Promise.resolve({ data: [] })
      ]);
      setActiveQuestions(questionsData || []);
      setAttempts(attemptsData || []);
      setAnswers({});
      setFeedback({});
      setResult(null);
      setLoadingQuiz(false);
    };
    loadActiveQuiz();
  }, [activeQuiz, userId]);

  const handleAddQuestion = () => {
    setFormQuestions(prev => [...prev, emptyQuestion()]);
  };

  const handleRemoveQuestion = (index: number) => {
    setFormQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuizFormQuestion, value: any) => {
    setFormQuestions(prev => prev.map((question, idx) => {
      if (idx !== index) return question;
      return { ...question, [field]: value };
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setFormQuestions(prev => prev.map((question, idx) => {
      if (idx !== questionIndex) return question;
      const nextOptions = question.options.map((option, optIdx) => (
        optIdx === optionIndex ? value : option
      ));
      return { ...question, options: nextOptions };
    }));
  };

  const handleAddOption = (questionIndex: number) => {
    setFormQuestions(prev => prev.map((question, idx) => {
      if (idx !== questionIndex) return question;
      return { ...question, options: [...question.options, ''] };
    }));
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setFormQuestions(prev => prev.map((question, idx) => {
      if (idx !== questionIndex) return question;
      const nextOptions = question.options.filter((_, optIdx) => optIdx !== optionIndex);
      const nextCorrect = Math.max(0, Math.min(question.correct_option_index, nextOptions.length - 1));
      return { ...question, options: nextOptions, correct_option_index: nextCorrect };
    }));
  };

  const resetQuizForm = () => {
    setTitle('');
    setDescription('');
    setStatus('draft');
    setFormQuestions([emptyQuestion()]);
    setEditingQuiz(null);
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setStatus(quiz.status);

    const { data: questions } = await fetchQuizQuestions(quiz.id);
    if (questions && questions.length > 0) {
      setFormQuestions(questions.map(q => ({
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation || ''
      })));
    } else {
      setFormQuestions([emptyQuestion()]);
    }
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    setTogglingStatus(quiz.id);
    const newStatus: QuizStatus = quiz.status === 'published' ? 'draft' : 'published';
    const { error } = await updateQuiz(quiz.id, { status: newStatus });
    setTogglingStatus(null);

    if (error) {
      showMessage('error', error.message || 'No pudimos cambiar el estado');
      return;
    }

    showMessage('success', newStatus === 'published' ? 'Cuestionario publicado' : 'Cuestionario despublicado');
    loadQuizzes();
  };

  const handleSaveQuiz = async () => {
    if (!userId) {
      showMessage('error', 'Debes iniciar sesion para crear cuestionarios');
      return;
    }

    if (!title.trim()) {
      showMessage('error', 'El titulo es obligatorio');
      return;
    }

    const filteredQuestions = formQuestions.filter(question => question.question_text.trim());
    if (filteredQuestions.length === 0) {
      showMessage('error', 'Agrega al menos una pregunta');
      return;
    }

    const hasInvalidOptions = filteredQuestions.some(question => question.options.filter(opt => opt.trim()).length < 2);
    if (hasInvalidOptions) {
      showMessage('error', 'Cada pregunta debe tener al menos 2 opciones validas');
      return;
    }

    setSavingQuiz(true);

    const questionsPayload: QuizQuestionInput[] = filteredQuestions.map((question, index) => ({
      question_text: question.question_text.trim(),
      options: question.options.map(opt => opt.trim()).filter(Boolean),
      correct_option_index: question.correct_option_index,
      explanation: question.explanation.trim() || null,
      display_order: index
    }));

    if (editingQuiz) {
      // Update existing quiz
      const quizResult = await updateQuiz(editingQuiz.id, {
        title: title.trim(),
        description: description.trim() || null,
        status
      });

      if (quizResult.error) {
        setSavingQuiz(false);
        showMessage('error', quizResult.error.message || 'No pudimos actualizar el cuestionario');
        return;
      }

      // Delete old questions and create new ones
      await deleteQuizQuestions(editingQuiz.id);
      const questionsResult = await createQuizQuestions(editingQuiz.id, questionsPayload);
      setSavingQuiz(false);

      if (questionsResult.error) {
        showMessage('error', questionsResult.error.message || 'Quiz actualizado, pero hubo un error con las preguntas');
        return;
      }

      showMessage('success', 'Cuestionario actualizado');
    } else {
      // Create new quiz
      const quizResult = await createQuiz({
        title: title.trim(),
        description: description.trim() || null,
        status,
        created_by: userId
      });

      if (quizResult.error || !quizResult.data) {
        setSavingQuiz(false);
        showMessage('error', quizResult.error?.message || 'No pudimos crear el cuestionario');
        return;
      }

      const questionsResult = await createQuizQuestions(quizResult.data.id, questionsPayload);
      setSavingQuiz(false);

      if (questionsResult.error) {
        showMessage('error', questionsResult.error.message || 'Quiz creado, pero no pudimos guardar las preguntas');
        return;
      }

      showMessage('success', 'Cuestionario creado');
    }

    resetQuizForm();
    loadQuizzes();
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Eliminar este cuestionario?')) return;
    const { error } = await deleteQuiz(quizId);
    if (error) {
      showMessage('error', error.message || 'No pudimos eliminar el cuestionario');
      return;
    }
    showMessage('success', 'Cuestionario eliminado');
    if (activeQuiz?.id === quizId) setActiveQuiz(null);
    loadQuizzes();
  };

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !userId) {
      showMessage('error', 'Debes iniciar sesion para responder');
      return;
    }

    const missing = activeQuestions.find(question => answers[question.id] === undefined);
    if (missing) {
      showMessage('error', 'Responde todas las preguntas antes de enviar');
      return;
    }

    const results = activeQuestions.map(question => {
      const selected = answers[question.id];
      const isCorrect = selected === question.correct_option_index;
      return { question_id: question.id, selected_index: selected, is_correct: isCorrect };
    });

    const score = results.filter(res => res.is_correct).length;
    setResult({ score, total: activeQuestions.length });
    const feedbackMap: Record<string, boolean> = {};
    results.forEach(res => { feedbackMap[res.question_id] = res.is_correct; });
    setFeedback(feedbackMap);

    setSavingAttempt(true);
    const attemptResult = await recordQuizAttempt({
      quiz_id: activeQuiz.id,
      user_id: userId,
      score,
      total_questions: activeQuestions.length,
      answers: results
    });
    setSavingAttempt(false);

    if (attemptResult.error) {
      showMessage('error', attemptResult.error.message || 'No pudimos guardar tu intento');
      return;
    }

    showMessage('success', 'Respuestas enviadas');
    const { data } = await fetchQuizAttemptsForUser(activeQuiz.id, userId);
    if (data) setAttempts(data);
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              {editingQuiz ? 'Editar cuestionario' : 'Crear cuestionario'}
            </p>
            <h2 className="text-xl text-slate-900 font-semibold">
              {editingQuiz ? `Editando: ${editingQuiz.title}` : 'Banco de preguntas'}
            </h2>
            <p className="text-sm text-slate-500">
              {editingQuiz
                ? 'Modifica el cuestionario y guarda los cambios.'
                : 'Disena mini-evaluaciones con feedback inmediato para cada respuesta.'}
            </p>
          </header>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700 font-medium">
                Titulo
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej: ACV isquemico - repaso"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-semibold shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700 font-medium">
                Estado
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as QuizStatus)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-semibold shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </label>
            </div>

            <label className="space-y-1 text-sm text-slate-700 font-medium">
              Descripcion
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Objetivo, nivel de dificultad, bibliografia sugerida..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="space-y-4">
              {formQuestions.map((question, index) => (
                <div key={`question-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                        Pregunta {index + 1}
                      </p>
                      <label className="space-y-1 text-sm text-slate-700 font-medium">
                        Enunciado
                        <input
                          value={question.question_text}
                          onChange={(event) => handleQuestionChange(index, 'question_text', event.target.value)}
                          placeholder="Escribe la pregunta..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>
                    {formQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-rose-700 text-xs font-semibold transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={`option-${index}-${optionIndex}`} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correct_option_index === optionIndex}
                          onChange={() => handleQuestionChange(index, 'correct_option_index', optionIndex)}
                          className="h-4 w-4 accent-slate-900"
                        />
                        <input
                          value={option}
                          onChange={(event) => handleOptionChange(index, optionIndex, event.target.value)}
                          placeholder={`Opcion ${optionIndex + 1}`}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index, optionIndex)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2 py-1 text-slate-600 text-xs font-semibold transition hover:bg-slate-100"
                          >
                            -
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddOption(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-slate-600 text-xs font-semibold transition hover:bg-slate-100"
                    >
                      + Opcion
                    </button>
                  </div>

                  <label className="mt-3 space-y-1 text-sm text-slate-700 font-medium">
                    Explicacion
                    <textarea
                      value={question.explanation}
                      onChange={(event) => handleQuestionChange(index, 'explanation', event.target.value)}
                      rows={2}
                      placeholder="Justificacion de la respuesta correcta..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700 text-sm font-semibold transition hover:bg-slate-100"
              >
                <PencilLine className="h-4 w-4" />
                Agregar pregunta
              </button>
              {editingQuiz && (
                <button
                  type="button"
                  onClick={resetQuizForm}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700 text-sm font-semibold transition hover:bg-slate-100"
                >
                  Cancelar edicion
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={savingQuiz}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-white text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              >
                {savingQuiz ? 'Guardando...' : editingQuiz ? 'Actualizar cuestionario' : 'Guardar cuestionario'}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {/* Mis cuestionarios (borradores y publicados propios) */}
          {userId && (myDraftQuizzes.length > 0 || myPublishedQuizzes.length > 0) && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 shadow-sm">
              <header className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-600 font-semibold">Mis cuestionarios</p>
                <h3 className="text-lg text-amber-900 font-semibold">Borradores y publicados</h3>
              </header>

              {myDraftQuizzes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-amber-700 font-semibold mb-2">Borradores ({myDraftQuizzes.length})</p>
                  <div className="space-y-2">
                    {myDraftQuizzes.map((quiz) => (
                      <div key={quiz.id} className="rounded-xl border border-amber-200 bg-white px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-900 font-semibold truncate">{quiz.title}</p>
                            <p className="text-xs text-slate-500 truncate">{quiz.description || 'Sin descripcion'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditQuiz(quiz)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-slate-700 text-xs font-semibold transition hover:bg-slate-100"
                            >
                              <Edit3 className="h-3 w-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(quiz)}
                              disabled={togglingStatus === quiz.id}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-white text-xs font-semibold transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Eye className="h-3 w-3" />
                              {togglingStatus === quiz.id ? '...' : 'Publicar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-rose-700 text-xs font-semibold transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myPublishedQuizzes.length > 0 && (
                <div>
                  <p className="text-xs text-amber-700 font-semibold mb-2">Publicados ({myPublishedQuizzes.length})</p>
                  <div className="space-y-2">
                    {myPublishedQuizzes.map((quiz) => (
                      <div key={quiz.id} className="rounded-xl border border-emerald-200 bg-white px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-900 font-semibold truncate">{quiz.title}</p>
                            <p className="text-xs text-slate-500 truncate">{quiz.description || 'Sin descripcion'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditQuiz(quiz)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-slate-700 text-xs font-semibold transition hover:bg-slate-100"
                            >
                              <Edit3 className="h-3 w-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(quiz)}
                              disabled={togglingStatus === quiz.id}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-amber-800 text-xs font-semibold transition hover:bg-amber-200 disabled:opacity-60"
                            >
                              <EyeOff className="h-3 w-3" />
                              {togglingStatus === quiz.id ? '...' : 'Despublicar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-rose-700 text-xs font-semibold transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-5 py-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300 font-semibold">Cuestionarios activos</p>
                <h3 className="text-xl text-white font-semibold">Responder y recibir feedback</h3>
                <p className="text-sm text-slate-300">Selecciona un cuestionario publicado.</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-slate-200" />
            </div>
          </div>

          <div className="space-y-3">
            {publishedQuizzes.map((quiz) => (
              <div key={quiz.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-900 font-semibold">{quiz.title}</p>
                    <p className="text-xs text-slate-500">{quiz.description || 'Sin descripcion'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveQuiz(quiz)}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-white text-xs font-semibold transition hover:-translate-y-0.5"
                    >
                      <FileQuestion className="h-3.5 w-3.5" />
                      Abrir
                    </button>
                    {quiz.created_by === userId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-rose-700 text-xs font-semibold transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {publishedQuizzes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-500 font-semibold">Aun no hay cuestionarios publicados.</p>
                <p className="text-xs text-slate-400">Crea uno y publicalo para que aparezca aqui.</p>
              </div>
            )}
          </div>

          {activeQuiz && (
            <div className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">En curso</p>
                  <h4 className="text-lg text-slate-900 font-semibold">{activeQuiz.title}</h4>
                  <p className="text-sm text-slate-500">{activeQuiz.description || 'Sin descripcion'}</p>
                </div>
                {attempts[0] && (
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-white text-xs font-semibold">
                    Ultimo puntaje: {attempts[0].score}/{attempts[0].total_questions}
                  </div>
                )}
              </div>

              {loadingQuiz ? (
                <p className="mt-4 text-sm text-slate-500">Cargando preguntas...</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {activeQuestions.map((question, index) => (
                    <div key={question.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                      <p className="text-sm text-slate-900 font-semibold">
                        {index + 1}. {question.question_text}
                      </p>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={`${question.id}-${optionIndex}`}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                              answers[question.id] === optionIndex
                                ? 'border-slate-900 bg-white'
                                : 'border-transparent bg-white/60'
                            } text-sm text-slate-700 font-medium`}
                          >
                            <input
                              type="radio"
                              name={`answer-${question.id}`}
                              checked={answers[question.id] === optionIndex}
                              onChange={() => handleAnswerChange(question.id, optionIndex)}
                              className="h-4 w-4 accent-slate-900"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {result && (
                        <div className={`mt-3 rounded-xl px-3 py-2 ${
                          feedback[question.id]
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        } text-sm`}>
                          <p className="font-semibold">
                            {feedback[question.id] ? 'Correcto' : 'Incorrecto'}
                          </p>
                          <p>{question.explanation || 'Sin explicacion cargada.'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {result && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-white text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Resultado: {result.score}/{result.total}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={savingAttempt || loadingQuiz}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-white text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                >
                  {savingAttempt ? 'Enviando...' : 'Enviar respuestas'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default QuizHub;
