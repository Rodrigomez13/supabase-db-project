-- Función para ejecutar SQL de solo lectura de forma segura
-- Esta función permite ejecutar consultas SELECT sin riesgo de modificar datos

CREATE OR REPLACE FUNCTION public.ejecutar_sql_seguro(consulta text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    resultado JSONB;
BEGIN
    -- Verificar que la consulta sea de solo lectura (SELECT)
    IF NOT (lower(trim(consulta)) LIKE 'select%') THEN
        RAISE EXCEPTION 'Solo se permiten consultas SELECT';
    END IF;
    
    -- Ejecutar la consulta y obtener los resultados como JSON
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || consulta || ') t' INTO resultado;
    
    RETURN COALESCE(resultado, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al ejecutar la consulta: %', SQLERRM;
END;
$$;

-- Otorgar permiso de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.ejecutar_sql_seguro(text) TO authenticated;
