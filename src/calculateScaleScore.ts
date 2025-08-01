// Utilidad para calcular el puntaje de una escala
import { Scale, ScaleResult, ScaleItem } from './types';

export default function calculateScaleScore(scale: Scale, scores: { [key: string]: number | string }): ScaleResult {
  let totalScore = 0;
  let details = '';

  scale.items.forEach((item: ScaleItem, index: number) => {
    const score = scores[item.id] !== undefined ? scores[item.id] : item.score || 0;
    let scoreValue = score;
    if (score === 'UN') {
      scoreValue = 0;
    } else if (typeof score === 'string' && score !== 'UN') {
      scoreValue = parseInt(score) || 0;
    }
    totalScore += typeof scoreValue === 'number' ? scoreValue : 0;
    const itemNumber = index + 1;
    const displayScore = score === 'UN' ? 'UN' : scoreValue;
    const itemTitle = item.label.replace(/^[0-9]+[ab]?\.\s*/, '');
    details += `${itemNumber}) ${itemTitle}: ${displayScore}\n`;
  });

  let interpretation = '';
  if (scale.id === 'nihss') {
    if (totalScore === 0) interpretation = 'Sin síntomas de ictus.';
    else if (totalScore >= 1 && totalScore <= 4) interpretation = 'Ictus leve.';
    else if (totalScore >= 5 && totalScore <= 15) interpretation = 'Ictus moderado.';
    else if (totalScore >= 16 && totalScore <= 20) interpretation = 'Ictus moderado a grave.';
    else interpretation = 'Ictus grave.';
  } else if (scale.id === 'glasgow') {
    if (totalScore >= 14) interpretation = 'Traumatismo craneal leve';
    else if (totalScore >= 9) interpretation = 'Traumatismo craneal moderado';
    else interpretation = 'Traumatismo craneal severo';
  } else if (scale.id === 'updrs1') {
    if (totalScore === 0) interpretation = 'Sin alteraciones no motoras';
    else if (totalScore <= 4) interpretation = 'Alteraciones no motoras leves';
    else if (totalScore <= 8) interpretation = 'Alteraciones no motoras moderadas';
    else interpretation = 'Alteraciones no motoras severas';
  } else if (scale.id === 'updrs2') {
    if (totalScore === 0) interpretation = 'Sin limitaciones en actividades de la vida diaria';
    else if (totalScore <= 13) interpretation = 'Limitaciones leves en AVD';
    else if (totalScore <= 26) interpretation = 'Limitaciones moderadas en AVD';
    else if (totalScore <= 39) interpretation = 'Limitaciones severas en AVD';
    else interpretation = 'Limitaciones muy severas en AVD';
  } else if (scale.id === 'updrs3') {
    if (totalScore === 0) interpretation = 'Sin signos motores';
    else if (totalScore <= 16) interpretation = 'Signos motores leves';
    else if (totalScore <= 32) interpretation = 'Signos motores moderados';
    else if (totalScore <= 48) interpretation = 'Signos motores severos';
    else interpretation = 'Signos motores muy severos';
  } else if (scale.id === 'updrs4') {
    if (totalScore === 0) interpretation = 'Sin complicaciones del tratamiento';
    else if (totalScore <= 6) interpretation = 'Complicaciones leves del tratamiento';
    else if (totalScore <= 12) interpretation = 'Complicaciones moderadas del tratamiento';
    else interpretation = 'Complicaciones severas del tratamiento';
  } else if (scale.id === 'parkinson_diagnosis') {
    // Evaluar criterios diagnósticos de Parkinson según MDS 2015
    const bradykinesia = scores['bradykinesia'] === 1 || scores['bradykinesia'] === '1';
    const tremor = scores['rest_tremor_4_6hz'] === 1 || scores['rest_tremor_4_6hz'] === '1';
    const rigidity = scores['muscular_rigidity'] === 1 || scores['muscular_rigidity'] === '1';
    const parkinsonSyndrome = bradykinesia && (tremor || rigidity);

    // Criterios de exclusión
    const exclusionCriteria = [
      'cerebellar_signs', 'supranuclear_palsy', 'legs_only_parkinsonism',
      'severe_dysautonomia', 'no_levodopa_response', 'prominent_dystonia', 'normal_spect_dat'
    ];
    const hasExclusions = exclusionCriteria.some(criteria => 
      scores[criteria] === 1 || scores[criteria] === '1'
    );

    // Criterios de apoyo
    const supportCriteria = [
      'asymmetric_onset', 'rest_tremor_present', 'marked_levodopa_response',
      'levodopa_dyskinesias', 'progressive_course', 'documented_hyposmia', 'mibg_alteration'
    ];
    const supportCount = supportCriteria.filter(criteria => 
      scores[criteria] === 1 || scores[criteria] === '1'
    ).length;

    // Banderas rojas
    const redFlagCriteria = [
      'rapid_progression', 'early_severe_dysautonomia', 'recurrent_falls',
      'prominent_axial_rigidity', 'cerebellar_ataxia', 'lack_progression', 'severe_cognitive_decline'
    ];
    const redFlagCount = redFlagCriteria.filter(criteria => 
      scores[criteria] === 1 || scores[criteria] === '1'
    ).length;

    // Determinar diagnóstico según algoritmo MDS 2015
    if (!parkinsonSyndrome) {
      interpretation = 'Descartar EP - No cumple síndrome parkinsoniano';
    } else if (hasExclusions) {
      interpretation = 'Descartar EP - Criterios de exclusión presentes';
    } else if (supportCount >= 2 && redFlagCount === 0) {
      interpretation = 'EP clínicamente establecida';
    } else if (redFlagCount <= 2 && supportCount > redFlagCount) {
      interpretation = 'EP clínicamente probable';
    } else {
      interpretation = 'Descartar EP - No cumple criterios suficientes';
    }

    // Añadir detalles al texto
    details += `\nSíndrome Parkinsoniano: ${parkinsonSyndrome ? 'Sí' : 'No'}`;
    details += `\nCriterios de exclusión: ${hasExclusions ? 'Sí' : 'No'}`;
    details += `\nCriterios de apoyo: ${supportCount}/7`;
    details += `\nBanderas rojas: ${redFlagCount}/7`;
  } else if (scale.id === 'ashworth') {
    // Para la escala de Ashworth, no hay puntaje total, solo evaluación cualitativa
    interpretation = 'Evaluación del tono muscular';
    
    // Reemplazar el formato de detalles para Ashworth
    details = 'ESCALA DE ASHWORTH MODIFICADA:\n\n';
    
    // Organizar por miembros
    const upperLimbItems = ['flexores_codo', 'extensores_codo', 'pronadores', 'flexores_muneca'];
    const lowerLimbItems = ['flexores_cadera', 'aductores_cadera', 'extensores_rodilla', 'flexores_rodilla', 'flexores_plantares'];
    
    let hasUpperLimbData = false;
    let hasLowerLimbData = false;
    
    // Verificar y procesar miembro superior
    const upperLimbResults: string[] = [];
    upperLimbItems.forEach((itemId) => {
      const item = scale.items.find(i => i.id === itemId);
      if (item && scores[item.id] !== undefined && scores[item.id] !== 0) {
        hasUpperLimbData = true;
        const scoreValue = scores[item.id];
        let displayScore = '';
        
        if (typeof scoreValue === 'string' && scoreValue.includes('+')) {
          displayScore = scoreValue;
        } else {
          displayScore = scoreValue.toString();
        }
        
        upperLimbResults.push(`${item.label}: ${displayScore}`);
      }
    });
    
    // Verificar y procesar miembro inferior
    const lowerLimbResults: string[] = [];
    lowerLimbItems.forEach((itemId) => {
      const item = scale.items.find(i => i.id === itemId);
      if (item && scores[item.id] !== undefined && scores[item.id] !== 0) {
        hasLowerLimbData = true;
        const scoreValue = scores[item.id];
        let displayScore = '';
        
        if (typeof scoreValue === 'string' && scoreValue.includes('+')) {
          displayScore = scoreValue;
        } else {
          displayScore = scoreValue.toString();
        }
        
        lowerLimbResults.push(`${item.label}: ${displayScore}`);
      }
    });
    
    // Construir el reporte
    if (hasUpperLimbData) {
      details += 'MIEMBRO SUPERIOR:\n';
      upperLimbResults.forEach(result => details += `- ${result}\n`);
      details += '\n';
    }
    
    if (hasLowerLimbData) {
      details += 'MIEMBRO INFERIOR:\n';
      lowerLimbResults.forEach(result => details += `- ${result}\n`);
      details += '\n';
    }
    
    details += 'INTERPRETACIÓN:\n';
    details += '0 = Sin aumento del tono\n';
    details += '1 = Ligero aumento al final del movimiento\n';
    details += '1+ = Ligero aumento en menos de la mitad del arco\n';
    details += '2 = Aumento pronunciado en la mayor parte del arco\n';
    details += '3 = Considerable aumento, movimiento pasivo difícil\n';
    details += '4 = Parte afectada rígida';
    
    // No usar puntaje total para Ashworth
    totalScore = 0;
  } else if (scale.id === 'mcdonald_2024') {
    // Criterios de McDonald 2024 para Esclerosis Múltiple
    const attacks = parseInt(scores['clinical_attacks']?.toString() || '1');
    const lesions = parseInt(scores['objective_lesions']?.toString() || '1');
    
    // Evaluar Diseminación en Espacio (DIS) - necesita ≥2 de 4 áreas
    const disAreas = [
      scores['dis_periventricular'] === 1,
      scores['dis_cortical'] === 1,
      scores['dis_infratentorial'] === 1,
      scores['dis_spinal'] === 1
    ].filter(Boolean).length;
    const disPresent = disAreas >= 2;
    
    // Evaluar Diseminación en Tiempo (DIT)
    const ditPresent = scores['dit_gadolinium'] === 1 || 
                      scores['dit_new_lesions'] === 1 || 
                      (scores['csf_oligoclonal'] === 1 && !scores['dit_gadolinium']);
    
    const alternativeDxRuledOut = scores['alternative_diagnosis'] === 1;
    
    // Aplicar algoritmo diagnóstico McDonald 2024
    let mcdonaldResult = '';
    // let canDiagnose = false;
    
    if (!alternativeDxRuledOut) {
      mcdonaldResult = 'CRITERIOS NO CUMPLIDOS - Debe descartarse diagnóstico alternativo';
    } else if (attacks >= 2 && lesions >= 2) {
      mcdonaldResult = 'ESCLEROSIS MÚLTIPLE - ≥2 ataques con ≥2 lesiones objetivas';
      // canDiagnose = true;
    } else if (attacks >= 2 && lesions === 1) {
      if (disPresent) {
        mcdonaldResult = 'ESCLEROSIS MÚLTIPLE - ≥2 ataques con 1 lesión + DIS demostrada';
        // canDiagnose = true;
      } else {
        mcdonaldResult = 'CRITERIOS INSUFICIENTES - Requiere DIS o esperar nuevo ataque';
      }
    } else if (attacks === 1 && lesions >= 2) {
      if (ditPresent) {
        mcdonaldResult = 'ESCLEROSIS MÚLTIPLE - 1 ataque con ≥2 lesiones + DIT demostrada';
        // canDiagnose = true;
      } else {
        mcdonaldResult = 'CRITERIOS INSUFICIENTES - Requiere DIT o esperar nuevo ataque';
      }
    } else if (attacks === 1 && lesions === 1) {
      if (disPresent && ditPresent) {
        mcdonaldResult = 'ESCLEROSIS MÚLTIPLE - 1 ataque con 1 lesión + DIS + DIT demostradas';
        // canDiagnose = true;
      } else {
        const missing = [];
        if (!disPresent) missing.push('DIS');
        if (!ditPresent) missing.push('DIT');
        mcdonaldResult = `CRITERIOS INSUFICIENTES - Requiere ${missing.join(' y ')}, o esperar nuevo ataque`;
      }
    }
    
    interpretation = mcdonaldResult;
    
    // Reemplazar formato de detalles para McDonald
    details = 'CRITERIOS DE McDONALD 2024 - ESCLEROSIS MÚLTIPLE:\n\n';
    details += `Ataques clínicos: ${attacks}\n`;
    details += `Lesiones objetivas: ${lesions}\n\n`;
    
    details += 'DISEMINACIÓN EN ESPACIO (DIS):\n';
    details += `- Lesiones periventriculares: ${scores['dis_periventricular'] ? 'Sí' : 'No'}\n`;
    details += `- Lesiones corticales/yuxtacorticales: ${scores['dis_cortical'] ? 'Sí' : 'No'}\n`;
    details += `- Lesiones infratentoriales: ${scores['dis_infratentorial'] ? 'Sí' : 'No'}\n`;
    details += `- Lesiones medulares: ${scores['dis_spinal'] ? 'Sí' : 'No'}\n`;
    details += `- Áreas afectadas: ${disAreas}/4 (requiere ≥2)\n`;
    details += `- DIS cumplida: ${disPresent ? 'SÍ' : 'NO'}\n\n`;
    
    details += 'DISEMINACIÓN EN TIEMPO (DIT):\n';
    details += `- Lesiones Gd+ y Gd- simultáneas: ${scores['dit_gadolinium'] ? 'Sí' : 'No'}\n`;
    details += `- Nuevas lesiones en seguimiento: ${scores['dit_new_lesions'] ? 'Sí' : 'No'}\n`;
    details += `- Bandas oligoclonales en LCR: ${scores['csf_oligoclonal'] ? 'Sí' : 'No'}\n`;
    details += `- DIT cumplida: ${ditPresent ? 'SÍ' : 'NO'}\n\n`;
    
    details += `Diagnóstico alternativo descartado: ${alternativeDxRuledOut ? 'SÍ' : 'NO'}\n\n`;
    details += `RESULTADO: ${mcdonaldResult}`;
    
    // No usar puntaje total para McDonald
    totalScore = 0;
  } else if (scale.id === 'mrs') {
    // Escala de Rankin Modificada (mRS)
    const mrsScore = parseInt(scores['mrs_score']?.toString() || '0');
    totalScore = mrsScore;
    
    // Interpretación basada en el puntaje mRS
    if (mrsScore === 0) {
      interpretation = 'Sin síntomas';
    } else if (mrsScore === 1) {
      interpretation = 'Sin discapacidad significativa - Independiente para AVD';
    } else if (mrsScore === 2) {
      interpretation = 'Discapacidad leve - Independiente pero con limitaciones';
    } else if (mrsScore === 3) {
      interpretation = 'Discapacidad moderada - Requiere ayuda pero camina independiente';
    } else if (mrsScore === 4) {
      interpretation = 'Discapacidad moderadamente severa - Requiere asistencia para caminar y AVD';
    } else if (mrsScore === 5) {
      interpretation = 'Discapacidad severa - Confinado a cama, requiere cuidado constante';
    } else if (mrsScore === 6) {
      interpretation = 'Muerte';
    }
    
    // Añadir contexto clínico
    details = `ESCALA DE RANKIN MODIFICADA (mRS):\n\n`;
    details += `Puntaje: ${mrsScore}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `SIGNIFICADO CLÍNICO:\n`;
    if (mrsScore <= 2) {
      details += `- Resultado funcional favorable\n`;
      details += `- Independencia para actividades básicas\n`;
    } else if (mrsScore <= 3) {
      details += `- Resultado funcional moderado\n`;
      details += `- Requiere supervisión o ayuda mínima\n`;
    } else if (mrsScore <= 5) {
      details += `- Resultado funcional desfavorable\n`;
      details += `- Dependencia significativa para AVD\n`;
    } else {
      details += `- Desenlace fatal\n`;
    }
  } else if (scale.id === 'aspects') {
    // ASPECTS (Alberta Stroke Program Early CT Score)
    // Suma todos los puntajes de las regiones (inicio con 10, se resta 1 por cada región alterada)
    const regionScores = [
      'aspects_c', 'aspects_l', 'aspects_ic', 'aspects_i',
      'aspects_m1', 'aspects_m2', 'aspects_m3', 'aspects_m4', 'aspects_m5', 'aspects_m6'
    ];
    
    totalScore = regionScores.reduce((sum, regionId) => {
      const score = parseInt(scores[regionId]?.toString() || '1');
      return sum + score;
    }, 0);
    
    // Interpretación basada en el puntaje ASPECTS
    if (totalScore >= 8) {
      interpretation = 'Cambios isquémicos mínimos - Candidato favorable para terapia de reperfusión';
    } else if (totalScore >= 6) {
      interpretation = 'Cambios isquémicos moderados - Evaluar individualmente para terapia';
    } else if (totalScore >= 4) {
      interpretation = 'Cambios isquémicos extensos - Riesgo aumentado de hemorragia sintomática';
    } else {
      interpretation = 'Cambios isquémicos muy extensos - Alto riesgo, contraindicación relativa';
    }
    
    // Crear reporte detallado
    details = `ASPECTS (Alberta Stroke Program Early CT Score):\n\n`;
    details += `Puntaje total: ${totalScore}/10\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    
    details += `EVALUACIÓN POR REGIONES:\n`;
    details += `Ganglios basales y cápsula interna:\n`;
    details += `- Núcleo caudado (C): ${parseInt(scores['aspects_c']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- Núcleo lenticular (L): ${parseInt(scores['aspects_l']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- Cápsula interna (IC): ${parseInt(scores['aspects_ic']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- Ínsula (I): ${parseInt(scores['aspects_i']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n\n`;
    
    details += `Corteza cerebral media (ACM):\n`;
    details += `- M1 (anterior): ${parseInt(scores['aspects_m1']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- M2 (lateral): ${parseInt(scores['aspects_m2']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- M3 (posterior): ${parseInt(scores['aspects_m3']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- M4 (anterior superior): ${parseInt(scores['aspects_m4']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- M5 (lateral superior): ${parseInt(scores['aspects_m5']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n`;
    details += `- M6 (posterior superior): ${parseInt(scores['aspects_m6']?.toString() || '1') === 1 ? 'Normal' : 'Alterado'}\n\n`;
    
    details += `SIGNIFICADO CLÍNICO:\n`;
    if (totalScore >= 8) {
      details += `- Área de infarto pequeña (<1/3 de territorio ACM)\n`;
      details += `- Bajo riesgo de transformación hemorrágica\n`;
      details += `- Candidato ideal para trombolisis/trombectomía\n`;
    } else if (totalScore >= 6) {
      details += `- Área de infarto moderada\n`;
      details += `- Riesgo intermedio de complicaciones\n`;
      details += `- Evaluar caso por caso para reperfusión\n`;
    } else {
      details += `- Área de infarto extensa (>1/3 de territorio ACM)\n`;
      details += `- Alto riesgo de transformación hemorrágica\n`;
      details += `- Precaución con terapias de reperfusión\n`;
    }
  } else if (scale.id === 'cha2ds2vasc') {
    // CHA2DS2-VASc Score
    const riskFactors = [
      { id: 'chf_heart_failure', points: 1, name: 'Insuficiencia cardíaca' },
      { id: 'hypertension', points: 1, name: 'Hipertensión' },
      { id: 'age_75_or_more', points: 2, name: 'Edad ≥75 años' },
      { id: 'diabetes', points: 1, name: 'Diabetes' },
      { id: 'stroke_tia_thromboembolism', points: 2, name: 'ACV/AIT previo' },
      { id: 'vascular_disease', points: 1, name: 'Enfermedad vascular' },
      { id: 'age_65_74', points: 1, name: 'Edad 65-74 años' },
      { id: 'sex_female', points: 1, name: 'Sexo femenino' }
    ];
    
    totalScore = 0;
    let activatedFactors: string[] = [];
    
    riskFactors.forEach(factor => {
      const score = parseInt(scores[factor.id]?.toString() || '0');
      if (score > 0) {
        totalScore += factor.points;
        activatedFactors.push(factor.name);
      }
    });
    
    // Interpretación del riesgo
    if (totalScore === 0) {
      interpretation = 'Riesgo muy bajo - No se recomienda anticoagulación';
    } else if (totalScore === 1) {
      interpretation = 'Riesgo bajo - Considerar anticoagulación (evaluar individualmente)';
    } else if (totalScore === 2) {
      interpretation = 'Riesgo moderado - Se recomienda anticoagulación';
    } else {
      interpretation = 'Riesgo alto - Anticoagulación fuertemente recomendada';
    }
    
    details = `CHA2DS2-VASc SCORE:\n\n`;
    details += `Puntaje total: ${totalScore}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `FACTORES DE RIESGO PRESENTES:\n`;
    if (activatedFactors.length > 0) {
      activatedFactors.forEach(factor => details += `• ${factor}\n`);
    } else {
      details += `• Ningún factor de riesgo presente\n`;
    }
    details += `\nRIESGO ANUAL DE ACV:\n`;
    if (totalScore === 0) details += `• 0%\n`;
    else if (totalScore === 1) details += `• 1.3%\n`;
    else if (totalScore === 2) details += `• 2.2%\n`;
    else if (totalScore === 3) details += `• 3.2%\n`;
    else if (totalScore === 4) details += `• 4.0%\n`;
    else if (totalScore === 5) details += `• 6.7%\n`;
    else if (totalScore === 6) details += `• 9.8%\n`;
    else if (totalScore === 7) details += `• 9.6%\n`;
    else if (totalScore === 8) details += `• 6.7%\n`;
    else details += `• 15.2%\n`;
  } else if (scale.id === 'hasbled') {
    // HAS-BLED Score
    const bleedingFactors = [
      { id: 'hypertension_uncontrolled', name: 'Hipertensión no controlada' },
      { id: 'abnormal_renal_liver', name: 'Función renal/hepática anormal' },
      { id: 'stroke_history', name: 'Historia de ACV' },
      { id: 'bleeding_history', name: 'Historia de sangrado' },
      { id: 'labile_inr', name: 'INR lábil' },
      { id: 'elderly_age', name: 'Edad >65 años' },
      { id: 'drugs_alcohol', name: 'Fármacos/Alcohol' }
    ];
    
    totalScore = 0;
    let activatedFactors: string[] = [];
    
    bleedingFactors.forEach(factor => {
      const score = parseInt(scores[factor.id]?.toString() || '0');
      if (score > 0) {
        totalScore += score;
        activatedFactors.push(factor.name);
      }
    });
    
    // Interpretación del riesgo de sangrado
    if (totalScore <= 2) {
      interpretation = 'Riesgo bajo de sangrado - Anticoagulación segura';
    } else if (totalScore === 3) {
      interpretation = 'Riesgo moderado de sangrado - Precaución con anticoagulación';
    } else {
      interpretation = 'Riesgo alto de sangrado - Evaluar cuidadosamente riesgo/beneficio';
    }
    
    details = `HAS-BLED SCORE:\n\n`;
    details += `Puntaje total: ${totalScore}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `FACTORES DE RIESGO DE SANGRADO:\n`;
    if (activatedFactors.length > 0) {
      activatedFactors.forEach(factor => details += `• ${factor}\n`);
    } else {
      details += `• Ningún factor de riesgo presente\n`;
    }
    details += `\nRIESGO ANUAL DE SANGRADO MAYOR:\n`;
    if (totalScore === 0) details += `• 1.13%\n`;
    else if (totalScore === 1) details += `• 1.02%\n`;
    else if (totalScore === 2) details += `• 1.88%\n`;
    else if (totalScore === 3) details += `• 3.74%\n`;
    else if (totalScore === 4) details += `• 8.70%\n`;
    else details += `• 12.50%\n`;
  } else if (scale.id === 'ich_score') {
    // ICH Score
    const glasgowScore = parseInt(scores['glasgow_coma_scale']?.toString() || '0');
    const volumeScore = parseInt(scores['ich_volume']?.toString() || '0');
    const ivhScore = parseInt(scores['intraventricular_hemorrhage']?.toString() || '0');
    const infratentorialScore = parseInt(scores['infratentorial_origin']?.toString() || '0');
    const ageScore = parseInt(scores['age_ich']?.toString() || '0');
    
    totalScore = glasgowScore + volumeScore + ivhScore + infratentorialScore + ageScore;
    
    // Interpretación pronóstica
    let mortalityAt30Days = '';
    let functionalOutcome = '';
    
    if (totalScore === 0) {
      mortalityAt30Days = '0%';
      functionalOutcome = 'Excelente (independencia funcional)';
      interpretation = 'Pronóstico excelente';
    } else if (totalScore === 1) {
      mortalityAt30Days = '13%';
      functionalOutcome = 'Bueno (independencia probable)';
      interpretation = 'Pronóstico bueno';
    } else if (totalScore === 2) {
      mortalityAt30Days = '26%';
      functionalOutcome = 'Moderado (dependencia moderada)';
      interpretation = 'Pronóstico moderado';
    } else if (totalScore === 3) {
      mortalityAt30Days = '72%';
      functionalOutcome = 'Pobre (dependencia severa)';
      interpretation = 'Pronóstico reservado';
    } else if (totalScore === 4) {
      mortalityAt30Days = '97%';
      functionalOutcome = 'Muy pobre (dependencia total o muerte)';
      interpretation = 'Pronóstico grave';
    } else {
      mortalityAt30Days = '100%';
      functionalOutcome = 'Muy pobre (muerte probable)';
      interpretation = 'Pronóstico muy grave';
    }
    
    details = `ICH SCORE (Hemorragia Intracerebral):\n\n`;
    details += `Puntaje total: ${totalScore}/6\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `COMPONENTES:\n`;
    details += `• Glasgow: ${glasgowScore === 0 ? '13-15' : glasgowScore === 1 ? '5-12' : '3-4'} (${glasgowScore} pts)\n`;
    details += `• Volumen HIC: ${volumeScore === 0 ? '<30 cm³' : '≥30 cm³'} (${volumeScore} pts)\n`;
    details += `• Sangrado intraventricular: ${ivhScore === 0 ? 'No' : 'Sí'} (${ivhScore} pts)\n`;
    details += `• Localización infratentorial: ${infratentorialScore === 0 ? 'No' : 'Sí'} (${infratentorialScore} pts)\n`;
    details += `• Edad: ${ageScore === 0 ? '<80 años' : '≥80 años'} (${ageScore} pts)\n\n`;
    details += `PRONÓSTICO:\n`;
    details += `• Mortalidad a 30 días: ${mortalityAt30Days}\n`;
    details += `• Resultado funcional esperado: ${functionalOutcome}\n`;
  } else if (scale.id === 'hunt_hess') {
    // Hunt and Hess Scale
    const grade = parseInt(scores['clinical_grade']?.toString() || '1');
    totalScore = grade;
    
    // Interpretación pronóstica
    let mortality = '';
    let clinicalStatus = '';
    
    if (grade === 1) {
      mortality = '0-5%';
      clinicalStatus = 'Excelente - Asintomático o síntomas mínimos';
      interpretation = 'Grado I - Pronóstico excelente';
    } else if (grade === 2) {
      mortality = '2-10%';
      clinicalStatus = 'Bueno - Cefalea moderada-severa, rigidez nucal';
      interpretation = 'Grado II - Pronóstico bueno';
    } else if (grade === 3) {
      mortality = '10-15%';
      clinicalStatus = 'Regular - Somnolencia, confusión, déficit focal leve';
      interpretation = 'Grado III - Pronóstico regular';
    } else if (grade === 4) {
      mortality = '60-70%';
      clinicalStatus = 'Malo - Estupor, hemiparesia moderada-severa';
      interpretation = 'Grado IV - Pronóstico reservado';
    } else {
      mortality = '70-100%';
      clinicalStatus = 'Muy malo - Coma, rigidez de descerebración';
      interpretation = 'Grado V - Pronóstico muy grave';
    }
    
    details = `ESCALA DE HUNT Y HESS:\n\n`;
    details += `Grado: ${grade}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `ESTADO CLÍNICO:\n`;
    details += `${clinicalStatus}\n\n`;
    details += `PRONÓSTICO:\n`;
    details += `• Mortalidad esperada: ${mortality}\n`;
    details += `• Indicación quirúrgica: ${grade <= 3 ? 'Favorable para cirugía' : 'Alto riesgo quirúrgico'}\n`;
    
    // No usar puntaje total numérico para Hunt-Hess
    totalScore = 0;
  } else if (scale.id === 'midas') {
    // MIDAS (Migraine Disability Assessment)
    const workMissed = parseInt(scores['work_missed']?.toString() || '0');
    const workHalfProd = parseInt(scores['work_half_productivity']?.toString() || '0');
    const householdMissed = parseInt(scores['household_missed']?.toString() || '0');
    const householdHalfProd = parseInt(scores['household_half_productivity']?.toString() || '0');
    const familySocialMissed = parseInt(scores['family_social_missed']?.toString() || '0');
    
    totalScore = workMissed + workHalfProd + householdMissed + householdHalfProd + familySocialMissed;
    
    // Interpretación basada en el puntaje MIDAS
    if (totalScore <= 5) {
      interpretation = 'Discapacidad mínima o infrecuente - Grado I';
    } else if (totalScore <= 10) {
      interpretation = 'Discapacidad leve - Grado II';
    } else if (totalScore <= 20) {
      interpretation = 'Discapacidad moderada - Grado III';
    } else {
      interpretation = 'Discapacidad severa - Grado IV';
    }
    
    details = `MIDAS (Migraine Disability Assessment):\n\n`;
    details += `Puntaje total: ${totalScore} días\n`;
    details += `Grado de discapacidad: ${interpretation}\n\n`;
    details += `DESGLOSE POR ÁREA:\n`;
    details += `• Días de trabajo/estudio perdidos: ${workMissed}\n`;
    details += `• Días de trabajo/estudio con productividad reducida: ${workHalfProd}\n`;
    details += `• Días de tareas domésticas perdidos: ${householdMissed}\n`;
    details += `• Días de tareas domésticas con productividad reducida: ${householdHalfProd}\n`;
    details += `• Días de actividades familiares/sociales perdidos: ${familySocialMissed}\n\n`;
    details += `RECOMENDACIONES TERAPÉUTICAS:\n`;
    if (totalScore <= 5) {
      details += `• Tratamiento sintomático según necesidad\n`;
      details += `• Medidas no farmacológicas (higiene del sueño, ejercicio)\n`;
      details += `• Seguimiento cada 3-6 meses\n`;
    } else if (totalScore <= 10) {
      details += `• Considerar tratamiento preventivo si >4 episodios/mes\n`;
      details += `• Optimizar tratamiento sintomático\n`;
      details += `• Educación sobre factores desencadenantes\n`;
    } else if (totalScore <= 20) {
      details += `• Tratamiento preventivo recomendado\n`;
      details += `• Evaluación de comorbilidades\n`;
      details += `• Consideración de tratamientos especializados\n`;
    } else {
      details += `• Tratamiento preventivo agresivo\n`;
      details += `• Evaluación en centro especializado\n`;
      details += `• Considerar tratamientos de tercera línea\n`;
      details += `• Evaluación de discapacidad laboral\n`;
    }
  } else if (scale.id === 'mmse') {
    // MMSE (Mini-Mental State Examination)
    const orientationTime = parseInt(scores['orientation_time']?.toString() || '0');
    const orientationPlace = parseInt(scores['orientation_place']?.toString() || '0');
    const registration = parseInt(scores['registration']?.toString() || '0');
    const attentionCalculation = parseInt(scores['attention_calculation']?.toString() || '0');
    const recall = parseInt(scores['recall']?.toString() || '0');
    const naming = parseInt(scores['naming']?.toString() || '0');
    const repetition = parseInt(scores['repetition']?.toString() || '0');
    const comprehension = parseInt(scores['comprehension']?.toString() || '0');
    const reading = parseInt(scores['reading']?.toString() || '0');
    const writing = parseInt(scores['writing']?.toString() || '0');
    const copying = parseInt(scores['copying']?.toString() || '0');
    
    totalScore = orientationTime + orientationPlace + registration + attentionCalculation + 
                 recall + naming + repetition + comprehension + reading + writing + copying;
    
    // Interpretación basada en el puntaje MMSE
    if (totalScore >= 27) {
      interpretation = 'Función cognitiva normal';
    } else if (totalScore >= 24) {
      interpretation = 'Posible deterioro cognitivo leve';
    } else if (totalScore >= 18) {
      interpretation = 'Deterioro cognitivo moderado';
    } else if (totalScore >= 10) {
      interpretation = 'Deterioro cognitivo moderadamente severo';
    } else {
      interpretation = 'Deterioro cognitivo severo';
    }
    
    details = `MMSE (Mini-Mental State Examination):\n\n`;
    details += `Puntaje total: ${totalScore}/30\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `DESGLOSE POR DOMINIO:\n`;
    details += `• Orientación temporal: ${orientationTime}/5\n`;
    details += `• Orientación espacial: ${orientationPlace}/5\n`;
    details += `• Registro: ${registration}/3\n`;
    details += `• Atención y cálculo: ${attentionCalculation}/5\n`;
    details += `• Recuerdo: ${recall}/3\n`;
    details += `• Denominación: ${naming}/2\n`;
    details += `• Repetición: ${repetition}/1\n`;
    details += `• Comprensión: ${comprehension}/3\n`;
    details += `• Lectura: ${reading}/1\n`;
    details += `• Escritura: ${writing}/1\n`;
    details += `• Copia: ${copying}/1\n\n`;
    details += `CONSIDERACIONES CLÍNICAS:\n`;
    if (totalScore >= 27) {
      details += `• No se evidencia deterioro cognitivo significativo\n`;
      details += `• Seguimiento rutinario según edad\n`;
    } else if (totalScore >= 24) {
      details += `• Requiere evaluación neuropsicológica completa\n`;
      details += `• Considerar factores confundidores (depresión, medicamentos)\n`;
      details += `• Seguimiento cada 6-12 meses\n`;
    } else if (totalScore >= 18) {
      details += `• Evaluación etiológica del deterioro cognitivo\n`;
      details += `• Neuroimágenes y estudios complementarios\n`;
      details += `• Consideración de tratamiento específico\n`;
    } else {
      details += `• Evaluación integral de demencia\n`;
      details += `• Valoración de capacidad de decisión\n`;
      details += `• Planificación de cuidados a largo plazo\n`;
    }
  } else if (scale.id === 'hoehn_yahr') {
    // Escala de Hoehn y Yahr
    const stageValue = scores['stage']?.toString() || '0';
    const stage = parseFloat(stageValue);
    
    totalScore = stage;
    
    // Interpretación basada en el estadio
    if (stage === 0) {
      interpretation = 'Sin signos de enfermedad';
    } else if (stage === 1) {
      interpretation = 'Enfermedad unilateral - Estadio inicial';
    } else if (stage === 1.5) {
      interpretation = 'Compromiso unilateral y axial - Estadio inicial';
    } else if (stage === 2) {
      interpretation = 'Enfermedad bilateral sin alteración del equilibrio - Estadio leve';
    } else if (stage === 2.5) {
      interpretation = 'Enfermedad bilateral leve con recuperación postural - Estadio leve';
    } else if (stage === 3) {
      interpretation = 'Enfermedad bilateral con inestabilidad postural - Estadio moderado';
    } else if (stage === 4) {
      interpretation = 'Incapacidad grave pero aún independiente - Estadio avanzado';
    } else if (stage === 5) {
      interpretation = 'Confinado a silla de ruedas o cama - Estadio muy avanzado';
    }
    
    details = `ESCALA DE HOEHN Y YAHR:\n\n`;
    details += `Estadio: ${stage}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `CARACTERÍSTICAS CLÍNICAS:\n`;
    if (stage === 0) {
      details += `• Sin evidencia de enfermedad\n`;
      details += `• Función normal\n`;
    } else if (stage <= 1.5) {
      details += `• Síntomas leves, unilaterales\n`;
      details += `• Funcionalidad preservada\n`;
      details += `• Respuesta excelente a tratamiento\n`;
    } else if (stage <= 2.5) {
      details += `• Síntomas bilaterales\n`;
      details += `• Equilibrio preservado\n`;
      details += `• Independencia mantenida\n`;
    } else if (stage === 3) {
      details += `• Inestabilidad postural evidente\n`;
      details += `• Funcionalmente independiente\n`;
      details += `• Riesgo de caídas\n`;
    } else if (stage === 4) {
      details += `• Discapacidad severa\n`;
      details += `• Requiere asistencia para algunas actividades\n`;
      details += `• Capaz de caminar sin apoyo\n`;
    } else if (stage === 5) {
      details += `• Dependencia total\n`;
      details += `• Confinado a silla de ruedas o cama\n`;
      details += `• Requiere cuidados especializados\n`;
    }
    
    details += `\nIMPLICACIONES TERAPÉUTICAS:\n`;
    if (stage <= 2) {
      details += `• Puede diferirse inicio de tratamiento\n`;
      details += `• Considerar factores individuales\n`;
    } else if (stage <= 3) {
      details += `• Tratamiento farmacológico recomendado\n`;
      details += `• Evaluación de fisioterapia\n`;
    } else {
      details += `• Optimización de tratamiento médico\n`;
      details += `• Rehabilitación integral\n`;
      details += `• Evaluación de cirugía (DBS) si apropiado\n`;
    }
  } else if (scale.id === 'edss') {
    // EDSS (Expanded Disability Status Scale)
    // Para simplicidad, usaremos principalmente la capacidad de deambulación
    const ambulation = parseInt(scores['ambulation']?.toString() || '0');
    const pyramidal = parseInt(scores['pyramidal_functions']?.toString() || '0');
    const cerebellar = parseInt(scores['cerebellar_functions']?.toString() || '0');
    const brainstem = parseInt(scores['brainstem_functions']?.toString() || '0');
    const sensory = parseInt(scores['sensory_functions']?.toString() || '0');
    const bowelBladder = parseInt(scores['bowel_bladder']?.toString() || '0');
    const visual = parseInt(scores['visual_functions']?.toString() || '0');
    const cerebral = parseInt(scores['cerebral_functions']?.toString() || '0');
    
    // Determinar EDSS basado en deambulación y sistemas funcionales
    let edssScore = 0;
    
    if (ambulation <= 0) {
      // EDSS 0-3.5 basado en sistemas funcionales
      const maxFS = Math.max(pyramidal, cerebellar, brainstem, sensory, bowelBladder, visual, cerebral);
      if (maxFS === 0) edssScore = 0;
      else if (maxFS === 1) edssScore = 1;
      else if (maxFS === 2) edssScore = 2;
      else if (maxFS === 3) edssScore = 3;
      else edssScore = 3.5;
    } else if (ambulation === 1) {
      edssScore = 4.0;
    } else if (ambulation === 2) {
      edssScore = 4.5;
    } else if (ambulation === 3) {
      edssScore = 5.0;
    } else if (ambulation === 4) {
      edssScore = 5.5;
    } else if (ambulation === 5) {
      edssScore = 6.0;
    } else if (ambulation === 6) {
      edssScore = 6.5;
    } else if (ambulation === 7) {
      edssScore = 7.0;
    } else if (ambulation === 8) {
      edssScore = 7.5;
    } else if (ambulation === 9) {
      edssScore = 8.0;
    } else if (ambulation === 10) {
      edssScore = 8.5;
    }
    
    totalScore = edssScore;
    
    // Interpretación basada en EDSS
    if (edssScore <= 1.5) {
      interpretation = 'Sin discapacidad - Signos neurológicos mínimos';
    } else if (edssScore <= 3.5) {
      interpretation = 'Discapacidad mínima - Signos en uno o dos sistemas funcionales';
    } else if (edssScore <= 5.5) {
      interpretation = 'Discapacidad moderada - Deambulación limitada pero independiente';
    } else if (edssScore <= 7.5) {
      interpretation = 'Discapacidad severa - Deambulación significativamente limitada';
    } else {
      interpretation = 'Discapacidad muy severa - Principalmente confinado';
    }
    
    details = `EDSS (Expanded Disability Status Scale):\n\n`;
    details += `Puntaje EDSS: ${edssScore}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `SISTEMAS FUNCIONALES:\n`;
    details += `• Funciones piramidales: ${pyramidal}/6\n`;
    details += `• Funciones cerebelares: ${cerebellar}/5\n`;
    details += `• Funciones del tronco: ${brainstem}/5\n`;
    details += `• Funciones sensoriales: ${sensory}/6\n`;
    details += `• Funciones vesicales/intestinales: ${bowelBladder}/6\n`;
    details += `• Funciones visuales: ${visual}/6\n`;
    details += `• Funciones cerebrales: ${cerebral}/5\n`;
    details += `• Capacidad de deambulación: Nivel ${ambulation}\n\n`;
    details += `IMPLICACIONES CLÍNICAS:\n`;
    if (edssScore <= 3.5) {
      details += `• Calidad de vida generalmente preservada\n`;
      details += `• Actividades laborales usualmente mantenidas\n`;
      details += `• Pronóstico favorable a mediano plazo\n`;
    } else if (edssScore <= 5.5) {
      details += `• Limitaciones funcionales evidentes\n`;
      details += `• Posibles modificaciones laborales necesarias\n`;
      details += `• Importante rol de la rehabilitación\n`;
    } else if (edssScore <= 7.5) {
      details += `• Discapacidad significativa\n`;
      details += `• Requiere asistencia para actividades diarias\n`;
      details += `• Consideración de tratamientos intensivos\n`;
    } else {
      details += `• Discapacidad severa\n`;
      details += `• Requiere cuidados especializados\n`;
      details += `• Enfoque en cuidados paliativos y calidad de vida\n`;
    }
  } else if (scale.id === 'engel') {
    // Escala de Engel para Epilepsia
    const outcomeValue = scores['seizure_outcome']?.toString() || 'Clase IV';
    const subclassValue = scores['subclass']?.toString() || 'Sin subclase';
    
    // Extraer clase numérica del resultado
    const classMatch = outcomeValue.match(/Clase ([I|II|III|IV])/);
    const engelClass = classMatch ? classMatch[1] : 'IV';
    
    // Extraer subclase
    const subclassMatch = subclassValue.match(/^([A|B|C|D])/);
    const subclass = subclassMatch ? subclassMatch[1] : '';
    
    totalScore = 0; // Engel es categórico, no numérico
    
    // Interpretación basada en la clase de Engel
    if (engelClass === 'I') {
      interpretation = 'Resultado excelente - Libre de crisis incapacitantes';
    } else if (engelClass === 'II') {
      interpretation = 'Resultado bueno - Crisis incapacitantes raras';
    } else if (engelClass === 'III') {
      interpretation = 'Resultado regular - Mejoría significativa';
    } else {
      interpretation = 'Resultado pobre - Sin mejoría significativa';
    }
    
    details = `ESCALA DE ENGEL - EPILEPSIA:\n\n`;
    details += `Clase: ${engelClass}${subclass ? subclass : ''}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `DESCRIPCIÓN DEL RESULTADO:\n`;
    
    if (engelClass === 'I') {
      details += `• Libre de crisis incapacitantes\n`;
      if (subclass === 'A') details += `• Completamente libre de crisis desde la cirugía\n`;
      else if (subclass === 'B') details += `• Solo auras no incapacitantes desde la cirugía\n`;
      else if (subclass === 'C') details += `• Crisis generalizadas solo con suspensión de medicación\n`;
      else if (subclass === 'D') details += `• Crisis generalizadas solo con enfermedad febril\n`;
      details += `• Excelente resultado quirúrgico\n`;
      details += `• Probable mejoría en calidad de vida\n`;
    } else if (engelClass === 'II') {
      details += `• Crisis incapacitantes raras (1-3 por año)\n`;
      details += `• Buen resultado quirúrgico\n`;
      details += `• Mejoría significativa en calidad de vida\n`;
    } else if (engelClass === 'III') {
      details += `• Reducción significativa de crisis (>75%)\n`;
      details += `• Resultado quirúrgico aceptable\n`;
      details += `• Considerar ajustes de medicación\n`;
    } else {
      details += `• Sin mejoría significativa en frecuencia de crisis\n`;
      details += `• Resultado quirúrgico subóptimo\n`;
      details += `• Evaluación de opciones terapéuticas adicionales\n`;
    }
    
    details += `\nIMPLICACIONES:\n`;
    if (engelClass === 'I' || engelClass === 'II') {
      details += `• Considerar reducción gradual de antiepilépticos\n`;
      details += `• Evaluación neuropsicológica post-quirúrgica\n`;
      details += `• Retorno gradual a actividades normales\n`;
    } else {
      details += `• Continuar con antiepilépticos a dosis óptimas\n`;
      details += `• Considerar segunda cirugía si apropiado\n`;
      details += `• Evaluación de estimulación del nervio vago\n`;
    }
  } else if (scale.id === 'moca') {
    // MoCA (Montreal Cognitive Assessment)
    const visuospatial = parseInt(scores['visuospatial']?.toString() || '0');
    const naming = parseInt(scores['naming']?.toString() || '0');
    const attention = parseInt(scores['attention']?.toString() || '0');
    const language = parseInt(scores['language']?.toString() || '0');
    const abstraction = parseInt(scores['abstraction']?.toString() || '0');
    const memory = parseInt(scores['memory']?.toString() || '0');
    const orientation = parseInt(scores['orientation']?.toString() || '0');
    
    totalScore = visuospatial + naming + attention + language + abstraction + memory + orientation;
    
    // Ajuste por educación (añadir 1 punto si ≤12 años de educación)
    // Para simplicidad, asumiríamos educación normal
    const adjustedScore = totalScore; // En implementación real, preguntar años de educación
    
    // Interpretación basada en MoCA
    if (adjustedScore >= 26) {
      interpretation = 'Función cognitiva normal';
    } else if (adjustedScore >= 18) {
      interpretation = 'Deterioro cognitivo leve probable';
    } else {
      interpretation = 'Deterioro cognitivo significativo';
    }
    
    details = `MoCA (Montreal Cognitive Assessment):\n\n`;
    details += `Puntaje total: ${totalScore}/30\n`;
    details += `Puntaje ajustado: ${adjustedScore}/30\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `DESGLOSE POR DOMINIO:\n`;
    details += `• Visuoespacial/Ejecutivo: ${visuospatial}/5\n`;
    details += `• Denominación: ${naming}/3\n`;
    details += `• Atención: ${attention}/6\n`;
    details += `• Lenguaje: ${language}/3\n`;
    details += `• Abstracción: ${abstraction}/2\n`;
    details += `• Memoria diferida: ${memory}/5\n`;
    details += `• Orientación: ${orientation}/6\n\n`;
    details += `PUNTOS DE CORTE:\n`;
    details += `• ≥26: Normal\n`;
    details += `• 18-25: Deterioro cognitivo leve probable\n`;
    details += `• <18: Deterioro cognitivo significativo\n\n`;
    details += `CONSIDERACIONES:\n`;
    if (adjustedScore >= 26) {
      details += `• MoCA normal, no requiere evaluación adicional rutinaria\n`;
      details += `• Considerar factores como ansiedad o depresión si hay quejas cognitivas\n`;
    } else if (adjustedScore >= 18) {
      details += `• Sugiere deterioro cognitivo leve\n`;
      details += `• Recomendada evaluación neuropsicológica completa\n`;
      details += `• Descartar causas reversibles (depresión, B12, TSH)\n`;
    } else {
      details += `• Sugiere deterioro cognitivo significativo\n`;
      details += `• Evaluación integral de demencia recomendada\n`;
      details += `• Neuroimágenes y estudios de laboratorio completos\n`;
    }
  } else if (scale.id === 'hit6') {
    // HIT-6 (Headache Impact Test)
    const workSchool = parseInt(scores['work_school_activities']?.toString() || '6');
    const household = parseInt(scores['household_activities']?.toString() || '6');
    const social = parseInt(scores['social_activities']?.toString() || '6');
    const concentration = parseInt(scores['concentration']?.toString() || '6');
    const energy = parseInt(scores['energy_fatigue']?.toString() || '6');
    const mood = parseInt(scores['mood']?.toString() || '6');
    
    totalScore = workSchool + household + social + concentration + energy + mood;
    
    // Interpretación basada en el puntaje HIT-6
    if (totalScore <= 49) {
      interpretation = 'Impacto mínimo o leve';
    } else if (totalScore <= 55) {
      interpretation = 'Impacto leve';
    } else if (totalScore <= 59) {
      interpretation = 'Impacto moderado';
    } else if (totalScore <= 65) {
      interpretation = 'Impacto sustancial';
    } else {
      interpretation = 'Impacto severo';
    }
    
    details = `HIT-6 (Headache Impact Test):\n\n`;
    details += `Puntaje total: ${totalScore}\n`;
    details += `Interpretación: ${interpretation}\n\n`;
    details += `CATEGORÍAS DE IMPACTO:\n`;
    details += `• Trabajo/Escuela: ${workSchool} puntos\n`;
    details += `• Actividades domésticas: ${household} puntos\n`;
    details += `• Actividades sociales: ${social} puntos\n`;
    details += `• Concentración: ${concentration} puntos\n`;
    details += `• Energía/Fatiga: ${energy} puntos\n`;
    details += `• Estado de ánimo: ${mood} puntos\n\n`;
    details += `INTERPRETACIÓN CLÍNICA:\n`;
    if (totalScore <= 49) {
      details += `• Impacto mínimo en la vida diaria\n`;
      details += `• Tratamiento sintomático usualmente suficiente\n`;
      details += `• Buena calidad de vida\n`;
    } else if (totalScore <= 55) {
      details += `• Impacto leve pero presente\n`;
      details += `• Considerar estrategias de manejo\n`;
      details += `• Evaluar frecuencia de cefaleas\n`;
    } else if (totalScore <= 59) {
      details += `• Impacto moderado en funcionamiento\n`;
      details += `• Considerar tratamiento preventivo\n`;
      details += `• Evaluación de factores desencadenantes\n`;
    } else if (totalScore <= 65) {
      details += `• Impacto sustancial en calidad de vida\n`;
      details += `• Tratamiento preventivo recomendado\n`;
      details += `• Considerar derivación a especialista\n`;
    } else {
      details += `• Impacto severo y discapacitante\n`;
      details += `• Tratamiento agresivo necesario\n`;
      details += `• Evaluación en centro especializado\n`;
      details += `• Considerar tratamientos de segunda línea\n`;
    }
  }

  return {
    scaleName: scale.name,
    totalScore,
    details,
    interpretation,
  };
} 