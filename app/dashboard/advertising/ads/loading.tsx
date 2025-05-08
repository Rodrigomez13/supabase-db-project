import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";

export default function LoadingAdsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anuncios</h1>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra los anuncios por nombre o estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Anuncios</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[200px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Nombre
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Estado
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Conjunto de Anuncios
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Campaña
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Fecha de Creación
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-5 w-[150px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-[80px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-[120px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-[120px]" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-[100px]" />
                      </td>
                      <td className="p-4 text-right">
                        <Skeleton className="h-9 w-[70px] ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Skeleton className="h-10 w-[300px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
