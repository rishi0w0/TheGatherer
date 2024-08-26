import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatbotPanel from '../../src/ui/ChatbotPanel';
import { startChatbot } from '../Chatbot';

jest.mock('../../src/ui/Chatbot', () => ({
  startChatbot: jest.fn().mockResolvedValue('Chatbot started')
}));

describe('ChatbotPanel', () => {
  it('renders chatbot panel and starts chatbot', async () => {
    render(<ChatbotPanel />);
    const button = screen.getByText(/Start Chatbot/i);
    fireEvent.click(button);
    expect(await screen.findByText(/Starting.../i)).toBeInTheDocument();
    expect(await screen.findByText(/Chatbot started/i)).toBeInTheDocument();
  });

  it('handles errors when starting chatbot', async () => {
    startChatbot.mockRejectedValueOnce(new Error('Failed to start chatbot'));
    render(<ChatbotPanel />);
    const button = screen.getByText(/Start Chatbot/i);
    fireEvent.click(button);
    expect(await screen.findByText(/Starting.../i)).toBeInTheDocument();
    expect(await screen.findByText(/Failed to start chatbot. Please try again./i)).toBeInTheDocument();
  });
});
