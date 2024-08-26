import React, { useState } from 'react';
import { startChatbot } from '../Chatbot';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatbotPanel = () => {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartChatbot = async () => {
    setLoading(true);
    setError(null);
    try {
      const chatbotOutput = await startChatbot();
      setOutput(chatbotOutput);
    } catch (err) {
      setError('Failed to start chatbot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-panel">
      <h2>Chatbot</h2>
      <button onClick={handleStartChatbot} disabled={loading}>
        {loading ? 'Starting...' : 'Start Chatbot'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <div className="error">{error}</div>}
      <div className="output">{output}</div>
      <style jsx>{`
        .chatbot-panel {
          padding: 20px;
        }
        .output {
          margin-top: 20px;
          white-space: pre-wrap;
        }
        .error {
          color: red;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default ChatbotPanel;
