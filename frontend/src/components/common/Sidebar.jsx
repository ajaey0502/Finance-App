import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: '🏠 Dashboard' },
  { path: '/transactions', label: '💳 Transactions' },
  { path: '/budget', label: '📈 Budget' },
  { path: '/analytics', label: '📉 Analytics' },
  { path: '/settings', label: '⚙️ Settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="bg-dark text-white w-64 min-h-screen p-6">
      <div className="space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded transition ${
              location.pathname === item.path
                ? 'bg-primary text-white'
                : 'hover:bg-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}




