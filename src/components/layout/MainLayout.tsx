import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/ui/header';
import { Sidebar } from '@/components/layout/Sidebar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="md:pl-64">
        <Header />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}