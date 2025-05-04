"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface DailyRecord {
  id: string;
  date: string;
  total_leads: number;
  total_conversions: number;
  total_spent: number;
  conversion_rate: number;
  cost_per_lead: number;
  cost_per_conversion: number;
  created_at: string;
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
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (params.id) {
      fetchServerInfo();
      fetchDailyRecords();
    }
  }, [params.id]);

  async function fetchServerInfo() {
    try {
      const { data, error } = await supabase
        .from("servers")
        .select("id, name")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setServer(data);
    } catch (err: any) {
      console.error("Error fetching server info:", err);
      setError(`Error al cargar información del servidor: ${err.message}`);
    }
  }

  async function fetchDailyRecords() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("server_daily_records")
        .select("*")
        .eq("server_id", params.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching daily records:", err);
      setError(`Error al cargar registros diarios: ${err.message}`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function filterByDate(selectedDate: Date | undefined) {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setDate(selectedDate);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("server_daily_records")
        .select("*")
        .eq("server_id", params.id)
        .eq("date", formattedDate)
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error filtering records:", err);
      setError(`Error al filtrar registros: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function clearFilter() {
    setDate(undefined);
    fetchDailyRecords();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/servers/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-usina-text-primary">
              Registros Diarios: {server?.name || "Cargando..."}
            </h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={filterByDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {date && (
            <Button variant="outline" onClick={clearFilter}>
              Mostrar Todos
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-usina-text-secondary">
          Cargando registros diarios...
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-usina-text-secondary">
              No hay registros diarios para este servidor
              {date ? ` en la fecha ${format(date, "dd/MM/yyyy")}` : ""}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Registros Diarios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversiones</TableHead>
                  <TableHead>Tasa de Conversión</TableHead>
                  <TableHead>Gasto Total</TableHead>
                  <TableHead>Costo por Lead</TableHead>
                  <TableHead>Costo por Conversión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), "dd 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>{record.total_leads}</TableCell>
                    <TableCell>{record.total_conversions}</TableCell>
                    <TableCell>{record.conversion_rate.toFixed(1)}%</TableCell>
                    <TableCell>${record.total_spent.toFixed(2)}</TableCell>
                    <TableCell>${record.cost_per_lead.toFixed(2)}</TableCell>
                    <TableCell>
                      ${record.cost_per_conversion.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
