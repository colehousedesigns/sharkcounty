
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all">
            🦈
          </div>
          <div>
            <span className="text-2xl font-oswald font-bold tracking-tighter text-white">SHARK</span>
            <span className="text-2xl font-oswald font-bold tracking-tighter text-cyan-400">COUNTY</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" active={isActive('/')}>Dashboard</NavLink>
          <NavLink to="/find" active={isActive('/find')}>Match Finder</NavLink>
          <NavLink to="/live" active={isActive('/live')}>Live Coach</NavLink>
          <NavLink to="/ai" active={isActive('/ai')}>Shark AI</NavLink>
          <NavLink to="/profile" active={isActive('/profile')}>Profile</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-zinc-500 font-medium tracking-widest">BETA</span>
            <span className="text-xs text-cyan-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <Link to="/live" className="bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-full text-xs font-black transition-all shadow-lg shadow-cyan-900/20 uppercase tracking-tighter">
            Start Live
          </Link>
        </div>
      </div>
    </header>
  );
};

const NavLink: React.FC<{ to: string; active: boolean; children: React.ReactNode }> = ({ to, active, children }) => (
  <Link 
    to={to} 
    className={`text-xs uppercase tracking-widest font-bold transition-colors ${active ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
  >
    {children}
  </Link>
);

export default Navbar;
