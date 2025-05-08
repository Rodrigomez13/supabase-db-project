"use client";

import { useState } from "react";
import { FranchiseSelector } from "./franchise-selector";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export function GlobalFranchiseSelector() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-[#133936] border-b border-green-200 transition-all duration-300 ease-in-out">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-green-800">
            Configuración de Derivación
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-2 pb-2">
            <FranchiseSelector />
          </div>
        )}
      </div>
    </div>
  );
}
