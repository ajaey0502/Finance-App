// @ts-nocheck
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);



export function CategoryChart({ analytics }) {
  const categoryBreakdown = analytics?.categoryBreakdown || [];
  
  // Color palette for categories
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
  ];

  const chartData = {
    labels: categoryBreakdown.map((c) => c.category || 'Unknown'),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.amount || 0),
        backgroundColor: colors.slice(0, categoryBreakdown.length),
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, weight: '500'},
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Expense Breakdown by Category',
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
            const dataset = context.dataset;
            const total = dataset.data.reduce((a, b) => a + b, 0);
            const currentValue = dataset.data[context.dataIndex];
            const percentage = ((currentValue / total) * 100).toFixed(1);
            return `${context.label}: $${currentValue.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
      <Pie data={chartData} options={options} height={280} />
      
      {/* Category Details */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {analytics.categoryBreakdown.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-gray-700 font-medium">{category.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">${category.amount.toFixed(2)}</span>
                <span className="text-gray-500 text-xs">{category.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




