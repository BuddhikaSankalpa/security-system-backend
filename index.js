import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; 
import { createServer } from 'http'; 
import { Server } from 'socket.io'; 
import mqtt from 'mqtt';

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import Alert from './models/Alert.js';
import alertRoutes from './routes/alertRoutes.js';
import Employee from './models/employee.js';
import sensorRoutes from './routes/sensorRoutes.js';
import User from './models/User.js';

dotenv.config();

// Connect to MongoDB database
connectDB(); 

const app = express();

app.use(express.json());
app.use(cors());

// --- Setup HTTP Server & WebSockets (Socket.io) ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.set('io', io); 

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log(`🟢 New Client Connected to WebSocket: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔴 Client Disconnected: ${socket.id}`);
    });
});

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sensors', sensorRoutes);

// --- TEST ROUTES ---
app.post('/api/test-alert', async (req, res) => {
    try {
        const alertData = req.body;
        const newAlert = new Alert({
            type: alertData.type || 'Unknown Emergency',
            location: alertData.location || 'Unknown Location',
            severity: alertData.severity || 'Critical',
            description: alertData.description || 'Triggered via Postman Test Route',
            status: 'Pending'
        });
        await newAlert.save();
        io.emit('new-emergency', newAlert);
        res.status(200).json({ message: "Alert saved to DB and sent to frontend!", alertData: newAlert });
    } catch (err) {
        console.error("Error saving test alert:", err);
        res.status(500).json({ message: "Error saving alert to Database" });
    }
});

app.post('/api/test-sensor', (req, res) => {
    try {
        const data = req.body;
        if (io) {
            io.emit('live-sensor-data', data);
            res.status(200).json({ message: "Test data sent to frontend!", data });
        } else {
            res.status(500).json({ message: "Socket API not ready." });
        }
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// ---------------------------------------------------------------
// --- MQTT BROKER CONNECTION & MESSAGE HANDLING ---
// ---------------------------------------------------------------
const mqttClient = mqtt.connect('mqtt://192.168.8.139:1883');

mqttClient.on('connect', () => {
    console.log('📶 Connected to Hardware MQTT Broker (192.168.8.139)');

    mqttClient.subscribe('esp32/employee', (err) => {
        if (!err) console.log('Subscribed to topic: esp32/employee');
    });

    mqttClient.subscribe('esp32/emergency', (err) => {
        if (!err) console.log('Subscribed to topic: esp32/emergency');
    });

    mqttClient.subscribe('esp32/sensor', (err) => {
        if (!err) console.log('Subscribed to topic: esp32/sensor');
    });
});

mqttClient.on('error', (err) => console.error('MQTT Error:', err));
mqttClient.on('offline', () => console.log('MQTT Client Offline'));
mqttClient.on('reconnect', () => console.log('Reconnecting to MQTT Broker...'));

// Helper function to calculate average and handle nulls safely
const getAverage = (val1, val2) => {
    if (val1 != null && val2 != null) return Number(((val1 + val2) / 2).toFixed(2));
    if (val1 != null) return val1;
    if (val2 != null) return val2;
    return 0; // Default fallback if both are null
};

mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());

        // 1. HANDLE SENSOR DATA (Real-time Graph)
        if (topic === 'esp32/sensor') {
            
            // Calculate averages based on new requirements
            const sensorPayload = {
                temp: getAverage(data.dht11_1, data.dht11_2),
                airQuality: getAverage(data.MQ2_1, data.MQ2_2),
                noise: data.noise != null ? data.noise : 0 
            };
            
            io.emit('live-sensor-data', sensorPayload);
        }

        // 2. HANDLE EMPLOYEE WATCH EMERGENCY
        else if (topic === 'esp32/employee') {
            const extractedId = data.ID || data.employeeId; 
            const floorNumber = data.floor || "Unknown Floor"; 
            const description = data.description;

            const employee = await Employee.findOne({ employeeId: extractedId });

            if (!employee) {
                console.log(`Employee not found in DB for ID: ${extractedId}`);
                return;
            }

            const alertLocation = `Floor ${floorNumber} - Field Operator`; 
            const newAlert = new Alert({
                type: 'Employee Emergency',
                location: alertLocation,
                severity: 'Critical',
                description: description || 'Smart Watch Emergency Button Pressed',
                status: 'Pending',
                employeeId: employee._id
            });

            await newAlert.save();
            console.log('🚨 Employee Emergency Alert Saved & Broadcasted');
            io.emit('new-emergency', newAlert);

            const adminUser = await User.findOne({ isAdmin: true });
            const securityOfficerNumber = adminUser ? adminUser.phone : "N/A";

            const returnPayload = JSON.stringify({
                securityOfficerNumber: securityOfficerNumber, 
                emergencyContact: employee.emergencyContactNumber || "N/A",
                emergencyServices: "0764175179"
            });

            mqttClient.publish('esp32/wearable1', returnPayload, (err) => {
                if (!err) console.log(`📤 Sent numbers back to esp32/wearable1: ${returnPayload}`);
            });
        } 
        
        // 3. HANDLE GENERIC BUTTON EMERGENCY
        else if (topic === 'esp32/emergency') {
            const newAlert = new Alert({
                type: data.type || 'Button Emergency',
                location: data.location || 'Unknown Location',
                severity: data.severity || 'Critical',
                description: data.description || 'Triggered via MQTT Button Alert',
                status: 'Pending'
            });

            await newAlert.save();
            console.log('🚨 Button Emergency Alert Saved & Broadcasted');
            io.emit('new-emergency', newAlert);
        }

    } catch (err) {
        console.error('MQTT Processing Error (Invalid JSON?):', err);
    }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server started successfully on port ${PORT}`);
});