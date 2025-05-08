"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FranchiseSubmenu } from "@/components/franchise-submenu";
import { getFranchiseById } from "@/lib/queries/franchise-queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const franchiseId = params.id as string;
  const [franchiseName, setFranchiseName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadFranchise = async () => {
      try {
        setLoading(true);
        const franchise = await getFranchiseById(franchiseId);
        if (franchise) {
          setFranchiseName(franchise.name);
        }
      } catch (error) {
        console.error("Error loading franchise:", error);
      } finally {
        setLoading(false);
      }
    };

    if (franchiseId) {
      loadFranchise();
    }
  }, [franchiseId]);

  return (
    <div>
      {loading ? (
        <div className="bg-card border-b border-border/50 mb-6">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      ) : (
        <FranchiseSubmenu
          franchiseId={franchiseId}
          franchiseName={franchiseName}
        />
      )}
      {children}
    </div>
  );
}
