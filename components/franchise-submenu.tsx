"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Phone,
  CreditCard,
  MessageSquare,
  FileText,
  Share2,
  Database,
  Settings,
} from "lucide-react";

interface FranchiseSubmenuProps {
  franchiseId: string;
  franchiseName: string;
}

export function FranchiseSubmenu({
  franchiseId,
  franchiseName,
}: FranchiseSubmenuProps) {
  const pathname = usePathname();
  const [isSticky, setIsSticky] = useState(false);

  // Hacer que el menú se quede fijo al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsSticky(offset > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    {
      name: "Resumen",
      path: `/dashboard/franchises/${franchiseId}`,
      icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
    },
    {
      name: "Teléfonos",
      path: `/dashboard/franchises/${franchiseId}/phones`,
      icon: <Phone className="w-4 h-4 mr-2" />,
    },
    {
      name: "Finanzas",
      path: `/dashboard/franchises/${franchiseId}/finance`,
      icon: <CreditCard className="w-4 h-4 mr-2" />,
    },
    {
      name: "Conversiones",
      path: `/dashboard/franchises/${franchiseId}/conversions`,
      icon: <MessageSquare className="w-4 h-4 mr-2" />,
    },
    {
      name: "Reportes",
      path: `/dashboard/franchises/${franchiseId}/reports`,
      icon: <FileText className="w-4 h-4 mr-2" />,
    },
    {
      name: "Asignaciones",
      path: `/dashboard/franchises/${franchiseId}/assignments`,
      icon: <Share2 className="w-4 h-4 mr-2" />,
    },
    {
      name: "Datos",
      path: `/dashboard/franchises/${franchiseId}/data`,
      icon: <Database className="w-4 h-4 mr-2" />,
    },
    {
      name: "Configuración",
      path: `/dashboard/franchises/${franchiseId}/settings`,
      icon: <Settings className="w-4 h-4 mr-2" />,
    },
  ];

  return (
    <div
      className={`bg-card border-b border-border/50 mb-6 transition-all ${
        isSticky ? "sticky top-0 z-10 shadow-md" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold py-4">
            Franquicia: <span className="text-primary">{franchiseName}</span>
          </h2>

          <div className="overflow-x-auto pb-1">
            <nav className="flex space-x-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors
                    ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
