const express = require('express');
const requestLogger = require('../../logging_middleware/index');

const app = express();
app.use(express.json());
app.use(requestLogger);

app.post('/event/schedule-generated', (req, res) => {
    req.logger.info("Received new schedule event");
    // TODO: Forward to message queue or handle notification logic
    res.status(202).send({ message: "Event accepted for processing" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
});
