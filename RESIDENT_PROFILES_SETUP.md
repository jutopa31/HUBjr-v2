# Configuración de Perfiles de Residentes

Esta guía te ayudará a configurar la tabla `resident_profiles` para que los nombres reales de los residentes aparezcan en el sistema en lugar de códigos genéricos como "Residente1f1e".

## 🚀 Pasos de Instalación

### 1. Crear la Tabla en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `setup_resident_profiles.sql`
4. Ejecuta el script

### 2. Agregar Datos de Ejemplo

**Opción A: Datos de Prueba (Recomendado para testing)**
1. En el SQL Editor de Supabase
2. Copia y pega el contenido del archivo `insert_sample_residents.sql`
3. Ejecuta el script

**Opción B: Datos Reales**
1. Primero obtén los user_ids reales: `SELECT id, email FROM auth.users;`
2. Edita el archivo `setup_resident_profiles.sql`
3. Reemplaza los UUIDs de ejemplo con los IDs reales
4. Ejecuta las declaraciones INSERT

### 3. Verificar la Instalación

Ejecuta esta consulta en Supabase para verificar:
```sql
SELECT
    first_name || ' ' || last_name as nombre_completo,
    email,
    training_level,
    current_rotation,
    status
FROM resident_profiles
WHERE status = 'active'
ORDER BY training_level;
```

## ✅ ¿Cómo Funciona?

### Funcionalidad Inteligente
El sistema ahora tiene **doble funcionalidad**:

1. **Si existe la tabla `resident_profiles`**: Carga nombres reales (ej: "Juan Carlos Pérez García")
2. **Si NO existe la tabla**: Usa el método anterior (ej: "Residente1f1e")

### Logs de Debugging
En la consola del navegador verás mensajes como:
- ✅ `Loading residents from resident_profiles table`
- ⚠️ `resident_profiles table not found or empty, using fallback method`
- 📋 `Loaded X residents`

## 🧪 Probar la Funcionalidad

1. Ve a **Pase de Sala - Neurología**
2. Haz clic en **"Agregar Paciente"**
3. En el campo **"Residente Asignado"** deberías ver nombres reales
4. Los residentes aparecen ordenados por nivel (R1, R2, R3, R4, R5, fellow, attending)

## 🛠️ Estructura de la Tabla

```sql
resident_profiles
├── id (UUID, Primary Key)
├── user_id (UUID, References auth.users)
├── first_name (TEXT)
├── last_name (TEXT)
├── email (TEXT, Unique)
├── training_level (TEXT: R1|R2|R3|R4|R5|fellow|attending|intern)
├── current_rotation (TEXT, Optional)
├── status (TEXT: active|on_leave|graduated|transferred|suspended)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔧 Gestión de Residentes

### Agregar Nuevo Residente
```sql
INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level)
VALUES ('user-uuid-here', 'Nombre', 'Apellido', 'email@hospital.com', 'R1');
```

### Actualizar Nivel de Entrenamiento
```sql
UPDATE resident_profiles
SET training_level = 'R2', current_rotation = 'Nueva Rotación'
WHERE user_id = 'user-uuid-here';
```

### Desactivar Residente
```sql
UPDATE resident_profiles
SET status = 'graduated'  -- o 'transferred', 'on_leave'
WHERE user_id = 'user-uuid-here';
```

## 🔐 Seguridad

- **RLS (Row Level Security)** habilitado
- Los usuarios pueden ver todos los perfiles activos
- Los usuarios solo pueden editar su propio perfil
- El service role tiene acceso completo

## 🆘 Solución de Problemas

### "No se cargan los residentes"
1. Verifica que la tabla existe: `SELECT * FROM resident_profiles LIMIT 1;`
2. Revisa la consola del navegador para ver los logs
3. Verifica que hay residentes activos: `SELECT * FROM resident_profiles WHERE status = 'active';`

### "Aparecen nombres genéricos"
1. La tabla puede estar vacía
2. Ejecuta `insert_sample_residents.sql` para agregar datos de prueba
3. Verifica en la consola del navegador el mensaje que aparece

### "Error de permisos"
1. Verifica que RLS está configurado correctamente
2. Asegúrate de que el usuario está autenticado
3. Revisa las políticas de seguridad en Supabase

## 📝 Notas

- Los datos de ejemplo en `insert_sample_residents.sql` usan UUIDs generados que **NO** corresponden a usuarios reales de auth.users
- Para producción, debes usar user_ids reales de tu tabla auth.users
- La funcionalidad es **backward compatible** - si no hay tabla, sigue funcionando como antes