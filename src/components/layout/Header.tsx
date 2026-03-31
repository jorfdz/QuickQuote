import React from 'react';
import { Bell } from 'lucide-react';
import { useStore } from '../../store';
import { GlobalSearch } from './GlobalSearch';

export const Header: React.FC = () => {
  const { sidebarCollapsed } = useStore();
  
  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_minmax(320px,720px)_minmax(0,1fr)] items-center gap-4 px-5 z-20 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-56'}`}>
      <div />
      <div className="justify-self-center w-full">
        <GlobalSearch />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button className="relative p-1.5 hover:bg-gray-50 rounded-md transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        </button>
      </div>
    </header>
  );
};
