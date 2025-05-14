-- 1. TABLA DE ACTIVIDADES (AUDITORÍA)

CREATE TABLE IF NOT EXISTS restructured.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    agency_id UUID REFERENCES restructured.agencies(id),
    server_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restructured.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can do everything" ON restructured.activities FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. VISTAS DE RESUMEN

-- Resumen de asistencia por agencia y mes
CREATE OR REPLACE VIEW restructured.agency_attendance_summary AS
SELECT 
  e.agency_id,
  a.name AS agency_name,
  att.date::DATE AS day,
  COUNT(att.id) AS total_attendances,
  SUM(att.hours_worked) AS total_hours,
  SUM(att.overtime) AS total_overtime
FROM restructured.employees e
JOIN restructured.agencies a ON e.agency_id = a.id
LEFT JOIN restructured.attendance att ON e.id = att.employee_id
GROUP BY e.agency_id, a.name, att.date;

-- Resumen de nómina por agencia y mes
CREATE OR REPLACE VIEW restructured.agency_payroll_summary AS
SELECT 
  e.agency_id,
  a.name AS agency_name,
  p.month,
  SUM(p.base_salary) AS total_base_salary,
  SUM(p.overtime) AS total_overtime,
  SUM(p.total_payment) AS total_payment
FROM restructured.employees e
JOIN restructured.agencies a ON e.agency_id = a.id
LEFT JOIN restructured.payroll p ON e.id = p.employee_id
GROUP BY e.agency_id, a.name, p.month;

-- Resumen de gastos por agencia y mes
CREATE OR REPLACE VIEW restructured.agency_expense_summary AS
SELECT 
  agency_id,
  date_trunc('month', date) AS month,
  SUM(amount) AS total_expenses
FROM restructured.expenses
GROUP BY agency_id, date_trunc('month', date);

-- Resumen de ingresos por agencia y mes
CREATE OR REPLACE VIEW restructured.agency_income_summary AS
SELECT 
  agency_id,
  date_trunc('month', date) AS month,
  SUM(amount) AS total_incomes
FROM restructured.incomes
GROUP BY agency_id, date_trunc('month', date);

-- 3. FUNCIONES ÚTILES

-- Métricas de servidor (adaptada)
CREATE OR REPLACE FUNCTION restructured.get_server_metrics(p_server_id UUID)
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
    SELECT COALESCE(SUM(leads_count), 0) AS total_leads
    FROM restructured.lead_distributions
    WHERE server_id = p_server_id
  ),
  conversion_stats AS (
    SELECT COALESCE(SUM(loads), 0) AS total_conversions,
           COALESCE(SUM(spent), 0) AS total_spend
    FROM restructured.server_ads
    WHERE server_id = p_server_id
  )
  SELECT 
    ls.total_leads,
    cs.total_conversions,
    CASE WHEN ls.total_leads > 0 THEN (cs.total_conversions::NUMERIC / ls.total_leads::NUMERIC) * 100 ELSE 0 END AS conversion_rate,
    cs.total_spend,
    CASE WHEN ls.total_leads > 0 THEN cs.total_spend / ls.total_leads ELSE 0 END AS cost_per_lead,
    CASE WHEN cs.total_conversions > 0 THEN cs.total_spend / cs.total_conversions ELSE 0 END AS cost_per_conversion
  FROM lead_stats ls, conversion_stats cs;
END;
$$;

-- Progreso diario de leads/conversiones (adaptada)
CREATE OR REPLACE FUNCTION restructured.get_daily_progress_data(p_server_id UUID DEFAULT NULL)
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
    SELECT COALESCE(date(created_at), CURRENT_DATE) AS date,
           SUM(leads_count) AS leads
    FROM restructured.lead_distributions
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND (p_server_id IS NULL OR server_id = p_server_id)
    GROUP BY date(created_at)
  ),
  conversion_data AS (
    SELECT COALESCE(date(created_at), CURRENT_DATE) AS date,
           SUM(loads) AS conversions
    FROM restructured.server_ads
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND (p_server_id IS NULL OR server_id = p_server_id)
    GROUP BY date(created_at)
  )
  SELECT d.date,
         COALESCE(ld.leads, 0) AS leads,
         COALESCE(cd.conversions, 0) AS conversions
  FROM dates d
  LEFT JOIN lead_data ld ON d.date = ld.date
  LEFT JOIN conversion_data cd ON d.date = cd.date
  ORDER BY d.date;
END;
$$;

-- Registrar actividad
CREATE OR REPLACE FUNCTION restructured.register_activity(
  p_user_id UUID,
  p_action TEXT,
  p_target TEXT,
  p_agency_id UUID DEFAULT NULL,
  p_server_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO restructured.activities (user_id, action, target, agency_id, server_id)
  VALUES (p_user_id, p_action, p_target, p_agency_id, p_server_id)
  RETURNING id INTO activity_id;
  RETURN activity_id;
END;
$$; 