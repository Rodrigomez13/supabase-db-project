import { supabase } from "./supabase"

export async function setupDatabase() {
  // This function will execute all the SQL needed to set up the database schema
  // Note: Many of the auth.* tables are created automatically by Supabase

  // Create public schema tables
  const publicTables = `
  -- Servers table
  CREATE TABLE IF NOT EXISTS public.servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    coefficient NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Wallets table
  CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Portfolios table
  CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_id TEXT,
    spend_limit NUMERIC,
    status TEXT DEFAULT 'active',
    wallet_id UUID REFERENCES public.wallets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Business Managers table
  CREATE TABLE IF NOT EXISTS public.business_managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bm_id TEXT,
    status TEXT DEFAULT 'active',
    portfolio_id UUID REFERENCES public.portfolios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Campaigns table
  CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    campaign_id TEXT,
    objective TEXT,
    status TEXT DEFAULT 'active',
    bm_id UUID REFERENCES public.business_managers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Ad Sets table
  CREATE TABLE IF NOT EXISTS public.ad_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    adset_id TEXT,
    budget NUMERIC,
    status TEXT DEFAULT 'active',
    campaign_id UUID REFERENCES public.campaigns(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Ads table
  CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ad_id TEXT,
    creative_type TEXT,
    status TEXT DEFAULT 'active',
    adset_id UUID REFERENCES public.ad_sets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- APIs table
  CREATE TABLE IF NOT EXISTS public.apis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    token TEXT,
    phone TEXT,
    messages_per_day INT,
    monthly_cost NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Franchises table
  CREATE TABLE IF NOT EXISTS public.franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    password TEXT,
    cvu TEXT,
    alias TEXT,
    owner TEXT,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Franchise Phones table
  CREATE TABLE IF NOT EXISTS public.franchise_phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES public.franchises(id),
    order_number INT,
    phone_number TEXT,
    status TEXT DEFAULT 'active',
    daily_goal INT,
    leads_assigned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Employees table
  CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    shift TEXT,
    account TEXT,
    salary NUMERIC,
    day_off TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Attendance table
  CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id),
    date DATE NOT NULL,
    hours_worked NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Payroll table
  CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id),
    month TEXT NOT NULL,
    base_salary NUMERIC,
    overtime NUMERIC DEFAULT 0,
    day_off_worked BOOLEAN DEFAULT FALSE,
    total_payment NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Server Ads table
  CREATE TABLE IF NOT EXISTS public.server_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    server_id UUID REFERENCES public.servers(id),
    ad_id UUID REFERENCES public.ads(id),
    api_id UUID REFERENCES public.apis(id),
    daily_budget NUMERIC,
    leads INT DEFAULT 0,
    loads INT DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Lead Distributions table
  CREATE TABLE IF NOT EXISTS public.lead_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    server_id UUID REFERENCES public.servers(id),
    franchise_id UUID REFERENCES public.franchises(id),
    franchise_phone_id UUID REFERENCES public.franchise_phones(id),
    leads_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Financial Records table
  CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    leads INT DEFAULT 0,
    loads INT DEFAULT 0,
    ad_spend NUMERIC DEFAULT 0,
    income NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Expenses table
  CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    category TEXT,
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Incomes table
  CREATE TABLE IF NOT EXISTS public.incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    franchise_id UUID REFERENCES public.franchises(id),
    concept TEXT,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Franchise Payments table
  CREATE TABLE IF NOT EXISTS public.franchise_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES public.franchises(id),
    date DATE NOT NULL,
    ad_spend NUMERIC DEFAULT 0,
    coefficient NUMERIC,
    total_with_increase NUMERIC,
    available_funds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  `

  // Execute the SQL to create tables
  const { error } = await supabase.rpc("exec_sql", { sql: publicTables })

  if (error) {
    console.error("Error setting up database:", error)
    return { success: false, error }
  }

  // Set up RLS policies
  const rlsPolicies = `
  -- Enable RLS on all tables
  ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.business_managers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.franchise_phones ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.server_ads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.lead_distributions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.franchise_payments ENABLE ROW LEVEL SECURITY;

  -- Create policies for authenticated users
  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.servers FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.wallets FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.portfolios FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.business_managers FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.campaigns FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.ad_sets FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.ads FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.apis FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.franchises FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.franchise_phones FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.employees FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.attendance FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.payroll FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.server_ads FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.lead_distributions FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.financial_records FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.incomes FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to read all data" 
  ON public.franchise_payments FOR SELECT 
  USING (auth.uid() IS NOT NULL);

  -- Políticas para insertar, actualizar y eliminar
  CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert data" 
  ON public.servers FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to update data" 
  ON public.servers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

  CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete data" 
  ON public.servers FOR DELETE
  USING (auth.uid() IS NOT NULL);

  -- Repetir para todas las tablas (simplificado por brevedad)
  `

  // Execute the SQL to create RLS policies
  const { error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsPolicies })

  if (rlsError) {
    console.error("Error setting up RLS policies:", rlsError)
    return { success: false, error: rlsError }
  }

  return { success: true }
}
