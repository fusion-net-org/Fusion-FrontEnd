import { Outlet } from 'react-router-dom';
import CompanyHeader from './CompanyHeader';
import CompanyFooter from './CompanyFooter';

export default function CompanyShell() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <CompanyHeader />

      {/* Nội dung trang */}
      <div className="flex-1">
        <Outlet />
      </div>

      <CompanyFooter />
    </div>
  );
}
