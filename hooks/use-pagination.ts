"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

interface UsePaginationProps {
  totalItems: number
  initialPage?: number
  initialPageSize?: number
  pageParamName?: string
  pageSizeParamName?: string
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  totalPages: number
  from: number
  to: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  previousPage: () => void
  nextPage: () => void
  paginatedItems: number[]
}

export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  pageParamName = "page",
  pageSizeParamName = "pageSize",
}: UsePaginationProps): UsePaginationReturn {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Obtener valores de los parámetros de URL
  const pageFromUrl = searchParams.get(pageParamName)
  const pageSizeFromUrl = searchParams.get(pageSizeParamName)

  // Estado inicial basado en URL o valores por defecto
  const [page, setPageState] = useState(pageFromUrl ? Number.parseInt(pageFromUrl) : initialPage)
  const [pageSize, setPageSizeState] = useState(pageSizeFromUrl ? Number.parseInt(pageSizeFromUrl) : initialPageSize)

  // Calcular valores derivados
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = Math.min(totalItems, (page - 1) * pageSize + 1)
  const to = Math.min(totalItems, page * pageSize)

  // Actualizar URL cuando cambian los valores
  const updateUrl = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(pageParamName, newPage.toString())
    params.set(pageSizeParamName, newPageSize.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // Funciones para cambiar la página
  const setPage = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    setPageState(validPage)
    updateUrl(validPage, pageSize)
  }

  const setPageSize = (newPageSize: number) => {
    setPageSizeState(newPageSize)
    // Al cambiar el tamaño de página, volvemos a la primera página
    setPageState(1)
    updateUrl(1, newPageSize)
  }

  const previousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  // Asegurarse de que la página actual es válida cuando cambia el total de páginas
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages])

  // Generar array de índices para los elementos de la página actual
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    return Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i)
  }, [page, pageSize, totalItems])

  return {
    page,
    pageSize,
    totalPages,
    from,
    to,
    setPage,
    setPageSize,
    previousPage,
    nextPage,
    paginatedItems,
  }
}
