import React from 'react';
import { render, screen } from '@testing-library/react';
import EventLoggerPanel from '../../src/ui/EventLoggerPanel';
import { getEventLogs } from '../../src/ui/EventLogger';

jest.mock('../../src/ui/EventLogger', () => ({
  getEventLogs: jest.fn()
}));

describe('EventLoggerPanel', () => {
  beforeEach(() => {
    getEventLogs.mockReturnValue(['[2022-01-01T00:00:00Z] [INFO] Test log']);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Event Logger panel', async () => {
    render(<EventLoggerPanel />);
    expect(await screen.findByText(/Event Logger/i)).toBeInTheDocument();
  });

  it('displays loading spinner initially', async () => {
    render(<EventLoggerPanel />);
    expect(await screen.findByText(/Loading.../i)).toBeInTheDocument();
  });

  it('displays event logs after loading', async () => {
    render(<EventLoggerPanel />);
    expect(await screen.findByText(/\[INFO\] Test log/i)).toBeInTheDocument();
  });

  it('handles error when loading event logs', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((cb) => cb());
    render(<EventLoggerPanel />);
    expect(await screen.findByText(/Failed to load event logs./i)).toBeInTheDocument();
  });
});
