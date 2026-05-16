import Alert from '../models/Alert.js';

// --- GET ALL ALERTS ---
export async function getAllAlerts(req, res) {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching alerts." });
    }
}

// --- UPDATE ALERT STATUS (Resolved) ---
export async function resolveAlert(req, res) {
    try {
        const alertId = req.params.id;
        const updatedAlert = await Alert.findByIdAndUpdate(
            alertId, 
            { status: 'Resolved', resolvedAt: new Date() }, 
            { new: true }
        );

        // ✔️ Newly added: Notify the socket that an Alert has been resolved
        // Ensure index.js sets io so we can get it from the Express req object
        const io = req.app.get('io');
        if (io) {
            io.emit('alert-resolved', alertId); 
        }

        res.status(200).json({ message: "Alert Resolved!", alert: updatedAlert });
    } catch (err) {
        res.status(500).json({ message: "Error resolving alert." });
    }
}