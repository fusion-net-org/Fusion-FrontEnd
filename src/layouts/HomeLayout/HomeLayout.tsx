import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NavLeft from '../../components/NavLeft/NavLeft';
import HomeHeader from '@/components/Header/HomeHeader';

const HomeLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nav-collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nav-collapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen">
      <NavLeft isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <HomeHeader toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HomeLayout;
