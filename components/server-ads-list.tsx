"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, PlusIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { safeQuery, safeUpdate, safeDelete } from "@/lib/safe-query";
import Link from "next/link";

interface ServerAd {
  id: string;
  ad_id: string;
  name: string;
  budget: number;
  is_active: boolean;
  api_connection: string;
  portfolio: { name: string };
  wallet: { name: string };
  adset: { name: string };
}

interface ServerAdsListProps {
  serverId: string;
}

export function ServerAdsList({ serverId }: ServerAdsListProps) {
  const [ads, setAds] = useState<ServerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (serverId) {
      fetchServerAds();
    }
  }, [serverId]);

  async function fetchServerAds() {
    try {
      setLoading(true);
      const { data, error } = await safeQuery("server_ads_view", {
        select:
          "id, ad_id, name, budget, is_active, api_connection, portfolio:portfolio_id(name), wallet:wallet_id(name), adset:adset_id(name)",
        filter: { column: "server_id", operator: "eq", value: serverId },
      });

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error("Error fetching server ads:", err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdStatus(id: string, currentStatus: boolean) {
    try {
      await safeUpdate("server_ads", id, { is_active: !currentStatus });
      setAds(
        ads.map((ad) =>
          ad.id === id ? { ...ad, is_active: !currentStatus } : ad
        )
      );
    } catch (err) {
      console.error("Error updating ad status:", err);
    }
  }

  async function deleteAd(id: string) {
    try {
      await safeDelete("server_ads", id);
      setAds(ads.filter((ad) => ad.id !== id));
    } catch (err) {
      console.error("Error deleting ad:", err);
    }
  }

  const filteredAds = ads.filter(
    (ad) =>
      ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.ad_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-usina-text-primary">
          Anuncios del Servidor
        </h3>
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar anuncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-background/10 border-usina-card/30"
          />
          <Button className="bg-usina-primary hover:bg-usina-secondary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Anuncio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-usina-text-secondary">
          Cargando anuncios...
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-4 text-usina-text-secondary">
          No hay anuncios para este servidor
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-usina-card/20">
                <TableHead className="text-usina-text-secondary">
                  Anuncio
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Presupuesto
                </TableHead>
                <TableHead className="text-usina-text-secondary">API</TableHead>
                <TableHead className="text-usina-text-secondary">
                  Portfolio
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Cuenta
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Conjunto
                </TableHead>
                <TableHead className="text-usina-text-secondary">
                  Estado
                </TableHead>
                <TableHead className="text-right text-usina-text-secondary">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id} className="border-usina-card/20">
                  <TableCell>
                    <div>
                      <p className="font-medium text-usina-text-primary">
                        {ad.name}
                      </p>
                      <p className="text-xs text-usina-text-secondary">
                        {ad.ad_id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    ${ad.budget?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.api_connection}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.portfolio?.name || "-"}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.wallet?.name || "-"}
                  </TableCell>
                  <TableCell className="text-usina-text-primary">
                    {ad.adset?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={() =>
                        toggleAdStatus(ad.id, ad.is_active)
                      }
                      className="data-[state=checked]:bg-usina-success"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-usina-primary/30 text-usina-primary hover:bg-usina-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-usina-danger/30 text-usina-danger hover:bg-usina-danger/10"
                        onClick={() => {
                          if (
                            confirm("¿Estás seguro de eliminar este anuncio?")
                          ) {
                            deleteAd(ad.id);
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
  );
}
