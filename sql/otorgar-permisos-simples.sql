-- Script para otorgar permisos a todas las vistas sin modificar su estructura
-- Este script es más simple y tiene menos probabilidades de fallar

BEGIN;

-- Paso 1: Otorgar permisos en el esquema auth (requiere privilegios de superusuario)
-- Si este paso falla, el script continuará con el siguiente
BEGIN
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT SELECT ON auth.users TO authenticated;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudieron otorgar permisos en el esquema auth: %', SQLERRM;
END;

-- Paso 2: Otorgar permisos SELECT en todas las vistas públicas
DO $$
DECLARE
    vista_nombre text;
BEGIN
    FOR vista_nombre IN 
        SELECT table_name
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        BEGIN
            -- Otorgar permiso SELECT al rol authenticated
            EXECUTE format('GRANT SELECT ON public.%I TO authenticated', vista_nombre);
            RAISE NOTICE 'Permiso SELECT otorgado en la vista: %', vista_nombre;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error al otorgar permiso en la vista %: %', vista_nombre, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;
