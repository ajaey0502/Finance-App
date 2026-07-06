import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export function TransactionModal({ onClose, onSave, transaction }) {
  const [formData, setFormData] = useState({
    amount: transaction?.amount ?? 0,
    type: transaction?.type ?? 'expense',
    category: transaction?.category ?? '',
    description: transaction?.description ?? '',
    date: transaction?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  useEffect(() => {
    setFormData({
      amount: transaction?.amount ?? 0,
      type: transaction?.type ?? 'expense',
      category: transaction?.category ?? '',
      description: transaction?.description ?? '',
      date: transaction?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    });
  }, [transaction]);

  // Auto-suggest category when description changes (only for expenses)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description && formData.description.trim().length >= 3 && formData.type === 'expense') {
        getSuggestion(formData.description);
      } else {
        setAiSuggestion(null);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(timer);
  }, [formData.description, formData.type]);

  // Get AI category suggestion
  const getSuggestion = async (description) => {
    setIsLoadingSuggestion(true);
    try {
      const { data } = await api.post('/ai/categorize', { description });
      setAiSuggestion(data);
      
      // Auto-fill category if confidence is high and category is empty
      if (data.confidence >= 0.7 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data.category }));
      }
    } catch (err) {
      console.error('Failed to get AI suggestion:', err);
      setAiSuggestion(null);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!formData.category.trim()) {
      setError('Please enter a category');
      return;
    }

    // Description is required for expenses, optional for income
    if (formData.type === 'expense' && !formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category.trim(),
        description: formData.description.trim(),
        date: formData.date,
      };

      if (transaction?._id) {
        await api.put(`/transactions/${transaction._id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to save transaction'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-bold">{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <p className="text-blue-100 text-sm">Enter details and get automatic category suggestions.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
                {formData.type === 'income' && <span className="text-gray-400 font-normal">(Optional)</span>}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.type === 'income' ? 'e.g., Monthly salary, Gift from friend' : 'e.g., Starbucks Coffee, Uber ride, Netflix subscription'}
              />
              {formData.type === 'expense' && isLoadingSuggestion && (
                <p className="text-xs text-blue-600 mt-1">🤖 Getting suggestion...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              
              {formData.type === 'income' ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Salary">Salary</option>
                  <option value="Gift">Gift / Transfer from someone</option>
                </select>
              ) : (
                <>
                  {aiSuggestion && !isLoadingSuggestion && (
                    <div className="mb-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-blue-700">AI Suggestion:</span>
                          <span className="ml-2 text-sm font-bold text-blue-900">{aiSuggestion.category}</span>
                          <span className="ml-2 text-xs text-blue-600">
                            ({Math.round(aiSuggestion.confidence * 100)}% confidence)
                          </span>
                        </div>
                        {formData.category !== aiSuggestion.category && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: aiSuggestion.category }))}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            Use This
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Source: {aiSuggestion.source === 'keyword' ? '⚡ Keyword match' : aiSuggestion.source === 'cache' ? '💾 Cache' : '🤖 AI'}
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Food, Rent, Salary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-suggested or enter your own
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : transaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




