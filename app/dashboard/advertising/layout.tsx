"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export default function AdvertisingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Determinar la pestaña activa basada en la ruta
  useEffect(() => {
    if (pathname === "/dashboard/advertising") {
      setActiveTab("overview");
    } else if (pathname.includes("/dashboard/advertising/business-managers")) {
      setActiveTab("business-managers");
    } else if (pathname.includes("/dashboard/advertising/apis")) {
      setActiveTab("apis");
    } else if (pathname.includes("/dashboard/advertising/distribution")) {
      setActiveTab("distribution");
    }
  }, [pathname]);

  // Manejar cambio de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    switch (value) {
      case "overview":
        router.push("/dashboard/advertising");
        break;
      case "business-managers":
        router.push("/dashboard/advertising/business-managers");
        break;
      case "apis":
        router.push("/dashboard/advertising/apis");
        break;
      case "distribution":
        router.push("/dashboard/advertising/distribution");
        break;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="border-b bg-card/30">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="business-managers"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Business Managers
            </TabsTrigger>
            <TabsTrigger
              value="apis"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              APIs
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Distribución
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
}
