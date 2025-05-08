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
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface PhoneData {
  phone_number: string
  franchise_id: string
  is_active: boolean
  notes?: string
}

export default function ImportPhonesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PhoneData[]>([])
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
      const requiredColumns = ["phone_number", "franchise_id"]
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
          if (header === "is_active") {
            row[header] = values[index]?.toLowerCase() === "true"
          } else {
            row[header] = values[index] || ""
          }
        })

        return row as PhoneData
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
            if (header === "is_active") {
              row[header] = values[index]?.toLowerCase() === "true"
            } else {
              row[header] = values[index] || ""
            }
          })

          try {
            // Verificar que el número de teléfono y franchise_id existen
            if (!row.phone_number) {
              throw new Error(`Fila ${i + 2}: Número de teléfono vacío`)
            }

            if (!row.franchise_id) {
              throw new Error(`Fila ${i + 2}: ID de franquicia vacío`)
            }

            // Verificar que la franquicia existe
            const { data: franchise, error: franchiseError } = await supabase
              .from("franchises")
              .select("id")
              .eq("id", row.franchise_id)
              .single()

            if (franchiseError || !franchise) {
              throw new Error(`Fila ${i + 2}: La franquicia con ID ${row.franchise_id} no existe`)
            }

            // Insertar el teléfono
            const { error } = await supabase.from("franchise_phones").insert({
              phone_number: row.phone_number,
              franchise_id: row.franchise_id,
              is_active: row.is_active !== undefined ? row.is_active : true,
              notes: row.notes || null,
            })

            if (error) {
              if (error.code === "23505") {
                // Código de error de duplicado
                throw new Error(`Fila ${i + 2}: El número ${row.phone_number} ya existe`)
              } else {
                throw new Error(`Fila ${i + 2}: ${error.message}`)
              }
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
            description: `Se importaron ${success} números de teléfono correctamente`,
          })
        } else {
          toast({
            title: "Importación completada con errores",
            description: `Se importaron ${success} de ${total} números. Hubo ${errors} errores.`,
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
        <h1 className="text-3xl font-bold">Importar Teléfonos</h1>
        <p className="text-muted-foreground">Importa números de teléfono desde un archivo CSV</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo CSV</CardTitle>
          <CardDescription>
            El archivo debe contener las columnas: phone_number, franchise_id, is_active (opcional), notes (opcional)
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de Teléfono</TableHead>
                      <TableHead>ID de Franquicia</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.phone_number}</TableCell>
                        <TableCell>{row.franchise_id}</TableCell>
                        <TableCell>{row.is_active ? "Sí" : "No"}</TableCell>
                        <TableCell>{row.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

              {results.success > 0 && results.errors === 0 && !importing && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Importación exitosa</AlertTitle>
                  <AlertDescription>Todos los registros fueron importados correctamente.</AlertDescription>
                </Alert>
              )}

              {results.errors > 0 && !importing && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Importación parcial</AlertTitle>
                  <AlertDescription>
                    Se importaron {results.success} registros correctamente, pero hubo {results.errors} errores.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
