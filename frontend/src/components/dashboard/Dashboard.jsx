import React, { useEffect, useState } from 'react';
import { WalletCard } from './WalletCard';
import { ForecastCard } from './ForecastCard';
import { RecentTransactions } from './RecentTransactions';
import { QuickInsights } from './QuickInsights';
import api from '../../services/api';

export function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setError('');
        const [analyticsRes, transactionsRes, budgetsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/transactions?limit=10'),
          api.get('/budget/usage/all'),
        ]);

        const data = analyticsRes.data?.data || {};
        
        // Transform the API response
        const transformedData = {
          totalIncome: data.summary?.totalIncome || 0,
          totalExpenses: data.summary?.totalExpenses || 0,
          balance: data.summary?.balance || 0,
          percentChange: data.summary?.percentChange || 0,
          topCategory: data.summary?.topCategory || null,
        };
        
        setAnalytics(transformedData);
        setTransactions(transactionsRes.data?.data || transactionsRes.data || []);
        
        // Calculate budget summary
        const budgetList = budgetsRes.data?.data || [];
        setBudgets({
          onTrack: budgetList.filter(b => b.percentageSpent < 80).length,
          needsAttention: budgetList.filter(b => b.percentageSpent >= 80).length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold">{error || 'Unable to load dashboard'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate savings
  const savings = analytics.totalIncome - analytics.totalExpenses;
  const savingsRate = analytics.totalIncome > 0 
    ? ((savings / analytics.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WalletCard
          title="Total Income"
          amount={analytics.totalIncome}
          color="green"
          icon="📈"
        />
        <WalletCard
          title="Total Expenses"
          amount={analytics.totalExpenses}
          color="red"
          icon="📉"
        />
        <WalletCard
          title="Balance"
          amount={analytics.balance}
          color={analytics.balance >= 0 ? 'blue' : 'red'}
          icon="💰"
        />
        <WalletCard
          title="Savings"
          amount={savings}
          color={savings >= 0 ? 'emerald' : 'orange'}
          icon="🏦"
          subtitle={`${savingsRate}% savings rate`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <ForecastCard />
          <RecentTransactions transactions={transactions} />
        </div>

        {/* Right Column - Takes 1 column */}
        <div>
          <QuickInsights summary={analytics} budgetSummary={budgets} />
        </div>
      </div>
    </div>
  );
}




