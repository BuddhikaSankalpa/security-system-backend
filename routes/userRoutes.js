import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getAdminUsers, 
    getAllUsers, 
    updateUser, 
    deleteUser 
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/admins', getAdminUsers); // Route to get only legacy Admins
router.get('/all', getAllUsers);       // New route to get all users
router.put('/update/:id', updateUser);  // Route to edit a user
router.delete('/delete/:id', deleteUser); // Route to remove a user

export default router;