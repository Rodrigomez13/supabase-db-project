-- Crear nuevo schema para la estructura optimizada
CREATE SCHEMA IF NOT EXISTS optimized;

-- Establecer permisos para el schema
GRANT USAGE ON SCHEMA optimized TO authenticated, anon, service_role;
GRANT ALL ON SCHEMA optimized TO service_role;

-- Configurar búsqueda de schema
ALTER DATABASE postgres SET search_path TO public, optimized;

-- Comentario para documentar el propósito del schema
COMMENT ON SCHEMA optimized IS 'Schema optimizado para la gestión de Usina Leads con estructura normalizada y sin duplicaciones';

-- =============================================
-- MÓDULO PUBLICIDAD
-- =============================================

-- Tabla: apis (APIs de WhatsApp)
CREATE TABLE IF NOT EXISTS optimized.apis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    token TEXT,
    phone TEXT,
    messages_per_day INTEGER,
    monthly_cost NUMERIC,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: portfolios (Carteras publicitarias)
CREATE TABLE IF NOT EXISTS optimized.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_id TEXT,
    spend_limit NUMERIC,
    status TEXT DEFAULT 'Activo',
    wallet_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: ads_account (Cuentas publicitarias)
CREATE TABLE IF NOT EXISTS optimized.ads_account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_id TEXT,
    status TEXT DEFAULT 'Activo',
    portfolio_id UUID REFERENCES optimized.portfolios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: business_managers (Business Managers de Meta)
CREATE TABLE IF NOT EXISTS optimized.business_managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bm_id TEXT,
    status TEXT DEFAULT 'Activo',
    ads_account_id UUID REFERENCES optimized.ads_account(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: campaigns (Campañas publicitarias)
CREATE TABLE IF NOT EXISTS optimized.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    campaign_id TEXT,
    objective TEXT,
    status TEXT DEFAULT 'Activo',
    business_manager_id UUID REFERENCES optimized.business_managers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: ads_sets (Conjuntos de anuncios)
CREATE TABLE IF NOT EXISTS optimized.ads_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    adset_id TEXT,
    budget NUMERIC,
    status TEXT DEFAULT 'Activo',
    campaign_id UUID REFERENCES optimized.campaigns(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: ads (Anuncios individuales)
CREATE TABLE IF NOT EXISTS optimized.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ad_id TEXT,
    creative_type TEXT,
    emoji TEXT,
    status TEXT DEFAULT 'Activo',
    adset_id UUID REFERENCES optimized.ads_sets(id),
    total_leads INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: servers (Servidores con diferentes coeficientes)
CREATE TABLE IF NOT EXISTS optimized.servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    coefficient NUMERIC NOT NULL,
    status TEXT DEFAULT 'Activo',
    description TEXT,
    default_franchise_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: server_ads (Relación entre servidores y anuncios activos)
CREATE TABLE IF NOT EXISTS optimized.server_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES optimized.servers(id),
    ad_id UUID REFERENCES optimized.ads(id),
    api_id UUID REFERENCES optimized.apis(id),
    daily_budget NUMERIC DEFAULT 0,
    leads INTEGER DEFAULT 0,
    loads INTEGER DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(server_id, ad_id, date)
);

-- Tabla: ad_metrics (Métricas históricas de anuncios)
CREATE TABLE IF NOT EXISTS optimized.ad_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES optimized.ads(id),
    server_id UUID REFERENCES optimized.servers(id),
    date DATE NOT NULL,
    leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ad_id, server_id, date)
);

-- Tabla: server_daily_records (Registros diarios consolidados por servidor)
CREATE TABLE IF NOT EXISTS optimized.server_daily_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES optimized.servers(id),
    date DATE NOT NULL,
    leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    fb_spend NUMERIC DEFAULT 0,
    cost_per_lead NUMERIC DEFAULT 0,
    cost_per_conversion NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(server_id, date)
);

-- Tabla: leads_distributions (Distribución de leads a franquicias)
CREATE TABLE IF NOT EXISTS optimized.leads_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    server_id UUID REFERENCES optimized.servers(id),
    ad_id UUID REFERENCES optimized.ads(id),
    franchise_id UUID,
    franchise_phone_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: loads_distributions (Distribución de conversiones a franquicias)
CREATE TABLE IF NOT EXISTS optimized.loads_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES optimized.leads_distributions(id),
    date DATE DEFAULT CURRENT_DATE,
    server_id UUID REFERENCES optimized.servers(id),
    ad_id UUID REFERENCES optimized.ads(id),
    franchise_id UUID,
    franchise_phone_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MÓDULO FINANZAS
-- =============================================

-- Tabla: payment_methods (Métodos de pago)
CREATE TABLE IF NOT EXISTS optimized.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: wallets (Billeteras)
CREATE TABLE IF NOT EXISTS optimized.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: transactions (Transacciones financieras)
CREATE TABLE IF NOT EXISTS optimized.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
    category TEXT NOT NULL, -- 'admin', 'agency', 'salary', 'ads'
    concept TEXT,
    amount NUMERIC NOT NULL,
    wallet_id UUID REFERENCES optimized.wallets(id),
    payment_method_id UUID REFERENCES optimized.payment_methods(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    related_entity_type TEXT, -- 'franchise', 'employee', 'ad', etc.
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expense_admin (Gastos administrativos)
CREATE TABLE IF NOT EXISTS optimized.expense_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    category TEXT,
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method_id UUID REFERENCES optimized.payment_methods(id),
    transaction_id UUID REFERENCES optimized.transactions(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expense_agencies (Gastos de agencias)
CREATE TABLE IF NOT EXISTS optimized.expense_agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    franchise_id UUID,
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method_id UUID REFERENCES optimized.payment_methods(id),
    transaction_id UUID REFERENCES optimized.transactions(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expense_salaries (Gastos de salarios)
CREATE TABLE IF NOT EXISTS optimized.expense_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    employee_id UUID,
    month TEXT NOT NULL,
    base_salary NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    total_payment NUMERIC,
    payment_method_id UUID REFERENCES optimized.payment_methods(id),
    transaction_id UUID REFERENCES optimized.transactions(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: expense_ads (Gastos de anuncios)
CREATE TABLE IF NOT EXISTS optimized.expense_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    ad_id UUID REFERENCES optimized.ads(id),
    server_id UUID REFERENCES optimized.servers(id),
    amount NUMERIC NOT NULL,
    wallet_id UUID REFERENCES optimized.wallets(id),
    transaction_id UUID REFERENCES optimized.transactions(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MÓDULO AGENCIAS
-- =============================================

-- Tabla: agency_data (Datos de agencias/franquicias)
CREATE TABLE IF NOT EXISTS optimized.agency_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    password TEXT,
    cvu TEXT,
    alias TEXT,
    owner TEXT,
    link TEXT,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: agency_phones (Teléfonos de agencias)
CREATE TABLE IF NOT EXISTS optimized.agency_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES optimized.agency_data(id),
    order_number INTEGER,
    phone_number TEXT,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: phone_goals (Metas diarias por teléfono)
CREATE TABLE IF NOT EXISTS optimized.phone_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_id UUID REFERENCES optimized.agency_phones(id),
    daily_goal INTEGER,
    leads_assigned INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(phone_id, date)
);

-- Tabla: agency_finances (Finanzas de agencias)
CREATE TABLE IF NOT EXISTS optimized.agency_finances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES optimized.agency_data(id),
    date DATE DEFAULT CURRENT_DATE,
    ad_spend NUMERIC DEFAULT 0,
    coefficient NUMERIC,
    total_with_increase NUMERIC,
    available_funds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: agency_metrics (Métricas consolidadas por agencia)
CREATE TABLE IF NOT EXISTS optimized.agency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES optimized.agency_data(id),
    date DATE DEFAULT CURRENT_DATE,
    leads_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    ad_spend NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(franchise_id, date)
);

-- Tabla: agency_assingament (Asignación de leads a agencias)
CREATE TABLE IF NOT EXISTS optimized.agency_assingament (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    server_id UUID REFERENCES optimized.servers(id),
    franchise_id UUID REFERENCES optimized.agency_data(id),
    franchise_phone_id UUID REFERENCES optimized.agency_phones(id),
    leads_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MÓDULO PERSONAL
-- =============================================

-- Tabla: roles (Roles de empleados)
CREATE TABLE IF NOT EXISTS optimized.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    base_salary NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: shifts (Turnos de trabajo)
CREATE TABLE IF NOT EXISTS optimized.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: employees_data (Datos de empleados)
CREATE TABLE IF NOT EXISTS optimized.employees_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role_id UUID REFERENCES optimized.roles(id),
    shift_id UUID REFERENCES optimized.shifts(id),
    account TEXT,
    cvu TEXT,
    alias TEXT,
    email TEXT,
    phone TEXT,
    day_off TEXT,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: employees_finances (Finanzas de empleados)
CREATE TABLE IF NOT EXISTS optimized.employees_finances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES optimized.employees_data(id),
    month TEXT NOT NULL,
    base_salary NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    total_payment NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: attendance_records (Registro diario de asistencia)
CREATE TABLE IF NOT EXISTS optimized.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES optimized.employees_data(id),
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    hours_worked NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Tabla: hours_worked (Horas trabajadas)
CREATE TABLE IF NOT EXISTS optimized.hours_worked (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES optimized.employees_data(id),
    date DATE DEFAULT CURRENT_DATE,
    hours_worked NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    attendance_record_id UUID REFERENCES optimized.attendance_records(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONFIGURACIÓN DEL SISTEMA
-- =============================================

-- Tabla: system_config (Configuración del sistema)
CREATE TABLE IF NOT EXISTS optimized.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PERMISOS DE TABLAS
-- =============================================

-- Otorgar permisos a las tablas para los roles de Supabase
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT information_schema.tables.table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'optimized' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON optimized.%I TO authenticated', t_name);
        EXECUTE format('GRANT SELECT ON optimized.%I TO anon', t_name);
        EXECUTE format('GRANT ALL ON optimized.%I TO service_role', t_name);
    END LOOP;
END
$$;

-- Habilitar RLS en todas las tablas
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT information_schema.tables.table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'optimized' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE optimized.%I ENABLE ROW LEVEL SECURITY', t_name);
        
        -- Crear política para permitir a usuarios autenticados ver todos los datos
        EXECUTE format('CREATE POLICY "Allow authenticated users to read all data" ON optimized.%I FOR SELECT USING (auth.uid() IS NOT NULL)', t_name);
        
        -- Crear política para permitir a usuarios autenticados insertar datos
        EXECUTE format('CREATE POLICY "Allow authenticated users to insert data" ON optimized.%I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', t_name);
        
        -- Crear política para permitir a usuarios autenticados actualizar datos
        EXECUTE format('CREATE POLICY "Allow authenticated users to update data" ON optimized.%I FOR UPDATE USING (auth.uid() IS NOT NULL)', t_name);
        
        -- Crear política para permitir a usuarios autenticados eliminar datos
        EXECUTE format('CREATE POLICY "Allow authenticated users to delete data" ON optimized.%I FOR DELETE USING (auth.uid() IS NOT NULL)', t_name);
    END LOOP;
END
$$;
