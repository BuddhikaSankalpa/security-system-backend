import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; 
import { createServer } from 'http'; // Socket.io requirement
import { Server } from 'socket.io'; // Socket.io requirement

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import Alert from './models/Alert.js';
import alertRoutes from './routes/alertRoutes.js';
import Employee from './models/employee.js';
import sensorRoutes from './routes/sensorRoutes.js';
// --- TEST ROUTE FOR SIMULATING SENSOR DATA ---
import mqtt from 'mqtt';
 // Add this near your other model imports
import User from './models/User.js';



// We will import mqttHandler here later
import setupMQTT from './mqttHandler.js';


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
        origin: "*", // Allow React app to connect
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // Make io accessible in controllers via req.app.get('io')

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log(`🟢 New Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔴 Client Disconnected: ${socket.id}`);
    });
});




// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sensors', sensorRoutes);



//----------------------------------------------------------------------------------------------------------------------------------------------

// --- TEST ROUTE FOR SIMULATING SENSOR DATA ---
app.post('/api/test-alert', async (req, res) => {
    try {
        const alertData = req.body;

        // 1. Save the new Alert to the Database!
        const newAlert = new Alert({
            type: alertData.type || 'Unknown Emergency',
            location: alertData.location || 'Unknown Location',
            severity: alertData.severity || 'Critical',
            description: alertData.description || 'Triggered via Postman Test Route',
            status: 'Pending'
        });
        await newAlert.save();

        // 2. Emit 'new-emergency' to the frontend with the newly saved Alert from the DB (includes the _id)
        io.emit('new-emergency', newAlert);
        
        res.status(200).json({ message: "Alert saved to DB and sent to frontend!", alertData: newAlert });
    } catch (err) {
        console.error("Error saving test alert:", err);
        res.status(500).json({ message: "Error saving alert to Database" });
    }
});

app.post('/api/test-alert', (req, res) => {
    const alertData = req.body;
    // Emit 'new-emergency' signal to the frontend
    io.emit('new-emergency', alertData);
    res.status(200).json({ message: "Alert sent!", alertData });
});




//----------------------------------------------------------------------------------------------------------------------------------------------

// --- TEST ROUTE FOR SIMULATING SENSOR DATA ---
app.post('/api/test-sensor', (req, res) => {
    try {
        const data = req.body;
        const io = req.app.get('io'); // Get the io instance that was set in index.js
        
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





// --- TEST ROUTE FOR EMPLOYEE WATCH EMERGENCY ---
const mqttClient = mqtt.connect('mqtt://192.168.35.40:1883');

mqttClient.on('connect', () => {
    console.log('Connected to MQTT Broker');

    mqttClient.subscribe('esp32/employee', (err) => {
        if (!err) {
            console.log('Subscribed to topic: esp32/employee');
        } else {
            console.log('Subscription error:', err);
        }
    });

    // NEW: Subscribe to the esp32/emergency topic
    mqttClient.subscribe('esp32/emergency', (err) => {
        if (!err) {
            console.log('Subscribed to topic: esp32/emergency');
        } else {
            console.log('Subscription error for esp32/emergency:', err);
        }
    });
});

mqttClient.on('error', (err) => {
    console.error('MQTT Error:', err);
});

mqttClient.on('offline', () => {
    console.log('MQTT Client Offline');
});

mqttClient.on('reconnect', () => {
    console.log('Reconnecting to MQTT Broker...');
});

mqttClient.on('message', async (topic, message) => {
    try {
        console.log(`MQTT Message Received on ${topic}: ${message.toString()}`);

        const data = JSON.parse(message.toString());

        // --- EXISTING LOGIC FOR ESP32/EMPLOYEE ---
        if (topic === 'esp32/employee') {
            // Extract ID and Floor based on the payload sent by ESP32 
            // e.g., {"employeeId": "EMP-002", "floor": "01"}
            const extractedId = data.ID || data.employeeId; 
            const floorNumber = data.floor || "Unknown Floor"; // Default if not sent
            const description = data.description;

            const employee = await Employee.findOne({ employeeId: extractedId });

            if (!employee) {
                console.log(`Employee not found in DB for ID: ${extractedId}`);
                return;
            }

            // --- 1. SAVE THE ALERT TO THE DATABASE ---
            // Dynamically build the location using the floor sent by the ESP32
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
            console.log('Emergency Alert Saved & Broadcasted');
            io.emit('new-emergency', newAlert);


            // --- 2. FETCH NUMBERS & SEND BACK TO ESP32 ---
            
            // Fetch the primary Security Officer / Admin from the User collection
            const adminUser = await User.findOne({ isAdmin: true });
            const securityOfficerNumber = adminUser ? adminUser.phone : "N/A";

            // Prepare the JSON payload with the 3 required numbers
            const returnPayload = JSON.stringify({
                securityOfficerNumber: securityOfficerNumber, 
                emergencyContact: employee.emergencyContactNumber || "N/A",
                emergencyServices: "1990"
            });

            // Publish back to the ESP32 using the specific topic
            mqttClient.publish('esp32/wearable1', returnPayload, (err) => {
                if (err) {
                    console.error('Failed to publish return numbers to ESP32:', err);
                } else {
                    console.log(`📤 Sent numbers back to esp32/wearable1: ${returnPayload}`);
                }
            });
        } 
        
        // --- NEW LOGIC FOR ESP32/EMERGENCY ---
        else if (topic === 'esp32/emergency') {
            const newAlert = new Alert({
                type: data.type || 'Button Emergency',
                location: data.location || 'Unknown Location',
                severity: data.severity || 'Critical',
                description: data.description || 'Triggered via MQTT Button Alert',
                status: 'Pending'
            });

            await newAlert.save();
            console.log('Button Emergency Alert Saved & Broadcasted from MQTT');
            io.emit('new-emergency', newAlert);
        }

    } catch (err) {
        console.error('MQTT Processing Error:', err);
    }
});





//----------------------------------------------------------------------------------------------------------------------------------------------

// --- TEST ROUTE FOR EMPLOYEE WATCH EMERGENCY ---
app.post('/api/test-employee-alert', async (req, res) => {
    try {
        const { employeeId, description } = req.body; 

        // 1. Find the Employee in the Database using the provided employeeId string (e.g., "EMP-006")
        const employee = await Employee.findOne({ employeeId: employeeId });
        
        if (!employee) {
            return res.status(404).json({ message: "Employee not found in Database!" });
        }

        // 2. Construct the alert location from the Employee details (flow and room)
        const alertLocation = `${employee.flow} - ${employee.room}`;

        // 3. Save the Alert
        const newAlert = new Alert({
            type: 'Employee Emergency',
            location: alertLocation, // Location obtained from the database
            severity: 'Critical',
            description: description || 'Smart Watch Emergency Button Pressed',
            status: 'Pending',
            employeeId: employee._id // Here we set the original ObjectId from the database
        });
        
        await newAlert.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('new-emergency', newAlert);
        }
        
        res.status(200).json({ message: "Employee Emergency Alert Triggered!", alertData: newAlert });
    } catch (err) {
        console.error("Error saving employee alert:", err);
        res.status(500).json({ message: "Error triggering employee alert" });
    }
});


// --- Connect MQTT ---
setupMQTT(io); // Pass the socket.io instance to MQTT

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log('Server started successfully');
    console.log(`Listening on port ${PORT}`);
});


//----------------------------------------------------------------------------------------------------------------------------------------------
