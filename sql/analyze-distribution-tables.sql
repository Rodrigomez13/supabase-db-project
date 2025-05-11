-- Analizar las tablas de distribución existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%distribution%';

-- Verificar la estructura de lead_distributions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lead_distributions';

-- Verificar la estructura de daily_distribution
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'daily_distribution';

-- Verificar si hay datos en lead_distributions
SELECT COUNT(*) FROM lead_distributions;

-- Verificar si hay datos en daily_distribution
SELECT COUNT(*) FROM daily_distribution;

-- Verificar las funciones que consultan distribuciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%distribution%';
