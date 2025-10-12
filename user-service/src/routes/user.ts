import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import DatabaseManager from '../config/database.js';

const router = Router();
const models = DatabaseManager.getInstance().getModels();
const userController = new UserController(models);

const handleAsync = (fn: any) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/:userId', handleAsync(userController.getUserById));
router.put('/:userId', handleAsync(userController.updateUser));

export default router;
