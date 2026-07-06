import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { BudgetCard } from '../components/budget/BudgetCard';
import { BudgetForm } from '../components/budget/BudgetForm';
import api from '../services/api';

export function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budget/usage/all');
      const list = response?.data?.data || [];
      setError('');
      // Normalize _id so BudgetCard/BudgetForm (which target /budget/:id) work
      // against usage-endpoint results, which key on budgetId instead.
      setBudgets(list.map((b) => ({ ...b, _id: b.budgetId })));
    } catch (err) {
      setError('Failed to load budgets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budget/${id}`);
      fetchBudgets();
    } catch (err) {
      setError('Failed to delete budget');
    }
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
                onClick={handleAdd}
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
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Budget
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget._id}
                    budget={budget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onClose={handleCloseForm}
          onSave={fetchBudgets}
        />
      )}
    </div>
  );
}
