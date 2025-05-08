"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ServerDailyRecord {
  id: string;
  server_id: string;
  date: string;
  total_leads: number;
  total_conversions: number;
  total_spent: number;
  conversion_rate: number;
  cost_per_lead: number;
  cost_per_conversion: number;
}

export function ServerDailyRecords({ serverId }: { serverId: string }) {
  const [records, setRecords] = useState<ServerDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDailyRecords() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("server_daily_records")
          .select("*")
          .eq("server_id", serverId)
          .order("date", { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error("Error fetching daily records:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDailyRecords();
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Cargando registros...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          No hay registros diarios para este servidor
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversiones</TableHead>
                <TableHead>Tasa</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>CPL</TableHead>
                <TableHead>CPC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{record.total_leads}</TableCell>
                  <TableCell>{record.total_conversions}</TableCell>
                  <TableCell>{record.conversion_rate?.toFixed(2)}%</TableCell>
                  <TableCell>${record.total_spent?.toFixed(2)}</TableCell>
                  <TableCell>${record.cost_per_lead?.toFixed(2)}</TableCell>
                  <TableCell>
                    ${record.cost_per_conversion?.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
