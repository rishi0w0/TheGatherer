import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/globals.css';
import * as serviceWorker from './serviceWorker';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
    
    if (process.env.NODE_ENV === 'production') {
      serviceWorker.register(); // Register service worker for production
      console.log('Production mode');
    }

    reportWebVitals(console.log); // Performance monitoring

  } catch (error) {
    console.error('Error during rendering:', error);
  }
} else {
  console.error('Root element not found');
}
