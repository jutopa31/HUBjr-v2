-- Insert sample resident data without requiring real user_ids
-- This creates fake user_ids for demonstration purposes

-- IMPORTANT: This is for testing purposes only
-- In production, use real user_ids from your auth.users table

-- First, let's create some test entries that will work immediately
-- We'll use generated UUIDs that don't conflict with real auth users

DO $$
DECLARE
    test_user_id_1 UUID := gen_random_uuid();
    test_user_id_2 UUID := gen_random_uuid();
    test_user_id_3 UUID := gen_random_uuid();
    test_user_id_4 UUID := gen_random_uuid();
    test_user_id_5 UUID := gen_random_uuid();
    test_user_id_6 UUID := gen_random_uuid();
    test_user_id_7 UUID := gen_random_uuid();
BEGIN
    -- Insert sample residents (these won't be linked to real auth users)
    INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level, current_rotation, status)
    VALUES
        (test_user_id_1, 'Juan Carlos', 'Pérez García', 'juan.perez@ejemplo.com', 'R1', 'Neurología General', 'active'),
        (test_user_id_2, 'María Elena', 'González López', 'maria.gonzalez@ejemplo.com', 'R2', 'Stroke Unit', 'active'),
        (test_user_id_3, 'Carlos Alberto', 'Rodríguez Morales', 'carlos.rodriguez@ejemplo.com', 'R3', 'Neurofisiología', 'active'),
        (test_user_id_4, 'Ana Sofía', 'Martínez Ruiz', 'ana.martinez@ejemplo.com', 'R4', 'Neurocirugía', 'active'),
        (test_user_id_5, 'Luis Fernando', 'García Mendoza', 'luis.garcia@ejemplo.com', 'R5', 'Investigación', 'active'),
        (test_user_id_6, 'Elena Isabel', 'López Herrera', 'elena.lopez@ejemplo.com', 'fellow', 'Epilepsia', 'active'),
        (test_user_id_7, 'Dr. Roberto', 'Fernández Silva', 'roberto.fernandez@ejemplo.com', 'attending', 'Staff Neurología', 'active')
    ON CONFLICT (email) DO NOTHING;

    -- Log the created user IDs for reference
    RAISE NOTICE 'Sample resident profiles created with test user IDs';
    RAISE NOTICE 'Juan Carlos Pérez García: %', test_user_id_1;
    RAISE NOTICE 'María Elena González López: %', test_user_id_2;
    RAISE NOTICE 'Carlos Alberto Rodríguez Morales: %', test_user_id_3;
    RAISE NOTICE 'Ana Sofía Martínez Ruiz: %', test_user_id_4;
    RAISE NOTICE 'Luis Fernando García Mendoza: %', test_user_id_5;
    RAISE NOTICE 'Elena Isabel López Herrera: %', test_user_id_6;
    RAISE NOTICE 'Dr. Roberto Fernández Silva: %', test_user_id_7;
END $$;

-- View the created residents
SELECT
    first_name || ' ' || last_name as nombre_completo,
    email,
    training_level,
    current_rotation,
    status,
    user_id
FROM resident_profiles
WHERE status = 'active'
ORDER BY training_level;

-- Helper query to see all residents
-- SELECT first_name, last_name, email, training_level, user_id FROM resident_profiles;