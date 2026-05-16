import express from 'express';
import { registerEmployee, getAllEmployees } from '../controllers/employeeController.js';

const router = express.Router();
    
router.post('/register', registerEmployee);
router.get('/', getAllEmployees);


export default router;