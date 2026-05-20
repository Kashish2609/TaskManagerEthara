const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Create a new task under a project
// @route   POST /api/tasks/project/:projectId
// @access  Private (Admin only)
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { projectId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can create tasks' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if assignee is valid project member (or admin, let's allow assigning to any project member)
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      dueDate,
      createdBy: req.user.id,
    });

    // Populate assignee details
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email avatar role');

    // Create activity logs
    let actionStr = `created task "${title}"`;
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      actionStr += ` and assigned it to ${assignedUser.name}`;
    }

    await Activity.create({
      user: req.user.id,
      project: projectId,
      task: task._id,
      action: actionStr,
    });

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a task (Admin can change everything, Member can only change status)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    let task = await Task.findById(req.params.id).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check project member status for Members
    const project = await Project.findById(task.project._id);
    if (
      req.user.role !== 'admin' &&
      !project.members.includes(req.user.id) &&
      project.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify tasks in this project' });
    }

    // Track original status for activity log
    const oldStatus = task.status;

    if (req.user.role === 'admin') {
      // Admin can update everything
      task.title = title !== undefined ? title : task.title;
      task.description = description !== undefined ? description : task.description;
      task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
      task.status = status !== undefined ? status : task.status;
      task.priority = priority !== undefined ? priority : task.priority;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    } else {
      // Member can ONLY update status
      if (
        title !== undefined ||
        description !== undefined ||
        assignedTo !== undefined ||
        priority !== undefined ||
        dueDate !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: 'Members are only allowed to update the status of a task',
        });
      }
      
      if (status !== undefined) {
        // Enforce that a member should be the assignee to update status, OR a member of the project
        task.status = status;
      }
    }

    await task.save();
    
    // Fetch populated task
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar');

    // Create activity logs for updates
    if (oldStatus !== task.status) {
      await Activity.create({
        user: req.user.id,
        project: task.project._id,
        task: task._id,
        action: `updated status of "${task.title}" from "${oldStatus}" to "${task.status}"`,
      });
    } else {
      await Activity.create({
        user: req.user.id,
        project: task.project._id,
        task: task._id,
        action: `edited task details for "${task.title}"`,
      });
    }

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can delete tasks' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = task.project;
    const taskTitle = task.title;

    await task.deleteOne();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      project: project,
      action: `deleted task "${taskTitle}"`,
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's tasks (assigned to them)
// @route   GET /api/tasks/me
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('project', 'name description')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & statistical breakdown
// @route   GET /api/tasks/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let projectsFilter = {};
    let tasksFilter = {};

    if (!isAdmin) {
      // Find projects user is a member of
      const userProjects = await Project.find({
        $or: [{ createdBy: userId }, { members: userId }],
      });
      const projectIds = userProjects.map((p) => p._id);
      
      // Filter for stats: member only sees tasks inside their projects OR assigned to them
      projectsFilter = { _id: { $in: projectIds } };
      tasksFilter = {
        $or: [
          { assignedTo: userId },
          { project: { $in: projectIds } }
        ]
      };
    }

    // Projects count
    const totalProjects = await Project.countDocuments(projectsFilter);

    // Tasks metrics
    const totalTasks = await Task.countDocuments(tasksFilter);
    const todoTasks = await Task.countDocuments({ ...tasksFilter, status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ ...tasksFilter, status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ ...tasksFilter, status: 'completed' });

    // Priority metrics
    const lowPriority = await Task.countDocuments({ ...tasksFilter, priority: 'low' });
    const mediumPriority = await Task.countDocuments({ ...tasksFilter, priority: 'medium' });
    const highPriority = await Task.countDocuments({ ...tasksFilter, priority: 'high' });

    // Overdue tasks: dueDate passed and status not completed
    const now = new Date();
    const overdueTasksCount = await Task.countDocuments({
      ...tasksFilter,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    });

    // Overdue tasks list
    const overdueTasks = await Task.find({
      ...tasksFilter,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 })
      .limit(5);

    // Recent Activities across all visible projects
    let recentActivities = [];
    if (isAdmin) {
      recentActivities = await Activity.find({})
        .populate('user', 'name email avatar role')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(8);
    } else {
      const userProjects = await Project.find({
        $or: [{ createdBy: userId }, { members: userId }],
      });
      const projectIds = userProjects.map((p) => p._id);
      recentActivities = await Activity.find({ project: { $in: projectIds } })
        .populate('user', 'name email avatar role')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(8);
    }

    res.json({
      success: true,
      stats: {
        projects: totalProjects,
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasksCount,
          progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        priority: {
          low: lowPriority,
          medium: mediumPriority,
          high: highPriority,
        },
      },
      overdueTasks,
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
