const express = require('express');
const { startChatbot } = require('./ui/Chatbot');
const { logEvent } = require('./ui/EventLogger');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

// Middleware for security (optional but recommended)
const helmet = require('helmet');
app.use(helmet());

// Middleware to log requests
app.use((req, res, next) => {
  logEvent(`${req.method} ${req.url}`, 'info');
  next();
});

// Example route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Graceful shutdown handling
function handleShutdown(signal) {
  logEvent(`Received ${signal}. Shutting down gracefully...`, 'info');
  startChatbot().then(() => {
    logEvent('Chatbot shutdown completed', 'info');
    process.exit(0);
  }).catch(err => {
    logEvent(`Error during chatbot shutdown: ${err.message}`, 'error');
    process.exit(1);
  });
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Start the chatbot or other background processes
startChatbot()
  .then(() => {
    logEvent('Chatbot started successfully', 'info');
  })
  .catch((err) => {
    logEvent(`Failed to start chatbot: ${err.message}`, 'error');
  });

// Start the web server
app.listen(port, () => {
  logEvent(`Server is running on http://localhost:${port}`, 'info');
});

// Catch unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logEvent(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
});

process.on('uncaughtException', (error) => {
  logEvent(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1); // Exit after logging the error
});
