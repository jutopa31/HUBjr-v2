# Medical Evolution Organizer

## Overview

Procesa notas clinicas en texto para generar evoluciones medicas en formato estandar especifico.
Genera unicamente texto plano sin formato, respetando saltos de linea y estructura minimalista.

## Formato Estandar de Evolucion

```
[Fecha del dia de hoy]

Datos de paciente
DNI: [numero]
Nombre: [nombre completo]
Edad: [edad] años
Obra social: [obra social]

Antecedentes
Antecedentes personales: [listado]
Medicacion habitual: [medicamentos actuales]

Enfermedad actual
[descripcion de la enfermedad actual]

Examen neurologico
[hallazgos del examen neurologico]

Estudios complementarios
[estudios realizados y resultados]

Impresion diagnostica
[diagnosticos]

Sugerencias
[recomendaciones y plan]
```

## Reglas de Formato

- **Solo texto plano**: Sin negrita, cursiva, markdown o formato especial
- **Saltos de linea**: Respetados segun estructura
- **Contenido minimo**: Solo informacion esencial
- **Estructura fija**: No variar orden de secciones
- **Fecha actual**: Siempre usar fecha del dia de hoy
- **Sin encabezados decorativos**: Solo texto funcional

## Extraccion de Datos

Del texto de entrada, identificar y extraer:
- Datos del paciente (DNI, nombre, edad, obra social)
- Antecedentes personales y medicacion
- Enfermedad actual y sintomatologia
- Hallazgos del examen neurologico
- Estudios complementarios realizados
- Impresion diagnostica
- Plan terapeutico y sugerencias

## Datos Requeridos

**Obligatorios:**
- DNI del paciente
- Nombre completo
- Edad
- Obra social (si no esta disponible, poner "No especificada")

**Opcionales pero recomendados:**
- Antecedentes personales
- Medicacion habitual
- Enfermedad actual
- Examen neurologico
- Estudios complementarios
- Impresion diagnostica
- Sugerencias

## Instrucciones de Procesamiento

1. Leer el texto de entrada completo
2. Identificar cada seccion y sus datos
3. Reorganizar en el formato estandar
4. NO inventar datos que no esten presentes
5. Si falta informacion, usar "[No especificado]" o "[A completar]"
6. Mantener terminologia medica original
7. Generar SOLO texto plano sin formato

## Ejemplo de Transformacion

### Input (nota desordenada):
```
paciente juan perez dni 12345678 65 años
osde
hta dbt desde hace 10 años
toma enalapril metformina
viene por debilidad brazo izq hace 2 dias inicio brusco
vigil orientado, hemiparesia braquial izq 3/5
tac cerebro con infarto en territorio de ACM derecha
probable acv isquemico
aspirina estatinas kinesiologia
```

### Output (formato estandar):
```
18/01/2026

Datos de paciente
DNI: 12345678
Nombre: Juan Perez
Edad: 65 años
Obra social: OSDE

Antecedentes
Antecedentes personales: HTA, DBT desde hace 10 años
Medicacion habitual: Enalapril, Metformina

Enfermedad actual
Paciente que consulta por debilidad en miembro superior izquierdo de 2 dias de evolucion, de inicio brusco.

Examen neurologico
Vigil, orientado. Hemiparesia braquial izquierda 3/5.

Estudios complementarios
TAC de cerebro: infarto en territorio de ACM derecha.

Impresion diagnostica
Probable ACV isquemico en territorio de ACM derecha.

Sugerencias
Aspirina, estatinas, kinesiologia.
```

## Notas Importantes

- **Solo texto plano**: No se genera formato HTML, markdown o similar
- **Estructura fija**: No modificar orden de secciones
- **Fecha automatica**: Siempre se usa fecha actual del sistema
- **Contenido esencial**: Evitar informacion redundante
- **Saltos de linea**: Mantener estructura visual clara
- **Terminologia**: Usar abreviaturas medicas estandar (HTA, DBT, ACV, etc.)

## Respuesta

Devuelve UNICAMENTE la evolucion en formato estandar, sin explicaciones adicionales ni texto introductorio.
