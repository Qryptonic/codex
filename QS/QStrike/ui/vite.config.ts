import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from 'path'
import fs from 'fs'

// Load schema directly so it can be resolved at build time
const schemaContent = fs.readFileSync('./src/QuantumEvent.avsc', 'utf-8')
const schemaPath = resolve(__dirname, 'src/QuantumEvent.avsc')

const PORT = Number(process.env.PORT) || 3000;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['kafkajs'], // Exclude heavy dependencies to improve dev-server startup
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // This allows us to import the schema as if it were a module
      '../QuantumEvent.avsc?raw': schemaPath
    }
  },
  // Server options including proxies for backend services
  server: { host: true, port: PORT, 
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
      '/replay': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/schema': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    // Add middleware for health check endpoint
    middlewareMode: false,
    configureServer: (server) => {
      server.middlewares.use('/__health', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end('OK')
      })
    }
  },
  preview: { port: PORT }, // Vite preview must match
  // Worker configuration
  worker: {
    format: 'es', // Use ES modules for workers
  },
  // Ensure schema files are available and optimize chunks
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear old artifacts to prevent stale files
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom',
            'zustand'
          ],
          'avro': [
            'avsc'
          ],
          'visualization': [
            'd3'
          ]
        }
      }
    },
    // Improve chunk size reporting
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  // Static files to be copied as-is
  publicDir: 'public',
  // Avro schema already resolved in the resolve config above
}) 