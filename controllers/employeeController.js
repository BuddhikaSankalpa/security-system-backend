import Employee from '../models/employee.js'; 
import bcrypt from 'bcrypt';

export async function registerEmployee(req, res) {
    try {
        // CHANGED: Extracted emergency fields instead of flow and room
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            employeeId, 
            emergencyContactName, 
            emergencyContactNumber, 
            password 
        } = req.body;

        // CHANGED: Validating existence of updated field metrics
        if (!firstName || !lastName || !email || !phone || !employeeId || !emergencyContactName || !emergencyContactNumber || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if employee already exists (Email or Employee ID)
        const existingEmployee = await Employee.findOne({ 
            $or: [{ email: email }, { employeeId: employeeId }] 
        });
        
        if (existingEmployee) {
            return res.status(409).json({ message: "Employee with this Email or ID already exists" });
        }

        // Password hashing
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // CHANGED: Assigning emergencyContactName and emergencyContactNumber properties
        const newEmployee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            employeeId,
            emergencyContactName, // newly added
            emergencyContactNumber, // newly added
            password: hashedPassword
        });

        // Save to database
        await newEmployee.save();
        res.status(201).json({ message: "Employee registered successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- GET ALL EMPLOYEES ---
export async function getAllEmployees(req, res) {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 }); 
        res.status(200).json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}