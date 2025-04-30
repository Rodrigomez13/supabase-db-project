import { supabase } from "./supabase"

export async function createCheckPermissionsFunction() {
  const sql = `
  CREATE OR REPLACE FUNCTION public.check_view_permissions()
  RETURNS TABLE (
      view_name text,
      security_definer boolean,
      has_auth_permissions boolean
  ) LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
      RETURN QUERY
      SELECT 
          v.table_name::text,
          COALESCE((SELECT pg_catalog.obj_description(pg_class.oid, 'pg_class')::json->>'security_definer' = 'true'
                   FROM pg_catalog.pg_class
                   WHERE pg_class.relname = v.table_name
                   AND pg_class.relkind = 'v'), false) as security_definer,
          EXISTS (
              SELECT 1 
              FROM pg_catalog.pg_class c
              JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              JOIN pg_catalog.pg_policy p ON p.polrelid = c.oid
              WHERE c.relname = v.table_name
              AND n.nspname = 'public'
              AND p.polroles @> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]
          ) OR EXISTS (
              SELECT 1
              FROM information_schema.role_table_grants g
              WHERE g.table_name = v.table_name
              AND g.table_schema = 'public'
              AND g.grantee = 'authenticated'
          ) as has_auth_permissions
      FROM information_schema.views v
      WHERE v.table_schema = 'public';
  END $$;

  GRANT EXECUTE ON FUNCTION public.check_view_permissions() TO authenticated;
  `

  const { error } = await supabase.rpc("exec_sql", { sql })

  if (error) {
    console.error("Error creating check_view_permissions function:", error)
    throw error
  }

  return { success: true }
}
