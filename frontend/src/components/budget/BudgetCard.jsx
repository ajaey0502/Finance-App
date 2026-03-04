import React from 'react';
import { Budget } from '../../types';



export function BudgetCard({ budget, onEdit, onDelete }) {
  const percentage = (budget.spent / budget.limit) * 100;
  const isAlert = percentage >= 80;

  return (
    <div className={`rounded-lg p-6 ${isAlert ? 'bg-warning bg-opacity-20 border-l-4 border-warning' : 'bg-white'} shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{budget.category}</h3>
          <p className="text-sm text-gray-600 capitalize">{budget.period}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(budget)}
            className="text-blue-600 hover:text-blue-800"
          >
            âœï¸
          </button>
          <button
            onClick={() => onDelete(budget._id)}
            className="text-red-600 hover:text-red-800"
          >
            ðŸ—‘ï¸
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>${budget.spent.toFixed(2)}</span>
          <span className="text-gray-600">${budget.limit.toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isAlert ? 'bg-warning' : 'bg-secondary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600">{percentage.toFixed(0)}% spent</p>
      </div>
    </div>
  );
}




