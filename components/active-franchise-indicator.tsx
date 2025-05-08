"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Badge } from "@/components/ui/badge";

export function ActiveFranchiseIndicator() {
  const [franchiseName, setFranchiseName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadActiveFranchise() {
      try {
        setLoading(true);

        // Obtener la franquicia activa de la configuración global
        const { data, error } = await supabase
          .from("system_config")
          .select("value")
          .eq("key", "active_franchise")
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error al cargar la franquicia activa:", error);
        }

        if (data?.value?.name) {
          setFranchiseName(data.value.name);
        }
      } catch (error) {
        console.error("Error al cargar la franquicia activa:", error);
      } finally {
        setLoading(false);
      }
    }

    loadActiveFranchise();

    // Suscribirse a cambios en la configuración
    const channel = supabase
      .channel("active_franchise_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "system_config",
          filter: "key=eq.active_franchise",
        },
        (payload) => {
          if (payload.new && payload.new.value && payload.new.value.name) {
            setFranchiseName(payload.new.value.name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading || !franchiseName) {
    return null;
  }

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">
      Franquicia: {franchiseName}
    </Badge>
  );
}
