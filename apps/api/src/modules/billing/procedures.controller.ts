import { Router, Request, Response, NextFunction } from 'express';
import { proceduresService } from './procedures.service.js';
import { validateQuery } from '../../common/middleware/validate.js';
import { authGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { z } from 'zod';

const router: Router = Router();

// All routes require authentication
router.use(authGuard, tenantGuard);

// GET /procedures - List procedures
router.get(
  '/',
  validateQuery(
    z.object({
      search: z.string().optional(),
      category: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category } = req.query;
      const procedures = await proceduresService.findAll(
        search as string,
        category as string
      );
      res.json({ success: true, data: procedures });
    } catch (error) {
      next(error);
    }
  }
);

// GET /procedures/categories - List categories
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await proceduresService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// GET /procedures/grouped - Get procedures grouped by category
router.get('/grouped', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grouped = await proceduresService.getByCategory();
    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
});

// GET /procedures/:code - Get procedure by code
router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const procedure = await proceduresService.findByCode(req.params.code);
    res.json({ success: true, data: procedure });
  } catch (error) {
    next(error);
  }
});

export const proceduresRouter = router;
