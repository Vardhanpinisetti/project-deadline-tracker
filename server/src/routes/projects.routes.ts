import { Router } from 'express';
import { ProjectsController } from '../controllers/projects.controller.js';

const router = Router();

router.get('/', ProjectsController.getProjects);
router.post('/', ProjectsController.createProject);
router.patch('/:id/status', ProjectsController.updateStatus);
router.patch('/:id', ProjectsController.updateProject);
router.delete('/:id', ProjectsController.deleteProject);

export default router;
