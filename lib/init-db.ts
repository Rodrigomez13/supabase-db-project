"use client"

import { useState } from "react"

export function useInitDb() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      const response = await fetch("/api/setup-db")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize database")
      }

      setIsInitialized(true)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setIsInitializing(false)
    }
  }

  return {
    initializeDatabase,
    isInitializing,
    isInitialized,
    error,
  }
}
