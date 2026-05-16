import Employee from '../models/employee.js'; // Use the exact filename of your model (Employee.js or employee.js)
import bcrypt from 'bcrypt';

export async function registerEmployee(req, res) {
    try {
        // 1. Here we use flow and room instead of assignedZone
        const { firstName, lastName, email, phone, employeeId, flow, room, password } = req.body;

        // 2. Also validate that flow and room are provided
        if (!firstName || !lastName || !email || !phone || !employeeId || !flow || !room || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 3. Check if employee already exists (Email or Employee ID)
        const existingEmployee = await Employee.findOne({ 
            $or: [{ email: email }, { employeeId: employeeId }] 
        });
        
        if (existingEmployee) {
            return res.status(409).json({ message: "Employee with this Email or ID already exists" });
        }

        // 4. Password hashing
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // 5. Create new employee (assign flow and room to the Mongoose model here)
        const newEmployee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            employeeId,
            flow: flow, // newly added
            room: room, // newly added
            password: hashedPassword
        });

        // 6. Save to database
        await newEmployee.save();
        res.status(201).json({ message: "Employee registered successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// --- GET ALL EMPLOYEES ---
export async function getAllEmployees(req, res) {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 }); // Newest added employees appear first
        res.status(200).json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}