const TYPE_PRIORITY = {
    Emergency: 100,
    Critical: 90,
    Result: 80,
    Placement: 70,
    Alert: 60,
    Notice: 50,
    General: 10
};

function getTypePriority(type) {
    return TYPE_PRIORITY[type] || 0;
}

function getTimestampValue(timestamp) {
    const value = new Date(timestamp).getTime();
    return Number.isNaN(value) ? 0 : value;
}

function rankNotifications(notifications, limit = 10) {
    return [...notifications]
        .sort((a, b) => {
            const priorityDiff = getTypePriority(b.Type) - getTypePriority(a.Type);
            if (priorityDiff !== 0) return priorityDiff;

            const timeDiff = getTimestampValue(b.Timestamp) - getTimestampValue(a.Timestamp);
            if (timeDiff !== 0) return timeDiff;

            return String(a.ID || '').localeCompare(String(b.ID || ''));
        })
        .slice(0, limit);
}

module.exports = { rankNotifications };
