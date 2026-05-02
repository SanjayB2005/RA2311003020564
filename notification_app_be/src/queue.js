const amqp = require('amqplib');
const { Notification } = require('./db');

const RABBITMQ_URL = 'amqp://localhost'; // Adjust based on your RabbitMQ server
const QUEUE_NAME = 'schedule_events';

// Stage 5: Message Queue System with Idempotency and Async processing
async function connectQueue(wss) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log(`[Queue] Waiting for messages in ${QUEUE_NAME}...`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    const eventId = data.eventId; // Unique payload ID from Scheduler

                    // Idempotency pattern check: Does this eventId already exist?
                    const exists = await Notification.findOne({ where: { eventId } });
                    if (exists) {
                        console.log(`[Idempotent] Event ${eventId} already processed. Skipping.`);
                        channel.ack(msg);
                        return;
                    }

                    // Process Data and calculate "Priority"
                    for (const depot of data.schedules) {
                        for (const task of depot.scheduledTasks) {
                            const newNotif = await Notification.create({
                                eventId: `${eventId}-${task.TaskID}`,
                                taskId: task.TaskID,
                                message: `Task ${task.TaskID} scheduled for Depot ${depot.depotId}`,
                                impact: task.Impact,
                                status: 'unread'
                            });

                            // Stage 1: Real-time messaging (WebSocket update)
                            wss.clients.forEach(client => {
                                if (client.readyState === 1) { // 1 = OPEN
                                    client.send(JSON.stringify(newNotif));
                                }
                            });
                        }
                    }
                    console.log(`[x] Processed batch of schedule events with ID: ${eventId}`);
                    channel.ack(msg); // Stage 5: Acknowledgment confirms success
                } catch (error) {
                    console.error('[Queue Error]', error);
                    // Stage 5: Failure handling via NACK (Requeue messages on failure)
                    channel.nack(msg);
                }
            }
        });

    } catch (err) {
        console.error('Failed to connect to RabbitMQ (Is it running?). Operating in fallback REST mode.');
        // Stop retrying aggressively so console remains clean if the user isn't running RMQ.
        // setTimeout(() => connectQueue(wss), 5000);
    }
}

module.exports = { connectQueue };