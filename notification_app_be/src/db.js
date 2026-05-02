const { Sequelize, DataTypes } = require('sequelize');

// Stage 2: Database Design -> Using SQLite for immediate testability
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    taskId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    impact: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('unread', 'read'),
        defaultValue: 'unread'
    },
    eventId: {
        type: DataTypes.STRING, // Stage 5: Idempotency Key
        unique: true
    }
}, {
    indexes: [
        { fields: ['status'] }, // Index for 'unread' notification query
        { fields: ['createdAt'] }, // Index for 'last 7 days' query
        { fields: ['impact'] } // Stage 6: Efficiency top-N Selection
    ]
});

module.exports = { sequelize, Notification };