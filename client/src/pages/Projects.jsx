import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FolderPlus, 
  Search, 
  Calendar, 
  CheckSquare, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Project creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]); // All users list
  const [selectedMembers, setSelectedMembers] = useState([]); // IDs
  const [memberEmail, setMemberEmail] = useState('');
  const [createError, setCreateError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
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
    fetchProjects();
    fetchUsers();
  }, []);

  const handleAddMemberByEmail = (e) => {
    e.preventDefault();
    setCreateError('');
    if (!memberEmail) return;

    const matchedUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());
    if (!matchedUser) {
      setCreateError('No user found with this email.');
      return;
    }

    if (selectedMembers.some(id => id === matchedUser._id)) {
      setCreateError('User already selected.');
      return;
    }

    setSelectedMembers([...selectedMembers, matchedUser._id]);
    setMemberEmail('');
  };

  const handleRemoveSelectedMember = (id) => {
    setSelectedMembers(selectedMembers.filter(memberId => memberId !== id));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!name) {
      setCreateError('Project name is required.');
      return;
    }

    try {
      const { data } = await axios.post('/api/projects', {
        name,
        description,
        members: selectedMembers
      });

      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setSelectedMembers([]);
        setCreateError('');
        fetchProjects(); // Refresh listing
      }
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Error creating project');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-white p-8 overflow-y-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Active Projects</h2>
          <p className="text-sm text-slate-400 mt-1">Review active workspaces and track overall task progress velocity.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Admin Project Button */}
          {user?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:from-indigo-600 hover:to-violet-700 transition-all duration-200 shrink-0"
            >
              <FolderPlus size={15} />
              New Project
            </motion.button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <motion.div
              key={proj._id}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => navigate(`/projects/${proj._id}`)}
              className="group p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-lg shadow-slate-950/20 cursor-pointer min-h-[220px]"
            >
              <div>
                {/* Title */}
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1">
                    {proj.name}
                  </h3>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                {/* Description */}
                <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed line-clamp-2 min-h-[32px]">
                  {proj.description || 'No description provided for this project.'}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {/* Progress Indicators */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={10} />
                      {proj.completedTasks}/{proj.totalTasks} Tasks
                    </span>
                    <span>{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${proj.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full"
                    />
                  </div>
                </div>

                {/* Footer details: Owner & Members */}
                <div className="flex justify-between items-center border-t border-slate-800/50 pt-3">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                  
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {proj.members?.slice(0, 4).map((member) => (
                      <img
                        key={member._id}
                        src={member.avatar}
                        alt={member.name}
                        title={`${member.name} (${member.role})`}
                        className="inline-block h-6.5 w-6.5 rounded-lg ring-2 ring-slate-900 object-cover shadow-sm"
                      />
                    ))}
                    {proj.members?.length > 4 && (
                      <div className="h-6.5 w-6.5 rounded-lg bg-slate-800 flex items-center justify-center text-[9px] font-bold ring-2 ring-slate-900 text-slate-400">
                        +{proj.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="h-[55vh] flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-8">
          <FolderPlus size={44} className="text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No projects found.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
            {user?.role === 'admin' 
              ? 'Click the "+ New Project" button at the top right to start a workspace.' 
              : 'Contact your administrator to be added as a project member.'}
          </p>
        </div>
      )}

      {/* Create Project Modal (Admin only) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setCreateError('');
          setSelectedMembers([]);
          setName('');
          setDescription('');
        }}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs font-semibold text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{createError}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ethara AI Platform v2"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the project objectives..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          {/* Team Members Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Invite Team Members</label>
            
            <div className="flex gap-2">
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter member's email address"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                type="button"
                onClick={handleAddMemberByEmail}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold uppercase px-4 rounded-2xl active:scale-95 transition-all duration-200"
              >
                Add
              </button>
            </div>

            {/* Selected Members Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMembers.map(memberId => {
                const member = users.find(u => u._id === memberId);
                if (!member) return null;
                return (
                  <div 
                    key={memberId} 
                    className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold"
                  >
                    <img src={member.avatar} alt="" className="h-4.5 w-4.5 rounded-md object-cover" />
                    <span className="text-slate-300 truncate max-w-[80px]">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedMember(memberId)}
                      className="text-slate-500 hover:text-white p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-2xl mt-4 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.98] transition-all duration-200"
          >
            Create Workspace
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
