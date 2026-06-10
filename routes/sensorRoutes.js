// backend/routes/sensorRoutes.js
import express from 'express';
import { getAllSensors, pingSensor } from '../controllers/sensorController.js';

const router = express.Router();

router.get('/', getAllSensors); // GET http://localhost:3000/api/sensors
router.post('/ping', pingSensor); // POST http://localhost:3000/api/sensors/ping

export default router;