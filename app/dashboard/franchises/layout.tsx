import type React from "react"
import { FranchiseTabs } from "@/components/franchise-tabs"

export default function FranchisesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <FranchiseTabs />
      <div className="p-4">{children}</div>
    </div>
  )
}
