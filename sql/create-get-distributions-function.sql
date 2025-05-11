-- Función para obtener distribuciones de leads por franquicia y fecha
CREATE OR REPLACE FUNCTION get_lead_distributions(p_date DATE, p_server_id UUID DEFAULT NULL)
RETURNS TABLE (
  franchise_id UUID,
  franchise_name TEXT,
  leads_count BIGINT,
  conversions_count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_leads BIGINT;
BEGIN
  -- Obtener el total de leads para calcular porcentajes
  SELECT COALESCE(SUM(ld.leads_count), 0)
  INTO total_leads
  FROM lead_distributions ld
  WHERE ld.date = p_date
  AND (p_server_id IS NULL OR ld.server_id = p_server_id);
  
  -- Si no hay leads, devolver un conjunto vacío
  IF total_leads = 0 THEN
    RETURN;
  END IF;
  
  -- Devolver las distribuciones agrupadas por franquicia
  RETURN QUERY
  SELECT 
    f.id AS franchise_id,
    f.name AS franchise_name,
    COALESCE(SUM(ld.leads_count), 0) AS leads_count,
    COALESCE(SUM(ld.conversions_count), 0) AS conversions_count,
    CASE 
      WHEN total_leads > 0 THEN (COALESCE(SUM(ld.leads_count), 0)::NUMERIC / total_leads) * 100
      ELSE 0
    END AS percentage
  FROM 
    franchises f
  LEFT JOIN 
    lead_distributions ld ON ld.franchise_id = f.id AND ld.date = p_date
    AND (p_server_id IS NULL OR ld.server_id = p_server_id)
  GROUP BY 
    f.id, f.name
  ORDER BY 
    leads_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_lead_distributions(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_distributions(DATE) TO authenticated;
