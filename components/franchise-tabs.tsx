"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { safeQuery } from "@/lib/safe-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

interface Franchise {
  id: string;
  name: string;
}

export function FranchiseTabs() {
  const pathname = usePathname();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState<string | null>(
    null
  );

  // Extraer el ID de la franquicia de la URL
  useEffect(() => {
    const match = pathname.match(/\/dashboard\/franchises\/([^/]+)/);
    if (match && match[1]) {
      setSelectedFranchise(match[1]);
    } else {
      setSelectedFranchise(null);
    }
  }, [pathname]);

  // Cargar todas las franquicias
  useEffect(() => {
    const loadFranchises = async () => {
      try {
        setLoading(true);
        const data = await safeQuery<Franchise>("franchises", {
          orderBy: { column: "name", ascending: true },
        });
        setFranchises(data);
      } catch (error) {
        console.error("Error loading franchises:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFranchises();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-2 bg-background border-b border-border">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (franchises.length === 0) {
    return (
      <div className="w-full p-4 bg-background border-b border-border text-center">
        <p className="text-muted-foreground">No hay franquicias disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b border-border p-2">
      <Tabs value={selectedFranchise || "none"} className="w-full">
        <TabsList className="w-full h-auto flex overflow-x-auto py-1 px-1 gap-1">
          {franchises.map((franchise) => (
            <TabsTrigger
              key={franchise.id}
              value={franchise.id}
              className="flex items-center whitespace-nowrap py-2 px-3"
              asChild
            >
              <Link href={`/dashboard/franchises/${franchise.id}`}>
                <Building2 className="h-4 w-4 mr-2" />
                {franchise.name}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
