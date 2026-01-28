import { supabase, isSupabaseConfigured } from '../utils/supabase';

type ServiceResult<T> = { data: T | null; error: Error | null };
type ServiceVoidResult = { error: Error | null };

const TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
  ]);
}

function toFriendlyError(error: any, fallbackMessage: string): Error {
  const rawMessage = typeof error?.message === 'string' ? error.message : '';
  if (rawMessage.toLowerCase().includes('timeout')) {
    return new Error('La solicitud tardo demasiado. Intenta nuevamente.');
  }
  return new Error(rawMessage || fallbackMessage);
}

export type QuizStatus = 'draft' | 'published';

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  status: QuizStatus;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string | null;
  display_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  answers: {
    question_id: string;
    selected_index: number;
    is_correct: boolean;
  }[];
  created_at: string;
}

export type QuizInput = Omit<Quiz, 'id' | 'created_at' | 'updated_at'>;
export type QuizQuestionInput = Omit<QuizQuestion, 'id' | 'created_at' | 'quiz_id'>;

export async function fetchQuizzes(): Promise<ServiceResult<Quiz[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_quizzes')
        .select('*')
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Error fetching quizzes:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar los cuestionarios') };
    }

    return { data: (data as Quiz[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchQuizzes:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar los cuestionarios') };
  }
}

export async function fetchQuizQuestions(quizId: string): Promise<ServiceResult<QuizQuestion[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('display_order', { ascending: true })
    );

    if (error) {
      console.error('Error fetching quiz questions:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar las preguntas') };
    }

    return { data: (data as QuizQuestion[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchQuizQuestions:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar las preguntas') };
  }
}

export async function createQuiz(payload: QuizInput): Promise<ServiceResult<Quiz>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_quizzes')
        .insert([{
          title: payload.title,
          description: payload.description || null,
          status: payload.status,
          created_by: payload.created_by
        }])
        .select()
        .single()
    );

    if (error) {
      console.error('Error creating quiz:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos crear el cuestionario') };
    }

    return { data: data as Quiz, error: null };
  } catch (error) {
    console.error('Error in createQuiz:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos crear el cuestionario') };
  }
}

export async function updateQuiz(id: string, updates: Partial<QuizInput>): Promise<ServiceResult<Quiz>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    if (!id) {
      return { data: null, error: new Error('ID invalido') };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('academy_quizzes')
        .update({
          title: updates.title,
          description: updates.description === undefined ? undefined : (updates.description || null),
          status: updates.status
        })
        .eq('id', id)
        .select()
        .single()
    );

    if (error) {
      console.error('Error updating quiz:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos actualizar el cuestionario') };
    }

    return { data: data as Quiz, error: null };
  } catch (error) {
    console.error('Error in updateQuiz:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos actualizar el cuestionario') };
  }
}

export async function deleteQuiz(id: string): Promise<ServiceVoidResult> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase no configurado') };
  }
  try {
    if (!id) {
      return { error: new Error('ID invalido') };
    }

    const { error } = await withTimeout(
      supabase
        .from('academy_quizzes')
        .delete()
        .eq('id', id)
    );

    if (error) {
      console.error('Error deleting quiz:', error);
      return { error: toFriendlyError(error, 'No pudimos eliminar el cuestionario') };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    return { error: toFriendlyError(error, 'No pudimos eliminar el cuestionario') };
  }
}

export async function createQuizQuestions(
  quizId: string,
  questions: QuizQuestionInput[]
): Promise<ServiceResult<QuizQuestion[]>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    const payload = questions.map((question, index) => ({
      quiz_id: quizId,
      question_text: question.question_text,
      options: question.options,
      correct_option_index: question.correct_option_index,
      explanation: question.explanation || null,
      display_order: question.display_order ?? index
    }));

    const { data, error } = await withTimeout(
      supabase
        .from('academy_quiz_questions')
        .insert(payload)
        .select()
    );

    if (error) {
      console.error('Error creating quiz questions:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos guardar las preguntas') };
    }

    return { data: (data as QuizQuestion[]) || [], error: null };
  } catch (error) {
    console.error('Error in createQuizQuestions:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos guardar las preguntas') };
  }
}

export async function fetchQuizAttemptsForUser(
  quizId: string,
  userId: string
): Promise<ServiceResult<QuizAttempt[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos cargar tus intentos') };
    }

    return { data: (data as QuizAttempt[]) || [], error: null };
  } catch (error) {
    console.error('Error in fetchQuizAttemptsForUser:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos cargar tus intentos') };
  }
}

export async function recordQuizAttempt(
  payload: Omit<QuizAttempt, 'id' | 'created_at'>
): Promise<ServiceResult<QuizAttempt>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase no configurado') };
  }
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('academy_quiz_attempts')
        .insert([{
          quiz_id: payload.quiz_id,
          user_id: payload.user_id,
          score: payload.score,
          total_questions: payload.total_questions,
          answers: payload.answers
        }])
        .select()
        .single()
    );

    if (error) {
      console.error('Error recording quiz attempt:', error);
      return { data: null, error: toFriendlyError(error, 'No pudimos registrar tu intento') };
    }

    return { data: data as QuizAttempt, error: null };
  } catch (error) {
    console.error('Error in recordQuizAttempt:', error);
    return { data: null, error: toFriendlyError(error, 'No pudimos registrar tu intento') };
  }
}
