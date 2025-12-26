import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Users, List, Grid, MessageCircle, ChevronRight, LogOut, BarChart3, ChevronLeft, Shield, MoreHorizontal } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  // Helper to determine if link is active
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    // Base classes
    let classes = 'flex items-center rounded-xl transition-all duration-200 group ';

    // Size & Spacing based on collapsed state
    if (isCollapsed) {
      classes += 'justify-center p-3 ';
    } else {
      classes += 'gap-3 px-4 py-3 ';
    }

    // Active state styles
    if (isActive) {
      classes += 'bg-blue-600 text-white shadow-lg shadow-blue-200/50 font-medium';
    } else {
      classes += 'text-gray-600 hover:bg-gray-100 hover:text-blue-600';
    }

    return classes;
  };

  const getBottomLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex flex-col items-center justify-center py-2 px-1 transition-colors ${isActive
      ? 'text-blue-600 font-medium'
      : 'text-gray-400 hover:text-gray-600'
      }`;
  };

  const userInitials = userProfile?.nome
    ? userProfile.nome.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const userName = userProfile?.nome || 'Usuário';
  const userRole = userProfile?.role || 'Publicador';

  const allNavItems = [
    { to: '/planner', icon: Calendar, label: 'Semanas', roles: ['USER', 'ASSISTENTE', 'PRESIDENTE', 'ADMIN'] },
    { to: '/tracking', icon: MessageCircle, label: 'Status', roles: ['ADMIN', 'PRESIDENTE', 'ASSISTENTE'] },
    { to: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['ADMIN', 'PRESIDENTE'] },
    { to: '/skills', icon: Grid, label: 'Matriz', roles: ['ADMIN'] },
    // Grouped in Menu for mobile (index >= 4)
    { to: '/participants', icon: Users, label: 'Publicadores', roles: ['ADMIN'] },
    { to: '/parts', icon: List, label: 'Partes', roles: ['ADMIN'] },
    { to: '/admin/users', icon: Shield, label: 'Usuários', roles: ['ADMIN'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-100 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`p-4 flex items-center border-b border-gray-50 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg shrink-0 flex items-center justify-center shadow-md shadow-blue-200">
                <Calendar className="text-white" size={20} />
              </div>
              <div className="leading-tight whitespace-nowrap">
                <h1 className="font-bold text-gray-800 text-lg tracking-tight">JW Planner</h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">v0.1.0</span>
                  {(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE) !== 'production' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE) === 'qa'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                      {(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle Button - Centered when collapsed, right-aligned when expanded */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
              title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {!isCollapsed && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-300">
                Menu Principal
              </div>
            )}

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={getLinkClass}
                title={isCollapsed ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600 transition-colors'}`} />

                    {!isCollapsed && (
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-300">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && isActive && (
                      <ChevronRight size={16} className="text-white/80 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer User Profile */}
          <div className="p-3 border-t border-gray-50">
            <div className={`bg-gray-50 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-indigo-100 shrink-0 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                {userInitials}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userRole}</p>
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100vh] overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <Calendar className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-800">JW Planner</span>
            {(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE) !== 'production' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE) === 'qa'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                {(import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {userInitials}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        {/* Added pb-24 to ensure content is not hidden behind bottom nav */}
        <div className="flex-1 overflow-auto bg-gray-50 relative pb-24 lg:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
          <div className="flex justify-around items-center px-2 py-1">
            {/* Logic: If <= 5 items, show all. If > 5, show 4 + More button */}
            {navItems.length <= 5 ? (
              navItems.map((item) => (
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
              ))
            ) : (
              // More than 5 items: Show first 4 + More
              <>
                {navItems.slice(0, 4).map((item) => (
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

                {/* More Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${isMobileMenuOpen ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <div className={`p-1 rounded-full transition-all ${isMobileMenuOpen ? 'bg-blue-50' : 'bg-transparent'}`}>
                    <MoreHorizontal size={20} className={isMobileMenuOpen ? 'text-blue-600' : 'text-gray-400'} strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium">Menu</span>
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Show remaining items */}
                {navItems.slice(4).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className={`p-2 rounded-full ${location.pathname.startsWith(item.to) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <item.icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-800 font-semibold rounded-xl"
              >
                Fechar
              </button>
              <div className="h-safe-bottom" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
