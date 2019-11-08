export declare type LogLevel = 'log' | 'fatal' | 'error' | 'warn' | 'info' | 'debug';
export declare type DebugLevel = '*';
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
declare type Debuggers<K extends string> = {
    [P in K]: (...args: any[]) => void;
};
export declare const isWebpack: boolean;
export declare const vars: {
    debug: string[];
};
/**
 * Creates a new singleton logger at the specified level. When no level is passed
 * the previously created logger is returned.
 *
 * @param level the log level that is active.
 */
export declare function createLogger(level?: LogLevel): ILogger;
/**
 * Creates debugger loggers that only run with
 * debug type has been loaded in __BLU_DEV_VARS__.
 *
 * Debugger names are stripped of the prefix /debug/ or /debug_/
 *
 * @param names a list of debugger names.
 */
export declare function createDebuggers<K extends string>(...names: K[]): Debuggers<K>;
export declare function getLogger(): ILogger;
export declare const debuggers: Debuggers<"debug_register" | "debug_init" | "debug_event" | "debug_api" | "debug_validate">;
export {};
