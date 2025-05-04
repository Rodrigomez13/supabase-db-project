"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, PlusIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { safeDelete } from "@/lib/safe-query"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

// Definir interfaces más precisas para los datos relacionados
interface PortfolioData {
  name: string
}

interface WalletData {
  name: string
}

interface AdsetData {
  name: string
}

interface ServerAd {
  id: string
  ad_id: string
  name: string
  daily_budget: number
  is_active?: boolean
  api_id: string
  portfolio_id?: string | null
  portfolio?: PortfolioData | null
  wallet_id?: string | null
  wallet?: WalletData | null
  adset_id?: string | null
  adset?: AdsetData | null
  spent?: number
  leads?: number
  loads?: number
}

interface ServerAdsListProps {
  serverId: string
}

export function ServerAdsList({ serverId }: ServerAdsListProps) {
  const [ads, setAds] = useState<ServerAd[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (serverId) {
      fetchServerAds()
    }
  }, [serverId])

  async function fetchServerAds() {
    try {
      setLoading(true)
      setError(null)

      // Consulta a la vista server_ads_view
      const { data: viewData, error: viewError } = await supabase
        .from("server_ads_view")
        .select("*")
        .eq("server_id", serverId)

      if (viewError) {
        console.error("Error al consultar la vista:", viewError)
        throw viewError
      }

      console.log("Server ads view data:", viewData)

      // Si no hay datos en la vista, intentamos con la tabla original
      if (!viewData || viewData.length === 0) {
        const { data: tableData, error: tableError } = await supabase
          .from("server_ads")
          .select("*")
          .eq("server_id", serverId)

        if (tableError) throw tableError

        console.log("Server ads table data:", tableData)

        // Transformar los datos de la tabla
        const transformedData =
          tableData?.map((item: any) => ({
            ...item,
            budget: item.daily_budget,
            api_connection: item.api_id,
          })) || []

        setAds(transformedData)
      } else {
        // Procesamos los datos de la vista
        const processedData = await Promise.all(
          (viewData || []).map(async (item: any) => {
            // Obtener información adicional si es necesario
            const adData: ServerAd = {
              ...item,
              budget: item.daily_budget,
              api_connection: item.api_id,
            }

            // Intentar obtener información del portfolio si existe
            if (item.portfolio_id) {
              try {
                const { data: portfolioData } = await supabase
                  .from("portfolios")
                  .select("name")
                  .eq("id", item.portfolio_id)
                  .single()

                if (portfolioData) {
                  adData.portfolio = portfolioData
                }
              } catch (e) {
                console.warn(`No se pudo cargar el portfolio para el anuncio ${item.id}`)
              }
            }

            // Intentar obtener información de la wallet si existe
            if (item.wallet_id) {
              try {
                const { data: walletData } = await supabase
                  .from("finance_wallets")
                  .select("name")
                  .eq("id", item.wallet_id)
                  .single()

                if (walletData) {
                  adData.wallet = walletData
                }
              } catch (e) {
                console.warn(`No se pudo cargar la wallet para el anuncio ${item.id}`)
              }
            }

            // Intentar obtener información del adset si existe
            if (item.adset_id) {
              try {
                const { data: adsetData } = await supabase
                  .from("ad_sets")
                  .select("name")
                  .eq("id", item.adset_id)
                  .single()

                if (adsetData) {
                  adData.adset = adsetData
                }
              } catch (e) {
                console.warn(`No se pudo cargar el adset para el anuncio ${item.id}`)
              }
            }

            return adData
          }),
        )

        setAds(processedData)
      }
    } catch (err: any) {
      console.error("Error fetching server ads:", err)
      setError(`Error al cargar anuncios: ${err.message || "Error desconocido"}`)
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleAdStatus(id: string, currentStatus: boolean) {
    try {
      // Aquí deberíamos actualizar el estado del anuncio en la tabla ads
      // ya que server_ads no tiene columna is_active
      const { data: adData } = await supabase.from("server_ads").select("ad_id").eq("id", id).single()

      if (adData && adData.ad_id) {
        await supabase.from("ads").update({ active: !currentStatus }).eq("id", adData.ad_id)

        // Actualizar el estado local
        setAds(ads.map((ad) => (ad.id === id ? { ...ad, is_active: !currentStatus } : ad)))
      }
    } catch (err) {
      console.error("Error updating ad status:", err)
    }
  }

  async function deleteAd(id: string) {
    try {
      await safeDelete("server_ads", id)
      setAds(ads.filter((ad) => ad.id !== id))
    } catch (err) {
      console.error("Error deleting ad:", err)
    }
  }

  const filteredAds = ads.filter(
    (ad) =>
      ad.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.ad_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-usina-text-primary">Anuncios del Servidor</h3>
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar anuncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-background/10 border-usina-card/30"
          />
          <Link href={`/dashboard/servers/${serverId}/add-ad`}>
            <Button className="bg-usina-primary hover:bg-usina-secondary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Anuncio
            </Button>
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">{error}</div>}

      {loading ? (
        <div className="text-center py-4 text-usina-text-secondary">Cargando anuncios...</div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-4 text-usina-text-secondary">No hay anuncios para este servidor</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-usina-card/20">
                <TableHead className="text-usina-text-secondary">Anuncio</TableHead>
                <TableHead className="text-usina-text-secondary">Presupuesto</TableHead>
                <TableHead className="text-usina-text-secondary">API</TableHead>
                <TableHead className="text-usina-text-secondary">Portfolio</TableHead>
                <TableHead className="text-usina-text-secondary">Cuenta</TableHead>
                <TableHead className="text-usina-text-secondary">Conjunto</TableHead>
                <TableHead className="text-usina-text-secondary">Estado</TableHead>
                <TableHead className="text-right text-usina-text-secondary">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id} className="border-usina-card/20">
                  <TableCell>
                    <div>
                      <p className="font-medium text-usina-text-primary">{ad.name}</p>
                      <p className="text-xs text-usina-text-secondary">{ad.ad_id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-usina-text-primary">${ad.daily_budget?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell className="text-usina-text-primary">{ad.api_id}</TableCell>
                  <TableCell className="text-usina-text-primary">{ad.portfolio?.name ?? "-"}</TableCell>
                  <TableCell className="text-usina-text-primary">{ad.wallet?.name ?? "-"}</TableCell>
                  <TableCell className="text-usina-text-primary">{ad.adset?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={ad.is_active ?? false}
                      onCheckedChange={() => toggleAdStatus(ad.id, ad.is_active ?? false)}
                      className="data-[state=checked]:bg-usina-success"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/servers/${serverId}/edit-ad/${ad.id}`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-usina-primary/30 text-usina-primary hover:bg-usina-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este anuncio?")) {
                            deleteAd(ad.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
