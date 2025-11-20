import { Bell, Search } from 'lucide-react';

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b">
      <div className="h-[56px] px-6 flex items-center justify-between">
        {/* breadcrumb đơn giản + search */}
        <div className="flex items-center gap-4 flex-1">
          <nav className="hidden md:flex items-center text-sm text-slate-500">
            <span>Home</span><span className="mx-2">›</span>
            <span>Dashboard</span><span className="mx-2">›</span>
            <span className="text-slate-900 font-medium">Sales</span>
          </nav>

          <div className="relative max-w-md w-full md:ml-2">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              placeholder="Search…"
              className="h-10 w-full pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          <button className="relative h-10 w-10 grid place-items-center rounded-xl border border-slate-200 hover:bg-slate-50">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute right-2 top-2 inline-block h-2 w-2 bg-violet-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <img
              className="h-9 w-9 rounded-full border border-slate-200 object-cover"
              src={sessionStorage.getItem('avatar') || 'https://randomuser.me/api/portraits/men/32.jpg'}
              alt="avatar"
            />
            <div className="hidden sm:block text-sm">
              <div className="font-medium text-slate-800">Joseph William</div>
              <div className="text-slate-500 text-xs">Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
