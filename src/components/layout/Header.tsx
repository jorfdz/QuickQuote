import React from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';

export const Header: React.FC = () => {
  const { sidebarCollapsed } = useStore();
  const navigate = useNavigate();
  
  return (
    <header className={`fixed top-0 right-0 h-12 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-20 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input placeholder="Quick search..." className="pl-8 pr-3 py-1 text-sm bg-gray-50 border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent w-56 placeholder-gray-400" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/quotes/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors" style={{ backgroundColor: '#F890E7' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Quote
        </button>
        <button className="relative p-1.5 hover:bg-gray-50 rounded-md transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        </button>
      </div>
    </header>
  );
};
