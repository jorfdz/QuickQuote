import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ClipboardList, KanbanSquare, History,
  Receipt, Users, UserCheck, Truck, ShoppingCart, Package, Settings,
  Zap, HelpCircle, ChevronLeft, ChevronRight, Layers, Wrench, Scissors, BookOpen
} from 'lucide-react';
import { useStore } from '../../store';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { divider: 'ESTIMATING' },
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
  { path: '/catalog', icon: BookOpen, label: 'Catalog' },
  { path: '/materials', icon: Package, label: 'Materials' },
  { path: '/equipment', icon: Wrench, label: 'Equipment' },
  { path: '/finishing', icon: Scissors, label: 'Finishing' },
  { path: '/templates', icon: Layers, label: 'Templates' },
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xs">QQ</span>
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">QuikQuote</span>
              <p className="text-[9px] text-gray-500 leading-none mt-0.5">V2 3/30/26 9:32PM</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center mx-auto hover:bg-yellow-300 transition-colors" title="Expand sidebar">
            <span className="text-gray-900 font-bold text-xs">QQ</span>
          </button>
        )}
        {!sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-auto">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="mx-auto mt-2 mb-1 flex items-center justify-center w-10 h-7 rounded-md hover:bg-white/10 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-px">
        {navItems.map((item, i) => {
          if ('divider' in item) {
            return sidebarCollapsed ? (
              <div key={i} className="border-t border-white/5 my-1.5" />
            ) : (
              <p key={i} className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2 pt-3 pb-1">{item.divider}</p>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all group ${isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
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
