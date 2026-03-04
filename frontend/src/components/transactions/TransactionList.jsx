import React from 'react';
import { Transaction } from '../../types';



export function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 text-lg">No transactions found</p>
      </div>
    );
  }

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">Income</p>
          <p className="text-2xl font-bold text-green-600">+${totalIncome.toFixed(2)}</p>
        </div>
        <div className="text-center border-l border-r border-gray-300">
          <p className="text-sm text-gray-600 font-medium">Expenses</p>
          <p className="text-2xl font-bold text-red-600">-${totalExpense.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">Net</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {(totalIncome - totalExpense) >= 0 ? '+' : '-'}${Math.abs(totalIncome - totalExpense).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction._id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                {/* Date */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>

                {/* Description */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {transaction.description || (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </td>

                {/* Category */}
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {transaction.category}
                  </span>
                </td>

                {/* Type */}
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {transaction.type === 'income' ? '📈 Income' : '📉 Expense'}
                  </span>
                </td>

                {/* Amount */}
                <td className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold"
                      title="Edit transaction"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(transaction._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
                      title="Delete transaction"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}




