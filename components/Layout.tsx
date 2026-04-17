import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, PackagePlus, SettingsIcon, AlertTriangle } from './Icons';

const Layout: React.FC = () => {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/parties': return 'Parties';
      case '/products': return 'Products';
      case '/expired': return 'Expired Prod';
      case '/settings': return 'Settings';
      default: return 'MedStore';
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`
      }
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </NavLink>
  );

  // Check if we are on the search/dashboard page
  const isSearchPage = location.pathname === '/';

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Header - Hidden on Search Page */}
      {!isSearchPage && (
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 sticky top-0 z-10 border-b dark:border-gray-700 transition-colors duration-200">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{getTitle()}</h1>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
        <div className="max-w-3xl mx-auto h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 pb-safe z-20 transition-colors duration-200">
        <div className="flex justify-around items-center h-full max-w-3xl mx-auto px-1">
          <NavItem to="/" icon={LayoutDashboard} label="Search" />
          <NavItem to="/parties" icon={Users} label="Parties" />
          <NavItem to="/products" icon={PackagePlus} label="Add" />
          <NavItem to="/expired" icon={AlertTriangle} label="Expired" />
          <NavItem to="/settings" icon={SettingsIcon} label="Set'ngs" />
        </div>
      </nav>
    </div>
  );
};

export default Layout;