import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEvents } from '../src/hooks/useEvents';
import { useStore } from '../src/store';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0; // CONNECTING
  binaryType: string = '';
  onopen: Function | null = null;
  onmessage: Function | null = null;
  onerror: Function | null = null;
  onclose: Function | null = null;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({ target: this });
    }, 50);
  }

  send(data: string | ArrayBuffer) {
    // Mock send implementation
    return true;
  }

  close(code?: number, reason?: string) {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ code: code || 1000, reason, wasClean: true });
  }
}

// Mock environment variables
vi.mock('../src/utils/env', () => ({
  QWS_URL: '/ws/jobs',
  API_URL: 'http://localhost:8080/api',
  DEBUG: true,
  DEMO_FALLBACK_MS: 1000,
  WS_HOST: 'localhost:8080',
  WS_PROTOCOL: 'ws',
  env: {
    QWS_URL: '/ws/jobs',
    API_URL: 'http://localhost:8080/api',
    DEBUG: true,
    DEMO_FALLBACK_MS: 1000,
    WS_HOST: 'localhost:8080',
    WS_PROTOCOL: 'ws',
  },
  validateEnv: () => ({
    QWS_URL: '/ws/jobs',
    API_URL: 'http://localhost:8080/api',
    DEBUG: true,
    DEMO_FALLBACK_MS: 1000,
    WS_HOST: 'localhost:8080',
    WS_PROTOCOL: 'ws',
  })
}));

// Mock store
vi.mock('../src/store', () => ({
  useStore: {
    getState: vi.fn(() => ({
      setWebSocket: vi.fn(),
      setConnected: vi.fn(),
      setError: vi.fn(),
      pushEvent: vi.fn(),
      clearEvents: vi.fn(),
      isConnected: false,
      webSocket: null
    })),
    setState: vi.fn(),
  }
}));

// Mock Worker
class MockWorker {
  onmessage: Function | null = null;
  onerror: Function | null = null;
  
  constructor() {
    // Simulate worker ready after short delay
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'worker_loaded' } });
      }
    }, 50);
  }
  
  postMessage(message: any, transfer?: any[]) {
    if (message.type === 'init_schema') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: { type: 'schema_ready' } });
        }
      }, 50);
    }
  }
  
  terminate() {
    // Mock terminate
  }
}

describe('useEvents WebSocket Connection', () => {
  // Save original WebSocket and Worker
  const originalWebSocket = global.WebSocket;
  const originalWorker = global.Worker;
  
  beforeEach(() => {
    // Mock WebSocket
    global.WebSocket = MockWebSocket as any;
    
    // Mock Worker
    global.Worker = MockWorker as any;
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob://mock-worker-url');
    
    // Mock import.meta.env
    global.import = {
      meta: {
        env: {
          VITE_QWS_URL: '/ws/jobs',
          VITE_API_URL: 'http://localhost:8080/api',
          VITE_DEBUG: 'true',
          VITE_DEMO_FALLBACK_MS: '1000',
          VITE_WS_HOST: 'localhost:8080',
          VITE_WS_PROTOCOL: 'ws',
        }
      }
    } as any;
    
    // Mock location
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        host: 'localhost:3000'
      },
      writable: true
    });
  });
  
  afterEach(() => {
    // Restore original WebSocket and Worker
    global.WebSocket = originalWebSocket;
    global.Worker = originalWorker;
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  it('should establish WebSocket connection with correct URL format', async () => {
    // Create a spy on WebSocket constructor
    const webSocketSpy = vi.spyOn(global, 'WebSocket');
    
    // Call useEvents with a sample URL
    const jobId = 'test-job-123';
    const url = `/ws/jobs/${jobId}/stream`;
    
    // Setup store mock
    const setWebSocketMock = vi.fn();
    const setConnectedMock = vi.fn();
    useStore.getState = vi.fn().mockReturnValue({
      setWebSocket: setWebSocketMock,
      setConnected: setConnectedMock,
      setError: vi.fn(),
      pushEvent: vi.fn(),
      clearEvents: vi.fn(),
      webSocket: null,
      isConnected: false
    });
    
    // Use the hook (this will create a WebSocket connection)
    useEvents(url);
    
    // Verify WebSocket was created with correct URL
    expect(webSocketSpy).toHaveBeenCalledTimes(1);
    const wsUrl = webSocketSpy.mock.calls[0][0];
    expect(wsUrl).toMatch(/^ws:\/\/localhost:8080\/ws\/jobs\/test-job-123\/stream$/);
    
    // Wait a bit for the "connection" to establish
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify connection handlers were set correctly
    expect(setConnectedMock).toHaveBeenCalledWith(true);
  });
});