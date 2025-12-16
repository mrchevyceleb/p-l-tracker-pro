import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, isSidebarOpen }) => {
  return (
    <header className={`p-4 flex items-center gap-4 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10 border-b border-zinc-800 ${isSidebarOpen ? 'lg:hidden' : ''}`}>
      <button onClick={onToggleSidebar} className="text-zinc-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h2 className="text-xl font-bold text-white capitalize">{title}</h2>
    </header>
  );
};

export default Header;
