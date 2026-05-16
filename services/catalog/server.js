const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { sendSuccess } = require('./utils/response');
const app = express();
const { ensureSeedProducts } = require('./scripts/seedProducts');


require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('./config/db_conn');
const port = Number(process.env.PRODUCT_PORT || 3002);
const serviceName = process.env.SERVICE_NAME || 'catalog-service';
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
        data: {
            service: serviceName,
            status: 'UP',
        },
        message: 'Health check passed',
    });
});


app.use("/products", require("./routes/productRouter"))
app.use("/filter", require("./routes/filterRouter"))

ensureSeedProducts().catch((error) => {
    console.error('Failed to seed catalog products', error.message);
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;