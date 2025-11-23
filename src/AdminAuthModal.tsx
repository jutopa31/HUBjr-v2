import React, { useState, useEffect } from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { Lock, Eye, EyeOff, X, Brain, Settings, Stethoscope, UserCheck } from 'lucide-react';
import AIConfigPanel from './AIConfigPanel';
import NeurologicalExamModal from './components/NeurologicalExamModal';
import { useAuthContext } from './components/auth/AuthProvider';

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
  const { user, hasPrivilege, hasHospitalContextAccess } = useAuthContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [showNeurologicalExam, setShowNeurologicalExam] = useState(false);

  // Contraseña simple para demo - en producción debería ser más segura
  const ADMIN_PASSWORD = 'admin2025';

  // Check if user has admin privileges automatically
  useEffect(() => {
    if (isOpen && user?.email) {
      const userHasAdminPrivilege = hasPrivilege('full_admin') || hasHospitalContextAccess;

      if (userHasAdminPrivilege) {
        console.log(`🔓 User ${user.email} has admin privileges - auto-authenticating`);
        setIsAuthenticated(true);
        onAuthenticate();
        setError('');
      } else {
        console.log(`🔒 User ${user.email} does not have admin privileges - password required`);
        setIsAuthenticated(false);
      }
    }
  }, [isOpen, user, hasPrivilege, hasHospitalContextAccess, onAuthenticate]);

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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg shadow-xl w-96 p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-950/40 rounded-lg border border-green-800">
                  <Settings className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-200">
                    Panel de Administración
                  </h2>
                  <p className="text-sm text-gray-400">
                    Gestiona la configuración del sistema
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-[#3a3a3a] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Configuración de IA */}
              <button
                onClick={() => setShowAIConfig(true)}
                className="w-full flex items-center space-x-3 p-4 bg-purple-950/40 border border-purple-800 rounded-lg hover:bg-purple-950/60 transition-colors"
              >
                <div className="p-2 bg-purple-900/50 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-300" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-200">Configuración de IA</h3>
                  <p className="text-sm text-gray-400">
                    Gestiona API keys y funciones de inteligencia artificial
                  </p>
                </div>
              </button>

              {/* Procesador OCR */}

              {/* Examen Neurológico Interactivo */}
              <button
                onClick={() => setShowNeurologicalExam(true)}
                className="w-full flex items-center space-x-3 p-4 bg-blue-950/40 border border-blue-800 rounded-lg hover:bg-blue-950/60 transition-colors"
              >
                <div className="p-2 bg-blue-900/50 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-200">Examen Neurológico</h3>
                  <p className="text-sm text-gray-400">
                    Sistema interactivo paso a paso para evaluación completa
                  </p>
                </div>
              </button>

              {/* Otras configuraciones futuras */}
              <div className="p-4 bg-[#333333] border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-200 mb-2">Funciones Disponibles</h3>
                <ul className="text-sm text-gray-400 space-y-1">
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
                className="px-4 py-2 text-gray-200 bg-[#3a3a3a] rounded-lg hover:bg-[#444444] transition-colors border border-gray-700"
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg shadow-xl w-96 p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${
                  user && (hasPrivilege('full_admin') || hasHospitalContextAccess)
                    ? 'bg-green-950/40 border-green-800'
                    : 'bg-orange-950/40 border-orange-800'
                }`}>
              {user && (hasPrivilege('full_admin') || hasHospitalContextAccess) ? (
                <UserCheck className="h-6 w-6 text-blue-300" />
              ) : (
                <Lock className="h-6 w-6 text-blue-300" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-200">
                Acceso Administrativo
              </h2>
              <p className="text-sm text-gray-400">
                {user && (hasPrivilege('full_admin') || hasHospitalContextAccess) ? (
                  <>Usuario autorizado: <span className="font-medium text-blue-300">{user.email}</span></>
                ) : (
                  'Ingrese la contraseña para editar contenidos'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div>
          {/* Show privilege info if user is authenticated */}
          {user && (hasPrivilege('full_admin') || hasHospitalContextAccess) && (
            <div className="mb-4 p-4 bg-green-950/40 border border-green-800 rounded-lg">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Privilegios de Usuario</h3>
              <ul className="text-xs text-blue-400 space-y-1">
                {hasPrivilege('full_admin') && <li>✅ Administrador completo</li>}
                {hasHospitalContextAccess && <li>✅ Acceso a contextos hospitalarios</li>}
                <li>✅ Acceso automático sin contraseña</li>
              </ul>
            </div>
          )}

          {/* Only show password form if user doesn't have privileges */}
          {!(user && (hasPrivilege('full_admin') || hasHospitalContextAccess)) && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 bg-[#333333] text-gray-200"
                    placeholder="Ingrese la contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-blue-400">{error}</p>
                )}
              </div>

              <div className="bg-yellow-950/40 border border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Nota:</strong> El modo de edición le permite modificar:
                </p>
                <ul className="text-xs text-blue-400 mt-1 ml-4 list-disc">
                  <li>Asignaciones semanales de residentes e internos</li>
                  <li>Eventos del calendario académico</li>
                  <li>Información de actividades</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-200 bg-[#3a3a3a] rounded-lg hover:bg-[#444444] transition-colors border border-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {isLoading ? 'Verificando...' : 'Acceder'}
                </button>
              </div>
            </form>

              <div className="mt-4 p-3 bg-[#333333] border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong>Para demo:</strong> Contraseña: <code className="bg-[#3a3a3a] px-1 rounded text-gray-300">admin2025</code>
                </p>
              </div>
            </>
          )}

          {/* Show access button for privileged users */}
          {user && (hasPrivilege('full_admin') || hasHospitalContextAccess) && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setIsAuthenticated(true);
                  onAuthenticate();
                }}
                className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Acceder al Panel de Administración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
