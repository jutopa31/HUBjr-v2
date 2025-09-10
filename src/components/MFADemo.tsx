import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, User, Settings } from 'lucide-react';
import { AuthProvider, AuthModal, UserMenu, ProtectedRoute } from './auth';

function MFADemo() {
  const [showProtectedContent, setShowProtectedContent] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  HubJR Neurología - Sistema de Autenticación
                </h1>
                <p className="text-gray-600 mt-2">
                  Demo de autenticación de dos factores (MFA/TOTP)
                </p>
              </div>
              <UserMenu />
            </div>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Autenticación</h3>
              </div>
              <p className="text-sm text-gray-600">
                Sistema completo de registro e inicio de sesión con Supabase Auth
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">MFA/TOTP</h3>
              </div>
              <p className="text-sm text-gray-600">
                Autenticación de dos factores con apps como Google Authenticator
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Gestión</h3>
              </div>
              <p className="text-sm text-gray-600">
                Interfaz completa para gestión de factores MFA
              </p>
            </div>
          </div>

          {/* Demo Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Probar Funcionalidad</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-600 font-medium">Abrir Modal de Autenticación</span>
              </button>

              <button
                onClick={() => setShowProtectedContent(true)}
                className="flex items-center justify-center p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <Shield className="h-5 w-5 text-orange-600 mr-2" />
                <span className="text-orange-600 font-medium">Ver Contenido Protegido (Requiere MFA)</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instrucciones</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-4 flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Registro/Inicio de Sesión</h3>
                  <p className="text-sm text-gray-600">
                    Cree una cuenta nueva o inicie sesión con credenciales existentes.
                    El sistema soporta diferentes roles (residente, staff, interno).
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-4 flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Configurar MFA</h3>
                  <p className="text-sm text-gray-600">
                    Una vez autenticado, configure la autenticación de dos factores:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
                    <li>Descargue Google Authenticator, Authy u otra app TOTP</li>
                    <li>Escanee el código QR o ingrese el código manualmente</li>
                    <li>Verifique con el código de 6 dígitos generado</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-4 flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Acceder a Contenido Protegido</h3>
                  <p className="text-sm text-gray-600">
                    Las secciones críticas requieren MFA activo. El sistema verificará
                    automáticamente y solicitará configuración si es necesario.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900">Nota de Seguridad</h4>
              </div>
              <p className="text-sm text-blue-800">
                Esta implementación cumple with las mejores prácticas de seguridad y
                resuelve la advertencia de "Insufficient MFA Options" mostrada en el
                Security Advisor de Supabase.
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {/* Protected Content Modal */}
        {showProtectedContent && (
          <ProtectedRoute requireMFA>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ¡Acceso Autorizado!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ha accedido exitosamente a contenido protegido con MFA.
                    Esta sección estaría disponible solo para usuarios con
                    autenticación de dos factores activa.
                  </p>
                  <button
                    onClick={() => setShowProtectedContent(false)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        )}
      </div>
    </AuthProvider>
  );
}

export default MFADemo;