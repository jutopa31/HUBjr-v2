import React, { useCallback } from 'react';
import { ClipboardList, HeartPulse, Stethoscope, FileSearch, User2, Image } from 'lucide-react';
import type { StructuredSections } from '../../types/evolucionadorStructured';
import SectionAccordion from './sections/SectionAccordion';
import DatosPacienteSection from './sections/DatosPacienteSection';
import AntecedentesSection from './sections/AntecedentesSection';
import MotivoConsultaSection from './sections/MotivoConsultaSection';
import ExamenFisicoSection from './sections/ExamenFisicoSection';
import EstudiosSection from './sections/EstudiosSection';
import OptionalSections from './sections/OptionalSections';
import MediaSection from './sections/MediaSection';

interface StructuredEvolucionadorProps {
  sections: StructuredSections;
  onChange: (sections: StructuredSections) => void;
  userId: string | null;
}

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

const StructuredEvolucionador: React.FC<StructuredEvolucionadorProps> = ({ sections, onChange, userId }) => {
  const updateSection = useCallback(
    (partial: Partial<StructuredSections>) => {
      onChange({ ...sections, ...partial });
    },
    [onChange, sections]
  );

  const isDatosComplete = [
    sections.datosPaciente.nombre,
    sections.datosPaciente.dni,
    sections.datosPaciente.edad,
    sections.datosPaciente.cama
  ].some(hasText);

  const isAntecedentesComplete = hasText(sections.antecedentes.texto) || sections.antecedentes.patologias.length > 0;
  const isMotivoComplete = hasText(sections.motivoConsulta.texto) || hasText(sections.motivoConsulta.enfermedadActual);
  const isExamenComplete = hasText(sections.examenFisico.texto) || hasText(sections.examenFisico.examenNeurologico);
  const isEstudiosComplete = [
    sections.estudiosComplementarios.texto,
    sections.estudiosComplementarios.laboratorio,
    sections.estudiosComplementarios.imagenes,
    sections.estudiosComplementarios.otros
  ].some(hasText);

  return (
    <div className="space-y-4">
      <SectionAccordion
        title="Datos del paciente"
        icon={<User2 className="h-4 w-4" />}
        isRequired
        isComplete={isDatosComplete}
      >
        <DatosPacienteSection
          value={sections.datosPaciente}
          onChange={(value) => updateSection({ datosPaciente: value })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Antecedentes"
        icon={<ClipboardList className="h-4 w-4" />}
        isRequired
        isComplete={isAntecedentesComplete}
      >
        <AntecedentesSection
          value={sections.antecedentes}
          onChange={(value) => updateSection({ antecedentes: value })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Motivo de consulta"
        icon={<HeartPulse className="h-4 w-4" />}
        isRequired
        isComplete={isMotivoComplete}
      >
        <MotivoConsultaSection
          value={sections.motivoConsulta}
          onChange={(value) => updateSection({ motivoConsulta: value })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Examen fisico"
        icon={<Stethoscope className="h-4 w-4" />}
        isRequired
        isComplete={isExamenComplete}
      >
        <ExamenFisicoSection
          value={sections.examenFisico}
          onChange={(value) => updateSection({ examenFisico: value })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Estudios complementarios"
        icon={<FileSearch className="h-4 w-4" />}
        isRequired
        isComplete={isEstudiosComplete}
      >
        <EstudiosSection
          value={sections.estudiosComplementarios}
          onChange={(value) => updateSection({ estudiosComplementarios: value })}
        />
      </SectionAccordion>

      <SectionAccordion
        title="Secciones opcionales"
        icon={<ClipboardList className="h-4 w-4" />}
        isComplete={hasText(sections.interpretacion) || hasText(sections.sugerencias)}
        defaultOpen={false}
      >
        <OptionalSections
          interpretacion={sections.interpretacion}
          sugerencias={sections.sugerencias}
          onChange={(value) => updateSection(value)}
        />
      </SectionAccordion>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              <Image className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Media</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{sections.media.items.length} archivos</p>
            </div>
          </div>
        </div>
        <MediaSection
          items={sections.media.items}
          onChange={(items) => updateSection({ media: { items } })}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default StructuredEvolucionador;
