import { describe, it, expect } from 'vitest';

describe('Basic Smoke Tests', () => {
  it('imports without error', () => {
    expect(true).toBe(true);
  });

  it('can access process env variables', () => {
    expect(process.env).toBeDefined();
  });

  it('can use DOM APIs in the test environment', () => {
    document.body.innerHTML = '<div id="test">Test Content</div>';
    const element = document.getElementById('test');
    expect(element).not.toBeNull();
    expect(element?.textContent).toBe('Test Content');
  });
});