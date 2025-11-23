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
    <div className="bg-[var(--bg-primary)] rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{
          backgroundColor: 'color-mix(in srgb, var(--state-info) 20%, var(--bg-primary) 80%)'
        }}>
          <Shield className="h-6 w-6" style={{ color: 'var(--state-info)' }} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {showSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">
          {showSignUp
            ? 'Registrarse en HubJR Neurología'
            : 'Acceder a HubJR Neurología'
          }
        </p>
      </div>

      {displayError && (
        <div className="mb-6 p-4 rounded-lg" style={{
          backgroundColor: 'color-mix(in srgb, var(--state-error) 10%, var(--bg-primary) 90%)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'color-mix(in srgb, var(--state-error) 30%, transparent)'
        }}>
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" style={{ color: 'var(--state-error)' }} />
            <span className="text-sm text-[var(--text-primary)]">{displayError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {showSignUp && (
          <>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg"
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg"
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
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg"
              placeholder="tu@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg"
              placeholder={showSignUp ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showSignUp && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg"
                placeholder="Confirma tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="w-full btn-accent py-2 px-4 rounded-lg flex items-center justify-center"
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
          className="font-medium"
          style={{ color: 'var(--state-info)' }}
        >
          {showSignUp
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'
          }
        </button>
      </div>

      {showSignUp && (
        <div className="mt-6 p-4 rounded-lg" style={{
          backgroundColor: 'color-mix(in srgb, var(--state-warning) 10%, var(--bg-primary) 90%)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'color-mix(in srgb, var(--state-warning) 30%, transparent)'
        }}>
          <p className="text-xs text-[var(--text-primary)]">
            <strong>Nota:</strong> Las cuentas nuevas requieren aprobación del administrador.
            Recibirás un email de confirmación una vez que tu cuenta sea activada.
          </p>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
