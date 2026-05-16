import express from 'express';
import { getAllAlerts, resolveAlert } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', getAllAlerts);
router.put('/:id/resolve', resolveAlert);

export default router;