import React from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';

export const Header: React.FC = () => {
  const { sidebarCollapsed } = useStore();
  const navigate = useNavigate();
  
  return (
    <header className={`fixed top-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Quick search..." className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 placeholder-gray-400" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/quotes/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </button>
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>
      </div>
    </header>
  );
};
