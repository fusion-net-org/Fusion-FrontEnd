import { Outlet } from 'react-router-dom';
import NavLeft from '../../components/NavLeft/NavLeft';

const HomeLayout = () => {
  return (
    <div className="flex min-h-screen">
      <NavLeft />

      <main className="flex-1 p-6 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
};
export default HomeLayout;
