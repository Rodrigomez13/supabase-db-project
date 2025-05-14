-- 0. CREACIÓN DEL SCHEMA

CREATE SCHEMA IF NOT EXISTS restructured;

-- 1. CREACIÓN DE TABLAS PRINCIPALES

CREATE TABLE IF NOT EXISTS restructured.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    password TEXT,
    cvu TEXT,
    alias TEXT,
    owner TEXT,
    link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    balance NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.agency_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    order_number INT,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    daily_goal INT,
    leads_assigned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.lead_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    server_id UUID REFERENCES public.servers(id),
    agency_id UUID REFERENCES restructured.agencies(id),
    agency_phone_id UUID REFERENCES restructured.agency_phones(id),
    leads_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.agency_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    date DATE NOT NULL,
    ad_spend NUMERIC DEFAULT 0,
    coefficient NUMERIC,
    total_with_increase NUMERIC,
    available_funds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREACIÓN DE VISTAS

CREATE OR REPLACE VIEW restructured.agency_lead_summary AS
SELECT 
  a.id AS agency_id,
  a.name AS agency_name,
  COALESCE(SUM(ld.leads_count), 0) AS total_leads,
  COALESCE(COUNT(DISTINCT ap.id), 0) AS total_phones
FROM restructured.agencies a
LEFT JOIN restructured.lead_distributions ld ON a.id = ld.agency_id
LEFT JOIN restructured.agency_phones ap ON a.id = ap.agency_id AND ap.is_active = TRUE
GROUP BY a.id, a.name;

CREATE OR REPLACE VIEW restructured.agency_financial_summary AS
SELECT 
  a.id AS agency_id,
  a.name AS agency_name,
  COALESCE(SUM(ap.ad_spend), 0) AS total_ad_spend,
  COALESCE(SUM(ap.available_funds), 0) AS total_funds
FROM restructured.agencies a
LEFT JOIN restructured.agency_payments ap ON a.id = ap.agency_id
GROUP BY a.id, a.name;

-- 3. FUNCIONES

CREATE OR REPLACE FUNCTION restructured.get_agency_distribution()
RETURNS TABLE (
  name TEXT,
  percentage NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  total_leads BIGINT;
BEGIN
  SELECT COALESCE(SUM(leads_count), 0) INTO total_leads FROM restructured.lead_distributions;
  RETURN QUERY
  SELECT 
    a.name,
    CASE 
      WHEN total_leads > 0 THEN ROUND((SUM(ld.leads_count)::NUMERIC / total_leads::NUMERIC) * 100, 2)
      ELSE 0
    END AS percentage
  FROM restructured.agencies a
  LEFT JOIN restructured.lead_distributions ld ON a.id = ld.agency_id
  GROUP BY a.name
  ORDER BY percentage DESC;
END;
$$;

CREATE OR REPLACE FUNCTION restructured.get_agency_balances()
RETURNS TABLE (
  name TEXT,
  balance NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    COALESCE(a.balance, 0) AS balance
  FROM restructured.agencies a
  ORDER BY balance DESC;
END;
$$;

-- 4. TRIGGERS (actualización de updated_at)

CREATE OR REPLACE FUNCTION restructured.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_agencies
BEFORE UPDATE ON restructured.agencies
FOR EACH ROW EXECUTE FUNCTION restructured.set_updated_at();

CREATE TRIGGER set_updated_at_agency_phones
BEFORE UPDATE ON restructured.agency_phones
FOR EACH ROW EXECUTE FUNCTION restructured.set_updated_at();

CREATE TRIGGER set_updated_at_lead_distributions
BEFORE UPDATE ON restructured.lead_distributions
FOR EACH ROW EXECUTE FUNCTION restructured.set_updated_at();

CREATE TRIGGER set_updated_at_agency_payments
BEFORE UPDATE ON restructured.agency_payments
FOR EACH ROW EXECUTE FUNCTION restructured.set_updated_at();

-- 5. ÍNDICES

CREATE INDEX IF NOT EXISTS idx_lead_distributions_agency_id ON restructured.lead_distributions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_phones_agency_id ON restructured.agency_phones(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_distributions_server_id ON restructured.lead_distributions(server_id);
CREATE INDEX IF NOT EXISTS idx_agency_payments_agency_id ON restructured.agency_payments(agency_id);

-- 6. RLS Y POLÍTICAS

ALTER TABLE restructured.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.agency_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.lead_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.agency_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything" ON restructured.agencies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.agency_phones FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.lead_distributions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.agency_payments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL); 