"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function AddEmojiToAdsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const addEmojiColumn = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Verificar si la columna emoji ya existe
        const { data: columns, error: columnsError } = await supabase
          .from("ads")
          .select("emoji")
          .limit(1)
          .maybeSingle();

        if (columnsError) {
          // Si hay un error porque la columna no existe, la creamos
          if (columnsError.message.includes('column "emoji" does not exist')) {
            // Intentamos crear la columna usando RPC si está disponible
            const { error: alterError } = await supabase.rpc("exec_sql", {
              sql_query: `ALTER TABLE ads ADD COLUMN IF NOT EXISTS emoji TEXT;`,
            });

            if (alterError) {
              console.error("Error al crear columna usando RPC:", alterError);
              // Si falla, mostramos un mensaje pero continuamos
              setError(
                "No se pudo crear automáticamente la columna emoji. Por favor, créala manualmente en la base de datos."
              );
            } else {
              setSuccess("Columna emoji agregada correctamente a la tabla ads");
            }
          } else {
            throw columnsError;
          }
        } else {
          // La columna ya existe
          setSuccess("La columna emoji ya existe en la tabla ads");
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || "Error al verificar la columna emoji");
      } finally {
        setLoading(false);
      }
    };

    addEmojiColumn();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Agregar Emoji a Anuncios</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estado de la Operación</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Verificando columna emoji...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
              <p className="mt-2 text-sm">
                Para crear la columna manualmente, ejecuta este SQL en tu base
                de datos:
                <code className="block bg-gray-100 p-2 mt-1 rounded">
                  ALTER TABLE ads ADD COLUMN IF NOT EXISTS emoji TEXT;
                </code>
              </p>
            </div>
          ) : success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <EmojiAssigner />
    </div>
  );
}

function EmojiAssigner() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emojiValues, setEmojiValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      setLoading(true);
      setError(null);

      // Primero verificamos si la columna emoji existe
      let { data, error } = await supabase
        .from("ads")
        .select("id, name, ad_id, status, emoji")
        .order("name");

      if (error) {
        throw error;
      }

      // Asegurarse de que los datos tengan la propiedad emoji
      data = (data || []).map((ad) => ({
        ...ad,
        emoji: ad.emoji || "",
      }));

      setAds(data || []);

      // Inicializar los valores de emoji
      const initialValues: Record<string, string> = {};
      data?.forEach((ad) => {
        initialValues[ad.id] = ad.emoji || "";
      });
      setEmojiValues(initialValues);
    } catch (err: any) {
      console.error("Error fetching ads:", err);
      setError(err.message || "Error al cargar anuncios");
    } finally {
      setLoading(false);
    }
  }

  const handleEmojiChange = (adId: string, value: string) => {
    setEmojiValues((prev) => ({
      ...prev,
      [adId]: value,
    }));
  };

  const saveEmojis = async () => {
    try {
      setSaving(true);
      setError(null);

      // Verificar si la columna emoji existe
      try {
        await supabase.from("ads").select("emoji").limit(1);
      } catch (err) {
        throw new Error(
          "La columna emoji no existe en la tabla ads. Por favor, créala manualmente."
        );
      }

      // Crear un array de promesas para actualizar cada anuncio
      const updatePromises = Object.entries(emojiValues).map(
        ([adId, emoji]) => {
          return supabase.from("ads").update({ emoji }).eq("id", adId);
        }
      );

      // Ejecutar todas las actualizaciones
      const results = await Promise.all(updatePromises);

      // Verificar si hubo errores
      const errors = results.filter((r) => r.error).map((r) => r.error);
      if (errors.length > 0) {
        throw new Error(
          `Ocurrieron ${errors.length} errores al guardar los emojis`
        );
      }

      toast({
        title: "Emojis guardados",
        description:
          "Los emojis han sido asignados correctamente a los anuncios",
      });

      // Recargar los anuncios
      await fetchAds();
    } catch (err: any) {
      console.error("Error saving emojis:", err);
      setError(err.message || "Error al guardar emojis");
      toast({
        title: "Error",
        description: err.message || "No se pudieron guardar los emojis",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Cargando anuncios...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar Emojis a Anuncios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Asigna un emoji único a cada anuncio para que el bot de publicidad
            pueda identificarlo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <div key={ad.id} className="border p-4 rounded-md">
                <Label htmlFor={`emoji-${ad.id}`} className="block mb-2">
                  {ad.name}
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id={`emoji-${ad.id}`}
                    value={emojiValues[ad.id] || ""}
                    onChange={(e) => handleEmojiChange(ad.id, e.target.value)}
                    placeholder="Emoji"
                    className="w-20 text-center text-2xl"
                  />
                  <div className="flex-1 text-sm text-gray-500 flex items-center">
                    <span className="truncate">{ad.ad_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={saveEmojis} disabled={saving} className="mt-4">
            {saving ? "Guardando..." : "Guardar Emojis"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
