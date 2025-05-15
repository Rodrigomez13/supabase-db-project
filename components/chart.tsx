"use client";

import { useEffect, useRef, useState } from "react";

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

// Registrar plugins de Chart.js (ChartJS.register es seguro de llamar múltiples veces)
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

interface ChartProps {
  type: "line" | "bar" | "pie" | "doughnut";
  data: any;
  options?: any;
  height?: number;
  width?: number;
  className?: string;
  loading?: boolean;
}

export function Chart({
  type,
  data,
  options = {},
  height = 200, // Reducido de 300 a 200
  width = 100,
  className = "",
  loading = false,
}: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [chartId] = useState(
    `chart-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    // Importar Chart.js dinámicamente para evitar problemas de SSR
    const loadChart = async () => {
      if (chartRef.current && data && !loading) {
        const { Chart, registerables } = await import("chart.js");
        Chart.register(...registerables);

        // Destruir el gráfico anterior si existe
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Crear el nuevo gráfico
        const ctx = chartRef.current ? chartRef.current.getContext("2d") : null;
        if (ctx) {
          // Configuración por defecto para el tema oscuro de Usina con colores turquesa
          const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 500, // Reducir duración de animaciones
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                labels: {
                  color: "#94B8A5", // Color turquesa claro para las etiquetas
                  font: {
                    family: "Inter, sans-serif",
                    size: 11, // Tamaño de fuente más pequeño
                  },
                  boxWidth: 12, // Cajas de leyenda más pequeñas
                  padding: 10, // Menos padding
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 36, 35, 0.9)",
                titleColor: "#FFFFFF",
                bodyColor: "#94B8A5", // Color turquesa claro para el cuerpo
                borderColor: "#009378", // Borde turquesa
                borderWidth: 1,
                padding: 8,
                cornerRadius: 4,
                displayColors: true,
                usePointStyle: true,
                boxPadding: 3,
                titleFont: {
                  size: 12,
                },
                bodyFont: {
                  size: 11,
                },
              },
            },
            scales:
              type !== "pie" && type !== "doughnut"
                ? {
                    x: {
                      grid: {
                        color: "rgba(0, 147, 120, 0.1)", // Líneas de cuadrícula turquesa muy sutiles
                        drawBorder: false,
                        drawTicks: false,
                      },
                      ticks: {
                        color: "#94B8A5", // Color turquesa claro para los ticks
                        font: {
                          size: 10, // Fuente más pequeña
                        },
                        maxRotation: 0, // Evitar rotación de etiquetas
                        padding: 5,
                      },
                    },
                    y: {
                      grid: {
                        color: "rgba(0, 147, 120, 0.1)", // Líneas de cuadrícula turquesa muy sutiles
                        drawBorder: false,
                      },
                      ticks: {
                        color: "#94B8A5", // Color turquesa claro para los ticks
                        font: {
                          size: 10, // Fuente más pequeña
                        },
                        padding: 5,
                      },
                      beginAtZero: true,
                    },
                  }
                : undefined,
          };

          // Asegurar que los colores de los datasets sean de la paleta turquesa
          if (data.datasets) {
            const turquoiseColors = [
              "#009378", // Turquesa principal
              "#00665A", // Turquesa secundario
              "#00332D", // Turquesa oscuro
              "#10B981", // Verde turquesa
              "#94B8A5", // Turquesa claro
            ];

            data.datasets.forEach((dataset: any, index: number) => {
              const colorIndex = index % turquoiseColors.length;

              if (type === "line") {
                dataset.borderColor =
                  dataset.borderColor || turquoiseColors[colorIndex];
                dataset.backgroundColor =
                  dataset.backgroundColor || `${turquoiseColors[colorIndex]}33`; // Con transparencia
                dataset.pointBackgroundColor =
                  dataset.pointBackgroundColor || turquoiseColors[colorIndex];
                dataset.pointBorderColor =
                  dataset.pointBorderColor || "#FFFFFF";
              } else if (type === "bar") {
                dataset.backgroundColor =
                  dataset.backgroundColor || turquoiseColors[colorIndex];
                dataset.hoverBackgroundColor =
                  dataset.hoverBackgroundColor ||
                  `${turquoiseColors[colorIndex]}CC`;
              } else if (type === "pie" || type === "doughnut") {
                dataset.backgroundColor =
                  dataset.backgroundColor ||
                  Array(dataset.data.length)
                    .fill(0)
                    .map((_, i) => turquoiseColors[i % turquoiseColors.length]);
              }
            });
          }

          // Combinar opciones por defecto con las proporcionadas
          const mergedOptions = { ...defaultOptions, ...options };

          chartInstance.current = new Chart(ctx, {
            type,
            data,
            options: mergedOptions,
          });
        }
      }
    };

    loadChart();

    // Limpiar al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartId, type, data, options, loading]); // Añadido chartId para evitar recreaciones innecesarias

  if (loading) {
    return (
      <div
        style={{ height: `${height}px`, width: "100%" }}
        className={`flex items-center justify-center ${className}`}
      >
        <div className="animate-pulse text-usina-text-secondary">
          Cargando datos...
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }} className={className}>
      <canvas id={chartId} ref={chartRef} />
    </div>
  );
}

export const BarChart = Chart;
export const LineChart = Chart;
