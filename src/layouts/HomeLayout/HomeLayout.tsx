import { Outlet } from 'react-router-dom';
import NavLeft from '../../components/NavLeft/NavLeft';

const HomeLayout = () => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r">
        <NavLeft />
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
export default HomeLayout;
