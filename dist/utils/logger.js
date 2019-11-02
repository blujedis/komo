"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levels = {
    error: 'font-weight: bold; color: #8B0000;',
    warn: 'color: #CCCC00;',
    info: 'color: #2B65EC;'
};
function createLogger(level = 'info') {
    const levelKeys = Object.keys(levels);
    const activeIdx = levelKeys.indexOf(level);
    function colorize(value, styles) {
        return [`%c${value}`, styles];
    }
    function logger(type, ...args) {
        const levelIdx = levelKeys.indexOf(type);
        if (levelIdx > activeIdx)
            return;
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
    function log(...args) {
        return logger('log', ...args);
    }
    log.error = (...args) => {
        return logger('error', ...args);
    };
    log.warn = (...args) => {
        return logger('warn', ...args);
    };
    log.info = (...args) => {
        return logger('info', ...args);
    };
    log.colorize = colorize;
    return log;
}
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map