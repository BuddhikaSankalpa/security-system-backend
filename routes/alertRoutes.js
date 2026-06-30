import express from 'express';
import { getAllAlerts, resolveAlert, deleteAllAlerts } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', getAllAlerts);
router.put('/:id/resolve', resolveAlert);
router.delete('/', deleteAllAlerts); 

export default router;