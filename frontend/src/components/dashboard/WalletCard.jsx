import React from 'react';



export function WalletCard({ title, amount, color, icon, trend, subtitle }) {
  const colorClasses = {
    green: 'bg-gradient-to-br from-green-400 to-green-600',
    red: 'bg-gradient-to-br from-red-400 to-red-600',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
  };

  return (
    <div className={`${colorClasses[color]} text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm opacity-90 font-medium">{title}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      
      <div className="flex items-baseline justify-between">
        <p className="text-4xl font-bold">
          {amount < 0 ? '-' : ''}${Math.abs(amount || 0).toFixed(2)}
        </p>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend.startsWith('+') || trend === 'Positive'
              ? 'bg-white bg-opacity-20'
              : 'bg-white bg-opacity-20'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}




