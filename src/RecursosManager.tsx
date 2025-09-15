import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Plus, Eye, Heart, Edit3, Trash2, X, Save, ExternalLink, Clock, User, Star } from 'lucide-react';
import { supabase } from './utils/supabase';

interface AcademicResource {
  id?: string;
  title: string;
  category: 'neuroanatomia' | 'semiologia' | 'patologia' | 'farmacologia' | 'imagenes' | 'electroencefalografia' | 'neurocirugia' | 'rehabilitacion' | 'pediatria' | 'geriatria' | 'urgencias' | 'investigacion';
  resource_type: 'guia' | 'paper' | 'video' | 'presentacion' | 'libro' | 'atlas' | 'caso_clinico';
  google_drive_url: string;
  description?: string;
  tags?: string[];
  difficulty_level?: 'basico' | 'intermedio' | 'avanzado';
  estimated_time?: number;
  language?: string;
  author?: string;
  publication_year?: number;
  is_featured?: boolean;
  view_count?: number;
  added_by?: string;
  created_at?: string;
}


interface RecursosManagerProps {
  isAdminMode?: boolean;
  userId?: string;
}

const RecursosManager: React.FC<RecursosManagerProps> = ({ isAdminMode = false, userId = 'demo-user' }) => {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [newResource, setNewResource] = useState<AcademicResource>({
    title: '',
    category: 'neuroanatomia',
    resource_type: 'guia',
    google_drive_url: '',
    description: '',
    tags: [],
    difficulty_level: 'basico',
    estimated_time: 30,
    language: 'es',
    author: '',
    publication_year: new Date().getFullYear(),
    is_featured: false
  });

  const categoryConfig = {
    neuroanatomia: { color: 'bg-blue-500', label: 'Neuroanatomía' },
    semiologia: { color: 'bg-green-500', label: 'Semiología' },
    patologia: { color: 'bg-red-500', label: 'Patología' },
    farmacologia: { color: 'bg-purple-500', label: 'Farmacología' },
    imagenes: { color: 'bg-indigo-500', label: 'Imágenes' },
    electroencefalografia: { color: 'bg-yellow-500', label: 'EEG' },
    neurocirugia: { color: 'bg-orange-500', label: 'Neurocirugía' },
    rehabilitacion: { color: 'bg-teal-500', label: 'Rehabilitación' },
    pediatria: { color: 'bg-pink-500', label: 'Pediatría' },
    geriatria: { color: 'bg-gray-500', label: 'Geriatría' },
    urgencias: { color: 'bg-red-600', label: 'Urgencias' },
    investigacion: { color: 'bg-cyan-500', label: 'Investigación' }
  };

  const typeConfig = {
    guia: { icon: BookOpen, label: 'Guía' },
    paper: { icon: BookOpen, label: 'Paper' },
    video: { icon: Eye, label: 'Video' },
    presentacion: { icon: BookOpen, label: 'Presentación' },
    libro: { icon: BookOpen, label: 'Libro' },
    atlas: { icon: BookOpen, label: 'Atlas' },
    caso_clinico: { icon: BookOpen, label: 'Caso Clínico' }
  };

  const difficultyConfig = {
    basico: { color: 'text-green-600 bg-green-100', label: 'Básico' },
    intermedio: { color: 'text-yellow-600 bg-yellow-100', label: 'Intermedio' },
    avanzado: { color: 'text-red-600 bg-red-100', label: 'Avanzado' }
  };

  // Fetch resources and favorites
  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data: resources, error } = await supabase
        .from('academic_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }

      setResources(resources || []);

      // Fetch user favorites
      const { data: favoriteData, error: favError } = await supabase
        .from('user_resource_favorites')
        .select('resource_id')
        .eq('user_id', userId);

      if (!favError && favoriteData) {
        setFavorites(favoriteData.map(fav => fav.resource_id));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newResource.title || !newResource.google_drive_url) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editingResource) {
        const { error } = await supabase
          .from('academic_resources')
          .update({
            title: newResource.title,
            category: newResource.category,
            resource_type: newResource.resource_type,
            google_drive_url: newResource.google_drive_url,
            description: newResource.description,
            tags: newResource.tags,
            difficulty_level: newResource.difficulty_level,
            estimated_time: newResource.estimated_time,
            language: newResource.language,
            author: newResource.author,
            publication_year: newResource.publication_year,
            is_featured: newResource.is_featured
          })
          .eq('id', editingResource);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('academic_resources')
          .insert([{
            ...newResource,
            added_by: 'admin',
            view_count: 0
          }]);

        if (error) throw error;
      }

      await fetchResources();
      resetForm();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Error al guardar el recurso');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewResource({
      title: '',
      category: 'neuroanatomia',
      resource_type: 'guia',
      google_drive_url: '',
      description: '',
      tags: [],
      difficulty_level: 'basico',
      estimated_time: 30,
      language: 'es',
      author: '',
      publication_year: new Date().getFullYear(),
      is_featured: false
    });
    setTagInput('');
    setEditingResource(null);
    setShowForm(false);
  };

  const handleEdit = (resource: AcademicResource) => {
    setNewResource(resource);
    setTagInput(resource.tags?.join(', ') || '');
    setEditingResource(resource.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este recurso?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('academic_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Error al eliminar el recurso');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (resourceId: string) => {
    const isFavorite = favorites.includes(resourceId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_resource_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('resource_id', resourceId);

        if (!error) {
          setFavorites(favorites.filter(id => id !== resourceId));
        }
      } else {
        const { error } = await supabase
          .from('user_resource_favorites')
          .insert([{ user_id: userId, resource_id: resourceId }]);

        if (!error) {
          setFavorites([...favorites, resourceId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const incrementViewCount = async (resourceId: string) => {
    try {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        await supabase
          .from('academic_resources')
          .update({ view_count: (resource.view_count || 0) + 1 })
          .eq('id', resourceId);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleTagInput = (value: string) => {
    setTagInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setNewResource({ ...newResource, tags });
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.resource_type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty_level === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  const featuredResources = filteredResources.filter(resource => resource.is_featured);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recursos Educativos</h2>
          <p className="text-gray-600">Biblioteca digital de materiales académicos</p>
        </div>

        {isAdminMode && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Recurso</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos los tipos</option>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todas las dificultades</option>
                {Object.entries(difficultyConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recursos Destacados</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredResources.slice(0, 6).map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isFavorite={favorites.includes(resource.id!)}
                  onToggleFavorite={toggleFavorite}
                  onView={incrementViewCount}
                  onEdit={isAdminMode ? handleEdit : undefined}
                  onDelete={isAdminMode ? handleDelete : undefined}
                  categoryConfig={categoryConfig}
                  typeConfig={typeConfig}
                  difficultyConfig={difficultyConfig}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Resources */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Todos los Recursos ({filteredResources.length})
          </h3>
        </div>
        <div className="p-4">
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron recursos con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isFavorite={favorites.includes(resource.id!)}
                  onToggleFavorite={toggleFavorite}
                  onView={incrementViewCount}
                  onEdit={isAdminMode ? handleEdit : undefined}
                  onDelete={isAdminMode ? handleDelete : undefined}
                  categoryConfig={categoryConfig}
                  typeConfig={typeConfig}
                  difficultyConfig={difficultyConfig}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newResource.category}
                    onChange={(e) => setNewResource({...newResource, category: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de recurso
                  </label>
                  <select
                    value={newResource.resource_type}
                    onChange={(e) => setNewResource({...newResource, resource_type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Google Drive *
                  </label>
                  <input
                    type="url"
                    value={newResource.google_drive_url}
                    onChange={(e) => setNewResource({...newResource, google_drive_url: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ejemplo: cefalea, migraña, neurología"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificultad
                  </label>
                  <select
                    value={newResource.difficulty_level}
                    onChange={(e) => setNewResource({...newResource, difficulty_level: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(difficultyConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo estimado (minutos)
                  </label>
                  <input
                    type="number"
                    value={newResource.estimated_time}
                    onChange={(e) => setNewResource({...newResource, estimated_time: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={newResource.author}
                    onChange={(e) => setNewResource({...newResource, author: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año de publicación
                  </label>
                  <input
                    type="number"
                    value={newResource.publication_year}
                    onChange={(e) => setNewResource({...newResource, publication_year: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newResource.is_featured}
                      onChange={(e) => setNewResource({...newResource, is_featured: e.target.checked})}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Recurso destacado</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Guardando...' : (editingResource ? 'Actualizar' : 'Crear')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Resource Card Component
interface ResourceCardProps {
  resource: AcademicResource;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onView: (id: string) => void;
  onEdit?: (resource: AcademicResource) => void;
  onDelete?: (id: string) => void;
  categoryConfig: any;
  typeConfig: any;
  difficultyConfig: any;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorite,
  onToggleFavorite,
  onView,
  onEdit,
  onDelete,
  categoryConfig,
  typeConfig,
  difficultyConfig
}) => {
  const categoryInfo = categoryConfig[resource.category];
  const typeInfo = typeConfig[resource.resource_type];
  const difficultyInfo = difficultyConfig[resource.difficulty_level || 'basico'];
  const Icon = typeInfo.icon;

  const handleOpenResource = () => {
    onView(resource.id!);
    window.open(resource.google_drive_url, '_blank');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 ${categoryInfo.color} text-white rounded-lg`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color} text-white`}>
                {categoryInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(resource.id!)}
            className={`p-1 rounded-full transition-colors ${
              isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title and Type */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{resource.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{typeInfo.label}</p>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-xs text-gray-700 line-clamp-2">{resource.description}</p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{resource.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {resource.difficulty_level && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
            )}
            {resource.estimated_time && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{resource.estimated_time}min</span>
              </div>
            )}
          </div>
          {resource.view_count && (
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{resource.view_count}</span>
            </div>
          )}
        </div>

        {/* Author and Year */}
        {(resource.author || resource.publication_year) && (
          <div className="text-xs text-gray-500">
            {resource.author && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{resource.author}</span>
              </div>
            )}
            {resource.publication_year && <span>({resource.publication_year})</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={handleOpenResource}
            className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Abrir</span>
          </button>

          {(onEdit || onDelete) && (
            <div className="flex space-x-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(resource)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(resource.id!)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecursosManager;