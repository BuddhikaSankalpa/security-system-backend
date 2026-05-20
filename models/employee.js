import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true }, // ex: EMP-001
    
    // CHANGED: Replaced flow and room with emergency contact details
    emergencyContactName: { type: String, required: true, trim: true }, 
    emergencyContactNumber: { type: String, required: true, trim: true }, 
    
    password: { type: String, required: true },
    status: { type: String, default: "Active" }
}, { timestamps: true });

// Use existing Employee model if already defined, otherwise create it
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

export default Employee;