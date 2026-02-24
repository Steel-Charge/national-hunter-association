'use client';

import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeightEntry } from '@/lib/store';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Props {
    entries: WeightEntry[];
    viewMode: 'WEEK' | 'MONTH';
    themeColor?: string;
}

export default function WeightProgressGraph({ entries, viewMode, themeColor = '#fff' }: Props) {
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => a.date.localeCompare(b.date));
    }, [entries]);

    const chartData = useMemo(() => {
        const now = new Date();
        const daysToFilter = viewMode === 'WEEK' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - daysToFilter);

        const filtered = sortedEntries.filter(e => new Date(e.date) >= cutoff);

        // If no entries in period, show empty but with scale
        const labels = filtered.map(e => {
            const date = new Date(e.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });

        const data = filtered.map(e => e.weight);

        return {
            labels,
            datasets: [
                {
                    label: 'Weight',
                    data: data,
                    borderColor: themeColor,
                    backgroundColor: `${themeColor}20`,
                    borderWidth: 3,
                    pointBackgroundColor: themeColor,
                    pointBorderColor: 'rgba(0,0,0,0.5)',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.3, // Smooth curve
                    fill: true,
                }
            ]
        };
    }, [sortedEntries, viewMode, themeColor]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: `${themeColor}44`,
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${context.parsed.y} kg`
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.4)',
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.4)',
                    font: {
                        size: 10
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    if (entries.length === 0) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.2)',
                fontSize: '0.9rem',
                textAlign: 'center',
                padding: '20px'
            }}>
                No weight data recorded yet.<br />
                Start by checking in on the calendar!
            </div>
        );
    }

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
