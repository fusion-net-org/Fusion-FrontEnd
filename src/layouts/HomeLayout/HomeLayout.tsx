import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import NavLeft from '../../components/NavLeft/NavLeft';
import HomeHeader from '@/components/Header/HomeHeader';
import { requestPermissionAndGetToken } from '@/Firebase';
import { registerDeviceToken } from '@/services/userDevice.js';
import { useSelector } from 'react-redux';
// import { listenForMessages } from '@/Firebase';

const HomeLayout = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.user.user);

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

  useEffect(() => {
    requestPermissionAndGetToken().then((fcmToken) => {
      if (fcmToken && user?.id) {
        registerDeviceToken({
          deviceToken: fcmToken,
          platform: 'WEB',
          deviceName: navigator.userAgent.substring(0, 80),
        });
      }
    });
  }, [user]);

  // useEffect(() => {
  //   listenForMessages();
  // }, []);
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
