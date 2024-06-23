
require('dotenv').config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : `.env.development` });

export default class Environment {
    static PORT = process.env.PORT;
    static APP_NAME = process.env.APP_NAME;
    static ENVIRONMENT = process.env.NODE_ENV;
    static IS_MAINTENANCE = process.env.IS_MAINTENANCE;
    static JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    static CORS_DOMAINS = (process.env.CORS_DOMAINS || '').split(',');
    static CORS_HTTP_METHODS = (process.env.CORS_HTTP_METHODS || '').split(',');
    static CORS_ALLOWED_HEADERS = (process.env.CORS_ALLOWED_HEADERS || '').split(',');
    static RATE_LIMIT_MINUTES_PER_WINDOWS = process.env.RATE_LIMIT_MINUTES_PER_WINDOWS || 15;
    static RATE_LIMIT_REQUESTS = process.env.RATE_LIMIT_REQUESTS || 100;
}
