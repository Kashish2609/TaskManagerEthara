import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color = 'indigo', progressValue }) => {
  // Setup color theme map
  const themes = {
    indigo: {
      bg: 'from-indigo-500/10 to-blue-500/5',
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      text: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      shadow: 'shadow-indigo-500/5'
    },
    violet: {
      bg: 'from-violet-500/10 to-purple-500/5',
      border: 'border-violet-500/20 hover:border-violet-500/40',
      text: 'text-violet-400',
      iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      shadow: 'shadow-violet-500/5'
    },
    emerald: {
      bg: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      shadow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'from-amber-500/10 to-orange-500/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      shadow: 'shadow-amber-500/5'
    },
    rose: {
      bg: 'from-rose-500/10 to-pink-500/5',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      shadow: 'shadow-rose-500/5'
    }
  };

  const theme = themes[color] || themes.indigo;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${theme.bg} ${theme.border} ${theme.shadow} border backdrop-blur-lg flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-400 uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${theme.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {progressValue !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Progress</span>
            <span className={theme.text}>{progressValue}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden border border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r from-indigo-500 to-violet-500`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
