// backend/models/Sensor.js
import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema({
    sensorId: { type: String, required: true, unique: true }, // ex: SNR-101, WCH-005
    type: { type: String, required: true }, // ex: "Temperature & Humidity", "Smoke Detector"
    location: { type: String, required: true }, // ex: "FLOW 01 - Room 02"
    status: { type: String, default: "Online" }, // "Online", "Warning", "Offline"
    battery: { type: String, default: "100%" },
    issue: { type: String, default: "" }, // If there is a problem (ex: "Low Battery")
    lastPing: { type: Date, default: Date.now } // When did the signal finally come?
}, { timestamps: true });

const Sensor = mongoose.models.Sensor || mongoose.model('Sensor', sensorSchema);
export default Sensor;