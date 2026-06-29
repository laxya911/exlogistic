// Highly structured logger to support JSON logging for ELK/Datadog/CloudWatch
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const payload = {
      level,
      timestamp,
      message,
      ...(meta && { meta }),
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, emit single line JSON
      console.log(JSON.stringify(payload));
    } else {
      // In development, emit human readable output
      const colors = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        debug: '\x1b[90m',
      };
      console.log(
        `${colors[level]}[${level.toUpperCase()}]\x1b[0m [${timestamp}] ${message}`,
        meta ? meta : ''
      );
    }
  }

  info(message: string, meta?: any) { this.log('info', message, meta); }
  warn(message: string, meta?: any) { this.log('warn', message, meta); }
  error(message: string, meta?: any) { this.log('error', message, meta); }
  debug(message: string, meta?: any) { this.log('debug', message, meta); }
}

export const logger = new Logger();
