import React, { useState } from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { Lock, Eye, EyeOff, X, Brain, Settings, Stethoscope } from 'lucide-react';
import AIConfigPanel from './AIConfigPanel';
import NeurologicalExamModal from './components/NeurologicalExamModal';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);

  // Contraseña simple para demo - en producción debería ser más segura
  const ADMIN_PASSWORD = 'admin2025';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simular verificación
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        onAuthenticate();
        setPassword('');
      } else {
        setError('Contraseña incorrecta');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsAuthenticated(false);
    setShowAIConfig(false);
    setShowNeurologicalExam(false);
    onClose();
  };

  useEscapeKey(handleClose, isOpen);

  if (!isOpen) return null;

  // Si está autenticado, mostrar panel de admin
  if (isAuthenticated) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Panel de Administración
                  </h2>
                  <p className="text-sm text-gray-600">
                    Gestiona la configuración del sistema
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Configuración de IA */}
              <button
                onClick={() => setShowAIConfig(true)}
                className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">Configuración de IA</h3>
                  <p className="text-sm text-gray-600">
                    Gestiona API keys y funciones de inteligencia artificial
                  </p>
                </div>
              </button>

              {/* Procesador OCR */}

              {/* Examen Neurológico Interactivo */}
              <button
                onClick={() => setShowNeurologicalExam(true)}
                className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-900">Examen Neurológico</h3>
                  <p className="text-sm text-gray-600">
                    Sistema interactivo paso a paso para evaluación completa
                  </p>
                </div>
              </button>

              {/* Otras configuraciones futuras */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Funciones Disponibles</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Configuración de IA y API Keys ✅</li>
                  <li>• Procesador OCR para documentos médicos ✅</li>
                  <li>• Examen Neurológico Interactivo 🚧 (Nuevo)</li>
                  <li>• Gestión de usuarios (próximamente)</li>
                  <li>• Configuración de calendario (próximamente)</li>
                  <li>• Configuración de escalas (próximamente)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* Panel de configuración de IA */}
        <AIConfigPanel
          isOpen={showAIConfig}
          onClose={() => setShowAIConfig(false)}
        />


        {/* Examen Neurológico */}
        <NeurologicalExamModal
          isOpen={showNeurologicalExam}
          onClose={() => setShowNeurologicalExam(false)}
          examiner="Dr. Administrador"
          onExamCompleted={(examData) => {
            console.log('✅ Examen neurológico completado:', examData);
            // Aquí se podría integrar con el sistema de pacientes
          }}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Acceso Administrativo
              </h2>
              <p className="text-sm text-gray-600">
                Ingrese la contraseña para editar contenidos
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña de Administrador
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10"
                placeholder="Ingrese la contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Nota:</strong> El modo de edición le permite modificar:
            </p>
            <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
              <li>Asignaciones semanales de residentes e internos</li>
              <li>Eventos del calendario académico</li>
              <li>Información de actividades</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Acceder'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Para demo:</strong> Contraseña: <code className="bg-gray-200 px-1 rounded">admin2025</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
