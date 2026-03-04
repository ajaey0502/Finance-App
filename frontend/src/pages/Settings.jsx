import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { useAuth } from '../hooks/useAuth';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600">Name</label>
                  <p className="text-lg font-medium">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <p className="text-lg font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold mb-4">About FinSight</h2>
                <p className="text-gray-700 mb-4">
                  FinSight is a personal finance application that helps you track expenses,
                  manage budgets, and forecast spending using AI.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Track income and expenses</li>
                    <li>Budget management with alerts</li>
                    <li>AI-powered expense categorization</li>
                    <li>Monthly spending forecast</li>
                    <li>Detailed analytics and reports</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold mb-4">API Information</h2>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Backend:</strong> Node.js + Express.js
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Database:</strong> MongoDB
                </p>
                <p className="text-sm text-gray-600">
                  <strong>AI:</strong> Google Gemini API
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




