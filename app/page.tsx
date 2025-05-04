import { redirect } from "next/navigation";

export default function Home() {
  // Redirigir inmediatamente a la página de login
  redirect("/login");

  // Este código nunca se ejecutará debido a la redirección
  return null;
}
