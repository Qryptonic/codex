import React from 'react';
import { render, screen } from '@testing-library/react';
import { SuccessThermometer } from '../../src/components/SuccessThermometer';
import '@testing-library/jest-dom';

describe('SuccessThermometer component', () => {
  // Mock event with different success probabilities
  const createMockEvent = (pSuccess: number) => ({
    jobId: 'test-job',
    provider: 'TEST',
    algo: 'SHOR',
    ts: 1234567890,
    phase: 'TESTING',
    progressPct: 50,
    etaSec: 120,
    fidelity: 0.95,
    physicalQubits: 50,
    logicalQubits: 10,
    circuitDepth: 100,
    gateError: 0.001,
    pSuccess,
    scaledEtaSec: 30
  });

  test('renders success percentage correctly', () => {
    const mockEvent = createMockEvent(0.83);
    render(<SuccessThermometer event={mockEvent} />);
    
    // Check that the success percentage is displayed correctly
    const successPercentage = screen.getByText('83.0%');
    expect(successPercentage).toBeInTheDocument();
  });

  test('displays thermometer with correct height based on success probability', () => {
    const mockEvent = createMockEvent(0.83);
    render(<SuccessThermometer event={mockEvent} />);
    
    // Find the thermometer fill element and check its height
    const thermometerFill = document.querySelector('div[style*="height: 83%"]');
    expect(thermometerFill).toBeInTheDocument();
  });

  test('formats ETA correctly for seconds', () => {
    const mockEvent = createMockEvent(0.5);
    mockEvent.etaSec = 45;
    mockEvent.scaledEtaSec = 10;
    
    render(<SuccessThermometer event={mockEvent} />);
    
    expect(screen.getByText('45s')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  test('formats ETA correctly for minutes and seconds', () => {
    const mockEvent = createMockEvent(0.5);
    mockEvent.etaSec = 125;
    
    render(<SuccessThermometer event={mockEvent} />);
    
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });

  test('changes color based on success probability', () => {
    // Test with high success probability (green)
    const highSuccessEvent = createMockEvent(0.96);
    const { rerender } = render(<SuccessThermometer event={highSuccessEvent} />);
    expect(screen.getByText('96.0%')).toHaveClass('text-green-400');
    
    // Rerender with medium success probability (yellow)
    const mediumSuccessEvent = createMockEvent(0.65);
    rerender(<SuccessThermometer event={mediumSuccessEvent} />);
    expect(screen.getByText('65.0%')).toHaveClass('text-yellow-400');
    
    // Rerender with low success probability (red)
    const lowSuccessEvent = createMockEvent(0.35);
    rerender(<SuccessThermometer event={lowSuccessEvent} />);
    expect(screen.getByText('35.0%')).toHaveClass('text-red-400');
  });

  test('shows N/A when scaled ETA is missing', () => {
    const mockEvent = createMockEvent(0.5);
    mockEvent.scaledEtaSec = null;
    
    render(<SuccessThermometer event={mockEvent} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
EOF < /dev/null
