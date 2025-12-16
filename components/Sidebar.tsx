

import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { View } from '../App';
import { supabase } from '../utils/supabase';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  onManageCategories: () => void;
  onManageTaxes: () => void;
  onQuickAdd: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}> = ({ isActive, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-lg font-semibold transition-colors duration-200 rounded-lg ${
      isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
    }`}
  >
    {icon}
    {children}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ view, setView, onManageCategories, onManageTaxes, onQuickAdd, isOpen, setIsOpen }) => {
  const [userEmail, setUserEmail] = useState<string | undefined>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email);
    });
  }, []);

  const handleSetView = (newView: View) => {
    setView(newView);
    setIsOpen(false);
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className={`w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col h-full fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <h1 className="text-xl font-bold text-white">P&L Tracker</h1>
            </div>
            <button 
                onClick={() => setIsOpen(false)} 
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Close sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavButton 
            isActive={view === 'dashboard'} 
            onClick={() => handleSetView('dashboard')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          >
            Dashboard
          </NavButton>
          <NavButton 
            isActive={view === 'transactions'} 
            onClick={() => handleSetView('transactions')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
          >
            Transactions
          </NavButton>
          <NavButton 
            isActive={view === 'subscriptions'} 
            onClick={() => handleSetView('subscriptions')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          >
            Subscriptions
          </NavButton>
          <NavButton 
            isActive={view === 'reports'} 
            onClick={() => handleSetView('reports')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          >
            Reports
          </NavButton>
           <NavButton 
            isActive={view === 'taxes'} 
            onClick={() => handleSetView('taxes')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" /></svg>}
          >
            Taxes
          </NavButton>
        </nav>
      </div>
      
      <div className="flex flex-col gap-2 mt-auto">
          <Button onClick={() => { onQuickAdd(); setIsOpen(false); }} className="w-full bg-green-600 hover:bg-green-700 text-white focus:ring-green-500">
             + Quick Add
          </Button>
          <Button onClick={() => { onManageCategories(); setIsOpen(false); }} variant="secondary" className="w-full">
            Manage Categories
          </Button>
          <Button onClick={() => { onManageTaxes(); setIsOpen(false); }} variant="secondary" className="w-full">
            Tax Settings
          </Button>
          <div className="border-t border-zinc-800 pt-4 mt-2">
            <div className="text-xs text-zinc-500 text-center mb-2 truncate px-2">{userEmail}</div>
            <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
            </button>
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;