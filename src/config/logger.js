const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDevelopment
    ? {
        level: process.env.LOG_LEVEL || 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      }
);

module.exports = logger;
