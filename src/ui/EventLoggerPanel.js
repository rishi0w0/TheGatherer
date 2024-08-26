import React, { useState, useEffect } from 'react';
import { getEventLogs } from '../EventLogger';

const EventLoggerPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const interval = setInterval(() => {
        setLogs(getEventLogs());
      }, 1000);

      return () => clearInterval(interval);
    } catch (err) {
      setError('Failed to load event logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="event-logger-panel">
      <h2>Event Logger</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      <div className="logs">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
      <style jsx>{`
        .event-logger-panel {
          padding: 20px;
        }
        .logs {
          margin-top: 20px;
          max-height: 300px;
          overflow-y: auto;
        }
        .error {
          color: red;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default EventLoggerPanel;
