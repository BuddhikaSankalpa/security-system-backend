import express from 'express';
// CHANGED: Imported deleteEmployee 
import { registerEmployee, getAllEmployees, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';

const router = express.Router();
    
router.post('/register', registerEmployee);
router.get('/', getAllEmployees);
router.put('/:id', updateEmployee);

// --- NEW ROUTE FOR DELETING ---
router.delete('/:id', deleteEmployee);

export default router;