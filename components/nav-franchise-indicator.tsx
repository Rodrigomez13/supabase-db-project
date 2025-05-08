"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Building, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NavFranchiseIndicator() {
  const [franchiseName, setFranchiseName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadFranchise() {
      try {
        setLoading(true);

        // Obtener el usuario actual
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) return;

        // Obtener la preferencia del usuario
        const { data: userPrefs } = await supabase
          .from("user_preferences")
          .select("selected_franchise_id")
          .eq("user_id", userData.user.id)
          .single();

        if (!userPrefs?.selected_franchise_id) return;

        // Obtener el nombre de la franquicia
        const { data: franchise } = await supabase
          .from("franchises")
          .select("name")
          .eq("id", userPrefs.selected_franchise_id)
          .single();

        if (franchise) {
          setFranchiseName(franchise.name);
        }
      } catch (error) {
        console.error("Error al cargar la franquicia:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFranchise();

    // Suscribirse a cambios en user_preferences
    const userChannel = supabase
      .channel("user_preferences_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_preferences",
        },
        () => {
          loadFranchise();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <Badge variant="outline" className="ml-auto">
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        <span className="text-xs">Cargando...</span>
      </Badge>
    );
  }

  if (!franchiseName) return null;

  return (
    <Badge variant="outline" className="ml-auto">
      <Building className="h-3 w-3 mr-1" />
      <span className="text-xs">Derivando a: {franchiseName}</span>
    </Badge>
  );
}
