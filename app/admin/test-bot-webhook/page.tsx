"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function TestBotWebhookPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [response, setResponse] = useState<any>(null);

  const [formData, setFormData] = useState({
    type: "new_lead",
    server_id: "",
    agency_id: "",
    ad_id: "",
    cahiser_phone: "",
  });

  // Cargar recursos al montar el componente
  useState(() => {
    Promise.all([
      fetchServers(),
      fetchFranchises(),
      fetchAds(),
      fetchPhones(),
    ]).finally(() => setLoadingResources(false));
  });

  async function fetchServers() {
    try {
      const { data, error } = await supabase
        .from("servers")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setServers(data || []);
    } catch (err) {
      console.error("Error fetching servers:", err);
    }
  }

  async function fetchFranchises() {
    try {
      const { data, error } = await supabase
        .from("franchises")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setFranchises(data || []);
    } catch (err) {
      console.error("Error fetching franchises:", err);
    }
  }

  async function fetchAds() {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("id, name, emoji")
        .order("name");

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error("Error fetching ads:", err);
    }
  }

  async function fetchPhones() {
    try {
      const { data, error } = await supabase
        .from("franchise_phones")
        .select("id, phone_number, franchise_id")
        .eq("is_active", true)
        .order("phone_number");

      if (error) throw error;
      setPhones(data || []);
    } catch (err) {
      console.error("Error fetching phones:", err);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Si seleccionamos un anuncio, usar su emoji como ad_id
    if (name === "adId") {
      const selectedAd = ads.find((ad) => ad.id === value);
      if (selectedAd && selectedAd.emoji) {
        setFormData((prev) => ({ ...prev, ad_id: selectedAd.emoji }));
      }
    }

    // Si seleccionamos un teléfono, usarlo como cahiser_phone
    if (name === "phoneId") {
      const selectedPhone = phones.find((phone) => phone.id === value);
      if (selectedPhone) {
        setFormData((prev) => ({
          ...prev,
          cahiser_phone: selectedPhone.phone_number,
        }));
      }
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const response = await fetch("/api/bot-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResponse({
        status: response.status,
        statusText: response.statusText,
        data,
      });

      if (response.ok) {
        toast({
          title: "Webhook ejecutado correctamente",
          description: "La solicitud se procesó con éxito",
        });
      } else {
        toast({
          title: "Error al ejecutar webhook",
          description:
            data.error || "Ocurrió un error al procesar la solicitud",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      setResponse({
        error: error.message,
      });
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Probar Bot Webhook</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enviar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new_lead" id="new_lead" />
                    <Label htmlFor="new_lead">Nuevo Lead</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new_load" id="new_load" />
                    <Label htmlFor="new_load">Nueva Conversión</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">Servidor</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("server_id", value)
                  }
                  disabled={loadingResources}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="franchise">Franquicia</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("agency_id", value)
                  }
                  disabled={loadingResources}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar franquicia" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad">Anuncio</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("adId", value)}
                  disabled={loadingResources}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar anuncio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ads.map((ad) => (
                      <SelectItem key={ad.id} value={ad.id}>
                        {ad.name} {ad.emoji ? `(${ad.emoji})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_id">Emoji del Anuncio</Label>
                <Input
                  id="ad_id"
                  name="ad_id"
                  value={formData.ad_id}
                  onChange={handleInputChange}
                  placeholder="Emoji identificador"
                  className="text-2xl text-center"
                />
              </div>

              {formData.type === "new_load" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono del Cajero</Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("phoneId", value)
                      }
                      disabled={loadingResources}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar teléfono" />
                      </SelectTrigger>
                      <SelectContent>
                        {phones.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id}>
                            {phone.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cahiser_phone">Número de Teléfono</Label>
                    <Input
                      id="cahiser_phone"
                      name="cahiser_phone"
                      value={formData.cahiser_phone}
                      onChange={handleInputChange}
                      placeholder="+54 9 11 1111-1111"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="raw_json">JSON Completo (opcional)</Label>
                <Textarea
                  id="raw_json"
                  name="raw_json"
                  placeholder="Pega aquí el JSON completo para sobrescribir los campos anteriores"
                  rows={5}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Datos"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      response.status >= 200 && response.status < 300
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span>
                    Status: {response.status} {response.statusText}
                  </span>
                </div>

                <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-sm">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">
                Envía una solicitud para ver la respuesta aquí
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
