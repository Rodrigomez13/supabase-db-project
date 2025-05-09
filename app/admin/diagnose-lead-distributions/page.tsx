"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DiagnoseLeadDistributionsPage() {
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    diagnoseTable();
  }, []);

  async function diagnoseTable() {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar si la tabla existe
      const { data: tableExists, error: tableError } = await supabase.rpc(
        "exec_sql",
        {
          sql_query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'lead_distributions'
          );
        `,
        }
      );

      if (tableError) {
        throw new Error(`Error al verificar tabla: ${tableError.message}`);
      }

      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        throw new Error("La tabla lead_distributions no existe");
      }

      // 2. Obtener información de la tabla
      const { data: tableInfo, error: infoError } = await supabase.rpc(
        "exec_sql",
        {
          sql_query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'lead_distributions'
          ORDER BY ordinal_position;
        `,
        }
      );

      if (infoError) {
        throw new Error(
          `Error al obtener información de la tabla: ${infoError.message}`
        );
      }

      setTableInfo(tableInfo);

      // 3. Obtener claves foráneas
      const { data: foreignKeys, error: fkError } = await supabase.rpc(
        "exec_sql",
        {
          sql_query: `
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'lead_distributions';
        `,
        }
      );

      if (fkError) {
        throw new Error(`Error al obtener claves foráneas: ${fkError.message}`);
      }

      setForeignKeys(foreignKeys || []);

      // 4. Realizar pruebas de diagnóstico
      const tests = [];

      // Prueba 1: Verificar si hay franquicias
      const { data: franchisesData, error: franchisesError } = await supabase
        .from("franchises")
        .select("id, name")
        .limit(5);

      tests.push({
        name: "Franquicias disponibles",
        success:
          !franchisesError && franchisesData && franchisesData.length > 0,
        message: franchisesError
          ? `Error: ${franchisesError.message}`
          : franchisesData && franchisesData.length > 0
          ? `Encontradas ${franchisesData.length} franquicias`
          : "No hay franquicias disponibles",
        data: franchisesData,
      });

      // Prueba 2: Verificar si hay teléfonos de franquicia
      const { data: phonesData, error: phonesError } = await supabase
        .from("franchise_phones")
        .select("id, franchise_id, phone_number, is_active")
        .limit(5);

      tests.push({
        name: "Teléfonos de franquicia disponibles",
        success: !phonesError && phonesData && phonesData.length > 0,
        message: phonesError
          ? `Error: ${phonesError.message}`
          : phonesData && phonesData.length > 0
          ? `Encontrados ${phonesData.length} teléfonos`
          : "No hay teléfonos de franquicia disponibles",
        data: phonesData,
      });

      // Prueba 3: Verificar si hay servidores
      const { data: serversData, error: serversError } = await supabase
        .from("servers")
        .select("id, name")
        .limit(5);

      tests.push({
        name: "Servidores disponibles",
        success: !serversError && serversData && serversData.length > 0,
        message: serversError
          ? `Error: ${serversError.message}`
          : serversData && serversData.length > 0
          ? `Encontrados ${serversData.length} servidores`
          : "No hay servidores disponibles",
        data: serversData,
      });

      // Prueba 4: Verificar si hay distribuciones de leads
      const { data: distributionsData, error: distributionsError } =
        await supabase
          .from("lead_distributions")
          .select("id, franchise_id, franchise_phone_id, server_id")
          .limit(5);

      tests.push({
        name: "Distribuciones de leads existentes",
        success: !distributionsError,
        message: distributionsError
          ? `Error: ${distributionsError.message}`
          : distributionsData && distributionsData.length > 0
          ? `Encontradas ${distributionsData.length} distribuciones`
          : "No hay distribuciones de leads",
        data: distributionsData,
      });

      // Prueba 5: Verificar permisos de la tabla
      const { data: permissionsData, error: permissionsError } =
        await supabase.rpc("exec_sql", {
          sql_query: `
          SELECT grantee, privilege_type
          FROM information_schema.table_privileges
          WHERE table_schema = 'public'
          AND table_name = 'lead_distributions';
        `,
        });

      tests.push({
        name: "Permisos de la tabla",
        success:
          !permissionsError && permissionsData && permissionsData.length > 0,
        message: permissionsError
          ? `Error: ${permissionsError.message}`
          : permissionsData && permissionsData.length > 0
          ? `Encontrados ${permissionsData.length} permisos`
          : "No se encontraron permisos",
        data: permissionsData,
      });

      setTestResults(tests);
    } catch (err: any) {
      console.error("Error en diagnóstico:", err);
      setError(err.message || "Error desconocido durante el diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Tabla Lead Distributions</CardTitle>
          <CardDescription>
            Esta herramienta analiza la estructura y relaciones de la tabla
            lead_distributions para identificar posibles problemas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={diagnoseTable}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Actualizar diagnóstico
                </>
              )}
            </Button>
          </div>

          {tableInfo && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Estructura de la tabla
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Columna</TableHead>
                    <TableHead>Tipo de dato</TableHead>
                    <TableHead>¿Permite NULL?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableInfo.map((column: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{column.column_name}</TableCell>
                      <TableCell>{column.data_type}</TableCell>
                      <TableCell>
                        {column.is_nullable === "YES" ? "Sí" : "No"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {foreignKeys && foreignKeys.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Claves foráneas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de restricción</TableHead>
                    <TableHead>Columna</TableHead>
                    <TableHead>Tabla referenciada</TableHead>
                    <TableHead>Columna referenciada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foreignKeys.map((fk: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{fk.constraint_name}</TableCell>
                      <TableCell>{fk.column_name}</TableCell>
                      <TableCell>{fk.foreign_table_name}</TableCell>
                      <TableCell>{fk.foreign_column_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {testResults && testResults.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Pruebas de diagnóstico
              </h3>
              <div className="space-y-4">
                {testResults.map((test, index) => (
                  <Alert
                    key={index}
                    variant={test.success ? "default" : "destructive"}
                  >
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>{test.name}</AlertTitle>
                    </div>
                    <AlertDescription>{test.message}</AlertDescription>
                    {test.data && test.data.length > 0 && (
                      <div className="mt-2 text-xs overflow-auto max-h-32">
                        <pre>{JSON.stringify(test.data, null, 2)}</pre>
                      </div>
                    )}
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
