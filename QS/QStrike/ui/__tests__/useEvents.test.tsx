import { renderHook, act } from '@testing-library/react-hooks';
import { useEvents } from '../src/hooks/useEvents';
import { useStore } from '../src/store';

// Mock the store
jest.mock('../src/store', () => ({
  useStore: jest.fn(),
  // Also export a mock implementation of store.getState()
  getState: jest.fn()
}));

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  readyState = 0; // CONNECTING
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  sendMock = jest.fn();

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({ target: this });
    }, 10);
  }

  send(data: string | ArrayBuffer) {
    this.sendMock(data);
    return true;
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ target: this });
  }
}

// Global WebSocket mock
global.WebSocket = MockWebSocket as any;

// Setup store mock implementation
const mockStore = {
  setWebSocket: jest.fn(),
  setConnected: jest.fn(),
  setError: jest.fn(),
  pushEvent: jest.fn(),
  clearEvents: jest.fn(),
  webSocket: null,
};

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  useStore.mockImplementation((selector) => {
    if (selector) {
      return selector(mockStore);
    }
    return mockStore;
  });
  (useStore as any).getState = jest.fn().mockReturnValue(mockStore);
});

describe('useEvents hook', () => {
  it('should establish WebSocket connection when URL is provided', () => {
    const { result } = renderHook(() => useEvents('/ws/jobs/test123/stream'));
    
    // Expect WebSocket to be created and stored
    expect(mockStore.setWebSocket).toHaveBeenCalled();
    
    // Get the WebSocket instance (first arg of first call)
    const ws = mockStore.setWebSocket.mock.calls[0][0];
    expect(ws.url).toContain('/ws/jobs/test123/stream');
  });

  it('should send ACK after receiving enough messages', async () => {
    // Render the hook
    const { result, waitFor } = renderHook(() => useEvents('/ws/jobs/test123/stream'));
    
    // Get the WebSocket instance (first arg of first call)
    const ws = mockStore.setWebSocket.mock.calls[0][0];
    
    // Wait for connection to open
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Simulate receiving 250 messages (exceed ACK_THRESHOLD of 200)
    for (let i = 0; i < 250; i++) {
      const buffer = new ArrayBuffer(8);
      // @ts-ignore - we're mocking the event
      ws.onmessage({ data: buffer });
    }
    
    // Check that ACK was sent
    await waitFor(() => {
      expect(ws.sendMock).toHaveBeenCalledWith('ACK');
    });
  });
  
  it('should handle plain text error messages from server', async () => {
    // Render the hook
    const { result, waitFor } = renderHook(() => useEvents('/ws/jobs/test123/stream'));
    
    // Get the WebSocket instance
    const ws = mockStore.setWebSocket.mock.calls[0][0];
    
    // Wait for connection to open
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Simulate receiving plain text error message
    // @ts-ignore - we're mocking the event
    ws.onmessage({ data: 'ERROR: Authentication failed: Invalid token' });
    
    // Check that error was set in store
    await waitFor(() => {
      expect(mockStore.setError).toHaveBeenCalledWith('Server error: Authentication failed: Invalid token');
    });
  });
  
  it('should reset ACK counter after each ACK send', async () => {
    // Render the hook
    const { result, waitFor } = renderHook(() => useEvents('/ws/jobs/test123/stream'));
    
    // Get the WebSocket instance
    const ws = mockStore.setWebSocket.mock.calls[0][0];
    
    // Wait for connection to open
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Simulate receiving 210 messages (exceed ACK_THRESHOLD of 200)
    for (let i = 0; i < 210; i++) {
      const buffer = new ArrayBuffer(8);
      // @ts-ignore - we're mocking the event
      ws.onmessage({ data: buffer });
    }
    
    // Check that ACK was sent
    await waitFor(() => {
      expect(ws.sendMock).toHaveBeenCalledWith('ACK');
    });
    
    // Reset mock to check for second ACK
    ws.sendMock.mockClear();
    
    // Send another 210 messages to trigger another ACK
    for (let i = 0; i < 210; i++) {
      const buffer = new ArrayBuffer(8);
      // @ts-ignore - we're mocking the event
      ws.onmessage({ data: buffer });
    }
    
    // Check that a second ACK was sent
    await waitFor(() => {
      expect(ws.sendMock).toHaveBeenCalledWith('ACK');
    });
  });

  it('should disconnect when URL becomes null', async () => {
    let url = '/ws/jobs/test123/stream';
    const { rerender } = renderHook(() => useEvents(url));
    
    // Get the WebSocket instance
    const ws = mockStore.setWebSocket.mock.calls[0][0];
    
    // Wait for connection to open
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Change URL to null to trigger disconnection
    url = null;
    rerender();
    
    // Check that webSocket was set to null
    expect(mockStore.setWebSocket).toHaveBeenCalledWith(null);
    expect(mockStore.setConnected).toHaveBeenCalledWith(false);
  });
});