// mqttHandler.js

import mqtt from 'mqtt';
import Alert from './models/Alert.js';

export default function setupMQTT(io) {
    const client = mqtt.connect('mqtt://localhost:1883');

    client.on('connect', () => {
        console.log('📶 Connected to MQTT Broker');
        client.subscribe('factory/sensors/#'); 
        client.subscribe('factory/alerts/#'); // Fire alerts are also received on this topic
    });

    client.on('message', async (topic, message) => {
        try {
            const data = JSON.parse(message.toString());

            // ----------------------------------------------------
            // SCENARIO A: Continuous Sensor Data (data that goes to the plot)
            // ----------------------------------------------------
            if (topic.startsWith('factory/sensors/')) {
                // Send data to live monitoring chart (this won't change)
                io.emit('live-sensor-data', data);
            }

            // ----------------------------------------------------
            // SCENARIO B: Alerts (Button, Employee AND FIRE)
            // ----------------------------------------------------
            if (topic.startsWith('factory/alerts/')) {
                
                // If the topic from ESP32 is 'factory/alerts/fire':
                if (topic === 'factory/alerts/fire') {
                    const newFireAlert = new Alert({
                        type: 'Fire Emergency', // Use this exact name because the frontend checks type?.includes("Fire")
                        location: data.location || 'Unknown Area', 
                        severity: 'Critical',
                        // Include temp, humidity, and aqi details from ESP32 into the description
                        description: `Fire Detected! Temp: ${data.temp}°C, Hum: ${data.humidity}%, AQI: ${data.aqi}`,
                        status: 'Pending'
                    });

                    await newFireAlert.save();
                    io.emit('new-emergency', newFireAlert); // Send the Alert to the frontend
                    console.log("🔥 Fire Emergency Triggered from ESP32!");
                } 
                else {
                    // Previous code for other Alerts (Button / Employee)
                    const newAlert = new Alert({
                        type: data.type, 
                        location: data.location,
                        severity: 'Critical',
                        description: data.description || 'Emergency triggered manually',
                        status: 'Pending'
                    });

                    await newAlert.save();
                    io.emit('new-emergency', newAlert);
                }
            }

        } catch (err) {
            console.error("MQTT Message Parsing Error:", err);
        }
    });
}