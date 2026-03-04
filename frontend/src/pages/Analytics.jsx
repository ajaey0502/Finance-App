import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import api from '../services/api';
import { CategoryBreakdown } from '../components/analytics/CategoryBreakdown';
import { MonthlyTrendChart } from '../components/analytics/MonthlyTrendChart';

export function Analytics() {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewType, setViewType] = useState('current-month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [displayMonth, setDisplayMonth] = useState('');

  // Initialize selectedMonth to current month
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthString = `${year}-${month}`;
    setSelectedMonth(monthString);
    updateDisplayMonth(monthString);
  }, []);

  const updateDisplayMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    setDisplayMonth(monthName);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [viewType, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      let params = {};
      
      if (viewType === 'specific-month') {
        // For specific month, extract year and month
        const [year, month] = selectedMonth.split('-');
        params = {
          year: parseInt(year),
          month: parseInt(month)
        };
      } else {
        // Map viewType to months
        const monthsMap = {
          'current-month': 1,
          'this-year': 12
        };
        
        params.months = monthsMap[viewType] || 1;
      }

      const [summaryRes, categoryRes, monthlyRes] = await Promise.all([
        api.get('/analytics/summary', { params }),
        api.get('/analytics/category-breakdown', { params }),
        api.get('/analytics/monthly-summary', { params }),
      ]);

      setSummary(summaryRes.data.data || summaryRes.data);
      setCategoryData(categoryRes.data.data || categoryRes.data);
      setMonthlyData(monthlyRes.data.data || monthlyRes.data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    updateDisplayMonth(newMonth);
    setViewType('specific-month');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">View your financial analytics and insights</p>
            </div>

            {/* Quick Selection Buttons */}
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={() => setViewType('current-month')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'current-month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setViewType('this-year')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'this-year'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                This Year
              </button>
              
              {/* Month Picker */}
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                viewType === 'specific-month'
                  ? 'bg-blue-50 border border-blue-300'
                  : 'bg-white border border-gray-300'
              }`}>
                <label htmlFor="month-picker" className={`font-medium ${
                  viewType === 'specific-month' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  Select Month:
                </label>
                <input
                  id="month-picker"
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="border-none focus:outline-none focus:ring-0 cursor-pointer bg-transparent"
                />
                {viewType === 'specific-month' && (
                  <span className="text-sm text-blue-600 ml-2">({displayMonth})</span>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${summary?.totalIncome?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${summary?.totalExpenses?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💸</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Net Balance</p>
                      <p className={`text-2xl font-bold ${(summary?.totalIncome - summary?.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((summary?.totalIncome || 0) - (summary?.totalExpenses || 0)) < 0 ? '-' : ''}${Math.abs(((summary?.totalIncome || 0) - (summary?.totalExpenses || 0))).toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Monthly Income vs Expenses Chart */}
            {monthlyData.length > 1 && (
              <div className="mb-8">
                <MonthlyTrendChart monthlyData={monthlyData} />
              </div>
            )}

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
              {categoryData.length > 0 ? (
                <CategoryBreakdown analytics={{ categoryBreakdown: categoryData }} />
              ) : (
                <p className="text-gray-600 text-center py-8">No transaction data available</p>
              )}
            </div>

            {/* Monthly Trends */}
            {viewType === 'this-year' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Trends</h2>
                {monthlyData.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyData.map((month, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">{month.monthName || month.month}</span>
                          <span className="text-sm text-gray-600">
                            {month.transactionCount} transactions
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Income</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${month.totalIncome?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Expenses</p>
                            <p className="text-lg font-semibold text-red-600">
                              ${month.totalExpenses?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No monthly data available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




