import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../../src/components/Layout';

describe('Layout', () => {
  it('renders all main components', async () => {
    render(<Layout />);
    expect(await screen.findByText(/Chatbot/i)).toBeInTheDocument();
    expect(await screen.findByText(/Puppeteer Browser/i)).toBeInTheDocument();
    expect(await screen.findByText(/Data Visualizer/i)).toBeInTheDocument();
    expect(await screen.findByText(/Event Logger/i)).toBeInTheDocument();
  });
});
