import React from 'react';
import { render, screen } from '@testing-library/react';
import PuppeteerPanel from '../../src/ui/PuppeteerPanel';

describe('PuppeteerPanel', () => {
  it('renders Puppeteer panel', async () => {
    render(<PuppeteerPanel />);
    expect(await screen.findByText(/Puppeteer Browser/i)).toBeInTheDocument();
  });

  it('displays loading spinner initially', async () => {
    render(<PuppeteerPanel />);
    expect(await screen.findByText(/Loading.../i)).toBeInTheDocument();
  });

  it('displays Puppeteer browser instance after loading', async () => {
    render(<PuppeteerPanel />);
    expect(await screen.findByText(/Puppeteer browser instance will be displayed here./i)).toBeInTheDocument();
  });

  it('handles error when loading Puppeteer browser instance', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((cb) => cb());
    render(<PuppeteerPanel />);
    expect(await screen.findByText(/Failed to load Puppeteer browser instance./i)).toBeInTheDocument();
  });
});
