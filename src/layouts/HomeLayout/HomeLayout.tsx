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
    localStorage.setItem('nav-collapsed', isCollapsed ? '1' : '0');
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-500">
      <NavLeft isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <HomeHeader toggleSidebar={toggleSidebar} />
        <main className="flex-1 px-6 pb-6 overflow-y-auto bg-white dark:bg-gray-800 border-l-[2px] border-gray-200 dark:border-gray-700 transition-colors duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HomeLayout;
