const logType = {
  error: 'font-weight: bold; color: #8B0000;',
  warn: 'color: #CCCC00;',
  info: 'color: #2B65EC;'
};

function colorize(value: any, styles: string) {
  return [`%c${value}`, styles];
}

function logger(type: 'log' | 'error' | 'warn' | 'info', ...args: any[]): ILogger {

  // tslint:disable-next-line
  const _log = console.log; // console[type] || console.log;

  if (type === 'log') {
    _log(...args);
  }
  else {
    const _type = type.toUpperCase() + ':';
    _log(...colorize(_type, logType[type]), ...args);
  }

  return log;

}

interface ILogger {
  (...args: any[]): this;
  error(...args: any[]): this;
  warn(...args: any[]): this;
  info(...args: any[]): this;
}

/**
 * Simpler logger with colorized types.
 * 
 * @param args arguments to be logged.
 */
export function log(...args: any[]) {
  return logger('log', ...args);
}

log.error = (...args: any[]) => {
  return logger('error', ...args);
};

log.warn = (...args: any[]) => {
  return logger('warn', ...args);
};

log.info = (...args: any[]) => {
  return logger('info', ...args);
};
