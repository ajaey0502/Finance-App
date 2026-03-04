import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

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

export function MonthlyTrendChart({ monthlyData }) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Income vs Expenses</h2>
        <p className="text-gray-600 text-center py-8">No data available</p>
      </div>
    );
  }

  const chartData = {
    labels: monthlyData.map((m) => m.monthName || m.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map((m) => m.totalIncome || 0),
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
        data: monthlyData.map((m) => m.totalExpenses || 0),
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 13, weight: '500' },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
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
          font: { size: 12 },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: { size: 12 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Income vs Expenses</h2>
      <div style={{ height: '350px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
