"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DailyRecord {
  id: string;
  date: string;
  leads: number;
  conversions: number;
  conversion_rate: number;
  fb_spend: number;
  fb_spend_with_imp: number;
  cost_per_lead: number;
  cost_per_conversion: number;
  cost_per_conversion_with_imp: number;
}

interface Server {
  id: string;
  name: string;
}

export default function ServerDailyRecordsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos del servidor
        const { data: serverData, error: serverError } = await supabase
          .from("servers")
          .select("id, name")
          .eq("id", params.id)
          .single();

        if (serverError) throw serverError;
        setServer(serverData);

        // Cargar registros diarios
        const { data: recordsData, error: recordsError } = await supabase
          .from("server_daily_records")
          .select("*")
          .eq("server_id", params.id)
          .order("date", { ascending: false });

        if (recordsError) throw recordsError;
        setRecords(recordsData || []);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  async function generateDailyRecord() {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      // Llamar a la función para generar el registro diario
      const { data, error } = await supabase.rpc(
        "generate_server_daily_record",
        {
          server_id_param: params.id,
          date_param: today,
        }
      );

      if (error) throw error;

      // Recargar los registros
      const { data: recordsData, error: recordsError } = await supabase
        .from("server_daily_records")
        .select("*")
        .eq("server_id", params.id)
        .order("date", { ascending: false });

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);
    } catch (err: any) {
      console.error("Error generating daily record:", err);
      setError(`Error al generar registro diario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !server) {
    return (
      <div className="flex justify-center items-center h-64">Cargando...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            Registros Diarios - {server?.name}
          </h1>
        </div>
        <Button onClick={generateDailyRecord}>Generar Registro de Hoy</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Registros Diarios</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros diarios para este servidor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Conv.</TableHead>
                    <TableHead>% Conv.</TableHead>
                    <TableHead>Gasto FB</TableHead>
                    <TableHead>Gasto FB + imp</TableHead>
                    <TableHead>$ Leads</TableHead>
                    <TableHead>$ Conv.</TableHead>
                    <TableHead>$ Conv. + imp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>{record.leads}</TableCell>
                      <TableCell>{record.conversions}</TableCell>
                      <TableCell>
                        {record.conversion_rate.toFixed(2)}%
                      </TableCell>
                      <TableCell>${record.fb_spend.toFixed(2)}</TableCell>
                      <TableCell>
                        ${record.fb_spend_with_imp.toFixed(2)}
                      </TableCell>
                      <TableCell>${record.cost_per_lead.toFixed(2)}</TableCell>
                      <TableCell>
                        ${record.cost_per_conversion.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        ${record.cost_per_conversion_with_imp.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
