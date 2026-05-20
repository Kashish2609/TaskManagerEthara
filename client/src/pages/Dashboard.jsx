import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FolderKanban, 
  ListTodo, 
  CalendarClock, 
  CheckCircle2, 
  TrendingUp, 
  Activity as ActivityIcon,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/tasks/dashboard/stats');
      if (data.success) {
        setStats(data.stats);
        setOverdueTasks(data.overdueTasks || []);
        setRecentActivities(data.recentActivities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  // Setup data for Charts
  const pieData = stats ? [
    { name: 'To Do', value: stats.tasks.todo, color: '#6366f1' },
    { name: 'In Progress', value: stats.tasks.inProgress, color: '#f59e0b' },
    { name: 'Completed', value: stats.tasks.completed, color: '#10b981' }
  ].filter(item => item.value > 0) : [];

  const barData = stats ? [
    { name: 'Low', count: stats.priority.low, fill: '#10b981' },
    { name: 'Medium', count: stats.priority.medium, fill: '#f59e0b' },
    { name: 'High', count: stats.priority.high, fill: '#f43f5e' }
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-white p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">Real-time health check on your active projects and tasks.</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 backdrop-blur-md">
          <Clock size={14} className="text-indigo-400" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Active Projects" 
              value={stats.projects} 
              icon={FolderKanban} 
              color="indigo" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Total Team Tasks" 
              value={stats.tasks.total} 
              icon={ListTodo} 
              color="violet"
              progressValue={stats.tasks.progressPercent}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Completed Tasks" 
              value={stats.tasks.completed} 
              icon={CheckCircle2} 
              color="emerald" 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              title="Overdue Items" 
              value={stats.tasks.overdue} 
              icon={CalendarClock} 
              color={stats.tasks.overdue > 0 ? 'rose' : 'amber'} 
            />
          </motion.div>
        </motion.div>
      )}

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Distribution (Pie Chart) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 rounded-3xl"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            Task Status Distribution
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-300 text-xs font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm font-semibold">No task data available.</p>
            )}
          </div>
        </motion.div>

        {/* Task Priorities (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 rounded-3xl"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            Tasks by Priority
          </h3>
          <div className="h-[300px]">
            {stats && (stats.priority.low || stats.priority.medium || stats.priority.high) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#white' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-sm font-semibold">No task priorities recorded.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row: Overdue Alert & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overdue Tasks Alert */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 rounded-3xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-500" />
            Overdue Tasks
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task) => (
                <div 
                  key={task._id} 
                  className="p-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 hover:border-rose-500/25 rounded-2xl transition-all duration-200"
                >
                  <p className="text-sm font-bold text-rose-300 truncate">{task.title}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-md">
                      {task.project?.name}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <CheckCircle2 size={32} className="text-emerald-500/80 mb-2" />
                <p className="text-slate-400 text-xs font-semibold">Perfect! No overdue tasks.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 rounded-3xl flex flex-col"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ActivityIcon size={18} className="text-indigo-400" />
            Recent Activity
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act._id} className="flex gap-3 items-start p-3 bg-slate-950/30 rounded-2xl border border-slate-800/40 hover:border-slate-800 transition-colors duration-200">
                  <img 
                    src={act.user?.avatar} 
                    alt={act.user?.name} 
                    className="h-8.5 w-8.5 rounded-xl border border-slate-700 object-cover shadow-sm mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-300">
                      <span className="font-bold text-white mr-1">{act.user?.name}</span>
                      {act.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wide">
                        {act.project?.name}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <ActivityIcon size={32} className="text-slate-600/80 mb-2 animate-pulse" />
                <p className="text-slate-500 text-xs font-semibold">No recent activity logged.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
