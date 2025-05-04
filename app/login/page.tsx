"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        console.error("Error de inicio de sesión:", error);
        setError(`Credenciales incorrectas. Por favor, intenta de nuevo.`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Error inesperado:", err);
      setError(`Error inesperado: ${err.message || "Desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex items-center justify-end p-8">
        <Card className="w-full max-w-md bg-card border-border/30 animate-slide-in-from-right animate-fade-in duration-700">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-[#26D9C7] font-bold">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-[#0B514C]">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-500/10 border-red-500/20 text-red-500"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#26D9C7]">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/30 placeholder:text-[#0B514C]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[#26D9C7]">
                    Contraseña
                  </Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/50 border-border/30"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label htmlFor="remember" className="text-sm text-[#26D9C7]">
                  Recordarme
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm" style={{ color: "#0B514C" }}>
              ¿No tienes una cuenta?{" "}
              <a href="/signup" className="text-primary hover:underline">
                Contacta al administrador
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="hidden lg:block lg:flex-1 bg-[url('/emerald-depths.png')] bg-cover bg-center">
        <div className="h-full w-full bg-gradient-to-r from-background to-transparent flex items-center justify-start">
          <div className="px-16 animate-slide-in-from-left animate-fade-in duration-700">
            <img
              src="/usina-leads-login2.png"
              alt="USINA"
              className="mb-8 w-[400px]"
            />
            <p className="text-2xl font-medium text-[#0B514C] max-w-md">
              Sistema integral de gestión de leads, campañas publicitarias y
              franquicias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
