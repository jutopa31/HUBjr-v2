import React, { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import SectionHeader from './components/layout/SectionHeader';

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

  // Exportar a PDF
  const exportToPDF = () => {
    const printContent = document.getElementById('ward-round-table');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('es-AR');
    const table = printContent.querySelector('table');
    const clonedTable = table ? (table.cloneNode(true) as HTMLTableElement) : null;

    if (clonedTable) {
      const headerRow = clonedTable.querySelector('thead tr');
      if (headerRow?.lastElementChild) {
        headerRow.lastElementChild.remove();
      }
      clonedTable.querySelectorAll('tbody tr').forEach((row) => {
        const lastCell = row.lastElementChild;
        if (lastCell) {
          lastCell.remove();
        }
      });

      const colgroup = document.createElement('colgroup');
      const widths = ['6%', '8%', '13%', '5%', '8%', '14%', '14%', '7%', '5%', '8%', '12%'];
      widths.forEach((width) => {
        const col = document.createElement('col');
        col.style.width = width;
        colgroup.appendChild(col);
      });
      clonedTable.prepend(colgroup);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Pase de Sala NeurologA-a - ${today}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              font-size: 8px;
            }
            h1 { 
              text-align: center; 
              color: #2563eb;
              margin-bottom: 12px;
              font-size: 12px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #ccc; 
              padding: 4px; 
              text-align: left;
              vertical-align: top;
              word-break: break-word;
              overflow: hidden;
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: bold;
              font-size: 8px;
            }
            thead { 
              display: table-header-group; 
            }
            tr { 
              page-break-inside: avoid; 
            }
            td:nth-child(1),
            td:nth-child(2),
            td:nth-child(4),
            td:nth-child(9) {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
            td:nth-child(3),
            td:nth-child(5),
            td:nth-child(8),
            td:nth-child(10),
            td:nth-child(11) {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            td:nth-child(6),
            td:nth-child(7) {
              display: -webkit-box;
              -webkit-line-clamp: 6;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .severity-I { background-color: #dcfce7; }
            .severity-II { background-color: #fef3c7; }
            .severity-III { background-color: #fed7aa; }
            .severity-IV { background-color: #fecaca; }
          </style>
        </head>
        <body>
          <h1>PASE DE SALA NEUROLOGA?A - ${today}</h1>
          ${clonedTable ? clonedTable.outerHTML : printContent.outerHTML}
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
      <div className="max-w-6xl mx-auto w-full mb-6">
      <SectionHeader
        title={"Pase de Sala - Neurología"}
        subtitle={new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex space-x-3">
            <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 px-3 py-2 rounded btn-accent text-sm">
              <Plus className="h-4 w-4" />
              <span>Agregar Paciente</span>
            </button>
            <button onClick={exportToPDF} className="flex items-center space-x-2 btn-soft px-3 py-2 text-sm rounded">
              <Download className="h-4 w-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        }
      />
      </div>

      {/* Mensaje si no hay conexión con Supabase */}
      <div className="mb-4 p-4 medical-card card-warning rounded-lg">
        <p className="text-[var(--text-primary)]">
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
            <thead className="bg-[var(--bg-tertiary)]">
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
                <tr key={patient.id} className={`hover:bg-gray-50`}>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.cama}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.dni}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 font-medium">{patient.nombre}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">{patient.edad}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.antecedentes}>{patient.antecedentes}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.motivo_consulta}>{patient.motivo_consulta}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.examen_fisico}>{patient.examen_fisico}</td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.estudios}>{patient.estudios}</td>
                  <td className="px-3 py-4 text-sm text-center">
                    <span
                      className={`badge ${
                        patient.severidad === 'I' ? 'badge-severity-1' :
                        patient.severidad === 'II' ? 'badge-severity-2' :
                        patient.severidad === 'III' ? 'badge-severity-3' :
                        patient.severidad === 'IV' ? 'badge-severity-4' : ''
                      }`}
                    >
                      {patient.severidad || '-'}
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

