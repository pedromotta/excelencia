angular
    .module('excelencia')
    .service('loggerService', loggerService);

function loggerService() {

    this.getLogger = (caller) => {
        const loggerName = extractLoggerName(caller);
        const logger = log4javascript.getLogger(loggerName);
        const consoleAppender = new log4javascript.BrowserConsoleAppender();

        logger.setLevel(log4javascript.Level.ALL);
        logger.addAppender(consoleAppender);

        return logger;
    };
}

function extractLoggerName(caller) {
    let name;
    if (caller) {
        if (typeof caller === 'string') {
            name = caller;
        } else {
            name = caller.constructor.name;
        }
    }
    return name;
}