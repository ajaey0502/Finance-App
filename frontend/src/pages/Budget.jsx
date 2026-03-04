import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import api from '../services/api';

export function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limit: 0,
    period: 'monthly',
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budget/usage/all');
      const list = response?.data?.data || [];
      setError('');
      setBudgets(list);
    } catch (err) {
      setError('Failed to load budgets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budget', {
        category: formData.category,
        limit: Number(formData.limit),
        period: formData.period,
      });
      setShowModal(false);
      setFormData({ category: '', limit: 0, period: 'monthly' });
      fetchBudgets();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create budget');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budget/${id}`);
      fetchBudgets();
    } catch (err) {
      setError('Failed to delete budget');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 100) return 'text-red-700';
    if (percentage >= 80) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget</h1>
                <p className="text-gray-600">Manage your budgets and spending limits</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Add Budget
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : budgets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">No budgets yet</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Budget
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {budgets.map((budget) => {
                  const limit = budget.limit || 0;
                  const spent = budget.spent || 0;
                  const remaining = budget.remaining ?? limit - spent;
                  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  return (
                    <div key={budget.budgetId || budget._id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{budget.category}</h3>
                          <p className="text-sm text-gray-500">{budget.period}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(budget.budgetId || budget._id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={getProgressTextColor(percentage)}>
                            ${spent.toFixed(2)} spent
                          </span>
                          <span className="text-gray-600">${limit.toFixed(2)} budget</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className={getProgressTextColor(percentage)}>
                          {percentage}% used
                        </span>
                        <span className="text-gray-600">
                          {remaining.toFixed(2)} remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-bold">Create Budget</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Food, Transportation"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Limit</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




