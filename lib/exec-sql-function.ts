// Este archivo contiene la definición de la función exec_sql que necesitamos crear en Supabase
// para poder ejecutar SQL dinámico desde la API

export const createExecSqlFunction = `
-- Función para ejecutar SQL dinámico con privilegios elevados
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Otorgar permiso de ejecución a la función
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
`
