
const WINDOW = typeof window === 'undefined' ? global : window;

const levels = {
  fatal: 'font-weight: bold; color: yellow; background-color: #8B0000;',
  error: 'font-weight: bold; color: #8B0000;',
  warn: 'color: #CCCC00;',
  info: 'color: #2B65EC;',
  debug: 'color: magenta'
};

export type LogLevel = 'log' | 'fatal' | 'error' | 'warn' | 'info' | 'debug';

export type DebugLevel = '*';

export interface ILogger {
  (...args: any[]): this;
  level: LogLevel;
  priority: number;
  fatal(...args: any[]): this;
  error(...args: any[]): this;
  warn(...args: any[]): this;
  info(...args: any[]): this;
  debugger(name: string): (...args: any[]) => this;
  styleize(value: any, styles: string): string[];
}

type Debuggers<K extends string> = { [P in K]: (...args: any[]) => void };

let _logger: ILogger;

export const isWebpack = typeof __BLU_DEV_VARS__ !== 'undefined';
export const vars = isWebpack ? __BLU_DEV_VARS__ || { debug: [] } : { debug: [] };

/**
 * Creates a new singleton logger at the specified level. When no level is passed
 * the previously created logger is returned.
 * 
 * @param level the log level that is active.
 */
export function createLogger(level?: LogLevel) {

  if (_logger && !level)
    return _logger;

  const levelKeys = Object.keys(levels);
  level = level || 'info';

  function styleize(value: any, styles: string) {
    return [`%c${value}`, styles];
  }

  function logger(type: LogLevel, ...args: any[]): ILogger {

    const idx = levelKeys.indexOf(type);

    if (idx > log.priority) return;

    // tslint:disable-next-line
    const _log = console.log;

    if (type === 'log') {
      _log(...args);
    }
    else {
      const _type = type.toUpperCase() + ':';
      if (type === 'fatal')
        // tslint:disable-next-line: no-console
        console.error(...styleize(_type, levels[type]), ...args);
      else
        _log(...styleize(_type, levels[type]), ...args);
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

  log.level = level;

  log.priority = levelKeys.indexOf(level);

  log.fatal = (...args: any[]) => {
    return logger('fatal', ...args);
  };

  log.error = (...args: any[]) => {
    return logger('error', ...args);
  };

  log.warn = (...args: any[]) => {
    return logger('warn', ...args);
  };

  log.info = (...args: any[]) => {
    return logger('info', ...args);
  };

  log.debugger = (name: string) => (...args: any[]) => {

    return logger('debug', `[${name.toUpperCase()}]`, ...args);
  };

  log.styleize = styleize;

  _logger = log;

  return _logger;

}

/**
 * Creates debugger loggers that only run with 
 * debug type has been loaded in __BLU_DEV_VARS__.
 * 
 * Debugger names are stripped of the prefix /debug/ or /debug_/
 * 
 * @param names a list of debugger names.
 */
export function createDebuggers<K extends string>(...names: K[]) {

  const enabled = vars.debug || [];

  return names.reduce((result, name) => {
    const label = name.replace(/debug_/i, '') as any;
    if (isWebpack && (enabled.includes(label) || enabled.includes('*')))
      result[name] = createLogger('debug').debugger(label);
    else
      result[name] = (...args: any[]) => null;
    return result;
  }, {} as Debuggers<K>);

}

export function getLogger() {
  return _logger || createLogger();
}

export const debuggers = createDebuggers('debug_register', 'debug_init', 'debug_event', 'debug_api', 'debug_validate', 'debug_set');
