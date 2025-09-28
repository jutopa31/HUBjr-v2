document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const form = document.getElementById('nihss-form');
    const calculateBtn = document.getElementById('calculate-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const resetBtn = document.getElementById('reset-btn');
    const insertBtn = document.getElementById('insert-btn');
    const resultContainer = document.getElementById('result-container');
    const totalScoreElement = document.getElementById('total-score');
    const interpretationElement = document.getElementById('interpretation-text');
    
    // Manejar el cálculo de la puntuación
    calculateBtn.addEventListener('click', function() {
        if (!validateForm()) {
            alert('Por favor, complete todos los campos de la evaluación.');
            return;
        }
        
        const score = calculateScore();
        displayResults(score);
    });
    
    // Validar que todos los campos requeridos estén completos
    function validateForm() {
        const requiredFields = [
            'loc', 'loc-questions', 'loc-commands', 'gaze', 'visual', 
            'facial', 'motor-left-arm', 'motor-right-arm', 
            'motor-left-leg', 'motor-right-leg', 'ataxia', 
            'sensory', 'language', 'dysarthria', 'neglect'
        ];
        
        for (const field of requiredFields) {
            const radioButtons = document.getElementsByName(field);
            let isChecked = false;
            
            for (const radio of radioButtons) {
                if (radio.checked) {
                    isChecked = true;
                    break;
                }
            }
            
            if (!isChecked) {
                return false;
            }
        }
        
        return true;
    }
    
    // Calcular la puntuación total
    function calculateScore() {
        let totalScore = 0;
        const fields = [
            'loc', 'loc-questions', 'loc-commands', 'gaze', 'visual', 
            'facial', 'motor-left-arm', 'motor-right-arm', 
            'motor-left-leg', 'motor-right-leg', 'ataxia', 
            'sensory', 'language', 'dysarthria', 'neglect'
        ];
        
        for (const field of fields) {
            const selectedValue = document.querySelector(`input[name="${field}"]:checked`).value;
            // Si el valor es "UN" (no evaluable), no sumamos nada
            if (selectedValue !== 'UN') {
                totalScore += parseInt(selectedValue);
            }
        }
        
        return totalScore;
    }
    
    // Mostrar los resultados
    function displayResults(score) {
        totalScoreElement.textContent = score;
        
        // Determinar la interpretación basada en la puntuación
        let interpretation = '';
        let severity = '';
        
        if (score === 0) {
            interpretation = 'Sin síntomas de ictus.';
            severity = 'none';
        } else if (score >= 1 && score <= 4) {
            interpretation = 'Ictus leve.';
            severity = 'minor';
        } else if (score >= 5 && score <= 15) {
            interpretation = 'Ictus moderado.';
            severity = 'moderate';
        } else if (score >= 16 && score <= 20) {
            interpretation = 'Ictus moderado a grave.';
            severity = 'moderate-severe';
        } else {
            interpretation = 'Ictus grave.';
            severity = 'severe';
        }
        
        interpretationElement.textContent = interpretation;
        
        // Resaltar la categoría de gravedad en el indicador
        const severityIndicator = document.querySelector('.severity-indicator');
        severityIndicator.querySelectorAll('div').forEach(div => {
            div.style.opacity = '0.3';
        });
        severityIndicator.querySelector(`.${severity}`).style.opacity = '1';
        
        // Mostrar el contenedor de resultados
        form.style.display = 'none';
        resultContainer.style.display = 'block';
    }
    
    // Manejar el botón de cancelar
    cancelBtn.addEventListener('click', function() {
        // Enviar mensaje al padre para cerrar el iframe
        window.parent.postMessage({ type: 'closeNihssScale' }, '*');
    });
    
    // Manejar el botón de reiniciar
    resetBtn.addEventListener('click', function() {
        form.reset();
        form.style.display = 'block';
        resultContainer.style.display = 'none';
    });
    
    // Manejar el botón de insertar
    insertBtn.addEventListener('click', function() {
        const score = totalScoreElement.textContent;
        const interpretation = interpretationElement.textContent;
        
        // Recopilar los valores seleccionados para cada ítem
        const itemValues = {};
        const itemLabels = {
            'loc': 'Nivel de consciencia',
            'loc-questions': 'Preguntas LOC',
            'loc-commands': 'Órdenes LOC',
            'gaze': 'Mejor mirada',
            'visual': 'Campos visuales',
            'facial': 'Parálisis facial',
            'motor-left-arm': 'Motor - Brazo izquierdo',
            'motor-right-arm': 'Motor - Brazo derecho',
            'motor-left-leg': 'Motor - Pierna izquierda',
            'motor-right-leg': 'Motor - Pierna derecha',
            'ataxia': 'Ataxia de miembros',
            'sensory': 'Sensibilidad',
            'language': 'Mejor lenguaje',
            'dysarthria': 'Disartria',
            'neglect': 'Extinción e inatención'
        };
        
        for (const [key, label] of Object.entries(itemLabels)) {
            const selectedRadio = document.querySelector(`input[name="${key}"]:checked`);
            if (selectedRadio) {
                const value = selectedRadio.value;
                const scoreText = value === 'UN' ? 'No evaluable' : value;
                itemValues[key] = { label, score: scoreText };
            }
        }
        
        // Crear el texto a insertar
        let resultText = `ESCALA NIHSS (National Institutes of Health Stroke Scale):\n`;
        resultText += `- Puntuación total: ${score} - ${interpretation}\n`;
        resultText += `- Desglose por ítems:\n`;
        
        for (const [key, item] of Object.entries(itemValues)) {
            resultText += `  • ${item.label}: ${item.score}\n`;
        }
        
        // Enviar el texto al padre para insertarlo en el textarea
        window.parent.postMessage({ 
            type: 'nihssText', 
            text: resultText 
        }, '*');
    });
});
