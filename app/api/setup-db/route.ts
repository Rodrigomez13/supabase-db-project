import { NextResponse } from "next/server"
import { setupDatabase } from "@/lib/db-setup"

export async function GET() {
  try {
    const result = await setupDatabase()

    if (result.success) {
      return NextResponse.json({ message: "Database setup completed successfully" })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in setup-db route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
