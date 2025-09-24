import React, { useState } from 'react';
import { Search, BookOpen, Calendar, Brain, Users, FileText, ExternalLink } from 'lucide-react';
import { Scale } from './types';
import ScaleModal from './ScaleModal';

interface ResourcesHubProps {
  onNavigate?: (tab: string) => void;
}

type ResourceCategory = 'all' | 'scales' | 'guidelines' | 'education' | 'schedule';

const ResourcesHub: React.FC<ResourcesHubProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>('all');
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);

  // Medical scales available for quick reference
  const medicalScales: Scale[] = [
    {
      id: 'nihss',
      name: 'NIHSS',
      fullName: 'National Institutes of Health Stroke Scale',
      description: 'Evaluación neurológica para accidente cerebrovascular',
      category: 'neurological',
      fields: []
    },
    {
      id: 'glasgow',
      name: 'Glasgow Coma Scale',
      fullName: 'Escala de Coma de Glasgow',
      description: 'Evaluación del nivel de conciencia',
      category: 'neurological',
      fields: []
    },
    {
      id: 'updrs',
      name: 'UPDRS',
      fullName: 'Unified Parkinson\'s Disease Rating Scale',
      description: 'Evaluación integral para enfermedad de Parkinson',
      category: 'movement',
      fields: []
    },
    {
      id: 'moca',
      name: 'MoCA',
      fullName: 'Montreal Cognitive Assessment',
      description: 'Evaluación cognitiva breve',
      category: 'cognitive',
      fields: []
    },
    {
      id: 'mmse',
      name: 'MMSE',
      fullName: 'Mini-Mental State Examination',
      description: 'Evaluación del estado mental',
      category: 'cognitive',
      fields: []
    }
  ];

  const guidelines = [
    {
      id: '1',
      title: 'Manejo del ACV Agudo',
      description: 'Protocolo hospitalario para el tratamiento del accidente cerebrovascular agudo',
      category: 'emergency',
      type: 'protocol'
    },
    {
      id: '2',
      title: 'Diagnóstico de Epilepsia',
      description: 'Guía para el diagnóstico y clasificación de crisis epilépticas',
      category: 'epilepsy',
      type: 'guideline'
    },
    {
      id: '3',
      title: 'Cefaleas Primarias',
      description: 'Criterios diagnósticos y tratamiento de cefaleas primarias',
      category: 'headache',
      type: 'guideline'
    }
  ];

  const educationResources = [
    {
      id: '1',
      title: 'Cronograma Académico',
      description: 'Horarios de clases y rotaciones',
      type: 'schedule',
      action: () => onNavigate?.('schedule')
    },
    {
      id: '2',
      title: 'Material de Academia',
      description: 'Presentaciones y material educativo',
      type: 'materials',
      action: () => onNavigate?.('academia')
    },
    {
      id: '3',
      title: 'Casos Clínicos',
      description: 'Biblioteca de casos para estudio',
      type: 'cases'
    }
  ];

  const categories = [
    { id: 'all', label: 'Todos', icon: FileText },
    { id: 'scales', label: 'Escalas', icon: Brain },
    { id: 'guidelines', label: 'Guías', icon: BookOpen },
    { id: 'education', label: 'Academia', icon: Users },
    { id: 'schedule', label: 'Cronograma', icon: Calendar }
  ];

  const CategoryButton: React.FC<{
    category: ResourceCategory;
    label: string;
    icon: React.ElementType;
  }> = ({ category, label, icon: Icon }) => (
    <button
      onClick={() => setActiveCategory(category)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeCategory === category
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  const ScaleCard: React.FC<{ scale: Scale }> = ({ scale }) => (
    <div
      onClick={() => setSelectedScale(scale)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{scale.name}</h3>
        <Brain className="h-5 w-5 text-blue-500" />
      </div>
      <p className="text-sm text-gray-600 mb-2">{scale.fullName}</p>
      <p className="text-sm text-gray-500">{scale.description}</p>
    </div>
  );

  const GuidelineCard: React.FC<{
    guideline: typeof guidelines[0];
  }> = ({ guideline }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{guideline.title}</h3>
        <ExternalLink className="h-4 w-4 text-gray-400" />
      </div>
      <p className="text-sm text-gray-600">{guideline.description}</p>
      <div className="mt-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {guideline.type}
        </span>
      </div>
    </div>
  );

  const EducationCard: React.FC<{
    resource: typeof educationResources[0];
  }> = ({ resource }) => (
    <div
      onClick={resource.action}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{resource.title}</h3>
        <Users className="h-5 w-5 text-green-500" />
      </div>
      <p className="text-sm text-gray-600">{resource.description}</p>
    </div>
  );

  const getFilteredContent = () => {
    const searchLower = searchTerm.toLowerCase();

    switch (activeCategory) {
      case 'scales':
        return medicalScales.filter(scale =>
          scale.name.toLowerCase().includes(searchLower) ||
          scale.fullName.toLowerCase().includes(searchLower) ||
          scale.description.toLowerCase().includes(searchLower)
        );
      case 'guidelines':
        return guidelines.filter(guide =>
          guide.title.toLowerCase().includes(searchLower) ||
          guide.description.toLowerCase().includes(searchLower)
        );
      case 'education':
        return educationResources.filter(resource =>
          resource.title.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower)
        );
      case 'all':
      default:
        return {
          scales: medicalScales.filter(scale =>
            scale.name.toLowerCase().includes(searchLower) ||
            scale.fullName.toLowerCase().includes(searchLower)
          ),
          guidelines: guidelines.filter(guide =>
            guide.title.toLowerCase().includes(searchLower) ||
            guide.description.toLowerCase().includes(searchLower)
          ),
          education: educationResources.filter(resource =>
            resource.title.toLowerCase().includes(searchLower) ||
            resource.description.toLowerCase().includes(searchLower)
          )
        };
    }
  };

  const filteredContent = getFilteredContent();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recursos</h1>
        <p className="text-gray-600">
          Escalas médicas, guías clínicas y material educativo
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar recursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            category={category.id as ResourceCategory}
            label={category.label}
            icon={category.icon}
          />
        ))}
      </div>

      {/* Content */}
      <div>
        {activeCategory === 'all' && typeof filteredContent === 'object' && 'scales' in filteredContent ? (
          <div className="space-y-8">
            {/* Scales Section */}
            {filteredContent.scales.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Escalas Médicas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContent.scales.map((scale) => (
                    <ScaleCard key={scale.id} scale={scale} />
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines Section */}
            {filteredContent.guidelines.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Guías Clínicas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContent.guidelines.map((guideline) => (
                    <GuidelineCard key={guideline.id} guideline={guideline} />
                  ))}
                </div>
              </div>
            )}

            {/* Education Section */}
            {filteredContent.education.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recursos Académicos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContent.education.map((resource) => (
                    <EducationCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCategory === 'scales' && Array.isArray(filteredContent) &&
              filteredContent.map((scale) => (
                <ScaleCard key={scale.id} scale={scale} />
              ))}
            {activeCategory === 'guidelines' && Array.isArray(filteredContent) &&
              filteredContent.map((guideline) => (
                <GuidelineCard key={guideline.id} guideline={guideline} />
              ))}
            {activeCategory === 'education' && Array.isArray(filteredContent) &&
              filteredContent.map((resource) => (
                <EducationCard key={resource.id} resource={resource} />
              ))}
          </div>
        )}
      </div>

      {/* Scale Modal */}
      {selectedScale && (
        <ScaleModal
          scale={selectedScale}
          onClose={() => setSelectedScale(null)}
          onComplete={(result) => {
            console.log('Scale completed:', result);
            setSelectedScale(null);
          }}
        />
      )}
    </div>
  );
};

export default ResourcesHub;