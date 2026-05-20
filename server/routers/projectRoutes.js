const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all project endpoints

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/members')
  .post(addProjectMember);

router.route('/:id/members/:userId')
  .delete(removeProjectMember);

module.exports = router;
