const { logEvent } = require('../ui/EventLogger');

const requestLogger = (req, res, next) => {
    logEvent(`${req.method} ${req.url}`, 'info');
    next();
};

module.exports = requestLogger;
