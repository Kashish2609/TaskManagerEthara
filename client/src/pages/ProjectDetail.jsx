import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Calendar, 
  AlertCircle, 
  CheckSquare, 
  ChevronRight,
  TrendingUp,
  FolderOpen,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Eye,
  Activity as ActivityIcon,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]); // All users list for member addition lookup
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // board, members, logs

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  
  // Create Task states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState('');

  // Add Member states
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');

  // Selected/Active Task details
  const [activeTask, setActiveTask] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const { data } = await axios.get(`/api/projects/${id}`);
      if (data.success) {
        setProject(data.project);
        setTasks(data.tasks || []);
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching project detail:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/auth/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchUsers();
  }, [id]);

  // Handle Project Delete
  const handleDeleteProject = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this project and all its tasks? This action is irreversible.')) return;
    try {
      const { data } = await axios.delete(`/api/projects/${id}`);
      if (data.success) {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');

    if (!taskTitle || !taskDueDate) {
      setTaskError('Task title and due date are required.');
      return;
    }

    try {
      const { data } = await axios.post(`/api/tasks/project/${id}`, {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssignee || null,
        priority: taskPriority,
        dueDate: taskDueDate,
      });

      if (data.success) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssignee('');
        setTaskPriority('medium');
        setTaskDueDate('');
        fetchProjectDetails(); // Reload details
      }
    } catch (error) {
      setTaskError(error.response?.data?.message || 'Error creating task');
    }
  };

  // Handle Adding Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');

    if (!memberEmail) return;

    try {
      const { data } = await axios.post(`/api/projects/${id}/members`, { email: memberEmail });
      if (data.success) {
        setIsMemberModalOpen(false);
        setMemberEmail('');
        fetchProjectDetails();
      }
    } catch (error) {
      setMemberError(error.response?.data?.message || 'Error adding team member');
    }
  };

  // Handle Removing Member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project? They will be unassigned from all tasks.')) return;
    try {
      const { data } = await axios.delete(`/api/projects/${id}/members/${memberId}`);
      if (data.success) {
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  // Handle Quick Task Deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const { data } = await axios.delete(`/api/tasks/${taskId}`);
      if (data.success) {
        setIsTaskDetailModalOpen(false);
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle Task Status Update (Admins can do it; Members can do it if they belong to project)
  const handleStatusChange = async (taskId, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      const { data } = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      if (data.success) {
        // Update local tasks state
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        if (activeTask && activeTask._id === taskId) {
          setActiveTask({ ...activeTask, status: newStatus });
        }
        fetchProjectDetails(); // Fetch logs & audits
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading project boards...</p>
        </div>
      </div>
    );
  }

  // Segment tasks by column status
  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  // Priority color tags helper
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

  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-white p-8 overflow-y-auto flex flex-col justify-between">
      <div>
        {/* Navigation Back */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider transition-colors duration-200"
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
        </div>

        {/* Project Header Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800/80 p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="text-indigo-400 h-6 w-6" />
              <h2 className="text-2xl font-extrabold tracking-tight text-white">{project?.name}</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1.5 font-medium max-w-xl">{project?.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Delete project button for Admins */}
            {user?.role === 'admin' && (
              <button 
                onClick={handleDeleteProject}
                className="flex items-center gap-1.5 text-rose-400 border border-rose-500/10 hover:border-rose-500/30 hover:bg-rose-500/5 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              >
                <Trash2 size={14} /> Delete Project
              </button>
            )}
            
            {/* Tabs toggle */}
            <div className="bg-slate-950 border border-slate-800/60 p-1.5 rounded-2xl flex gap-1">
              <button
                onClick={() => setActiveTab('board')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'board' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'members' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Team ({project?.members?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'logs' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Audits
              </button>
            </div>
          </div>
        </div>

        {/* Tab contents */}
        <AnimatePresence mode="wait">
          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'board' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              {/* Board Header and Admin Control */}
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-300">Kanban Board Columns</h3>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-indigo-500/10"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>

              {/* Kanban Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Column 1: TO DO */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/40">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">To Do</h4>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
                      {getTasksByStatus('todo').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {getTasksByStatus('todo').map(task => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        onClick={() => {
                          setActiveTask(task);
                          setIsTaskDetailModalOpen(true);
                        }} 
                      />
                    ))}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/40">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">In Progress</h4>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
                      {getTasksByStatus('in-progress').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {getTasksByStatus('in-progress').map(task => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        onClick={() => {
                          setActiveTask(task);
                          setIsTaskDetailModalOpen(true);
                        }} 
                      />
                    ))}
                  </div>
                </div>

                {/* Column 3: COMPLETED */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/40">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Completed</h4>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
                      {getTasksByStatus('completed').length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {getTasksByStatus('completed').map(task => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        onClick={() => {
                          setActiveTask(task);
                          setIsTaskDetailModalOpen(true);
                        }} 
                      />
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-800/50 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Project Members</h3>
                  <p className="text-xs text-slate-400 mt-1">Users allowed to collaborate, assign, and update statuses in this project.</p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200"
                  >
                    <UserPlus size={14} /> Invite Member
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Creator / Admin card */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img 
                      src={project?.createdBy?.avatar} 
                      alt="" 
                      className="h-10 w-10 rounded-xl object-cover border border-violet-500/20"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{project?.createdBy?.name} (Owner)</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project?.createdBy?.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-widest">
                    <ShieldCheck size={9} /> Creator
                  </span>
                </div>

                {/* Other members */}
                {project?.members?.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <img 
                        src={member.avatar} 
                        alt="" 
                        className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{member.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                        member.role === 'admin' 
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {member.role}
                      </span>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          title="Remove user from project"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 border border-transparent hover:border-rose-500/10"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: AUDITS */}
          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col"
            >
              <h3 className="text-lg font-bold text-white mb-5 pb-3 border-b border-slate-800/50">Project Activity logs</h3>
              
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map(act => (
                    <div key={act._id} className="flex gap-3 items-start p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                      <img 
                        src={act.user?.avatar} 
                        alt="" 
                        className="h-8 w-8 rounded-lg object-cover border border-slate-700 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-300">
                          <span className="font-extrabold text-white mr-1">{act.user?.name}</span>
                          {act.action}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ActivityIcon size={32} className="text-slate-700/80 mb-2 animate-pulse" />
                    <p className="text-slate-500 text-xs font-bold">No edits or actions logged yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RENDER MODAL: CREATE TASK (Admin only) */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskError('');
          setTaskTitle('');
          setTaskDesc('');
          setTaskAssignee('');
          setTaskPriority('medium');
          setTaskDueDate('');
        }}
        title="Add Project Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {taskError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs font-semibold text-rose-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{taskError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Code database schemas"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Provide simple task details..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          {/* Assignee Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assign To</label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Unassigned</option>
              {/* Creator/Owner */}
              <option value={project?.createdBy?._id}>{project?.createdBy?.name} (Owner)</option>
              {/* Project Members */}
              {project?.members?.map(member => (
                <option key={member._id} value={member._id}>{member.name} ({member.role})</option>
              ))}
            </select>
          </div>

          {/* Priority and Due Date Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Create Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-2xl mt-3 active:scale-[0.98] transition-all duration-200"
          >
            Deploy Task
          </button>
        </form>
      </Modal>

      {/* RENDER MODAL: INVITE MEMBER (Admin only) */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setMemberError('');
          setMemberEmail('');
        }}
        title="Invite Project Collaborator"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          {memberError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs font-semibold text-rose-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{memberError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Member Email</label>
            <select
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Choose User Email...</option>
              {users
                .filter(u => u._id !== project?.createdBy?._id && !project?.members?.some(m => m._id === u._id))
                .map(u => (
                  <option key={u._id} value={u.email}>{u.name} ({u.email})</option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-2xl active:scale-[0.98] transition-all duration-200"
          >
            Add Team Member
          </button>
        </form>
      </Modal>

      {/* RENDER MODAL: TASK DETAIL & EDIT (Both, restricted updates) */}
      <Modal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setActiveTask(null);
        }}
        title="Task Properties"
      >
        {activeTask && (
          <div className="space-y-5">
            {/* Title / Description */}
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide mb-2 ${getPriorityStyles(activeTask.priority)}`}>
                <Tag size={9} /> {activeTask.priority} Priority
              </span>
              <h4 className="text-lg font-bold text-white leading-snug">{activeTask.title}</h4>
              <p className="text-xs font-medium text-slate-400 leading-relaxed mt-2 p-3 bg-slate-950/60 border border-slate-800/40 rounded-2xl min-h-[60px]">
                {activeTask.description || 'No additional details listed for this task.'}
              </p>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[9px]">Assigned To</p>
                <div className="flex items-center gap-2 mt-2">
                  {activeTask.assignedTo ? (
                    <>
                      <img src={activeTask.assignedTo.avatar} alt="" className="h-6 w-6 rounded-md object-cover" />
                      <span className="font-semibold text-slate-300 truncate">{activeTask.assignedTo.name}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-slate-500 italic">Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[9px]">Due Date</p>
                <div className="flex items-center gap-2 mt-2.5 text-slate-300 font-semibold">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>{new Date(activeTask.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Status Change Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status Board Column</label>
              <select
                disabled={statusUpdateLoading}
                value={activeTask.status}
                onChange={(e) => handleStatusChange(activeTask._id, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Action buttons (Delete task for Admin only) */}
            {user?.role === 'admin' && (
              <div className="pt-2">
                <button
                  onClick={() => handleDeleteTask(activeTask._id)}
                  className="w-full bg-rose-500/10 border border-rose-500/15 text-rose-400 text-xs font-bold uppercase py-3 rounded-2xl hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Task
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// TaskCard Component inside Kanban Columns
const TaskCard = ({ task, onClick }) => {
  const getBorderColor = (prio) => {
    switch (prio) {
      case 'high':
        return 'hover:border-rose-500/30';
      case 'medium':
        return 'hover:border-amber-500/30';
      case 'low':
      default:
        return 'hover:border-emerald-500/30';
    }
  };

  const getPriorityDot = (prio) => {
    switch (prio) {
      case 'high':
        return 'bg-rose-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className={`p-4 rounded-2xl bg-slate-950 border border-slate-800/80 ${getBorderColor(task.priority)} transition-all duration-200 cursor-pointer shadow-md select-none`}
    >
      <div className="flex justify-between items-start gap-3">
        <h5 className="text-xs font-bold text-white tracking-wide line-clamp-2 leading-relaxed">{task.title}</h5>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getPriorityDot(task.priority)} mt-1 shadow-sm`} />
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900/60">
        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
          <Calendar size={10} className="text-indigo-500/80" />
          {new Date(task.dueDate).toLocaleDateString()}
        </span>

        {task.assignedTo ? (
          <img 
            src={task.assignedTo.avatar} 
            alt={task.assignedTo.name} 
            title={task.assignedTo.name}
            className="h-5.5 w-5.5 rounded-md object-cover border border-slate-700 shadow-inner" 
          />
        ) : (
          <span className="text-[9px] font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/40 italic">unassigned</span>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectDetail;
