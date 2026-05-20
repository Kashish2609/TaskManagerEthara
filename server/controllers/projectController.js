const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Get all projects (Admin gets all, Member gets their assigned projects)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let projects;
    
    if (req.user.role === 'admin') {
      // Admins see all projects
      projects = await Project.find({})
        .populate('createdBy', 'name email avatar')
        .populate('members', 'name email avatar role');
    } else {
      // Members see projects they are added to or created
      projects = await Project.find({
        $or: [
          { createdBy: req.user.id },
          { members: req.user.id }
        ]
      })
        .populate('createdBy', 'name email avatar')
        .populate('members', 'name email avatar role');
    }

    // Include task completion counts for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({
          project: project._id,
          status: 'completed',
        });
        
        return {
          ...project.toObject(),
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
      })
    );

    res.json({ success: true, projects: projectsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin only)
exports.createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can create projects' });
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      members: members || [],
    });

    // Log Activity
    await Activity.create({
      user: req.user.id,
      project: project._id,
      action: `created the project "${name}"`,
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single project details (including members & tasks)
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check authorization: admin can access everything, members must be project members
    if (
      req.user.role !== 'admin' &&
      project.createdBy.toString() !== req.user.id &&
      !project.members.some((m) => m._id.toString() === req.user.id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to this project' });
    }

    // Get associated tasks
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar');

    // Get project activities
    const activities = await Activity.find({ project: project._id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(15);

    res.json({
      success: true,
      project,
      tasks,
      activities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can update projects' });
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.name = name || project.name;
    project.description = description || project.description;

    await project.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      project: project._id,
      action: `updated the project details`,
    });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a project and its tasks
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can delete projects' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete tasks inside this project
    await Task.deleteMany({ project: project._id });
    
    // Delete activities related to this project
    await Activity.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    res.json({ success: true, message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to a project
// @route   POST /api/projects/:id/members
// @access  Private (Admin only)
exports.addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can manage team members' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Find the user to add
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Check if user is already a member
    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push(userToAdd._id);
    await project.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      project: project._id,
      action: `added ${userToAdd.name} to the team`,
    });

    res.json({
      success: true,
      message: 'Member added successfully',
      members: project.members,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin only)
exports.removeProjectMember = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can manage team members' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userToRemove = await User.findById(req.params.userId);
    if (!userToRemove) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is in members array
    if (!project.members.includes(userToRemove._id)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this project' });
    }

    // Remove user
    project.members = project.members.filter(
      (memberId) => memberId.toString() !== userToRemove._id.toString()
    );
    await project.save();

    // Also unassign tasks in this project assigned to this user
    await Task.updateMany(
      { project: project._id, assignedTo: userToRemove._id },
      { $unset: { assignedTo: 1 } }
    );

    // Log Activity
    await Activity.create({
      user: req.user.id,
      project: project._id,
      action: `removed ${userToRemove.name} from the team`,
    });

    res.json({
      success: true,
      message: 'Member removed successfully',
      members: project.members,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
