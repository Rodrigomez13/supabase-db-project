"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { execSQL } from "@/lib/exec-sql-function";

export default function CreateIncrementFunctionsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const executeSQL = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const sql = `
        -- Función para incrementar leads en server_ads
        CREATE OR REPLACE FUNCTION increment_server_ad_leads(p_server_id UUID, p_ad_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE server_ads
          SET leads = COALESCE(leads, 0) + 1
          WHERE server_id = p_server_id AND ad_id = p_ad_id;
          
          IF NOT FOUND THEN
            INSERT INTO server_ads (server_id, ad_id, leads, loads)
            VALUES (p_server_id, p_ad_id, 1, 0);
          END IF;
        END;
        $$ LANGUAGE plpgsql;

        -- Función para incrementar loads en server_ads
        CREATE OR REPLACE FUNCTION increment_server_ad_loads(p_server_id UUID, p_ad_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE server_ads
          SET loads = COALESCE(loads, 0) + 1
          WHERE server_id = p_server_id AND ad_id = p_ad_id;
          
          IF NOT FOUND THEN
            INSERT INTO server_ads (server_id, ad_id, leads, loads)
            VALUES (p_server_id, p_ad_id, 0, 1);
          END IF;
        END;
        $$ LANGUAGE plpgsql;

        -- Otorgar permisos
        GRANT EXECUTE ON FUNCTION increment_server_ad_leads(UUID, UUID) TO authenticated;
        GRANT EXECUTE ON FUNCTION increment_server_ad_loads(UUID, UUID) TO authenticated;
      `;

      const result = await execSQL(sql);

      if (!result.success) {
        throw new Error(result.error || "Error al ejecutar SQL");
      }

      setSuccess("Funciones de incremento creadas correctamente");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Crear Funciones de Incremento</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar SQL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Este proceso creará funciones para incrementar los contadores de
            leads y loads en la tabla server_ads.
          </p>

          <Button onClick={executeSQL} disabled={loading}>
            {loading ? "Ejecutando..." : "Crear Funciones"}
          </Button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
