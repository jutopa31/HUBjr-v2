import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Save, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface ResidentProfile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  training_level: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'fellow' | 'attending' | 'intern';
  current_rotation?: string;
  status: 'active' | 'on_leave' | 'graduated' | 'transferred' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

const ResidentManagement = () => {
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentProfile | null>(null);
  const [formData, setFormData] = useState<Partial<ResidentProfile>>({});

  const trainingLevels = ['R1', 'R2', 'R3', 'R4', 'R5', 'fellow', 'attending', 'intern'];
  const statusOptions = ['active', 'on_leave', 'graduated', 'transferred', 'suspended'];

  // Load residents
  const loadResidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resident_profiles')
        .select('*')
        .order('training_level', { ascending: true });

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error('Error loading residents:', error);
      alert('Error al cargar residentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  // Filter residents
  const filteredResidents = residents.filter(resident => {
    const matchesSearch =
      resident.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || resident.status === selectedStatus;
    const matchesLevel = selectedLevel === 'all' || resident.training_level === selectedLevel;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Form handlers
  const openCreateForm = () => {
    setEditingResident(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      training_level: 'R1',
      current_rotation: 'Neurología General',
      status: 'active',
      user_id: '' // Will be generated
    });
    setShowForm(true);
  };

  const openEditForm = (resident: ResidentProfile) => {
    setEditingResident(resident);
    setFormData({ ...resident });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingResident(null);
    setFormData({});
  };

  // CRUD operations
  const saveResident = async () => {
    try {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }

      if (editingResident) {
        // Update existing resident
        const { error } = await supabase
          .from('resident_profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            training_level: formData.training_level,
            current_rotation: formData.current_rotation,
            status: formData.status
          })
          .eq('id', editingResident.id);

        if (error) throw error;
        alert('Residente actualizado correctamente');
      } else {
        // Create new resident
        const { error } = await supabase
          .from('resident_profiles')
          .insert({
            user_id: crypto.randomUUID(), // Generate random UUID for user_id
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            training_level: formData.training_level,
            current_rotation: formData.current_rotation,
            status: formData.status
          });

        if (error) throw error;
        alert('Residente creado correctamente');
      }

      closeForm();
      loadResidents();
    } catch (error: any) {
      console.error('Error saving resident:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const deleteResident = async (resident: ResidentProfile) => {
    if (!confirm(`¿Estás seguro de eliminar a ${resident.first_name} ${resident.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resident_profiles')
        .delete()
        .eq('id', resident.id);

      if (error) throw error;
      alert('Residente eliminado correctamente');
      loadResidents();
    } catch (error: any) {
      console.error('Error deleting resident:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const changeStatus = async (resident: ResidentProfile, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('resident_profiles')
        .update({ status: newStatus })
        .eq('id', resident.id);

      if (error) throw error;
      loadResidents();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Statistics
  const stats = {
    total: residents.length,
    active: residents.filter(r => r.status === 'active').length,
    byLevel: trainingLevels.reduce((acc, level) => {
      acc[level] = residents.filter(r => r.training_level === level && r.status === 'active').length;
      return acc;
    }, {} as Record<string, number>)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Cargando residentes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Residentes</h2>
          <p className="text-gray-600">Administra los perfiles de residentes del programa</p>
        </div>
        <button
          onClick={openCreateForm}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Residente</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-800">Total</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-green-800">Activos</div>
        </div>
        {trainingLevels.slice(0, 6).map(level => (
          <div key={level} className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.byLevel[level] || 0}</div>
            <div className="text-sm text-gray-800">{level}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status === 'active' ? 'Activo' :
               status === 'on_leave' ? 'En licencia' :
               status === 'graduated' ? 'Graduado' :
               status === 'transferred' ? 'Transferido' : 'Suspendido'}
            </option>
          ))}
        </select>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los niveles</option>
          {trainingLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Residente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rotación Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {resident.first_name} {resident.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{resident.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {resident.training_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resident.current_rotation || 'No asignada'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={resident.status}
                      onChange={(e) => changeStatus(resident, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 cursor-pointer ${
                        resident.status === 'active' ? 'bg-green-100 text-green-800' :
                        resident.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                        resident.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                        resident.status === 'transferred' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status === 'active' ? 'Activo' :
                           status === 'on_leave' ? 'En licencia' :
                           status === 'graduated' ? 'Graduado' :
                           status === 'transferred' ? 'Transferido' : 'Suspendido'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditForm(resident)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteResident(resident)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResidents.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay residentes</h3>
            <p className="mt-1 text-sm text-gray-500">
              {residents.length === 0
                ? 'Comienza agregando tu primer residente.'
                : 'No se encontraron residentes con los filtros aplicados.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingResident ? 'Editar Residente' : 'Nuevo Residente'}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nivel</label>
                  <select
                    value={formData.training_level || 'R1'}
                    onChange={(e) => setFormData({ ...formData, training_level: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {trainingLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status === 'active' ? 'Activo' :
                         status === 'on_leave' ? 'En licencia' :
                         status === 'graduated' ? 'Graduado' :
                         status === 'transferred' ? 'Transferido' : 'Suspendido'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rotación Actual</label>
                <input
                  type="text"
                  value={formData.current_rotation || ''}
                  onChange={(e) => setFormData({ ...formData, current_rotation: e.target.value })}
                  placeholder="ej. Neurología General, Stroke Unit, etc."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveResident}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingResident ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentManagement;
