import React, { useState } from 'react';
import { Plus, Download } from 'lucide-react';

interface Patient {
  id: string;
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

const WardRoundsWorking: React.FC = () => {
  const [patients] = useState<Patient[]>([
    {
      id: '1',
      cama: 'UTI 1',
      dni: '12345678',
      nombre: 'PACIENTE DE EJEMPLO',
      edad: '45 AÑOS',
      antecedentes: 'HTA, DBT',
      motivo_consulta: 'Dolor de cabeza intenso',
      examen_fisico: 'Consciente, orientado',
      estudios: 'TC cerebro: normal',
      severidad: 'II',
      diagnostico: 'Cefalea primaria',
      plan: 'Analgésicos, observación',
      fecha: '2025-09-04'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

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

      {/* Mensaje si no hay conexión con Supabase */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          📋 <strong>Versión de prueba:</strong> Los datos no se guardan permanentemente aún. 
          Para guardar en Supabase, necesitamos verificar la conexión.
        </p>
      </div>

      {/* Modal básico para agregar paciente */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h2 className="text-xl font-semibold mb-4">Agregar Paciente</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Cama (ej: UTI 1, 3C7)"
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Diagnóstico"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Funcionalidad en desarrollo. Por ahora solo puedes ver el ejemplo.');
                  setShowAddForm(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
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
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cama</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ant</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">MC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">EF/NIHSS</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">EC</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SEV</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DX</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
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
                      patient.severidad === 'I' ? 'bg-green-100 text-gray-800' :
                      patient.severidad === 'II' ? 'bg-yellow-100 text-gray-800' :
                      patient.severidad === 'III' ? 'bg-orange-100 text-gray-800' :
                      patient.severidad === 'IV' ? 'bg-red-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.severidad}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.diagnostico}>{patient.diagnostico}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.plan}>{patient.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WardRoundsWorking;
