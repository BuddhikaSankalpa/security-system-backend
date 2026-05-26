import Employee from '../models/employee.js'; 
import bcrypt from 'bcrypt';

export async function registerEmployee(req, res) {
    try {
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

        if (!firstName || !lastName || !email || !phone || !employeeId || !emergencyContactName || !emergencyContactNumber || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingEmployee = await Employee.findOne({ 
            $or: [{ email: email }, { employeeId: employeeId }] 
        });
        
        if (existingEmployee) {
            return res.status(409).json({ message: "Employee with this Email or ID already exists" });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newEmployee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            employeeId,
            emergencyContactName,
            emergencyContactNumber, 
            password: hashedPassword
        });

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

// --- UPDATE EMPLOYEE DETAILS ---
export async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.password) {
            delete updateData.password;
        }

        if (updateData.email) {
            delete updateData.email;
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true } 
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- NEW: DELETE EMPLOYEE ---
export async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;

        const deletedEmployee = await Employee.findByIdAndDelete(id);

        if (!deletedEmployee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}