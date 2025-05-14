-- 1. EMPLEADOS Y ASISTENCIA

CREATE TABLE IF NOT EXISTS restructured.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    name TEXT NOT NULL,
    role TEXT,
    shift TEXT,
    account TEXT,
    salary NUMERIC,
    day_off TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES restructured.employees(id),
    date DATE NOT NULL,
    hours_worked NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES restructured.employees(id),
    month TEXT NOT NULL,
    base_salary NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    total_payment NUMERIC,
    status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PUBLICIDAD Y SERVIDORES

CREATE TABLE IF NOT EXISTS restructured.server_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    server_id UUID REFERENCES public.servers(id),
    ad_id UUID,
    api_id UUID,
    daily_budget NUMERIC,
    leads INT DEFAULT 0,
    loads INT DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINANZAS Y GESTIÓN

CREATE TABLE IF NOT EXISTS restructured.financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    date DATE NOT NULL,
    leads INT DEFAULT 0,
    loads INT DEFAULT 0,
    ad_spend NUMERIC DEFAULT 0,
    income NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    date DATE NOT NULL,
    category TEXT,
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restructured.incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES restructured.agencies(id),
    date DATE NOT NULL,
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES Y RLS

CREATE INDEX IF NOT EXISTS idx_employees_agency_id ON restructured.employees(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON restructured.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON restructured.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_agency_id ON restructured.financial_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_expenses_agency_id ON restructured.expenses(agency_id);
CREATE INDEX IF NOT EXISTS idx_incomes_agency_id ON restructured.incomes(agency_id);

ALTER TABLE restructured.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.server_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE restructured.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything" ON restructured.employees FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.attendance FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.payroll FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.server_ads FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.financial_records FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.expenses FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can do everything" ON restructured.incomes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL); 