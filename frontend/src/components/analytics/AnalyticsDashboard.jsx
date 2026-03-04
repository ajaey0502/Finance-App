import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



export function IncomeVsExpense({ analytics }) {
  const chartData = {
    labels: analytics.monthlyTrends.map((t) => t.month),
    datasets: [
      {
        label: 'Income',
        data: analytics.monthlyTrends.map((t) => t.income),
        backgroundColor: '#10b981',
      },
      {
        label: 'Expenses',
        data: analytics.monthlyTrends.map((t) => t.expenses),
        backgroundColor: '#ef4444',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses',
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Bar data={chartData} options={options} />
    </div>
  );
}




