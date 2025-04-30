-- Paso 1: Otorgar permisos necesarios en el esquema auth y la tabla users
-- Este paso puede requerir privilegios de superusuario
BEGIN;

-- Otorgar uso del esquema auth al rol authenticated
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Otorgar permiso SELECT en auth.users al rol authenticated
GRANT SELECT ON auth.users TO authenticated;

-- Paso 2: Recrear las vistas como SECURITY DEFINER
-- En versiones anteriores de PostgreSQL, necesitamos recrear las vistas
DO $$
DECLARE
    vista_nombre text;
    vista_definicion text;
BEGIN
    FOR vista_nombre, vista_definicion IN 
        SELECT table_name, view_definition
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        -- Obtener la definición completa de la vista
        EXECUTE format('CREATE OR REPLACE VIEW public.%I AS %s SECURITY DEFINER', 
                      vista_nombre, 
                      vista_definicion);
        
        -- Otorgar todos los permisos al rol authenticated
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', vista_nombre);
        
        RAISE NOTICE 'Permisos corregidos para la vista: %', vista_nombre;
    END LOOP;
END $$;

-- Paso 3: Crear una función auxiliar para verificar los permisos de las vistas
CREATE OR REPLACE FUNCTION public.verificar_permisos_vistas()
RETURNS TABLE (
    nombre_vista text,
    es_security_definer boolean,
    tiene_permisos_auth boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.table_name::text,
        EXISTS (
            SELECT 1
            FROM pg_views
            WHERE schemaname = 'public'
            AND viewname = v.table_name
            AND definition LIKE '%SECURITY DEFINER%'
        ) as es_security_definer,
        EXISTS (
            SELECT 1
            FROM information_schema.role_table_grants g
            WHERE g.table_name = v.table_name
            AND g.table_schema = 'public'
            AND g.grantee = 'authenticated'
        ) as tiene_permisos_auth
    FROM information_schema.views v
    WHERE v.table_schema = 'public';
END $$;

-- Otorgar permiso de ejecución en la función auxiliar
GRANT EXECUTE ON FUNCTION public.verificar_permisos_vistas() TO authenticated;

COMMIT;
