const { logEvent } = require('../ui/EventLogger');
const { saveAsPDF, saveAsWord } = require('../utils/FileSaver');
const { askQuestion } = require('../ui/Chatbot.');

async function visualizeData(data) {
    try {
        logEvent('Visualizing data...');
        console.log('Data visualization (placeholder):', JSON.stringify(data, null, 2));

        const saveOption = await askQuestion('Do you want to download the visualization as PDF or Word? (pdf/word): ');
        if (saveOption.toLowerCase() === 'pdf') {
            await saveAsPDF(data);
        } else if (saveOption.toLowerCase() === 'word') {
            await saveAsWord(data);
        } else {
            logEvent('Invalid option. Skipping download.', 'warning');
        }
    } catch (error) {
        logEvent(`Error visualizing data: ${error.message}`, 'error');
    }
}

module.exports = { visualizeData };
