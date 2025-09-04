import React, { useState, useEffect } from 'react';
import { Plus, Download, Edit, X } from 'lucide-react';
import { supabase } from './utils/supabase';

interface Patient {
  id?: string;
  cama: string;
  dni: string;
  nombre: string;
  edad: string;
  antecedentes: string;
  motivo_consulta: string;
  examen_fisico: string;
  estudios: string;
  severidad: string;
  diagnostico: string;
  plan: string;
  fecha: string;
}

const WardRounds: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const emptyPatient: Patient = {
    cama: '',
    dni: '',
    nombre: '',
    edad: '',
    antecedentes: '',
    motivo_consulta: '',
    examen_fisico: '',
    estudios: '',
    severidad: '',
    diagnostico: '',
    plan: '',
    fecha: new Date().toISOString().split('T')[0]
  };

  const [newPatient, setNewPatient] = useState<Patient>(emptyPatient);

  // Cargar pacientes desde Supabase
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('ward_round_patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      alert('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  // Agregar nuevo paciente
  const addPatient = async () => {
    try {
      const { error } = await supabase
        .from('ward_round_patients')
        .insert([newPatient]);

      if (error) throw error;
      
      setNewPatient(emptyPatient);
      setShowAddForm(false);
      loadPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Error al agregar paciente');
    }
  };


  // Exportar a PDF (simple)
  const exportToPDF = () => {
    const printContent = document.getElementById('ward-round-table');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('es-AR');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Pase de Sala Neurología - ${today}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            h1 { 
              text-align: center; 
              color: #2563eb;
              margin-bottom: 20px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #ccc; 
              padding: 8px; 
              text-align: left;
              vertical-align: top;
              word-wrap: break-word;
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: bold;
            }
            .severity-I { background-color: #dcfce7; }
            .severity-II { background-color: #fef3c7; }
            .severity-III { background-color: #fed7aa; }
            .severity-IV { background-color: #fecaca; }
          </style>
        </head>
        <body>
          <h1>PASE DE SALA NEUROLOGÍA - ${today}</h1>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pase de Sala - Neurología</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Paciente</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Formulario para agregar paciente */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Agregar Nuevo Paciente</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatient(emptyPatient);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cama</label>
                <input
                  type="text"
                  value={newPatient.cama}
                  onChange={(e) => setNewPatient({...newPatient, cama: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="EMA CAMILLA 3, UTI 1, 3C7..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <input
                  type="text"
                  value={newPatient.dni}
                  onChange={(e) => setNewPatient({...newPatient, dni: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newPatient.nombre}
                  onChange={(e) => setNewPatient({...newPatient, nombre: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <input
                  type="text"
                  value={newPatient.edad}
                  onChange={(e) => setNewPatient({...newPatient, edad: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="22, 52 AÑOS..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Antecedentes</label>
                <textarea
                  value={newPatient.antecedentes}
                  onChange={(e) => setNewPatient({...newPatient, antecedentes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Consulta</label>
                <textarea
                  value={newPatient.motivo_consulta}
                  onChange={(e) => setNewPatient({...newPatient, motivo_consulta: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">EF/NIHSS/ABCD2</label>
                <textarea
                  value={newPatient.examen_fisico}
                  onChange={(e) => setNewPatient({...newPatient, examen_fisico: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudios Complementarios</label>
                <textarea
                  value={newPatient.estudios}
                  onChange={(e) => setNewPatient({...newPatient, estudios: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                <select
                  value={newPatient.severidad}
                  onChange={(e) => setNewPatient({...newPatient, severidad: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar...</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={newPatient.fecha}
                  onChange={(e) => setNewPatient({...newPatient, fecha: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  value={newPatient.diagnostico}
                  onChange={(e) => setNewPatient({...newPatient, diagnostico: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <textarea
                  value={newPatient.plan}
                  onChange={(e) => setNewPatient({...newPatient, plan: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatient(emptyPatient);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={addPatient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de pacientes */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div id="ward-round-table">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cama</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ant</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EF/NIHSS</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEV</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DX</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className={`hover:bg-gray-50 ${
                  patient.severidad === 'I' ? 'bg-green-50' :
                  patient.severidad === 'II' ? 'bg-yellow-50' :
                  patient.severidad === 'III' ? 'bg-orange-50' :
                  patient.severidad === 'IV' ? 'bg-red-50' : ''
                }`}>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.cama}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.dni}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 font-medium">{patient.nombre}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.edad}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.antecedentes}>{patient.antecedentes}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.motivo_consulta}>{patient.motivo_consulta}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.examen_fisico}>{patient.examen_fisico}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.estudios}>{patient.estudios}</td>
                  <td className="px-3 py-4 text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.severidad === 'I' ? 'bg-green-100 text-green-800' :
                      patient.severidad === 'II' ? 'bg-yellow-100 text-yellow-800' :
                      patient.severidad === 'III' ? 'bg-orange-100 text-orange-800' :
                      patient.severidad === 'IV' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.severidad}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.diagnostico}>{patient.diagnostico}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.plan}>{patient.plan}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <button
                      onClick={() => setEditingId(patient.id || null)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar paciente"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {patients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay pacientes registrados</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Agregar el primer paciente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WardRounds;