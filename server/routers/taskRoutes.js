const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all task endpoints

router.get('/me', getMyTasks);
router.get('/dashboard/stats', getDashboardStats);

router.post('/project/:projectId', createTask);
router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
