import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { Dashboard as DashboardComponent } from '../components/dashboard/Dashboard';

export function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <DashboardComponent />
        </div>
      </div>
    </div>
  );
}
