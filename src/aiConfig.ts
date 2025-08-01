// Configuración centralizada de IA para el proyecto HUBJR
export interface AIProvider {
  id: 'openai' | 'claude' | 'gemini' | 'local';
  name: string;
  description: string;
  requiresApiKey: boolean;
  supportedFeatures: AIFeature[];
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  costPerRequest?: number;
}

export interface AIConfig {
  provider: AIProvider['id'];
  apiKey: string;
  model: string;
  enabled: boolean;
  features: { [key: string]: boolean };
  usage: {
    requestsToday: number;
    costToday: number;
    lastReset: string;
  };
}

// Proveedores disponibles
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'GPT-4/3.5 para análisis médico avanzado',
    requiresApiKey: true,
    supportedFeatures: [
      { id: 'diagnostic_analysis', name: 'Análisis Diagnóstico', description: 'Análisis de texto médico', enabled: true },
      { id: 'report_generation', name: 'Generación de Reportes', description: 'Reportes automáticos', enabled: true },
      { id: 'case_summarization', name: 'Resumen de Casos', description: 'Resúmenes automáticos', enabled: true },
      { id: 'differential_diagnosis', name: 'Diagnóstico Diferencial', description: 'Sugerencias diagnósticas', enabled: true }
    ]
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 especializado en medicina',
    requiresApiKey: true,
    supportedFeatures: [
      { id: 'diagnostic_analysis', name: 'Análisis Diagnóstico', description: 'Análisis de texto médico', enabled: true },
      { id: 'report_generation', name: 'Generación de Reportes', description: 'Reportes automáticos', enabled: true },
      { id: 'case_summarization', name: 'Resumen de Casos', description: 'Resúmenes automáticos', enabled: true },
      { id: 'differential_diagnosis', name: 'Diagnóstico Diferencial', description: 'Sugerencias diagnósticas', enabled: true }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro para análisis multimodal',
    requiresApiKey: true,
    supportedFeatures: [
      { id: 'diagnostic_analysis', name: 'Análisis Diagnóstico', description: 'Análisis de texto médico', enabled: true },
      { id: 'image_analysis', name: 'Análisis de Imágenes', description: 'Análisis de neuroimágenes', enabled: true },
      { id: 'report_generation', name: 'Generación de Reportes', description: 'Reportes automáticos', enabled: true }
    ]
  },
  {
    id: 'local',
    name: 'Análisis Local',
    description: 'Patrones médicos locales (sin costo)',
    requiresApiKey: false,
    supportedFeatures: [
      { id: 'diagnostic_analysis', name: 'Análisis Diagnóstico', description: 'Patrones médicos predefinidos', enabled: true }
    ]
  }
];

// Configuración por defecto
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'local',
  apiKey: '',
  model: 'local-patterns',
  enabled: true,
  features: {
    diagnostic_analysis: true,
    report_generation: false,
    case_summarization: false,
    differential_diagnosis: false,
    image_analysis: false
  },
  usage: {
    requestsToday: 0,
    costToday: 0,
    lastReset: new Date().toISOString().split('T')[0]
  }
};

// Modelos por proveedor
export const AI_MODELS = {
  openai: [
    { id: 'gpt-4', name: 'GPT-4', costPer1k: 0.03 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', costPer1k: 0.01 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', costPer1k: 0.001 }
  ],
  claude: [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', costPer1k: 0.015 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', costPer1k: 0.0025 }
  ],
  gemini: [
    { id: 'gemini-pro', name: 'Gemini Pro', costPer1k: 0.002 },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', costPer1k: 0.005 }
  ],
  local: [
    { id: 'local-patterns', name: 'Patrones Locales', costPer1k: 0 }
  ]
};

// Funciones de utilidad
export const getProviderById = (id: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(provider => provider.id === id);
};

export const getModelsByProvider = (providerId: string) => {
  return AI_MODELS[providerId as keyof typeof AI_MODELS] || [];
};

export const loadAIConfig = (): AIConfig => {
  try {
    const saved = localStorage.getItem('hubjr_ai_config');
    if (saved) {
      const config = JSON.parse(saved);
      // Resetear contadores diarios si es necesario
      const today = new Date().toISOString().split('T')[0];
      if (config.usage?.lastReset !== today) {
        config.usage = {
          requestsToday: 0,
          costToday: 0,
          lastReset: today
        };
      }
      return { ...DEFAULT_AI_CONFIG, ...config };
    }
  } catch (error) {
    console.warn('Error loading AI config:', error);
  }
  return DEFAULT_AI_CONFIG;
};

export const saveAIConfig = (config: AIConfig): void => {
  try {
    localStorage.setItem('hubjr_ai_config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving AI config:', error);
  }
};

export const updateUsage = (requests: number = 1, cost: number = 0): void => {
  const config = loadAIConfig();
  config.usage.requestsToday += requests;
  config.usage.costToday += cost;
  saveAIConfig(config);
};