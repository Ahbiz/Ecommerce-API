import express from 'express';
import { initiatePayment, verifyPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.get('/verify', verifyPayment); 

export default router;
