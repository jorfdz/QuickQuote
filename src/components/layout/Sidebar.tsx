import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardList, KanbanSquare, History,
  Receipt, Users, UserCheck, Truck, ShoppingCart, Package, Settings,
  Zap, HelpCircle, ChevronLeft, ChevronRight, Layers, Wrench, Grid3X3,
  Calculator
} from 'lucide-react';
import { useStore } from '../../store';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { divider: 'ESTIMATING' },
  { path: '/pricing', icon: Calculator, label: 'Pricing Tool' },
  { path: '/quotes', icon: FileText, label: 'Quotes' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/tracker', icon: KanbanSquare, label: 'Order Tracker' },
  { path: '/history', icon: History, label: 'History' },
  { divider: 'BILLING' },
  { path: '/invoices', icon: Receipt, label: 'Invoices' },
  { divider: 'CLIENTS' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/contacts', icon: UserCheck, label: 'Contacts' },
  { divider: 'PURCHASING' },
  { path: '/vendors', icon: Truck, label: 'Vendors' },
  { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { divider: 'SETUP' },
  { path: '/materials', icon: Package, label: 'Materials' },
  { path: '/equipment', icon: Wrench, label: 'Equipment' },
  { path: '/templates', icon: Layers, label: 'Templates' },
  { path: '/imposition', icon: Grid3X3, label: 'Imposition Calc' },
  { divider: 'SYSTEM' },
  { path: '/users', icon: UserCheck, label: 'Users & Roles' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/integrations', icon: Zap, label: 'Integrations' },
  { path: '/help', icon: HelpCircle, label: 'Help Center' },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useStore();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-950 text-white flex flex-col transition-all duration-300 z-30 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">QQ</span>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">QuikQuote</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xs">QQ</span>
          </div>
        )}
        {!sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-auto">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return sidebarCollapsed ? (
              <div key={i} className="border-t border-white/10 my-2" />
            ) : (
              <p key={i} className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 pt-4 pb-1">{item.divider}</p>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all group ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        {sidebarCollapsed ? (
          <button onClick={() => setSidebarCollapsed(false)} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
            <span className="text-xs font-bold text-white">{currentUser.name[0]}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{currentUser.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{currentUser.role}</p>
            </div>
            <button onClick={() => setSidebarCollapsed(true)} className="p-0.5 hover:bg-white/10 rounded">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
