import { render } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

import App from '../src/App';

// Mock framer-motion to avoid issues in happy-dom environment
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    nav: 'nav',
    ul: 'ul',
    li: 'li',
    a: 'a',
    button: 'button',
    span: 'span',
    p: 'p',
    header: 'header',
    footer: 'footer',
    main: 'main',
    section: 'section',
    article: 'article',
    aside: 'aside',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock three.js to avoid WebGL-related errors
vi.mock('three', () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
  })),
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  Object3D: vi.fn(),
  TextureLoader: vi.fn(),
  Material: vi.fn(),
  Mesh: vi.fn(),
  Group: vi.fn(),
  Vector3: vi.fn(),
  Geometry: vi.fn(),
  BoxGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  GridHelper: vi.fn(),
  PlaneGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  DirectionalLight: vi.fn(),
  AmbientLight: vi.fn(),
  SphereGeometry: vi.fn(),
}));

describe('App component', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
