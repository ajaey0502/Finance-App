import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export function BudgetForm({ onClose, onSave, budget }) {
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    limit: budget?.limit || 0,
    period: budget?.period || 'monthly',
  });

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get('/categories', { params: { type: 'expense' } });
        setCategories((response.data?.data || []).map((c) => c.name));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const payload = {
        category: formData.category,
        limit: Number(formData.limit),
        period: formData.period,
      };

      if (budget) {
        await api.put(`/budget/${budget._id}`, payload);
      } else {
        await api.post('/budget', payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">
          {budget ? 'Edit Budget' : 'Add Budget'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                })
              }
              className="w-full border rounded px-3 py-2 mt-1"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Limit</label>
            <input
              type="number"
              value={formData.limit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limit: e.target.value === '' ? '' : parseFloat(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2 mt-1"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Period</label>
            <select
              value={formData.period}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  period: e.target.value,
                })
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded transition disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
