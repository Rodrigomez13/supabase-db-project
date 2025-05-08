"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LayoutDashboard,
  Server,
  Store,
  BarChart3,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Database,
  BellIcon,
  DollarSign,
  Wallet,
  CreditCard,
  Send,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UsinaLogo } from "@/components/usina-logo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { NavFranchiseIndicator } from "@/components/nav-franchise-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [advertisingOpen, setAdvertisingOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [financesOpen, setFinancesOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    // Forzar tema oscuro para Usina Leads
    setTheme("dark");

    if (!loading && !user) {
      router.push("/login");
    }

    // Abrir automáticamente el menú de admin si estamos en alguna de sus rutas
    if (pathname?.includes("/admin/")) {
      setAdminOpen(true);
    }

    // Abrir automáticamente el menú de finanzas si estamos en alguna de sus rutas
    if (pathname?.includes("/dashboard/finances")) {
      setFinancesOpen(true);
    }
  }, [user, loading, router, pathname, setTheme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname?.includes("/dashboard/servers")) return "Servidores";
    if (pathname?.includes("/dashboard/franchises")) return "Franquicias";
    if (pathname?.includes("/dashboard/advertising/portfolios"))
      return "Portfolios";
    if (pathname?.includes("/dashboard/advertising/wallets"))
      return "Cuentas Publicitarias";
    if (pathname?.includes("/dashboard/advertising/business-managers"))
      return "Business Managers";
    if (pathname?.includes("/dashboard/advertising/campaigns"))
      return "Campañas";
    if (pathname?.includes("/dashboard/advertising/ad-sets"))
      return "Conjuntos de Anuncios";
    if (pathname?.includes("/dashboard/advertising/ads")) return "Anuncios";
    if (pathname?.includes("/dashboard/advertising/register-activity"))
      return "Registrar Actividad";
    if (pathname?.includes("/dashboard/advertising/apis")) return "APIs";
    if (pathname?.includes("/dashboard/advertising")) return "Publicidad";
    if (pathname?.includes("/dashboard/personnel")) return "Personal";
    if (pathname?.includes("/dashboard/reports")) return "Reportes";
    if (pathname?.includes("/dashboard/settings")) return "Configuración";
    if (pathname?.includes("/admin/diagnostics")) return "Diagnóstico";
    if (pathname?.includes("/admin/table-info")) return "Información de Tablas";
    if (pathname?.includes("/admin/setup")) return "Configuración DB";
    if (pathname?.includes("/admin/rls-manager")) return "Administrar RLS";
    if (pathname?.includes("/admin/fix-user")) return "Arreglar Rol de Usuario";
    if (pathname?.includes("/dashboard/finances")) return "Finanzas";
    if (pathname?.includes("/dashboard/finances/wallets")) return "Billeteras";
    return "";
  };

  const getPageDescription = () => {
    if (pathname === "/dashboard")
      return "Bienvenido al panel de control de Usina Leads.";
    if (pathname?.includes("/dashboard/servers"))
      return "Gestiona los servidores y sus anuncios activos.";
    if (pathname?.includes("/dashboard/franchises"))
      return "Gestiona las agencias y franquicias.";
    if (pathname?.includes("/dashboard/advertising")) {
      if (pathname?.includes("/register-activity"))
        return "Registra la actividad de tus anuncios.";
      return "Gestiona tus campañas publicitarias y anuncios.";
    }
    if (pathname?.includes("/dashboard/personnel"))
      return "Administra el personal y sus registros.";
    if (pathname?.includes("/dashboard/reports"))
      return "Genera y gestiona reportes personalizados.";
    if (pathname?.includes("/dashboard/settings"))
      return "Configura las opciones del sistema.";
    if (pathname?.includes("/admin/"))
      return "Administra la configuración avanzada del sistema.";
    if (pathname?.includes("/dashboard/finances"))
      return "Gestiona las finanzas y billeteras de la plataforma.";
    return "";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="usina-sidebar">
        <div className="usina-sidebar-logo">
          <UsinaLogo />
        </div>
        <div className="flex items-center space-x-4">
          <NavFranchiseIndicator />
        </div>
        <nav className="usina-sidebar-nav">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={`usina-sidebar-nav-item ${
                  isActive("/dashboard") ? "Activo" : ""
                }`}
              >
                <LayoutDashboard className="usina-sidebar-icon" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/servers"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/servers") ? "Activo" : ""
                }`}
              >
                <Server className="usina-sidebar-icon" />
                Servidores
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/franchises"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/franchises") ? "Activo" : ""
                }`}
              >
                <Store className="usina-sidebar-icon" />
                Franquicias
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/distribution"
                className={cn(
                  "usina-sidebar-nav-item",
                  pathname === "/dashboard/distribution" && "Activo"
                )}
              >
                <Send className="usina-sidebar-icon" />
                Distribución
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/advertising"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/advertising") ? "Activo" : ""
                }`}
              >
                <BarChart3 className="usina-sidebar-icon" />
                Publicidad
              </Link>
            </li>
            <li>
              <button
                onClick={() => setFinancesOpen(!financesOpen)}
                className={`usina-sidebar-nav-item w-full justify-between ${
                  pathname?.includes("/dashboard/finances") ? "Activo" : ""
                }`}
              >
                <div className="flex items-center">
                  <DollarSign className="usina-sidebar-icon" />
                  Finanzas
                </div>
                {financesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {financesOpen && (
                <ul className="pl-10 mt-1 space-y-1">
                  <li>
                    <Link
                      href="/dashboard/finances"
                      className={`block p-2 rounded-md text-sm ${
                        pathname === "/dashboard/finances"
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        Resumen
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/finances/wallets"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/dashboard/finances/wallets")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Wallet className="h-4 w-4" />
                        Cuentas Publicitarias
                      </div>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link
                href="/dashboard/personnel"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/personnel") ? "Activo" : ""
                }`}
              >
                <Users className="usina-sidebar-icon" />
                Personal
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/reports"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/reports") ? "Activo" : ""
                }`}
              >
                <FileText className="usina-sidebar-icon" />
                Reportes
              </Link>
            </li>
            <li>
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className={`usina-sidebar-nav-item w-full justify-between ${
                  pathname?.includes("/admin/") ? "Activo" : ""
                }`}
              >
                <div className="flex items-center">
                  <Database className="usina-sidebar-icon" />
                  Administración
                </div>
                {adminOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {adminOpen && (
                <ul className="pl-10 mt-1 space-y-1">
                  <li>
                    <Link
                      href="/admin/diagnostics"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/admin/diagnostics")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      Diagnóstico
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/table-info"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/admin/table-info")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      Información de Tablas
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/setup"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/admin/setup")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      Configuración DB
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/rls-manager"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/admin/rls-manager")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      Administrar RLS
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/fix-user"
                      className={`block p-2 rounded-md text-sm ${
                        pathname?.includes("/admin/fix-user")
                          ? "text-primary font-medium"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      Arreglar Rol de Usuario
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className={`usina-sidebar-nav-item ${
                  pathname?.includes("/dashboard/settings") ? "Activo" : ""
                }`}
              >
                <Settings className="usina-sidebar-icon" />
                Configuración
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-border/30 mt-auto">
          <div className="mb-4 text-sm text-muted-foreground">
            <p>Usuario: {user.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={signOut}>
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-background">
        <header className="bg-card shadow-sm p-4 border-b border-border/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground">
                {getPageDescription()}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" className="relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
              </Button>
              <ThemeToggle />
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
