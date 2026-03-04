import React from 'react';



export function TransactionFilters({
  selectedMonth,
  onMonthChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  onAddTransaction,
  categories = [],
}) {
  // Get current month and year for min/max bounds
  const now = new Date();
  const maxMonth = now.toISOString().slice(0, 7);
  const minMonth = new Date(now.getFullYear() - 2, 0, 1).toISOString().slice(0, 7);

  const hasActiveFilters =
    selectedCategory || selectedType !== 'all';

  const handleResetFilters = () => {
    onCategoryChange('');
    onTypeChange('all');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🔍 Filters
        </h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset filters
            </button>
          )}
          <button
            onClick={onAddTransaction}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            ➕ Add Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            min={minMonth}
            max={maxMonth}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📂 Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>
    </div>
  );
}




