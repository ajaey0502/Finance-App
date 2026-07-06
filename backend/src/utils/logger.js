const config = require('../config/env');

class Logger {
  constructor() {
    this.isDevelopment = config.server.nodeEnv === 'development';
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    // Error objects serialize to '{}' via JSON.stringify (message/stack
    // aren't enumerable own properties), which hides the actual failure.
    const serializable = data instanceof Error
      ? { message: data.message, name: data.name, stack: data.stack }
      : data;
    const dataStr = serializable ? ` ${JSON.stringify(serializable)}` : '';
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
