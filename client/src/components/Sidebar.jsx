import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  LogOut, 
  ShieldAlert, 
  UserCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', to: '/projects', icon: FolderKanban },
    { name: 'My Tasks', to: '/my-tasks', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-slate-300">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-6 pb-6 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-xl">E</span>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">Ethara.ai</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Task Manager</span>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur-md">
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="h-10 w-10 rounded-xl border border-indigo-500/30 object-cover shadow-inner"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                    <ShieldAlert size={8} /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    <UserCircle size={8} /> Member
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-2 flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 text-white border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] shadow-indigo-500/5'
                    : 'text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white hover:border-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`mr-3 h-5 w-5 shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="shrink-0 p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rose-400 rounded-xl hover:bg-rose-500/5 hover:text-rose-300 border border-transparent hover:border-rose-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
