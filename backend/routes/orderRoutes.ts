import { Router } from 'express';
import { getOrders } from '../controllers/orderController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getOrders);

export default router;
