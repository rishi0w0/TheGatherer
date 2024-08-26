const { logEvent, getEventLogs } = require('../../src/ui/EventLogger');

describe('EventLogger', () => {
  beforeEach(() => {
    // Clear logs before each test
    while (getEventLogs().length > 0) {
      getEventLogs().pop();
    }
  });

  it('should log events', () => {
    logEvent('Test event', 'info');
    const logs = getEventLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('INFO');
    expect(logs[0]).toContain('Test event');
  });

  it('should keep only the latest 100 logs', () => {
    for (let i = 0; i < 110; i++) {
      logEvent(`Test event ${i}`, 'info');
    }
    const logs = getEventLogs();
    expect(logs.length).toBe(100);
    expect(logs[0]).toContain('Test event 10');
  });

  it('should handle error events', () => {
    logEvent('Error event', 'error');
    const logs = getEventLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('ERROR');
    expect(logs[0]).toContain('Error event');
  });
});
