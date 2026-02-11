export type SexoPaciente = 'Masculino' | 'Femenino' | 'Otro' | 'No especificado';

export type MediaCategory = 'Estudio' | 'Examen fisico' | 'Procedimiento' | 'Otro';

export type MediaType = 'image' | 'video';

export interface DatosPacienteSection {
  nombre: string;
  dni: string;
  edad: string;
  cama: string;
  sexo: SexoPaciente;
  obraSocial: string;
}

export interface AntecedentesSection {
  texto: string;
  patologias: string[];
  medicacionHabitual: string;
  alergias: string;
}

export interface MotivoConsultaSection {
  texto: string;
  enfermedadActual: string;
}

export interface ExamenFisicoSection {
  texto: string;
  examenNeurologico: string;
}

export interface EstudiosComplementariosSection {
  texto: string;
  laboratorio: string;
  imagenes: string;
  otros: string;
}

export interface MediaItem {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: MediaCategory;
  type: MediaType;
  description?: string;
  createdAt: string;
  publicUrl?: string;
  signedUrl?: string;
}

export interface MediaSection {
  items: MediaItem[];
}

export interface StructuredSections {
  datosPaciente: DatosPacienteSection;
  antecedentes: AntecedentesSection;
  motivoConsulta: MotivoConsultaSection;
  examenFisico: ExamenFisicoSection;
  estudiosComplementarios: EstudiosComplementariosSection;
  interpretacion: string;
  sugerencias: string;
  media: MediaSection;
}

export interface SlideConfig {
  title: string;
  body: string;
}

export interface PresentationConfig {
  patientName: string;
  patientDni?: string;
  patientAge?: string;
  hospitalName?: string;
  dateLabel?: string;
  sections: StructuredSections;
  scaleResults?: Array<{ name: string; score: string; details?: string }>;
}

export const createEmptyStructuredSections = (): StructuredSections => ({
  datosPaciente: {
    nombre: '',
    dni: '',
    edad: '',
    cama: '',
    sexo: 'No especificado',
    obraSocial: ''
  },
  antecedentes: {
    texto: '',
    patologias: [],
    medicacionHabitual: '',
    alergias: ''
  },
  motivoConsulta: {
    texto: '',
    enfermedadActual: ''
  },
  examenFisico: {
    texto: '',
    examenNeurologico: ''
  },
  estudiosComplementarios: {
    texto: '',
    laboratorio: '',
    imagenes: '',
    otros: ''
  },
  interpretacion: '',
  sugerencias: '',
  media: {
    items: []
  }
});
