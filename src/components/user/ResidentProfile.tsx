import React, { useState, useEffect } from 'react';
import { User, Calendar, GraduationCap, Stethoscope, Edit, Save, X, Award, MapPin, Phone, Mail } from 'lucide-react';
import { useAuthContext } from '../auth/AuthProvider';
import { useUserData } from '../../hooks/useUserData';
import { ResidentProfileFormData } from '../../types/residentProfile';

interface ResidentProfileProps {
  onClose?: () => void;
}

const ResidentProfile: React.FC<ResidentProfileProps> = ({ onClose }) => {
  const { user } = useAuthContext();
  const { residentProfile, profileLoading } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ResidentProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    training_level: 'R1',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (residentProfile) {
      setFormData({
        first_name: residentProfile.first_name || '',
        last_name: residentProfile.last_name || '',
        dni: residentProfile.dni || '',
        email: residentProfile.email || user?.email || '',
        phone: residentProfile.phone || '',
        training_level: residentProfile.training_level || 'R1',
        program_year: residentProfile.program_year || undefined,
        start_date: residentProfile.start_date || new Date().toISOString().split('T')[0],
        expected_graduation: residentProfile.expected_graduation || '',
        current_rotation: residentProfile.current_rotation || '',
        medical_school: residentProfile.medical_school || '',
        graduation_year: residentProfile.graduation_year || undefined,
        emergency_contact_name: residentProfile.emergency_contact_name || '',
        emergency_contact_phone: residentProfile.emergency_contact_phone || '',
        bio: residentProfile.bio || ''
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [residentProfile, user]);

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const getTrainingLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'R1': 'Residente de 1er Año',
      'R2': 'Residente de 2do Año',
      'R3': 'Residente de 3er Año',
      'R4': 'Residente de 4to Año',
      'R5': 'Residente de 5to Año',
      'fellow': 'Fellow',
      'attending': 'Staff',
      'intern': 'Interno'
    };
    return labels[level] || level;
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Perfil del Residente</h2>
            <p className="text-sm text-gray-600">
              Información personal y de entrenamiento
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Guardar</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Editar</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.first_name || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.last_name || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.dni || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.dni || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    {formData.email || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {formData.phone || 'No especificado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Training Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Residencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Entrenamiento
                </label>
                {isEditing ? (
                  <select
                    value={formData.training_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, training_level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="intern">Interno</option>
                    <option value="R1">R1</option>
                    <option value="R2">R2</option>
                    <option value="R3">R3</option>
                    <option value="R4">R4</option>
                    <option value="R5">R5</option>
                    <option value="fellow">Fellow</option>
                    <option value="attending">Staff</option>
                  </select>
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                    {getTrainingLevelLabel(formData.training_level)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año del Programa
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.program_year || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, program_year: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.program_year || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {new Date(formData.start_date).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotación Actual
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.current_rotation || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_rotation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Neurología General"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <Stethoscope className="h-4 w-4 text-gray-400 mr-2" />
                    {formData.current_rotation || 'No especificado'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Rápidas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Días en el programa</span>
                <span className="font-medium">
                  {Math.floor((new Date().getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <span className="px-2 py-1 bg-green-100 text-gray-800 text-xs rounded-full">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Hospital Info */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital</h3>
            <div className="space-y-3">
              <p className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                Hospital Nacional Prof. A. Posadas
              </p>
              <p className="flex items-center text-sm">
                <Award className="h-4 w-4 text-gray-400 mr-2" />
                Servicio de Neurología
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfile;
