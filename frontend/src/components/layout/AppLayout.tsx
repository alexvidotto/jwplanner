import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Users, List, Grid, MessageCircle, ChevronRight, LogOut, BarChart3 } from 'lucide-react';

export const AppLayout = () => {


  // Helper to determine if link is active
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50 font-medium'
      : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
      }`;
  };

  const getBottomLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex flex-col items-center justify-center py-2 px-1 transition-colors ${isActive
      ? 'text-blue-600 font-medium'
      : 'text-gray-400 hover:text-gray-600'
      }`;
  };

  const navItems = [
    { to: '/planner', icon: Calendar, label: 'Semanas' },
    { to: '/participants', icon: Users, label: 'Publicadores' },
    { to: '/parts', icon: List, label: 'Partes' },
    { to: '/skills', icon: Grid, label: 'Matriz' },
    { to: '/tracking', icon: MessageCircle, label: 'Acompanhamento' },
    { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 z-50">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
                <Calendar className="text-white" size={20} />
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-gray-800 text-lg tracking-tight">JW Planner</h1>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">v0.1.0</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Principal</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={getLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600 transition-colors'} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={16} className="text-white/80" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer User Profile (Mock) */}
          <div className="p-4 border-t border-gray-50">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">Congregação</p>
              </div>
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100vh] overflow-hidden">
        {/* Mobile Header (No Menu Button) */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <Calendar className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-800">JW Planner</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            A
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        {/* Added pb-24 to ensure content is not hidden behind bottom nav */}
        <div className="flex-1 overflow-auto bg-gray-50 relative pb-24 lg:pb-0">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
          <div className="flex justify-around items-center px-2 py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={getBottomLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                      <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
};
