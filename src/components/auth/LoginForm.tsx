import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle, Shield } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleMode?: () => void;
  showSignUp?: boolean;
}

function LoginForm({ onSuccess, onToggleMode, showSignUp = false }: LoginFormProps) {
  const { signIn, signUp, loading, error: authError } = useAuthContext();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'resident' as 'resident' | 'attending' | 'intern',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (showSignUp) {
        // Sign up validation
        if (formData.password !== formData.confirmPassword) {
          setFormError('Las contraseñas no coinciden');
          return;
        }
        if (formData.password.length < 8) {
          setFormError('La contraseña debe tener al menos 8 caracteres');
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          role: formData.role,
        });

        if (error) {
          setFormError(error.message);
        } else {
          onSuccess?.();
        }
      } else {
        // Sign in
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          setFormError(error.message);
        } else {
          onSuccess?.();
        }
      }
    } catch (error) {
      setFormError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };


  const displayError = formError || authError;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {showSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>
        <p className="text-gray-600 mt-2">
          {showSignUp 
            ? 'Registrarse en HubJR Neurología' 
            : 'Acceder a HubJR Neurología'
          }
        </p>
      </div>

      {displayError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{displayError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {showSignUp && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="resident">Residente</option>
                <option value="attending">Staff</option>
                <option value="intern">Interno</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={showSignUp ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirma tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {(loading || isSubmitting) ? (
            <Loader className="animate-spin h-5 w-5 mr-2" />
          ) : null}
          {showSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onToggleMode}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {showSignUp 
            ? '¿Ya tienes cuenta? Inicia sesión' 
            : '¿No tienes cuenta? Regístrate'
          }
        </button>
      </div>

      {showSignUp && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Nota:</strong> Las cuentas nuevas requieren aprobación del administrador.
            Recibirás un email de confirmación una vez que tu cuenta sea activada.
          </p>
        </div>
      )}
    </div>
  );
}

export default LoginForm;