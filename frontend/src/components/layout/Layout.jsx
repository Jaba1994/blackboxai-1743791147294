import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Toast from '../common/Toast';
import { useToastStore } from '@/store/toastStore';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts } = useToastStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <div className="fixed bottom-0 right-0 p-6 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => toast.onClose(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Layout;