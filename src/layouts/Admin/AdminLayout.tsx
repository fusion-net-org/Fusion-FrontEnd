import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminNav from './AdminNav';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-900">
      <AdminNav collapsed={collapsed} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onToggleNav={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-xl shadow-md p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
