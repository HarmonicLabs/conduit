import color from "picocolors";
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (LogLevel = {}));
Object.freeze(LogLevel);
export function isLogLevelString(str) {
    return (typeof str === "string" &&
        typeof LogLevel[str.toUpperCase()] === "number");
}
export function logLevelFromString(str) {
    if (typeof str !== "string")
        return LogLevel.INFO;
    return LogLevel[str.toUpperCase()] ?? LogLevel.INFO;
}
const defaultLoggerConfig = {
    logLevel: LogLevel.INFO
};
export class Logger {
    config = { ...defaultLoggerConfig };
    _colors = true;
    constructor(config) {
        this.config = {
            ...defaultLoggerConfig,
            ...config
        };
    }
    get logLevel() {
        return this.config.logLevel;
    }
    useColors(enable = true) {
        this._colors = enable;
    }
    canDebug() {
        return this.logLevel <= LogLevel.DEBUG;
    }
    canInfo() {
        return this.logLevel <= LogLevel.INFO;
    }
    canWarn() {
        return this.logLevel <= LogLevel.WARN;
    }
    canError() {
        return this.logLevel <= LogLevel.ERROR;
    }
    setLogLevel(level) {
        this.config.logLevel = level;
    }
    debug(...stuff) {
        if (!this.canDebug())
            return;
        let prefix = `[Debug][${new Date().toUTCString()}]:`;
        if (this._colors)
            prefix = color.magenta(prefix);
        console.log(prefix, ...stuff);
    }
    log(...stuff) {
        this.info(...stuff);
    }
    info(...stuff) {
        if (!this.canInfo())
            return;
        let prefix = `[Info ][${new Date().toUTCString()}]:`;
        if (this._colors)
            prefix = color.cyan(prefix);
        console.log(prefix, ...stuff);
    }
    warn(...stuff) {
        if (!this.canWarn())
            return;
        let prefix = `[Warn ][${new Date().toUTCString()}]:`;
        if (this._colors)
            prefix = color.yellow(prefix);
        console.warn(prefix, ...stuff);
    }
    error(...stuff) {
        if (!this.canError())
            return;
        let prefix = `[Error][${new Date().toUTCString()}]:`;
        if (this._colors)
            prefix = color.red(prefix);
        console.error(prefix, ...stuff);
    }
}
export const logger = new Logger({ logLevel: LogLevel.DEBUG });
//# sourceMappingURL=Logger.js.map