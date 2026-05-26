import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  Users, 
  Trophy, 
  LogOut, 
  User as UserIcon, 
  Flame,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/notes', label: 'Notes Hub', icon: BookOpen },
    { path: '/quizzes', label: 'AI Quizzes', icon: Sparkles },
    { path: '/rooms', label: 'Study Rooms', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-brand-surface/90 backdrop-blur-md border-b border-brand-accent/25 flex items-center justify-between px-6 z-40 md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-neonCyan flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-wider bg-gradient-to-r from-brand-text to-brand-neonPurple bg-clip-text text-transparent text-sm">
            STUDYVERSE
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-brand-textMuted hover:text-brand-text transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar navigation container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-surface border-r border-brand-accent/20 flex flex-col justify-between transition-transform duration-300 transform
        md:static md:translate-x-0 md:h-screen md:sticky md:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Logo & Close button on mobile */}
          <div className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-neonCyan flex items-center justify-center shadow-glass-glow animate-float">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-brand-text to-brand-neonPurple bg-clip-text text-transparent">
                  STUDYVERSE
                </h1>
                <span className="text-[10px] uppercase text-brand-neonCyan tracking-widest font-semibold text-glow-cyan">
                  AI Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-brand-textMuted hover:text-brand-text md:hidden border border-brand-accent/20 rounded-lg bg-brand-surface"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Mini Profile */}
          {user && (
            <div className="mx-4 my-2 p-4 rounded-2xl glass-panel flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/50 flex items-center justify-center text-brand-neonPurple font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-semibold text-sm truncate text-brand-text">{user.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-brand-accent/30 text-brand-neonPurple px-1.5 py-0.5 rounded-full font-bold border border-brand-accent/25">
                    Lvl {user.level}
                  </span>
                  <span className="text-[11px] text-brand-textMuted font-medium">
                    {user.xp} XP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <nav className="mt-8 px-4 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm border
                    ${isActive 
                      ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-neonPurple shadow-glass' 
                      : 'border-transparent text-brand-textMuted hover:text-brand-text hover:bg-brand-accent/5'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Logout Option */}
        <div className="p-4">
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent text-brand-textMuted hover:text-brand-neonPink hover:bg-brand-neonPink/5 transition-all duration-300 font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
