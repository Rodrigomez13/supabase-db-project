"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, Info, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AdData {
  name: string
  platform: string
  ad_id: string
  ad_set_id: string
  campaign_id: string
  business_manager_id: string
  portfolio_id?: string
  account_id?: string
  status: string
  spent?: number
  leads?: number
  conversions?: number
}

export default function ImportAdsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<AdData[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
    errorMessages: string[]
  }>({
    total: 0,
    success: 0,
    errors: 0,
    errorMessages: [],
  })
  const [activeTab, setActiveTab] = useState("upload")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Formato no válido",
        description: "Por favor selecciona un archivo CSV",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())

      // Verificar que el CSV tiene las columnas requeridas
      const requiredColumns = ["name", "platform", "ad_id", "ad_set_id", "campaign_id", "business_manager_id", "status"]
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

      if (missingColumns.length > 0) {
        toast({
          title: "Formato de CSV incorrecto",
          description: `Faltan columnas requeridas: ${missingColumns.join(", ")}`,
          variant: "destructive",
        })
        setFile(null)
        return
      }

      // Parsear los datos (primeras 5 filas para preview)
      const previewRows = lines.slice(1, 6).filter((line) => line.trim() !== "")
      const parsedData = previewRows.map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const row: Record<string, any> = {}

        headers.forEach((header, index) => {
          if (["spent", "leads", "conversions"].includes(header)) {
            row[header] = values[index] ? Number.parseFloat(values[index]) : 0
          } else {
            row[header] = values[index] || ""
          }
        })

        return row as AdData
      })

      setPreviewData(parsedData)
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setResults({
      total: 0,
      success: 0,
      errors: 0,
      errorMessages: [],
    })

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        // Filtrar líneas vacías
        const dataRows = lines.slice(1).filter((line) => line.trim() !== "")
        const total = dataRows.length
        let success = 0
        let errors = 0
        const errorMessages: string[] = []

        for (let i = 0; i < dataRows.length; i++) {
          const line = dataRows[i]
          const values = line.split(",").map((v) => v.trim())
          const row: Record<string, any> = {}

          headers.forEach((header, index) => {
            if (["spent", "leads", "conversions"].includes(header)) {
              row[header] = values[index] ? Number.parseFloat(values[index]) : 0
            } else {
              row[header] = values[index] || ""
            }
          })

          try {
            // Verificar campos requeridos
            const requiredFields = [
              "name",
              "platform",
              "ad_id",
              "ad_set_id",
              "campaign_id",
              "business_manager_id",
              "status",
            ]
            for (const field of requiredFields) {
              if (!row[field]) {
                throw new Error(`Fila ${i + 2}: Campo ${field} vacío`)
              }
            }

            // Verificar que el business manager existe
            const { data: bm, error: bmError } = await supabase
              .from("business_managers")
              .select("id")
              .eq("id", row.business_manager_id)
              .single()

            if (bmError || !bm) {
              throw new Error(`Fila ${i + 2}: El Business Manager con ID ${row.business_manager_id} no existe`)
            }

            // Verificar si el anuncio ya existe
            const { data: existingAd, error: existingAdError } = await supabase
              .from("ads")
              .select("id")
              .eq("ad_id", row.ad_id)
              .single()

            let adId

            if (existingAd) {
              // Actualizar anuncio existente
              const { error: updateError } = await supabase
                .from("ads")
                .update({
                  name: row.name,
                  platform: row.platform,
                  ad_set_id: row.ad_set_id,
                  campaign_id: row.campaign_id,
                  business_manager_id: row.business_manager_id,
                  portfolio_id: row.portfolio_id || null,
                  account_id: row.account_id || null,
                  status: row.status,
                  spent: row.spent || 0,
                  leads: row.leads || 0,
                  conversions: row.conversions || 0,
                })
                .eq("id", existingAd.id)

              if (updateError) {
                throw new Error(`Fila ${i + 2}: Error al actualizar anuncio: ${updateError.message}`)
              }

              adId = existingAd.id
            } else {
              // Insertar nuevo anuncio
              const { data: newAd, error: insertError } = await supabase
                .from("ads")
                .insert({
                  name: row.name,
                  platform: row.platform,
                  ad_id: row.ad_id,
                  ad_set_id: row.ad_set_id,
                  campaign_id: row.campaign_id,
                  business_manager_id: row.business_manager_id,
                  portfolio_id: row.portfolio_id || null,
                  account_id: row.account_id || null,
                  status: row.status,
                  spent: row.spent || 0,
                  leads: row.leads || 0,
                  conversions: row.conversions || 0,
                })
                .select("id")
                .single()

              if (insertError) {
                throw new Error(`Fila ${i + 2}: Error al insertar anuncio: ${insertError.message}`)
              }

              adId = newAd?.id
            }

            success++
          } catch (error: any) {
            errors++
            errorMessages.push(error.message)
          }

          // Actualizar progreso
          setProgress(Math.round(((i + 1) / total) * 100))

          // Actualizar resultados parciales cada 10 filas
          if ((i + 1) % 10 === 0 || i === dataRows.length - 1) {
            setResults({
              total,
              success,
              errors,
              errorMessages,
            })
          }
        }

        // Actualizar resultados finales
        setResults({
          total,
          success,
          errors,
          errorMessages,
        })

        if (errors === 0) {
          toast({
            title: "Importación completada",
            description: `Se importaron ${success} anuncios correctamente`,
          })
        } else {
          toast({
            title: "Importación completada con errores",
            description: `Se importaron ${success} de ${total} anuncios. Hubo ${errors} errores.`,
            variant: "destructive",
          })
        }
      }

      reader.readAsText(file)
    } catch (error: any) {
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Anuncios</h1>
        <p className="text-muted-foreground">Importa anuncios y sus relaciones desde un archivo CSV</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
          <TabsTrigger value="template">Plantilla</TabsTrigger>
          <TabsTrigger value="help">Ayuda</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Archivo CSV</CardTitle>
              <CardDescription>
                El archivo debe contener las columnas requeridas para los anuncios y sus relaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="csv-file">Archivo CSV</Label>
                  <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
                </div>

                {previewData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Vista previa</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>ID Anuncio</TableHead>
                            <TableHead>ID Conjunto</TableHead>
                            <TableHead>ID Campaña</TableHead>
                            <TableHead>ID BM</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.platform}</TableCell>
                              <TableCell>{row.ad_id}</TableCell>
                              <TableCell>{row.ad_set_id}</TableCell>
                              <TableCell>{row.campaign_id}</TableCell>
                              <TableCell>{row.business_manager_id}</TableCell>
                              <TableCell>{row.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando {previewData.length} de {file ? file.name : ""} (vista previa)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setPreviewData([])
                }}
                disabled={importing || !file}
              >
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || !file}>
                {importing ? (
                  <>
                    Importando...
                    <Progress value={progress} className="w-20 ml-2 h-2" />
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Datos
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {(importing || results.total > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Importación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Total de registros</p>
                      <p className="text-2xl font-bold">{results.total}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">Exitosos</p>
                      <p className="text-2xl font-bold text-green-600">{results.success}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">Errores</p>
                      <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Progreso</p>
                      <Progress value={progress} className="w-40 h-2 mt-2" />
                    </div>
                  </div>

                  {results.errorMessages.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Errores</h3>
                      <div className="max-h-60 overflow-y-auto border rounded-md p-4 bg-red-50">
                        <ul className="space-y-2">
                          {results.errorMessages.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">
                              <AlertCircle className="inline-block mr-2 h-4 w-4" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Plantilla CSV</CardTitle>
              <CardDescription>Descarga una plantilla para importar anuncios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Formato requerido</AlertTitle>
                  <AlertDescription>
                    La plantilla incluye todas las columnas necesarias para importar anuncios correctamente.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">Columnas requeridas</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">name</span> - Nombre del anuncio
                    </li>
                    <li>
                      <span className="font-medium">platform</span> - Plataforma (Facebook, Instagram, etc.)
                    </li>
                    <li>
                      <span className="font-medium">ad_id</span> - ID único del anuncio en la plataforma
                    </li>
                    <li>
                      <span className="font-medium">ad_set_id</span> - ID del conjunto de anuncios
                    </li>
                    <li>
                      <span className="font-medium">campaign_id</span> - ID de la campaña
                    </li>
                    <li>
                      <span className="font-medium">business_manager_id</span> - ID del Business Manager
                    </li>
                    <li>
                      <span className="font-medium">status</span> - Estado del anuncio (active, paused, etc.)
                    </li>
                  </ul>

                  <h3 className="text-lg font-medium mt-4 mb-2">Columnas opcionales</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">portfolio_id</span> - ID del portfolio (si aplica)
                    </li>
                    <li>
                      <span className="font-medium">account_id</span> - ID de la cuenta publicitaria
                    </li>
                    <li>
                      <span className="font-medium">spent</span> - Gasto acumulado
                    </li>
                    <li>
                      <span className="font-medium">leads</span> - Número de leads generados
                    </li>
                    <li>
                      <span className="font-medium">conversions</span> - Número de conversiones
                    </li>
                  </ul>
                </div>

                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Ayuda para Importación</CardTitle>
              <CardDescription>Guía para importar anuncios correctamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Preparación del CSV</h3>
                  <p className="text-muted-foreground">
                    Asegúrate de que tu archivo CSV tenga las columnas correctas y esté formateado adecuadamente:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li>Usa comas como separadores</li>
                    <li>Incluye una fila de encabezado con los nombres exactos de las columnas</li>
                    <li>Asegúrate de que los IDs existan en el sistema</li>
                    <li>Usa el formato correcto para cada campo (texto, números)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Proceso de Importación</h3>
                  <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                    <li>Prepara tu archivo CSV con todas las columnas requeridas</li>
                    <li>Sube el archivo usando el formulario en la pestaña "Subir Archivo"</li>
                    <li>Revisa la vista previa para asegurarte de que los datos son correctos</li>
                    <li>Haz clic en "Importar Datos" para comenzar el proceso</li>
                    <li>Espera a que se complete la importación y revisa los resultados</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Solución de Problemas</h3>
                  <p className="text-muted-foreground">Si encuentras errores durante la importación:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li>Verifica que todos los IDs de referencia existan en el sistema</li>
                    <li>Asegúrate de que no haya duplicados de ad_id</li>
                    <li>Revisa el formato de los campos numéricos</li>
                    <li>Verifica que los estados sean válidos (active, paused, etc.)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
