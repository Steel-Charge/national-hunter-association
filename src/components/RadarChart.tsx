'use client';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface RadarChartProps {
    labels: string[];
    data: number[];
    rankColor?: string; // Dynamic rank color
    comparisonData?: number[]; // Optional comparison data
    comparisonColor?: string; // Optional comparison color
}

export default function RadarChart({ labels, data, rankColor = '#00e5ff', comparisonData, comparisonColor = 'red' }: RadarChartProps) {
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Attributes',
                data: data,
                backgroundColor: `${rankColor}33`, // Transparent rank color background
                borderColor: rankColor,
                borderWidth: 4, // Thicker line for more impact
                pointBackgroundColor: rankColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: rankColor,
                pointHoverRadius: 8,
                pointHoverBorderWidth: 3,
                fill: true,
            },
            ...(comparisonData ? [{
                label: 'Comparison',
                data: comparisonData,
                backgroundColor: 'transparent',
                borderColor: comparisonColor,
                borderWidth: 2,
                pointBackgroundColor: comparisonColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: comparisonColor,
                pointHoverRadius: 7,
                pointHoverBorderWidth: 3,
                borderDash: [5, 5],
            }] : []),
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: `${rankColor}22`, // Themed angle lines
                    lineWidth: 1,
                },
                grid: {
                    color: `${rankColor}22`, // Themed grid lines
                    lineWidth: 1,
                },
                pointLabels: {
                    color: rankColor, // Themed labels
                    font: {
                        size: 16, // Slightly larger
                        weight: 'bold' as const,
                        family: 'Inter, sans-serif',
                    },
                    padding: 20,
                },
                ticks: {
                    display: false,
                    backdropColor: 'transparent',
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: rankColor,
                bodyColor: '#ffffff',
                borderColor: rankColor,
                borderWidth: 2,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        return `${context.parsed.r.toFixed(1)}%`;
                    }
                }
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div style={{
            height: '350px',
            width: '100%',
            position: 'relative',
            filter: `drop-shadow(0 0 15px ${rankColor}44)` // Subtle glow for the whole chart
        }}>
            <Radar data={chartData} options={options} />
        </div>
    );
}
