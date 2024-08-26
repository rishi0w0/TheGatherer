const fs = require('fs');
const path = require('path');
const { logEvent } = require('../ui/EventLogger');

function saveData(fileName, data) {
    try {
        const filePath = path.resolve(__dirname, `../data/${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logEvent(`Data saved to ${filePath}`);
    } catch (error) {
        logEvent(`Error saving data: ${error.message}`, 'error');
    }
}

function loadData(fileName) {
    try {
        const filePath = path.resolve(__dirname, `../data/${fileName}.json`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data;
    } catch (error) {
        logEvent(`Failed to load data from ${fileName}.json: ${error.message}`, 'error');
        return null;
    }
}

module.exports = { saveData, loadData };
