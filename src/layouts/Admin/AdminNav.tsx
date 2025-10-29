import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users2, ShieldCheck, CreditCard, ReceiptText, Settings,
  ChevronDown, ChevronRight
} from 'lucide-react';
import logo_fusion from '@/assets/logo_fusion.png';

export default function AdminNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [openDash, setOpenDash] = useState(true);

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + '/');

  return (
    <aside className="h-screen sticky top-0 flex flex-col text-white bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-[64px] border-b border-white/10">
        <div className="p-2 rounded-full bg-violet-600">
          <img src={logo_fusion} className="h-5 w-5" alt="Fusion" />
        </div>
        <span className="font-semibold tracking-wide">Fusion — Admin</span>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-lg bg-violet-700/40">Level</span>
      </div>

      <nav className="px-3 py-4 space-y-6 overflow-y-auto">
        {/* Dashboard group */}
        <div>
          <button
            onClick={() => setOpenDash(v=>!v)}
            className="w-full flex items-center justify-between text-slate-300 hover:text-white px-2"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
            {openDash ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4" />}
          </button>

          {openDash && (
            <div className="mt-2 space-y-1">
              <button
                onClick={()=>nav('/admin')}
                className={`relative w-full text-left pl-10 pr-3 py-2 rounded-lg text-sm transition
                  ${pathname==='/admin'
                    ? 'bg-violet-600/15 text-white ring-1 ring-violet-500'
                    : 'text-slate-300 hover:bg-white/10'}`}
              >
                {/* vạch tím trái khi active */}
                {pathname==='/admin' && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-violet-500 rounded-r-full" />}
                Sales
              </button>
            </div>
          )}
        </div>

        {/* Main items */}
        <div className="space-y-1">
          {[
            {name:'Companies', icon:Building2, path:'/admin/companies'},
            {name:'Users', icon:Users2, path:'/admin/users'},
            {name:'Roles', icon:ShieldCheck, path:'/admin/roles'},
            {name:'Subscriptions', icon:CreditCard, path:'/admin/subscriptions'},
            {name:'Transactions', icon:ReceiptText, path:'/admin/transactions'},
            {name:'Settings', icon:Settings, path:'/admin/settings'},
          ].map(it=>{
            const Active = isActive(it.path);
            const Icon = it.icon;
            return (
              <button
                key={it.path}
                onClick={()=>nav(it.path)}
                className={`relative w-full flex items-center gap-3 pl-10 pr-3 py-2 rounded-lg text-sm transition
                  ${Active ? 'bg-violet-600/15 text-white ring-1 ring-violet-500' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {Active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-violet-500 rounded-r-full" />}
                <Icon className="h-5 w-5 opacity-90" />
                <span>{it.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto p-4 text-center text-slate-400 text-xs border-t border-white/10">
        © {new Date().getFullYear()} Fusion
      </div>
    </aside>
  );
}
