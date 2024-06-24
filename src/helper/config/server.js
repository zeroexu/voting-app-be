
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Environment = require('./environment');

module.exports = app => {
    // RATE LIMIT
    const limiter = rateLimit({
        windowMs: Environment.RATE_LIMIT_MINUTES_PER_WINDOWS * 60 * 1000, // 15 minutos
        max: Environment.RATE_LIMIT_REQUESTS, // limita cada IP a 100 peticiones por ventana de 15 minutos
        message: 'Too many requests, please try again later.'
    });
    app.use(limiter);

    // CORS configuration
    const corsOptions = {
        origin: Environment.CORS_DOMAINS,
        methods: Environment.CORS_HTTP_METHODS,
        allowedHeaders: Environment.CORS_ALLOWED_HEADERS
    };
    app.use(cors(corsOptions));

    return app;
};