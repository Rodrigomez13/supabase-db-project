-- Añadir la columna business_manager_id a la tabla ad_sets
ALTER TABLE ad_sets ADD COLUMN IF NOT EXISTS business_manager_id UUID REFERENCES business_managers(id);

-- Crear un índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ad_sets_business_manager_id ON ad_sets(business_manager_id);
