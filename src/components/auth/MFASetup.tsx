import React, { useState } from 'react';
import { Shield, Smartphone, Key, QrCode, Copy, Check, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface MFASetupProps {
  onClose?: () => void;
}

function MFASetup({ onClose }: MFASetupProps) {
  const { 
    mfaFactors, 
    enrollMFA, 
    verifyMFAEnrollment, 
    unenrollMFA, 
    refreshMFAFactors,
    user 
  } = useAuthContext();

  const [step, setStep] = useState<'overview' | 'setup' | 'verify'>('overview');
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasVerifiedMFA = mfaFactors.some(factor => factor.status === 'verified');

  const startEnrollment = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First, try to clean up any existing unverified MFA factors
      if (mfaFactors.length > 0) {
        console.log('Cleaning up existing MFA factors...');
        for (const factor of mfaFactors) {
          if (factor.status !== 'verified') {
            await unenrollMFA(factor.id);
          }
        }
        await refreshMFAFactors();
      }
      
      const result = await enrollMFA();
      if (result.error) {
        console.error('Enrollment error details:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No enrollment data received');
      }
      
      setEnrollmentData(result.data);
      setStep('setup');
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      if (error.message.includes('already exists')) {
        setError('Ya existe una configuración MFA. Eliminando configuraciones previas...');
        // Try to clean up and retry
        try {
          for (const factor of mfaFactors) {
            await unenrollMFA(factor.id);
          }
          await refreshMFAFactors();
          // Retry enrollment
          const retryResult = await enrollMFA();
          if (retryResult.error) throw retryResult.error;
          setEnrollmentData(retryResult.data);
          setStep('setup');
          setError('');
        } catch (retryError: any) {
          setError('Error al limpiar configuraciones MFA previas. Recargue la página e intente nuevamente.');
        }
      } else {
        setError(error.message || 'Error al iniciar configuración MFA');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollmentData || !verificationCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('MFA Enrollment verification:', {
        factorId: enrollmentData.id,
        code: verificationCode,
        enrollmentData
      });
      
      const { error } = await verifyMFAEnrollment(enrollmentData.id, verificationCode);
      if (error) {
        console.error('MFA verification error:', error);
        throw error;
      }
      
      console.log('MFA verification successful');
      await refreshMFAFactors();
      setStep('overview');
      setVerificationCode('');
      setEnrollmentData(null);
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      setError(error.message || 'Código inválido. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const removeMFA = async (factorId: string) => {
    if (!confirm('¿Está seguro que desea eliminar este método de autenticación?')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error } = await unenrollMFA(factorId);
      if (error) throw error;
      
      await refreshMFAFactors();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar MFA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  const generateQRCodeURL = () => {
    if (!enrollmentData || !user) return '';
    
    const issuer = encodeURIComponent('HubJR Neurología');
    const accountName = encodeURIComponent(user.email || '');
    const secret = enrollmentData.totp.secret;
    
    return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
  };

  if (step === 'setup' && enrollmentData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
            <QrCode className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Configurar Autenticador
          </h3>
          <p className="text-gray-600 mt-2">
            Escanea el código QR con tu app de autenticación
          </p>
        </div>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
            <div className="bg-gray-100 h-48 flex items-center justify-center rounded-lg mb-4">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  QR Code generado para:<br />
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {generateQRCodeURL()}
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              ¿No puedes escanear? Ingresa manualmente:
            </h4>
            <div className="bg-white border border-gray-200 rounded p-3 mb-3">
              <code className="text-sm text-gray-700 break-all">
                {formatSecret(enrollmentData.totp.secret)}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(enrollmentData.totp.secret)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Descarga una app como Google Authenticator o Authy</li>
              <li>Escanea el código QR o ingresa el código manualmente</li>
              <li>Ingresa el código de 6 dígitos que aparece en tu app</li>
            </ol>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setStep('verify')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Continuar con Verificación
            </button>
            
            <button
              onClick={() => {
                setStep('overview');
                setEnrollmentData(null);
              }}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify' && enrollmentData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
            <Key className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Verificar Código
          </h3>
          <p className="text-gray-600 mt-2">
            Ingresa el código de 6 dígitos de tu app
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-2xl font-mono tracking-widest px-3 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <button
            onClick={verifyEnrollment}
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar y Activar'}
          </button>

          <button
            onClick={() => setStep('setup')}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Overview/Management screen
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Autenticación de Dos Factores
            </h3>
            <p className="text-sm text-gray-600">
              {hasVerifiedMFA ? 'Activa' : 'Inactiva'}
            </p>
          </div>
        </div>
        
        {hasVerifiedMFA && (
          <div className="flex items-center text-green-600">
            <Shield className="h-5 w-5" />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {!hasVerifiedMFA ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">MFA no configurado</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Configure la autenticación de dos factores para mayor seguridad.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">MFA activo</h4>
                <p className="text-sm text-green-700 mt-1">
                  Su cuenta está protegida con autenticación de dos factores.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active MFA Methods */}
        {mfaFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Métodos activos:</h4>
            {mfaFactors.map((factor) => (
              <div key={factor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {factor.friendly_name || 'App Autenticadora'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Estado: {factor.status === 'verified' ? 'Verificado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeMFA(factor.id)}
                  disabled={loading}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Eliminar método MFA"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {!hasVerifiedMFA && (
            <button
              onClick={startEnrollment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Smartphone className="h-4 w-4 mr-2" />
              )}
              Configurar MFA
            </button>
          )}

          <button
            onClick={refreshMFAFactors}
            disabled={loading}
            className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Estado
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MFASetup;