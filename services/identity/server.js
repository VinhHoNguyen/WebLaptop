const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { sendSuccess } = require('./utils/response');
const validateToken = require('./middleware/tokenValidationMiddleware');
const { loginUser, getUser } = require('./controllers/usercontroller');
const app = express();


require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const pool = require('./config/db_conn');
const port = process.env.USER_PORT || 3001;
const serviceName = process.env.SERVICE_NAME || 'identity-service';
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(
    cors(
        corsOrigin === '*'
            ? undefined
            : {
                  origin: corsOrigin.split(',').map((item) => item.trim()),
              }
    )
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const traceId = req.headers['x-request-id'] || crypto.randomUUID();
    req.traceId = traceId;
    req.requestId = traceId;
    res.setHeader('x-request-id', traceId);

    const startedAt = Date.now();
    res.on('finish', () => {
        const log = {
            ts: new Date().toISOString(),
            level: res.statusCode >= 500 ? 'error' : 'info',
            service: serviceName,
            requestId: traceId,
            userId: req.user?.id || null,
            message: `${req.method} ${req.originalUrl}`,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
        };
        console.log(JSON.stringify(log));
    });

    next();
});

app.get('/health', (req, res) => {
    return sendSuccess(res, req, {
        data: { service: serviceName, status: 'UP' },
        message: 'Health check passed',
    });
});

app.get('/health/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return sendSuccess(res, req, { data: { service: serviceName, status: 'READY' }, message: 'Readiness check passed' });
    } catch (err) {
        res.status(503).json({ success: false, data: { service: serviceName, status: 'NOT_READY' }, message: err.message });
    }
});

app.post('/login', loginUser);
app.get('/me', validateToken, getUser);

app.use("/users", require("./routes/userRouter"))

const { ensureSeedAdmin } = require('./scripts/seedAdmin');
ensureSeedAdmin().catch((error) => {
    console.error('Failed to seed admin user', error.message);
});

if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    const shutdown = (signal) => {
        console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', service: serviceName, message: 'shutdown_initiated', signal }));
        server.close(async () => {
            try { await pool.end(); } catch (_) {}
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;