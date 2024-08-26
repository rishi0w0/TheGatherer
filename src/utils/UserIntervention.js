const { logEvent } = require('../ui/EventLogger');
const { askQuestion } = require('../ui/Chatbot.');

async function promptUserIntervention(message) {
    logEvent(message);
    logEvent('Please handle the required intervention in the live Puppeteer browser. Type "done" when finished.');

    while (true) {
        const response = await askQuestion('Type "done" when you have completed the intervention: ');
        if (response.toLowerCase() === 'done') {
            logEvent('User intervention completed. Resuming scraping process.');
            break;
        } else {
            logEvent('Invalid response. Please type "done" when you have completed the intervention.', 'warning');
        }
    }
}

module.exports = { promptUserIntervention };
