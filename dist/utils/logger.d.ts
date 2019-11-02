interface ILogger {
    (...args: any[]): this;
    error(...args: any[]): this;
    warn(...args: any[]): this;
    info(...args: any[]): this;
    colorize(value: any, styles: string): string[];
}
export declare function createLogger(level?: 'error' | 'warn' | 'info'): {
    (...args: any[]): ILogger;
    error(...args: any[]): ILogger;
    warn(...args: any[]): ILogger;
    info(...args: any[]): ILogger;
    colorize: (value: any, styles: string) => string[];
};
export {};
