import { Outlet } from 'react-router-dom';
import NavLeft from '../../components/NavLeft/NavLeft';

const HomeLayout = () => {
  return (
    <div className="flex bg-white min-h-screen">
      <NavLeft />

      <main className="flex-1 p-6 overflow-y-auto bg-white border-l-[2px] border-gray-300">
        <Outlet />
      </main>
    </div>
  );
};
export default HomeLayout;
