import React from 'react';
import ChatbotPanel from '../ui/ChatbotPanel';
import PuppeteerPanel from '../ui/PuppeteerPanel';
import DataVisualizerPanel from '../ui/DataVisualizerPanel';
import EventLoggerPanel from '../ui/EventLoggerPanel';

const Layout = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 min-h-screen bg-gray-900 text-white">
      <div className="border p-4">
        <ChatbotPanel />
      </div>
      <div className="border p-4">
        <PuppeteerPanel />
      </div>
      <div className="border p-4">
        <DataVisualizerPanel />
      </div>
      <div className="border p-4">
        <EventLoggerPanel />
      </div>
    </div>
  );
};

export default Layout;
