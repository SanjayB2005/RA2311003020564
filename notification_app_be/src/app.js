const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const config = require('./config');

// Database Sync
const { sequelize } = require('./db');

// Ensure tables exist properly
sequelize.sync({ alter: true }).then(() => {
    console.log("Stage 2: Database Schema synced properly.");
});

// Create Express Backend
const app = express();
app.use(cors());
app.use(express.json());

// Create Server
const server = http.createServer(app);

// Stage 1: WebSocket setup for Real-Time synchronization
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected for real-time notifications');
    ws.send(JSON.stringify({ message: "Connected to Notification Service" }));

    ws.on('close', () => console.log('Client disconnected'));
});

// Stage 5: Start Queue listeners for Message Broker AMQP
const { connectQueue } = require('./queue');
connectQueue(wss);

// Sub routes
const notifRoutes = require('./routes/notifications');
app.use('/notifications', notifRoutes);

app.post('/event/schedule-generated', async (req, res) => {
    // Basic local Fallback if queue isn't required 
    // This allows graceful failover for systems without RabbitMQ running
    console.log("REST Fallback received new schedule event");
    
    // Manual synchronous fallback processor logic
    try {
        const { Notification } = require('./db');
        const data = req.body;
        const eventId = data.eventId || `rest-${Date.now()}`;
        
        let notifs = [];
        if (data.schedules) {
            for (const depot of data.schedules) {
                for (const task of depot.scheduledTasks) {
                    const newNotif = await Notification.create({
                        eventId: `${eventId}-${task.TaskID}`,
                        taskId: task.TaskID,
                        message: `Task ${task.TaskID} scheduled for Depot ${depot.depotId}`,
                        impact: task.Impact,
                        status: 'unread'
                    });
                    notifs.push(newNotif);
                    
                    // WebSocket Push
                    wss.clients.forEach(client => {
                        if (client.readyState === 1) { 
                            client.send(JSON.stringify(newNotif));
                        }
                    });
                }
            }
        }
        res.status(202).send({ message: "Event accepted for REST processing", created: notifs.length });
    } catch(e) {
        console.error(e);
        res.status(500).send({ error: e.message });
    }
});

// Base Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Notification App running' });
});

const PORT = config.port;

server.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
});
