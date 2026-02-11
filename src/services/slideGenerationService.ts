import type { PresentationConfig, StructuredSections } from '../types/evolucionadorStructured';

const HEADER_COLOR = '1e40af';
const FOOTER_TEXT = 'HubJR';

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });

export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo descargar la imagen.');
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
}

const formatDateLabel = () =>
  new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

const buildSectionText = (sections: StructuredSections) => {
  return {
    antecedentes: [
      sections.antecedentes.patologias.length
        ? `Patologias: ${sections.antecedentes.patologias.join(', ')}`
        : '',
      sections.antecedentes.texto.trim(),
      sections.antecedentes.medicacionHabitual.trim()
        ? `Medicacion habitual: ${sections.antecedentes.medicacionHabitual.trim()}`
        : '',
      sections.antecedentes.alergias.trim()
        ? `Alergias: ${sections.antecedentes.alergias.trim()}`
        : ''
    ].filter(Boolean).join('\n'),
    motivo: [
      sections.motivoConsulta.texto.trim(),
      sections.motivoConsulta.enfermedadActual.trim()
        ? `Enfermedad actual: ${sections.motivoConsulta.enfermedadActual.trim()}`
        : ''
    ].filter(Boolean).join('\n'),
    examen: [
      sections.examenFisico.texto.trim(),
      sections.examenFisico.examenNeurologico.trim()
        ? `Examen neurologico: ${sections.examenFisico.examenNeurologico.trim()}`
        : ''
    ].filter(Boolean).join('\n'),
    estudios: [
      sections.estudiosComplementarios.texto.trim(),
      sections.estudiosComplementarios.laboratorio.trim()
        ? `Laboratorio: ${sections.estudiosComplementarios.laboratorio.trim()}`
        : '',
      sections.estudiosComplementarios.imagenes.trim()
        ? `Imagenes: ${sections.estudiosComplementarios.imagenes.trim()}`
        : '',
      sections.estudiosComplementarios.otros.trim()
        ? `Otros: ${sections.estudiosComplementarios.otros.trim()}`
        : ''
    ].filter(Boolean).join('\n')
  };
};

const addHeader = (slide: any, title: string) => {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.7,
    fill: { color: HEADER_COLOR }
  });
  slide.addText(title, {
    x: 0.4,
    y: 0.1,
    w: 12.5,
    h: 0.4,
    color: 'FFFFFF',
    fontSize: 24,
    fontFace: 'Calibri',
    bold: true
  });
};

const addFooter = (slide: any) => {
  slide.addText(FOOTER_TEXT, {
    x: 0.4,
    y: 7.1,
    w: 12.5,
    h: 0.3,
    color: '666666',
    fontSize: 10,
    fontFace: 'Calibri'
  });
};

export async function generatePresentation(config: PresentationConfig): Promise<Blob> {
  const pptxModule = await import('pptxgenjs');
  const PptxGenJS = pptxModule.default || pptxModule;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HubJR';
  pptx.company = 'HubJR';
  pptx.subject = 'Evolucionador';
  pptx.theme = { headFontFace: 'Calibri', bodyFontFace: 'Calibri' };

  const dateLabel = config.dateLabel || formatDateLabel();
  const sectionsText = buildSectionText(config.sections);

  // Slide 1 - Titulo
  {
    const slide = pptx.addSlide();
    addHeader(slide, 'Evolucionador');
    slide.addText(config.patientName || 'Paciente', {
      x: 0.6,
      y: 1.5,
      w: 12,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Calibri',
      bold: true,
      color: '111827'
    });
    const details = [
      config.patientDni ? `DNI: ${config.patientDni}` : '',
      config.patientAge ? `Edad: ${config.patientAge}` : '',
      config.hospitalName ? `Hospital: ${config.hospitalName}` : '',
      `Fecha: ${dateLabel}`
    ].filter(Boolean).join('   ');

    slide.addText(details, {
      x: 0.6,
      y: 2.3,
      w: 12,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Calibri',
      color: '374151'
    });
    addFooter(slide);
  }

  const addTextSlide = (title: string, body: string) => {
    const slide = pptx.addSlide();
    addHeader(slide, title);
    slide.addText(body || 'Sin datos', {
      x: 0.6,
      y: 1.1,
      w: 12.2,
      h: 5.8,
      fontSize: 14,
      fontFace: 'Calibri',
      color: '111827',
      valign: 'top'
    });
    addFooter(slide);
  };

  addTextSlide('Antecedentes', sectionsText.antecedentes);
  addTextSlide('Motivo de consulta', sectionsText.motivo);
  addTextSlide('Examen fisico', sectionsText.examen);
  addTextSlide('Estudios complementarios', sectionsText.estudios);

  const mediaItems = config.sections.media.items || [];
  const imageItems = mediaItems.filter(item => item.type === 'image' && (item.signedUrl || item.publicUrl));
  const videoItems = mediaItems.filter(item => item.type === 'video');

  if (imageItems.length > 0) {
    const perSlide = 4;
    for (let i = 0; i < imageItems.length; i += perSlide) {
      const slide = pptx.addSlide();
      addHeader(slide, 'Media');

      const chunk = imageItems.slice(i, i + perSlide);
      const positions = [
        { x: 0.6, y: 1.1 },
        { x: 6.9, y: 1.1 },
        { x: 0.6, y: 4.0 },
        { x: 6.9, y: 4.0 }
      ];

      for (let j = 0; j < chunk.length; j += 1) {
        const item = chunk[j];
        const position = positions[j];
        const url = item.signedUrl || item.publicUrl || '';
        try {
          const dataUrl = await fetchImageAsBase64(url);
          slide.addImage({ data: dataUrl, x: position.x, y: position.y, w: 5.8, h: 2.6 });
        } catch (error) {
          slide.addText('Imagen no disponible', {
            x: position.x,
            y: position.y + 1,
            w: 5.8,
            h: 0.4,
            fontSize: 10,
            fontFace: 'Calibri',
            color: '9CA3AF'
          });
        }

        slide.addText(`${item.category}${item.description ? `: ${item.description}` : ''}`, {
          x: position.x,
          y: position.y + 2.65,
          w: 5.8,
          h: 0.4,
          fontSize: 10,
          fontFace: 'Calibri',
          color: '374151'
        });
      }

      addFooter(slide);
    }
  }

  if (videoItems.length > 0) {
    const slide = pptx.addSlide();
    addHeader(slide, 'Media - Videos');
    const lines = videoItems.map(item => `- ${item.fileName}${item.description ? ` (${item.description})` : ''}`);
    slide.addText(lines.join('\n'), {
      x: 0.6,
      y: 1.2,
      w: 12.2,
      h: 5.5,
      fontSize: 14,
      fontFace: 'Calibri',
      color: '111827'
    });
    addFooter(slide);
  }

  if (config.scaleResults && config.scaleResults.length > 0) {
    const slide = pptx.addSlide();
    addHeader(slide, 'Escalas');
    const lines = config.scaleResults.map(scale => `- ${scale.name}: ${scale.score}${scale.details ? ` (${scale.details})` : ''}`);
    slide.addText(lines.join('\n'), {
      x: 0.6,
      y: 1.2,
      w: 12.2,
      h: 5.5,
      fontSize: 14,
      fontFace: 'Calibri',
      color: '111827'
    });
    addFooter(slide);
  }

  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}

export async function downloadPresentation(
  sections: StructuredSections,
  scaleResults: Array<{ name: string; score: string; details?: string }>,
  patientName: string,
  hospitalName?: string
): Promise<void> {
  const config: PresentationConfig = {
    patientName,
    patientDni: sections.datosPaciente.dni,
    patientAge: sections.datosPaciente.edad,
    hospitalName,
    sections,
    scaleResults
  };

  const blob = await generatePresentation(config);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = patientName ? `Evolucion_${patientName.replace(/\s+/g, '_')}.pptx` : `Evolucion_${Date.now()}.pptx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
