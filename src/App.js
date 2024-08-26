import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components
const ChatbotPanel = lazy(() => import('./components/ChatbotPanel'));
const DataVisualizerPanel = lazy(() => import('./components/DataVisualizerPanel'));
const EventLoggerPanel = lazy(() => import('./components/EventLoggerPanel'));
const PuppeteerPanel = lazy(() => import('./components/PuppeteerPanel'));

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Switch>
            <Route path="/" exact component={ChatbotPanel} />
            <Route path="/visualizer" component={DataVisualizerPanel} />
            <Route path="/logger" component={EventLoggerPanel} />
            <Route path="/puppeteer" component={PuppeteerPanel} />
          </Switch>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
