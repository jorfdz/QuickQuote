import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { GlobalSearch } from './GlobalSearch';

export const Header: React.FC = () => {
  const { sidebarCollapsed } = useStore();
  const navigate = useNavigate();
  
  return (
    <header className={`fixed top-0 right-0 h-14 bg-white border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_minmax(320px,720px)_minmax(0,1fr)] items-center gap-4 px-5 z-20 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'}`}>
      <div />
      <div className="justify-self-center w-full">
        <GlobalSearch />
      </div>
      <div className="flex items-center justify-end gap-2">
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
