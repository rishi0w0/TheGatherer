import React from 'react';
import { render, screen } from '@testing-library/react';
import DataVisualizerPanel from '../../src/ui/DataVisualizerPanel';

describe('DataVisualizerPanel', () => {
  it('renders Data Visualizer panel', async () => {
    render(<DataVisualizerPanel />);
    expect(await screen.findByText(/Data Visualizer/i)).toBeInTheDocument();
  });

  it('displays loading spinner initially', async () => {
    render(<DataVisualizerPanel />);
    expect(await screen.findByText(/Loading.../i)).toBeInTheDocument();
  });

  it('displays data visualization after loading', async () => {
    render(<DataVisualizerPanel />);
    expect(await screen.findByText(/Data visualization will be displayed here./i)).toBeInTheDocument();
  });

  it('handles error when loading data visualization', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementationOnce((cb) => cb());
    render(<DataVisualizerPanel />);
    expect(await screen.findByText(/Failed to load data visualization./i)).toBeInTheDocument();
  });
});
