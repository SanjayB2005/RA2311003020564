const config = require('../config');

let cachedToken = config.evalServer.token;

function extractToken(data) {
    return (
        data?.access_token ||
        data?.accessToken ||
        data?.token ||
        data?.accessToken?.token ||
        data?.data?.access_token ||
        data?.data?.accessToken ||
        data?.data?.token
    );
}

async function getBearerToken() {
    if (cachedToken) return cachedToken;

    const { clientId, clientSecret, accessCode, email, name, rollNo } = config.evalServer;
    if (!clientId || !clientSecret || !accessCode || !email || !name || !rollNo) {
        throw new Error('Missing evaluation server auth values. Set EVAL_SERVER_TOKEN/ACCESS_TOKEN, or set CLIENT_ID, CLIENT_SECRET, ACCESS_CODE, EVAL_EMAIL, EVAL_NAME, and EVAL_ROLL_NO');
    }

    const response = await fetch(`${config.evalServer.baseUrl}/evaluation-service/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            name,
            rollNo,
            clientID: clientId,
            clientSecret,
            accessCode
        })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Auth failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`);
    }

    cachedToken = extractToken(await response.json());
    if (!cachedToken) {
        throw new Error('Auth succeeded but no bearer token was found in the response');
    }

    return cachedToken;
}

async function getAuthHeaders() {
    const token = await getBearerToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

async function fetchEvaluationNotifications() {
    const url = `${config.evalServer.baseUrl}/evaluation-service/notifications`;
    const response = await fetch(url, { headers: await getAuthHeaders() });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Notification fetch failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`);
    }

    const data = await response.json();
    return Array.isArray(data.notifications) ? data.notifications : [];
}

module.exports = { fetchEvaluationNotifications };
