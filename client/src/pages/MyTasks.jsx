import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckSquare, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Play,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, todo, in-progress, completed

  const fetchMyTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks/me');
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const { data } = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      if (data.success) {
        // Update local state directly
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on active selection
  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  const getPriorityStyles = (prio) => {
    switch (prio) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  // Status helper cards
  const getStatusPill = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'in-progress':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'todo':
      default:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
  };

  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-white p-8 overflow-y-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">My Task Sheet</h2>
          <p className="text-sm text-slate-400 mt-1">Unified board listing all action items assigned directly to you.</p>
        </div>

        {/* Filters Row */}
        <div className="bg-slate-900 border border-slate-800/60 p-1.5 rounded-2xl flex gap-1 self-stretch sm:self-auto overflow-x-auto shrink-0 select-none">
          {['all', 'todo', 'in-progress', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                activeFilter === f ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'in-progress' ? 'In Progress' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Task Rows Sheet */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-3xl bg-slate-900/40 border transition-colors duration-200 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue 
                    ? 'border-rose-500/20 hover:border-rose-500/30' 
                    : 'border-slate-800/80 hover:border-slate-800'
                }`}
              >
                {/* Details */}
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-800/60">
                      {task.project?.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getPriorityStyles(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getStatusPill(task.status)}`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-snug">{task.title}</h3>
                  
                  {task.description && (
                    <p className="text-xs font-semibold text-slate-400 truncate max-w-xl">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Status Shifting and Actions */}
                <div className="flex flex-wrap items-center gap-4 shrink-0 border-t md:border-t-0 border-slate-800/40 pt-3 md:pt-0">
                  {/* Due Date display */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mr-2">
                    <Calendar size={13} className={isOverdue ? 'text-rose-400' : 'text-slate-400'} />
                    <span className={isOverdue ? 'text-rose-400 font-black' : ''}>
                      {isOverdue ? 'Overdue: ' : ''}
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions column */}
                  <div className="flex gap-2 select-none">
                    {task.status === 'todo' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'in-progress')}
                        className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase px-3.5 py-2 rounded-xl transition-all duration-200"
                      >
                        <Play size={10} /> Start Work
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'completed')}
                        className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-3.5 py-2 rounded-xl transition-all duration-200"
                      >
                        <CheckCircle2 size={10} /> Mark Complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate(task._id, 'in-progress')}
                        className="text-slate-500 hover:text-white text-[10px] font-extrabold uppercase border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all duration-200"
                      >
                        Re-open Task
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="h-[55vh] flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-8">
          <ClipboardList size={44} className="text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">All caught up!</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
            You do not have any tasks in this view. Nice work!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
