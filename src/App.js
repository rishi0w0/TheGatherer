import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider } from './AppContext';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: "https://your-dsn-url@sentry.io/project-id",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

const ChatbotPanel = lazy(() => import('./components/ChatbotPanel'));
const DataVisualizerPanel = lazy(() => import('./components/DataVisualizerPanel'));
const EventLoggerPanel = lazy(() => import('./components/EventLoggerPanel'));
const PuppeteerPanel = lazy(() => import('./components/PuppeteerPanel'));

function App() {
  return (
    <AppProvider>
      <Router>
        <Helmet>
          <title>My App</title>
          <meta name="description" content="My App Description" />
        </Helmet>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Switch>
                <Route path="/" exact component={ChatbotPanel} />
                <Route path="/visualizer" component={DataVisualizerPanel} />
                <Route path="/logger" component={EventLoggerPanel} />
                <Route path="/puppeteer" component={PuppeteerPanel} />
              </Switch>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
