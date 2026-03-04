import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);



export function CategoryBreakdown({ analytics }) {
  const chartData = {
    labels: analytics.categoryBreakdown.map((c) => c.category),
    datasets: [
      {
        data: analytics.categoryBreakdown.map((c) => c.amount),
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#fbbf24',
          '#10b981',
          '#06b6d4',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Expense Breakdown by Category',
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="max-w-md mx-auto" style={{ height: 320 }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}




