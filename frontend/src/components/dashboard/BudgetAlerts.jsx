import React from 'react';



export function BudgetAlerts({ budgetStatus }) {
  const budgets = budgetStatus || [];
  // Separate alerts and non-alerts
  const alerts = budgets.filter((b) => b.isAlert);
  const onTrack = budgets.filter((b) => !b.isAlert);

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">No budgets configured yet</p>
      </div>
    );
  }

  // Alert status colors and messages
  const getAlertStatus = (percentage) => {
    if (percentage >= 100) return { color: 'text-red-700', bgColor: 'bg-red-50', border: 'border-red-200', label: 'Over Budget' };
    if (percentage >= 90) return { color: 'text-orange-700', bgColor: 'bg-orange-50', border: 'border-orange-200', label: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-700', bgColor: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning' };
    return { color: 'text-green-700', bgColor: 'bg-green-50', border: 'border-green-200', label: 'On Track' };
  };

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 rounded-xl shadow-lg p-8 border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            âš ï¸ Budget Alerts ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((budget) => {
              const status = getAlertStatus(budget.percentage);
              const remaining = Math.max(0, budget.limit - budget.spent);
              
              return (
                <div
                  key={budget.category}
                  className={`${status.bgColor} border border-l-4 ${status.border} rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{budget.category}</p>
                      <p className="text-xs text-gray-600 mt-1">{status.label}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.color} bg-white`}>
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        budget.percentage >= 100
                          ? 'bg-red-600'
                          : budget.percentage >= 90
                            ? 'bg-orange-600'
                            : budget.percentage >= 75
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Amount Details */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                    </span>
                    {remaining > 0 && budget.percentage < 100 ? (
                      <span className="text-green-700 font-medium">
                        ${remaining.toFixed(2)} remaining
                      </span>
                    ) : budget.percentage >= 100 ? (
                      <span className="text-red-700 font-medium">
                        ${Math.abs(remaining).toFixed(2)} over budget
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* On Track Budgets */}
      {onTrack.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            âœ“ On Track ({onTrack.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onTrack.map((budget) => {
              const status = getAlertStatus(budget.percentage);
              const remaining = budget.limit - budget.spent;

              return (
                <div
                  key={budget.category}
                  className={`${status.bgColor} rounded-lg p-4 border ${status.border}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{budget.category}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${status.color} bg-white`}>
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Small Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${budget.percentage}%` }}
                    />
                  </div>

                  {/* Compact Details */}
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>${budget.spent.toFixed(2)} of ${budget.limit.toFixed(2)}</span>
                    <span className="text-green-700 font-medium">${remaining.toFixed(2)} left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {budgetStatus.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{budgetStatus.length}</p>
            <p className="text-xs text-gray-600 mt-1">Total Budgets</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <p className="text-2xl font-bold text-orange-600">{alerts.length}</p>
            <p className="text-xs text-gray-600 mt-1">Active Alerts</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-600">{onTrack.length}</p>
            <p className="text-xs text-gray-600 mt-1">On Track</p>
          </div>
        </div>
      )}
    </div>
  );
}




