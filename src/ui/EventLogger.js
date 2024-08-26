let eventLogs = [];

function logEvent(message, type = 'info') {
  const timestamp = new Date().toISOString();
  eventLogs.push(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  if (eventLogs.length > 100) {
    eventLogs.shift(); // Keep only the latest 100 logs
  }
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
}

function getEventLogs() {
  return eventLogs;
}

module.exports = { logEvent, getEventLogs };
