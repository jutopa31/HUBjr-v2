import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIPromptChatProps {
  isOpen: boolean;
  onClose: () => void;
  evolucionadorContent: string;
}

const MAX_MESSAGES_PER_SESSION = 5;
const ESTIMATED_COST_PER_MESSAGE = 0.015; // Aproximadamente $0.015 USD por mensaje

const AIPromptChat: React.FC<AIPromptChatProps> = ({ isOpen, onClose, evolucionadorContent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remainingMessages = MAX_MESSAGES_PER_SESSION - messages.filter(m => m.role === 'user').length;
  const estimatedCostSoFar = messages.filter(m => m.role === 'user').length * ESTIMATED_COST_PER_MESSAGE;

  useEffect(() => {
    if (isOpen) {
      // Reset chat when modal opens
      setMessages([]);
      setInputValue('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (remainingMessages <= 0) {
      setError('Has alcanzado el límite de 5 mensajes por sesión. Cierra y vuelve a abrir el chat para reiniciar.');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evolucionadorContent,
          chatHistory: messages,
          userMessage: userMessage.content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al comunicarse con la IA');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl dark:bg-gray-900 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 dark:border-gray-700 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asistente IA</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Consulta sobre el contenido del evolucionador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400"
            aria-label="Cerrar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Usage Info */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Mensajes restantes: <strong className="text-blue-600 dark:text-blue-400">{remainingMessages}/{MAX_MESSAGES_PER_SESSION}</strong>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              Costo estimado: <strong className="text-green-600 dark:text-green-400">${estimatedCostSoFar.toFixed(3)} USD</strong>
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 p-4 dark:from-blue-900 dark:to-purple-900">
                <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                ¿En qué puedo ayudarte?
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
                Puedo analizar el contenido del evolucionador, responder preguntas, sugerir diagnósticos diferenciales, revisar redacción, y más.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-left w-full max-w-md">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <strong className="text-blue-900 dark:text-blue-300">Ejemplo:</strong>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">"Resume el caso clínico en 3 puntos clave"</p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
                  <strong className="text-purple-900 dark:text-purple-300">Ejemplo:</strong>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">"¿Qué diagnósticos diferenciales debería considerar?"</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p className={`mt-2 text-xs ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analizando...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 dark:text-red-300">Error</p>
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remainingMessages > 0 ? "Escribe tu pregunta... (Shift+Enter para nueva línea)" : "Límite de mensajes alcanzado"}
              disabled={isLoading || remainingMessages <= 0}
              className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:disabled:bg-gray-700"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || remainingMessages <= 0}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md"
              aria-label="Enviar mensaje"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {remainingMessages > 0
              ? `Presiona Enter para enviar, Shift+Enter para nueva línea. ${remainingMessages} ${remainingMessages === 1 ? 'mensaje' : 'mensajes'} ${remainingMessages === 1 ? 'restante' : 'restantes'}.`
              : 'Has alcanzado el límite de mensajes. Cierra y reabre el chat para reiniciar.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIPromptChat;
