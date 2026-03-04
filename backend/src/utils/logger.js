const config = require('../config/env');

class Logger {
  constructor() {
    this.isDevelopment = config.server.nodeEnv === 'development';
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${prefix} ${message}${dataStr}`;
  }

  info(message, data) {
    console.log(this.formatMessage('info', message, data));
  }

  error(message, data) {
    console.error(this.formatMessage('error', message, data));
  }

  warn(message, data) {
    console.warn(this.formatMessage('warn', message, data));
  }

  debug(message, data) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

module.exports = new Logger();
