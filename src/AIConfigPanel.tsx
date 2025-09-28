import React, { useState, useEffect } from 'react';
import useEscapeKey from './hooks/useEscapeKey';
import { 
  Brain, 
  Key, 
  Settings, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  DollarSign,
  Activity,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  AIConfig, 
  AI_PROVIDERS, 
  DEFAULT_AI_CONFIG,
  loadAIConfig, 
  saveAIConfig, 
  getProviderById,
  getModelsByProvider
} from './aiConfig';

interface AIConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadAIConfig());
    }
  }, [isOpen]);

  const handleProviderChange = (providerId: string) => {
    const provider = getProviderById(providerId);
    if (provider) {
      const models = getModelsByProvider(providerId);
      setConfig(prev => ({
        ...prev,
        provider: provider.id,
        model: models[0]?.id || '',
        apiKey: provider.requiresApiKey ? prev.apiKey : ''
      }));
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureId]: !prev.features[featureId]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveAIConfig(config);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error saving config:', error);
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    // Simular test de conexión
    setTimeout(() => {
      if (config.provider === 'local' || (config.apiKey && config.apiKey.length > 10)) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
      setTestingConnection(false);
    }, 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_AI_CONFIG);
    setConnectionStatus('idle');
  };

  const currentProvider = getProviderById(config.provider);
  const availableModels = getModelsByProvider(config.provider);
  const enabledFeatures = Object.values(config.features).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Configuración de IA</h2>
                <p className="text-purple-100 text-sm">
                  Gestiona la integración de inteligencia artificial
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado Actual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Estado IA</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {config.enabled ? 'Activa' : 'Inactiva'}
              </p>
              <p className="text-xs text-blue-700">
                {enabledFeatures} funciones habilitadas
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Uso Hoy</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                ${config.usage.costToday.toFixed(3)}
              </p>
              <p className="text-xs text-green-700">
                {config.usage.requestsToday} solicitudes
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Proveedor</span>
              </div>
              <p className="text-lg font-bold text-purple-900 mt-1">
                {currentProvider?.name || 'No seleccionado'}
              </p>
              <p className="text-xs text-purple-700">{config.model}</p>
            </div>
          </div>

          {/* Configuración General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configuración General</span>
            </h3>

            {/* Enable/Disable IA */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Habilitar IA</h4>
                <p className="text-sm text-gray-600">
                  Activar/desactivar todas las funciones de IA
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Proveedor */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Proveedor de IA
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AI_PROVIDERS.map((provider) => (
                  <label
                    key={provider.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      config.provider === provider.id
                        ? 'border-purple-600 ring-2 ring-purple-600 bg-purple-50'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={provider.id}
                      checked={config.provider === provider.id}
                      onChange={() => handleProviderChange(provider.id)}
                      className="sr-only"
                    />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {provider.name}
                          </div>
                          <div className="text-gray-500">
                            {provider.description}
                          </div>
                        </div>
                      </div>
                      {config.provider === provider.id && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* API Key */}
            {currentProvider?.requiresApiKey && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-20"
                    placeholder={`Ingrese su ${currentProvider.name} API Key`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || !config.apiKey}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      {testingConnection ? (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {connectionStatus === 'success' && (
                  <p className="text-sm text-green-600 flex items-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>Conexión exitosa</span>
                  </p>
                )}
                {connectionStatus === 'error' && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error de conexión - Verifique la API Key</span>
                  </p>
                )}
              </div>
            )}

            {/* Modelo */}
            {availableModels.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Modelo
                </label>
                <select
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.costPer1k > 0 && `($${model.costPer1k}/1K tokens)`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Funciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Funciones de IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProvider?.supportedFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{feature.name}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features[feature.id] || false}
                      onChange={() => handleFeatureToggle(feature.id)}
                      disabled={!config.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restablecer</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPanel;
