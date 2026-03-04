// @ts-nocheck
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';


Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);



export function ChartSection({ analytics }) {
  const monthlyTrends = analytics?.monthlyTrends || [];
  const chartData = {
    labels: monthlyTrends.map((t) => t.month || 'N/A'),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map((t) => t.income || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map((t) => t.expenses || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: '500'},
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses Trend',
        font: { size: 16, weight: 'bold'},
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold'},
        bodyFont: { size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
      <Line data={chartData} options={options} height={300} />
    </div>
  );
}




