import { Router } from 'express';
import { themeController } from '../controller/theme';

const router = Router();

router.get('/theme', themeController.getTheme);
router.put('/theme', themeController.setTheme);

export default router;
