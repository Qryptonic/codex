/**
 * Basic accessibility tests for key components
 */
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Header } from '../src/components/Header';
import SuccessThermometer from '../src/components/SuccessThermometer';

describe('Accessibility Tests', () => {
  it('Header component should have no accessibility violations', async () => {
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SuccessThermometer should have no accessibility violations', async () => {
    const mockEvent = {
      provider: 'IBM',
      algo: 'SHOR',
      phase: 'TEST',
      pSuccess: 0.75,
      etaSec: 120,
      scaledEtaSec: 10,
      jobId: 'test-job',
      ts: Date.now(),
      logicalQubits: 50,
      physicalQubits: 200,
      circuitDepth: 100,
      gateError: 0.001,
      fidelity: 0.99,
      progressPct: 75
    };
    
    const { container } = render(<SuccessThermometer event={mockEvent} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  // More accessibility tests for other components...
});