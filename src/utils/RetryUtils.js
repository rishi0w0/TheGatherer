const { logEvent } = require('../ui/EventLogger');

async function retryOperation(operation, retries, delay) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            logEvent(`Operation failed (attempt ${i + 1}): ${error.message}`, 'warning');
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error;
            }
        }
    }
}

module.exports = { retryOperation };
