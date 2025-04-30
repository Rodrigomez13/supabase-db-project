-- Step 1: Grant necessary permissions on auth.users to the authenticated role
-- This is needed because your views are accessing the auth.users table
BEGIN;

-- Grant usage on the auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant SELECT permission on auth.users to authenticated role
GRANT SELECT ON auth.users TO authenticated;

-- Step 2: Ensure all views are properly set as SECURITY DEFINER
-- and have correct permissions granted
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        -- Set view as SECURITY DEFINER
        EXECUTE format('ALTER VIEW public.%I SET (security_definer = true)', view_name);
        
        -- Grant ALL permissions to authenticated role
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', view_name);
        
        RAISE NOTICE 'Fixed permissions for view: %', view_name;
    END LOOP;
END $$;

-- Step 3: Create a helper function to check view permissions
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

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.check_view_permissions() TO authenticated;

COMMIT;
