const levels = {
  error: 'font-weight: bold; color: #8B0000;',
  warn: 'color: #CCCC00;',
  info: 'color: #2B65EC;'
};

interface ILogger {
  (...args: any[]): this;
  error(...args: any[]): this;
  warn(...args: any[]): this;
  info(...args: any[]): this;
  colorize(value: any, styles: string): string[];
}

export function createLogger(level: 'error' | 'warn' | 'info' = 'info') {

  const levelKeys = Object.keys(levels);
  const activeIdx = levelKeys.indexOf(level);

  function colorize(value: any, styles: string) {
    return [`%c${value}`, styles];
  }

  function logger(type: 'log' | 'error' | 'warn' | 'info', ...args: any[]): ILogger {

    const levelIdx = levelKeys.indexOf(type);

    if (levelIdx > activeIdx) return;

    // tslint:disable-next-line
    const _log = console.log;
  
    if (type === 'log') {
      _log(...args);
    }
    else {
      const _type = type.toUpperCase() + ':';
      _log(...colorize(_type, levels[type]), ...args);
    }
  
    return log;
  
  }
  
  /**
   * Simpler logger with colorized types.
   * 
   * @param args arguments to be logged.
   */
  function log(...args: any[]) {
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

  log.colorize = colorize;

  return log;

}
