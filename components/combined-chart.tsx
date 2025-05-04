"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CombinedChartProps {
  data: {
    labels: string[];
    datasets: {
      type: "bar" | "line";
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      yAxisID?: string;
      tension?: number;
      fill?: boolean;
      pointRadius?: number;
      pointHoverRadius?: number;
    }[];
  };
  options?: any;
  height?: number;
  className?: string;
  loading?: boolean;
}

export function CombinedChart({
  data,
  options = {},
  height = 350,
  className = "",
  loading = false,
}: CombinedChartProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{ height: `${height}px` }}
        className={`flex items-center justify-center ${className}`}
      >
        <div className="animate-pulse text-muted-foreground">
          Cargando datos...
        </div>
      </div>
    );
  }

  // Opciones por defecto para el gráfico combinado
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (context.dataset.yAxisID === "y1") {
                label += `$${context.parsed.y.toFixed(2)}`;
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Cantidad",
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Costo ($)",
        },
        grid: {
          drawOnChartArea: false,
        },
        beginAtZero: true,
      },
    },
  };

  // Combinar opciones por defecto con las proporcionadas
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height: `${height}px` }} className={className}>
      <Chart ref={chartRef} type="bar" data={data} options={mergedOptions} />
    </div>
  );
}
