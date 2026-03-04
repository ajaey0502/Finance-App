import React from 'react';

export function QuickInsights({ summary, budgetSummary }) {
  const insights = [];

  // Spending comparison insight
  if (summary?.percentChange !== undefined) {
    const change = summary.percentChange;
    if (Math.abs(change) > 10) {
      const direction = change > 0 ? 'more' : 'less';
      insights.push({
        icon: change > 0 ? '📈' : '📉',
        text: `Spending ${Math.abs(change).toFixed(0)}% ${direction} than last month`,
        color: change > 0 ? 'text-orange-700' : 'text-green-700',
        bgColor: change > 0 ? 'bg-orange-50' : 'bg-green-50',
        borderColor: change > 0 ? 'border-orange-200' : 'border-green-200',
      });
    } else {
      insights.push({
        icon: '✅',
        text: 'Spending is consistent with last month',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      });
    }
  }

  // Top category insight
  if (summary?.topCategory && summary.topCategory.name) {
    insights.push({
      icon: '🏆',
      text: `Your biggest expense is ${summary.topCategory.name} ($${summary.topCategory.amount.toFixed(2)})`,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    });
  }

  // Budget status insight
  if (budgetSummary) {
    const { onTrack, needsAttention } = budgetSummary;
    if (onTrack + needsAttention > 0) {
      insights.push({
        icon: needsAttention > 0 ? '⚠️' : '✅',
        text: needsAttention > 0 
          ? `${onTrack} budgets on track, ${needsAttention} needs attention`
          : `All ${onTrack} budgets are on track`,
        color: needsAttention > 0 ? 'text-yellow-700' : 'text-green-700',
        bgColor: needsAttention > 0 ? 'bg-yellow-50' : 'bg-green-50',
        borderColor: needsAttention > 0 ? 'border-yellow-200' : 'border-green-200',
      });
    }
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`${insight.bgColor} border ${insight.borderColor} rounded-lg p-4 flex items-start gap-3`}
          >
            <span className="text-2xl">{insight.icon}</span>
            <p className={`${insight.color} font-medium flex-1`}>{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
