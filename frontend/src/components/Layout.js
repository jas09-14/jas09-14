import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, FolderOpen, BarChart3 } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monthly', icon: Calendar, label: 'Controle Mensal' },
    { to: '/categories', icon: FolderOpen, label: 'Categorias' },
    { to: '/reports', icon: BarChart3, label: 'Relatórios' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-border/50 sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">Controle Financeiro</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Gestão Anual 2026</p>
            </div>
            <nav className="flex gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;