"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WINDOW = typeof window === 'undefined' ? global : window;
const levels = {
    fatal: 'font-weight: bold; color: yellow; background-color: #8B0000;',
    error: 'font-weight: bold; color: #8B0000;',
    warn: 'color: #CCCC00;',
    info: 'color: #2B65EC;',
    debug: 'color: magenta'
};
let _logger;
exports.isWebpack = typeof __BLU_DEV_VARS__ !== 'undefined';
exports.vars = exports.isWebpack ? __BLU_DEV_VARS__ || { debug: [] } : { debug: [] };
/**
 * Creates a new singleton logger at the specified level. When no level is passed
 * the previously created logger is returned.
 *
 * @param level the log level that is active.
 */
function createLogger(level) {
    if (_logger && !level)
        return _logger;
    const levelKeys = Object.keys(levels);
    level = level || 'info';
    function styleize(value, styles) {
        return [`%c${value}`, styles];
    }
    function logger(type, ...args) {
        const idx = levelKeys.indexOf(type);
        if (idx > log.priority)
            return;
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
    function log(...args) {
        return logger('log', ...args);
    }
    log.level = level;
    log.priority = levelKeys.indexOf(level);
    log.fatal = (...args) => {
        return logger('fatal', ...args);
    };
    log.error = (...args) => {
        return logger('error', ...args);
    };
    log.warn = (...args) => {
        return logger('warn', ...args);
    };
    log.info = (...args) => {
        return logger('info', ...args);
    };
    log.debugger = (name) => (...args) => {
        return logger('debug', `[${name.toUpperCase()}]`, ...args);
    };
    log.styleize = styleize;
    _logger = log;
    return _logger;
}
exports.createLogger = createLogger;
/**
 * Creates debugger loggers that only run with
 * debug type has been loaded in __BLU_DEV_VARS__.
 *
 * Debugger names are stripped of the prefix /debug/ or /debug_/
 *
 * @param names a list of debugger names.
 */
function createDebuggers(...names) {
    const enabled = exports.vars.debug || [];
    return names.reduce((result, name) => {
        const label = name.replace(/debug_/i, '');
        if (exports.isWebpack && (enabled.includes(label) || enabled.includes('*')))
            result[name] = createLogger('debug').debugger(label);
        else
            result[name] = (...args) => null;
        return result;
    }, {});
}
exports.createDebuggers = createDebuggers;
function getLogger() {
    return _logger || createLogger();
}
exports.getLogger = getLogger;
exports.debuggers = createDebuggers('debug_register', 'debug_init', 'debug_event', 'debug_api', 'debug_validate');
//# sourceMappingURL=tools.js.map