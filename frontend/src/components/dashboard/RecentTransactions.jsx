import React from 'react';
import { Link } from 'react-router-dom';

export function RecentTransactions({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <p className="text-gray-500 text-center py-8">No transactions yet</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Link 
          to="/transactions" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {transactions.slice(0, 3).map((transaction) => (
          <div 
            key={transaction._id} 
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{transaction.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {transaction.category}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
