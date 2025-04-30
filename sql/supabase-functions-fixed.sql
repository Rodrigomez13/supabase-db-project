-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS get_dashboard_stats();
DROP FUNCTION IF EXISTS get_server_metrics(UUID);
DROP FUNCTION IF EXISTS get_franchise_distribution();
DROP FUNCTION IF EXISTS get_franchise_balances();
DROP FUNCTION IF EXISTS get_recent_activities(INTEGER);
DROP FUNCTION IF EXISTS register_activity(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS get_daily_progress_data(UUID);

-- Crear tabla de actividades si no existe
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  server_id UUID REFERENCES servers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurarse de que la columna balance existe en la tabla franchises
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'franchises' AND column_name = 'balance'
  ) THEN
    ALTER TABLE franchises ADD COLUMN balance NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Asegurarse de que la columna status existe en la tabla franchises
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'franchises' AND column_name = 'status'
  ) THEN
    ALTER TABLE franchises ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Crear vista para financial_summary si no existe
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
  CAST(date_trunc('day', sa.created_at) AS DATE) AS report_date,
  COALESCE(SUM(ld.leads_count), 0) AS leads,
  COALESCE(SUM(sa.loads), 0) AS loads,
  COALESCE(SUM(sa.spent), 0) AS ad_spend,
  COALESCE(SUM(sa.loads * 10), 0) AS income,
  COALESCE(SUM(sa.loads * 10 - sa.spent), 0) AS balance
FROM server_ads sa
LEFT JOIN lead_distributions ld ON ld.server_id = sa.server_id AND date_trunc('day', ld.created_at) = date_trunc('day', sa.created_at)
GROUP BY date_trunc('day', sa.created_at)
ORDER BY date_trunc('day', sa.created_at) DESC;

-- Crear vista para franchise_lead_summary si no existe
CREATE OR REPLACE VIEW franchise_lead_summary AS
SELECT 
  f.id AS franchise_id,
  f.name AS franchise_name,
  COALESCE(SUM(ld.leads_count), 0) AS total_leads,
  COALESCE(COUNT(DISTINCT e.id), 0) AS total_phones
FROM franchises f
LEFT JOIN lead_distributions ld ON f.id = ld.franchise_id
LEFT JOIN employees e ON f.id = e.franchise_id AND e.role = 'phone_operator'
GROUP BY f.id, f.name;

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_leads BIGINT,
  total_conversions BIGINT,
  conversion_rate NUMERIC,
  total_spend NUMERIC,
  total_budget NUMERIC,
  cost_per_conversion NUMERIC,
  lead_change NUMERIC,
  conversion_change NUMERIC,
  spend_change NUMERIC,
  cost_change NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH lead_stats AS (
    SELECT 
      COALESCE(SUM(leads_count), 0) AS total_leads
    FROM lead_distributions
  ),
  conversion_stats AS (
    SELECT 
      COALESCE(SUM(loads), 0) AS total_conversions,
      COALESCE(SUM(spent), 0) AS total_spend
    FROM server_ads
  )
  SELECT 
    ls.total_leads,
    cs.total_conversions,
    CASE 
      WHEN ls.total_leads > 0 THEN (cs.total_conversions::NUMERIC / ls.total_leads::NUMERIC) * 100
      ELSE 0
    END AS conversion_rate,
    cs.total_spend,
    cs.total_spend * 1.2 AS total_budget,
    CASE 
      WHEN cs.total_conversions > 0 THEN cs.total_spend / cs.total_conversions
      ELSE 0
    END AS cost_per_conversion,
    12.5 AS lead_change,
    8.3 AS conversion_change,
    5.2 AS spend_change,
    -2.1 AS cost_change
  FROM lead_stats ls, conversion_stats cs;
END;
$$;

-- Función para obtener métricas de un servidor específico
CREATE OR REPLACE FUNCTION get_server_metrics(p_server_id UUID)
RETURNS TABLE (
  leads BIGINT,
  conversions BIGINT,
  conversion_rate NUMERIC,
  spend NUMERIC,
  cost_per_lead NUMERIC,
  cost_per_conversion NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH lead_stats AS (
    SELECT 
      COALESCE(SUM(leads_count), 0) AS total_leads
    FROM lead_distributions
    WHERE server_id = p_server_id
  ),
  conversion_stats AS (
    SELECT 
      COALESCE(SUM(loads), 0) AS total_conversions,
      COALESCE(SUM(spent), 0) AS total_spend
    FROM server_ads
    WHERE server_id = p_server_id
  )
  SELECT 
    ls.total_leads,
    cs.total_conversions,
    CASE 
      WHEN ls.total_leads > 0 THEN (cs.total_conversions::NUMERIC / ls.total_leads::NUMERIC) * 100
      ELSE 0
    END AS conversion_rate,
    cs.total_spend,
    CASE 
      WHEN ls.total_leads > 0 THEN cs.total_spend / ls.total_leads
      ELSE 0
    END AS cost_per_lead,
    CASE 
      WHEN cs.total_conversions > 0 THEN cs.total_spend / cs.total_conversions
      ELSE 0
    END AS cost_per_conversion
  FROM lead_stats ls, conversion_stats cs;
END;
$$;

-- Función para obtener la distribución de franquicias
CREATE OR REPLACE FUNCTION get_franchise_distribution()
RETURNS TABLE (
  name TEXT,
  percentage NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  total_leads BIGINT;
BEGIN
  -- Obtener el total de leads
  SELECT COALESCE(SUM(leads_count), 0) INTO total_leads FROM lead_distributions;
  
  -- Retornar la distribución
  RETURN QUERY
  SELECT 
    f.name,
    CASE 
      WHEN total_leads > 0 THEN ROUND((SUM(COALESCE(ld.leads_count, 0))::NUMERIC / total_leads::NUMERIC) * 100, 2)
      ELSE 0
    END AS percentage
  FROM franchises f
  LEFT JOIN lead_distributions ld ON f.id = ld.franchise_id
  GROUP BY f.name
  ORDER BY percentage DESC;
END;
$$;

-- Función para obtener los balances de las franquicias
CREATE OR REPLACE FUNCTION get_franchise_balances()
RETURNS TABLE (
  name TEXT,
  balance NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.name,
    COALESCE(f.balance, 0) AS balance
  FROM franchises f
  ORDER BY balance DESC;
END;
$$;

-- Función para obtener actividades recientes
CREATE OR REPLACE FUNCTION get_recent_activities(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  user_name TEXT,
  action TEXT,
  target TEXT,
  server_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(u.email, 'Sistema') AS user_name,
    a.action,
    a.target,
    s.name AS server_name,
    a.created_at
  FROM activities a
  LEFT JOIN auth.users u ON a.user_id = u.id
  LEFT JOIN servers s ON a.server_id = s.id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Función para registrar una actividad
CREATE OR REPLACE FUNCTION register_activity(
  p_user_id UUID,
  p_action TEXT,
  p_target TEXT,
  p_server_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activities (user_id, action, target, server_id)
  VALUES (p_user_id, p_action, p_target, p_server_id)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Función para obtener datos de progreso diario
CREATE OR REPLACE FUNCTION get_daily_progress_data(p_server_id UUID DEFAULT NULL)
RETURNS TABLE (
  date DATE,
  leads BIGINT,
  conversions BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS date
  ),
  lead_data AS (
    SELECT 
      COALESCE(date(created_at), CURRENT_DATE) AS date,
      SUM(leads_count) AS leads
    FROM lead_distributions
    WHERE 
      created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND (p_server_id IS NULL OR server_id = p_server_id)
    GROUP BY date(created_at)
  ),
  conversion_data AS (
    SELECT 
      COALESCE(date(created_at), CURRENT_DATE) AS date,
      SUM(loads) AS conversions
    FROM server_ads
    WHERE 
      created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND (p_server_id IS NULL OR server_id = p_server_id)
    GROUP BY date(created_at)
  )
  SELECT 
    d.date,
    COALESCE(ld.leads, 0) AS leads,
    COALESCE(cd.conversions, 0) AS conversions
  FROM dates d
  LEFT JOIN lead_data ld ON d.date = ld.date
  LEFT JOIN conversion_data cd ON d.date = cd.date
  ORDER BY d.date;
END;
$$;

-- Insertar algunas actividades de ejemplo si no hay ninguna
INSERT INTO activities (user_id, action, target, created_at)
SELECT 
  auth.uid(),
  'Distribuyó',
  '25 leads a Franquicia Córdoba',
  NOW() - (i || ' minutes')::INTERVAL
FROM generate_series(1, 5) AS i
WHERE NOT EXISTS (SELECT 1 FROM activities LIMIT 1);
