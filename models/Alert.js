// models/Alert.js
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'Fire', 'Gas', 'ManDown', 'Button', 'Employee Emergency'
    location: { type: String, required: true }, 
    severity: { type: String, default: 'Critical' }, 
    description: { type: String }, 
    status: { type: String, default: 'Pending' }, 
    resolvedBy: { type: String }, 
    resolvedAt: { type: Date },
    // Newly added: If the Alert is related to an Employee, store their ID
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' } 
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;