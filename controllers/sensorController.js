// backend/controllers/sensorController.js
import Sensor from '../models/Sensor.js';

// 1. previwe sensers that are in the database (GET http://localhost:3000/api/sensors)
export async function getAllSensors(req, res) {
    try {
        const sensors = await Sensor.find().sort({ updatedAt: -1 });
        res.status(200).json(sensors);
    } catch (err) {
        res.status(500).json({ message: "Error fetching sensors data", error: err.message });
    }
}

// 2. Capturing and updating (or creating new) health data from the sensor
export async function pingSensor(req, res) {
    try {
        const { sensorId, type, location, status, battery, issue } = req.body;

        // Checks if the sensor already exists, and if so, updates it. Or creates a new one (upsert: true)
        const updatedSensor = await Sensor.findOneAndUpdate(
            { sensorId: sensorId },
            { 
                type: type || "Unknown Sensor", 
                location: location || "Unknown Location", 
                status: status || "Online", 
                battery: battery || "100%", 
                issue: issue || "", 
                lastPing: new Date() // Will update when the data finally arrives.
            },
            { new: true, upsert: true } 
        );

        // Frontend එකට Live Update එක යවනවා
        const io = req.app.get('io');
        if (io) {
            io.emit('sensor-health-update', updatedSensor);
        }

        res.status(200).json({ message: "Sensor health updated successfully!", sensor: updatedSensor });
    } catch (err) {
        res.status(500).json({ message: "Error updating sensor health", error: err.message });
    }
}