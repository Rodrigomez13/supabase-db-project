"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiagnosticDistributions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("distributions");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Cargar franquicias
      const { data: franchiseData, error: franchiseError } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (franchiseError) throw franchiseError;
      setFranchises(franchiseData || []);

      // Cargar teléfonos
      const { data: phoneData, error: phoneError } = await supabase
        .from("franchise_phones")
        .select("id, franchise_id, phone_number, is_active, order_number")
        .order("franchise_id, order_number");

      if (phoneError) throw phoneError;
      setPhones(phoneData || []);

      // Cargar distribuciones
      const { data: distData, error: distError } = await supabase
        .from("daily_distribution")
        .select(
          "id, date, server_id, franchise_id, franchise_phone_id, leads_count, conversions_count"
        )
        .order("date", { ascending: false })
        .limit(100);

      if (distError) throw distError;
      setDistributions(distData || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fixDistributions() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // 1. Verificar si la columna conversions_count existe en daily_distribution
      const { data: columns, error: columnsError } = await supabase.rpc(
        "get_table_columns",
        {
          table_name: "daily_distribution",
        }
      );

      if (columnsError) throw columnsError;

      const hasConversionsCount = columns.some(
        (col: any) => col.column_name === "conversions_count"
      );

      if (!hasConversionsCount) {
        // Agregar la columna conversions_count
        await supabase.rpc("exec_sql", {
          sql_query: `
          ALTER TABLE daily_distribution 
          ADD COLUMN IF NOT EXISTS conversions_count INTEGER DEFAULT 0
          `,
        });
      }

      // 2. Verificar si hay distribuciones sin franchise_phone_id
      const { data: missingPhones, error: missingError } = await supabase
        .from("daily_distribution")
        .select("id, franchise_id")
        .is("franchise_phone_id", null)
        .not("franchise_id", "is", null);

      if (missingError) throw missingError;

      // 3. Corregir distribuciones sin franchise_phone_id
      if (missingPhones && missingPhones.length > 0) {
        for (const dist of missingPhones) {
          // Buscar un teléfono activo para esta franquicia
          const { data: phone, error: phoneError } = await supabase
            .from("franchise_phones")
            .select("id")
            .eq("franchise_id", dist.franchise_id)
            .eq("is_active", true)
            .order("order_number")
            .limit(1)
            .single();

          if (phoneError) continue;

          // Actualizar la distribución
          await supabase
            .from("daily_distribution")
            .update({ franchise_phone_id: phone.id })
            .eq("id", dist.id);
        }
      }

      setSuccess(
        `Diagnóstico completado. Se verificaron ${
          distributions.length
        } distribuciones y se corrigieron ${
          missingPhones?.length || 0
        } registros.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message || "Error al corregir distribuciones");
      console.error("Error al corregir distribuciones:", err);
    } finally {
      setLoading(false);
    }
  }

  function getFranchiseName(id: string) {
    const franchise = franchises.find((f) => f.id === id);
    return franchise ? franchise.name : "Desconocida";
  }

  function getPhoneNumber(id: string) {
    const phone = phones.find((p) => p.id === id);
    return phone ? phone.phone_number : "Desconocido";
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Distribuciones</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-6">
        <Button onClick={loadData} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar datos"}
        </Button>
        <Button onClick={fixDistributions} disabled={loading} variant="outline">
          Corregir distribuciones
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="distributions">Distribuciones</TabsTrigger>
          <TabsTrigger value="phones">Teléfonos por Franquicia</TabsTrigger>
        </TabsList>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Últimas 100 distribuciones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando distribuciones...</p>
              ) : distributions.length === 0 ? (
                <p>No hay distribuciones registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Fecha</th>
                        <th className="border p-2 text-left">Franquicia</th>
                        <th className="border p-2 text-left">Teléfono</th>
                        <th className="border p-2 text-center">Leads</th>
                        <th className="border p-2 text-center">Conversiones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.map((dist) => (
                        <tr key={dist.id} className="hover:bg-gray-50">
                          <td className="border p-2">
                            {new Date(dist.date).toLocaleDateString()}
                          </td>
                          <td className="border p-2">
                            {getFranchiseName(dist.franchise_id)}
                          </td>
                          <td className="border p-2">
                            {dist.franchise_phone_id
                              ? getPhoneNumber(dist.franchise_phone_id)
                              : "No asignado"}
                          </td>
                          <td className="border p-2 text-center">
                            {dist.leads_count || 0}
                          </td>
                          <td className="border p-2 text-center">
                            {dist.conversions_count || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phones">
          <Card>
            <CardHeader>
              <CardTitle>Teléfonos por Franquicia</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando teléfonos...</p>
              ) : (
                <div>
                  {franchises.map((franchise) => {
                    const franchisePhones = phones.filter(
                      (p) => p.franchise_id === franchise.id
                    );
                    return (
                      <div key={franchise.id} className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">
                          {franchise.name}
                        </h3>
                        {franchisePhones.length === 0 ? (
                          <p className="text-red-500">
                            No hay teléfonos registrados para esta franquicia.
                          </p>
                        ) : (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Número</th>
                                <th className="border p-2 text-center">
                                  Orden
                                </th>
                                <th className="border p-2 text-center">
                                  Estado
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {franchisePhones.map((phone) => (
                                <tr key={phone.id} className="hover:bg-gray-50">
                                  <td className="border p-2">
                                    {phone.phone_number}
                                  </td>
                                  <td className="border p-2 text-center">
                                    {phone.order_number || "N/A"}
                                  </td>
                                  <td
                                    className={`border p-2 text-center ${
                                      phone.is_active
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {phone.is_active ? "Activo" : "Inactivo"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
