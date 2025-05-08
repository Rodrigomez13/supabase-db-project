"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

// Registrar los componentes necesarios de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CombinedChartProps {
  data: any;
  loading?: boolean;
}

export function CombinedChart({ data, loading = false }: CombinedChartProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    // Limpiar el chart cuando el componente se desmonte
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (!data || !data.labels || !data.datasets) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
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
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Costo ($)",
        },
      },
    },
  };

  return <Chart ref={chartRef} type="bar" data={data} options={options} />;
}
