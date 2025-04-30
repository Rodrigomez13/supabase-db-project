"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTableData } from "@/lib/check-connection";

export default function TableInfoPage() {
  const [selectedTable, setSelectedTable] = useState<string>("franchises");
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tables = [
    "servers",
    "franchises",
    "campaigns",
    "ads",
    "employees",
    "lead_distributions",
  ];

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTableData(tableName);

      if (result.success) {
        setTableData(result.data || []);
      } else {
        setError(result.error || "Error al cargar los datos");
        setTableData([]);
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTableColumns = () => {
    if (tableData.length === 0) return null;

    const columns = Object.keys(tableData[0]);

    return (
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
    );
  };

  const renderTableRows = () => {
    if (tableData.length === 0) return null;

    const columns = Object.keys(tableData[0]);

    return (
      <TableBody>
        {tableData.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={`${index}-${column}`}>
                {typeof row[column] === "object"
                  ? JSON.stringify(row[column])
                  : String(row[column] || "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Información de Tablas</h1>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecciona una tabla" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => loadTableData(selectedTable)}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Recargar"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Tabla: {selectedTable}
            {tableData.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({tableData.length} registros)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Cargando datos...</div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-8">No hay datos disponibles</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                {renderTableColumns()}
                {renderTableRows()}
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
