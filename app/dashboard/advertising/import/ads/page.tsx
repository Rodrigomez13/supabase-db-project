"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CsvRow {
  ad_name: string;
  ad_id: string;
  creative_type: string;
  status: string;
  adset_name: string;
  adset_id: string;
  campaign_name: string;
  campaign_id: string;
  objective: string;
  bm_name: string;
  bm_id: string;
  portfolio_name: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: string;
}

export default function ImportAdsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());

        // Validar encabezados
        const requiredHeaders = [
          "ad_name",
          "ad_id",
          "creative_type",
          "status",
          "adset_name",
          "adset_id",
          "campaign_name",
          "campaign_id",
          "objective",
          "bm_name",
          "bm_id",
          "portfolio_name",
        ];

        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );
        if (missingHeaders.length > 0) {
          setError(
            `Faltan encabezados requeridos: ${missingHeaders.join(", ")}`
          );
          return;
        }

        const parsedData: CsvRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          parsedData.push(row as CsvRow);
        }

        setCsvData(parsedData);
        setPreviewData(parsedData.slice(0, 5)); // Mostrar solo las primeras 5 filas
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setError(
          "Error al procesar el archivo CSV. Asegúrate de que el formato sea correcto."
        );
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!csvData.length) {
      setError("No hay datos para importar");
      return;
    }

    setImporting(true);
    setProgress(0);
    setResults([]);
    setError(null);
    setSuccess(null);

    const importResults: ImportResult[] = [];
    let successCount = 0;

    try {
      // Procesar cada fila
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        setProgress(Math.round(((i + 1) / csvData.length) * 100));

        try {
          // 1. Verificar/crear portfolio
          let portfolioId = null;
          if (row.portfolio_name) {
            const { data: portfolios } = await supabase
              .from("portfolios")
              .select("id")
              .eq("name", row.portfolio_name)
              .limit(1);

            if (portfolios && portfolios.length > 0) {
              portfolioId = portfolios[0].id;
            } else {
              const { data: newPortfolio } = await supabase
                .from("portfolios")
                .insert({
                  name: row.portfolio_name,
                  status: "active",
                })
                .select("id")
                .single();

              portfolioId = newPortfolio?.id;
            }
          }

          // 2. Verificar/crear business manager
          let bmId = null;
          if (row.bm_name && row.bm_id) {
            const { data: bms } = await supabase
              .from("business_managers")
              .select("id")
              .eq("bm_id", row.bm_id)
              .limit(1);

            if (bms && bms.length > 0) {
              bmId = bms[0].id;
            } else {
              const { data: newBM } = await supabase
                .from("business_managers")
                .insert({
                  name: row.bm_name,
                  bm_id: row.bm_id,
                  status: "active",
                  portfolio_id: portfolioId,
                })
                .select("id")
                .single();

              bmId = newBM?.id;
            }
          }

          // 3. Verificar/crear campaña
          let campaignId = null;
          if (row.campaign_name && row.campaign_id) {
            const { data: campaigns } = await supabase
              .from("campaigns")
              .select("id")
              .eq("campaign_id", row.campaign_id)
              .limit(1);

            if (campaigns && campaigns.length > 0) {
              campaignId = campaigns[0].id;
            } else {
              const { data: newCampaign } = await supabase
                .from("campaigns")
                .insert({
                  name: row.campaign_name,
                  campaign_id: row.campaign_id,
                  objective: row.objective || "CONVERSIONS",
                  status: "active",
                  business_manager_id: bmId,
                })
                .select("id")
                .single();

              campaignId = newCampaign?.id;
            }
          }

          // 4. Verificar/crear conjunto de anuncios
          let adSetId = null;
          if (row.adset_name && row.adset_id) {
            const { data: adSets } = await supabase
              .from("ad_sets")
              .select("id")
              .eq("adset_id", row.adset_id)
              .limit(1);

            if (adSets && adSets.length > 0) {
              adSetId = adSets[0].id;
            } else {
              const { data: newAdSet } = await supabase
                .from("ad_sets")
                .insert({
                  name: row.adset_name,
                  adset_id: row.adset_id,
                  status: "active",
                  campaign_id: campaignId,
                })
                .select("id")
                .single();

              adSetId = newAdSet?.id;
            }
          }

          // 5. Verificar/crear anuncio
          if (row.ad_name && row.ad_id) {
            const { data: ads } = await supabase
              .from("ads")
              .select("id")
              .eq("ad_id", row.ad_id)
              .limit(1);

            if (ads && ads.length > 0) {
              // Actualizar anuncio existente
              await supabase
                .from("ads")
                .update({
                  name: row.ad_name,
                  status: row.status || "active",
                  creative_type: row.creative_type || "image",
                  adset_id: adSetId,
                })
                .eq("id", ads[0].id);

              importResults.push({
                success: true,
                message: `Anuncio actualizado: ${row.ad_name}`,
              });
            } else {
              // Crear nuevo anuncio
              await supabase.from("ads").insert({
                name: row.ad_name,
                ad_id: row.ad_id,
                status: row.status || "active",
                creative_type: row.creative_type || "image",
                adset_id: adSetId,
              });

              importResults.push({
                success: true,
                message: `Anuncio creado: ${row.ad_name}`,
              });
            }

            successCount++;
          } else {
            importResults.push({
              success: false,
              message: `Fila ${i + 1}: Faltan datos de anuncio obligatorios`,
            });
          }
        } catch (err: any) {
          console.error(`Error importing row ${i + 1}:`, err);
          importResults.push({
            success: false,
            message: `Error en fila ${i + 1}`,
            details: err.message,
          });
        }
      }

      setResults(importResults);
      setSuccess(
        `Importación completada. ${successCount} de ${csvData.length} anuncios importados correctamente.`
      );
    } catch (err: any) {
      console.error("Error during import:", err);
      setError(`Error durante la importación: ${err.message}`);
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const downloadTemplate = () => {
    const headers =
      "ad_name,ad_id,creative_type,status,adset_name,adset_id,campaign_name,campaign_id,objective,bm_name,bm_id,portfolio_name";
    const sampleRow =
      "Anuncio Ejemplo,123456789,image,active,Conjunto Ejemplo,987654321,Campaña Ejemplo,123123123,CONVERSIONS,BM Ejemplo,111222333,Portfolio Ejemplo";
    const csvContent = `${headers}\n${sampleRow}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_anuncios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-usina-text-primary">
            Importar Anuncios
          </h1>
          <p className="text-usina-text-secondary">
            Importa anuncios y sus relaciones desde un archivo CSV
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-usina-card bg-background/5 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-usina-text-primary">
              Instrucciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-usina-text-primary">
                1. Descarga la plantilla
              </h3>
              <p className="text-sm text-usina-text-secondary">
                Descarga nuestra plantilla CSV y complétala con tus datos de
                anuncios.
              </p>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-usina-text-primary">
                2. Completa los datos
              </h3>
              <p className="text-sm text-usina-text-secondary">
                Asegúrate de incluir todos los campos requeridos:
              </p>
              <ul className="text-sm text-usina-text-secondary space-y-1">
                <li>- ad_name: Nombre del anuncio</li>
                <li>- ad_id: ID del anuncio</li>
                <li>
                  - creative_type: Tipo de creativo (image, video, carousel)
                </li>
                <li>- status: Estado del anuncio (active, paused)</li>
                <li>- adset_name: Nombre del conjunto de anuncios</li>
                <li>- adset_id: ID del conjunto de anuncios</li>
                <li>- campaign_name: Nombre de la campaña</li>
                <li>- campaign_id: ID de la campaña</li>
                <li>- objective: Objetivo de la campaña</li>
                <li>- bm_name: Nombre del Business Manager</li>
                <li>- bm_id: ID del Business Manager</li>
                <li>- portfolio_name: Nombre del Portfolio</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-usina-text-primary">
                3. Sube el archivo
              </h3>
              <p className="text-sm text-usina-text-secondary">
                Sube tu archivo CSV y revisa la vista previa antes de importar.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-usina-text-primary">
                4. Importa los datos
              </h3>
              <p className="text-sm text-usina-text-secondary">
                Haz clic en "Importar" para comenzar el proceso. El sistema
                creará automáticamente las relaciones necesarias.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-usina-card bg-background/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-usina-text-primary">
              Importar Anuncios
            </CardTitle>
            <CardDescription>
              Sube un archivo CSV con los datos de tus anuncios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background/10 border-usina-card/50 hover:bg-background/20"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="w-10 h-10 mb-3 text-usina-text-secondary" />
                  <p className="mb-2 text-sm text-usina-text-primary">
                    <span className="font-semibold">Haz clic para subir</span> o
                    arrastra y suelta
                  </p>
                  <p className="text-xs text-usina-text-secondary">
                    CSV (Valores separados por comas)
                  </p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </label>
            </div>

            {file && (
              <div className="p-3 bg-background/20 rounded-md">
                <p className="text-sm text-usina-text-primary">
                  <span className="font-medium">Archivo seleccionado:</span>{" "}
                  {file.name}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {previewData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-usina-text-primary">
                  Vista previa
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-usina-text-secondary">
                          Anuncio
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          ID Anuncio
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Conjunto
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          Campaña
                        </TableHead>
                        <TableHead className="text-usina-text-secondary">
                          BM
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-usina-text-primary">
                            {row.ad_name}
                          </TableCell>
                          <TableCell className="text-usina-text-secondary">
                            {row.ad_id}
                          </TableCell>
                          <TableCell className="text-usina-text-secondary">
                            {row.adset_name}
                          </TableCell>
                          <TableCell className="text-usina-text-secondary">
                            {row.campaign_name}
                          </TableCell>
                          <TableCell className="text-usina-text-secondary">
                            {row.bm_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-usina-text-secondary">
                  Mostrando {previewData.length} de {csvData.length} filas
                </p>
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-usina-text-secondary">
                    Importando...
                  </span>
                  <span className="text-sm text-usina-text-secondary">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <h3 className="font-medium text-usina-text-primary">
                  Resultados
                </h3>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`text-xs p-1 rounded ${
                        result.success
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      {result.message}
                      {result.details && (
                        <div className="text-xs opacity-75 mt-0.5">
                          {result.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!csvData.length || importing}
              className="bg-usina-primary hover:bg-usina-secondary"
            >
              {importing ? (
                <>Importando...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {csvData.length} Anuncios
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
