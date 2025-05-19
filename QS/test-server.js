const http = require('http');

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!\n');
});

// Try to listen on port 3002
const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// Handle errors
server.on('error', (e) => {
  console.error(`Server error: ${e.message}`);
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try stopping other services.`);
  }
});

// Print a message every 5 seconds to show the server is still running
setInterval(() => {
  console.log(`Server still running at ${new Date().toISOString()}`);
}, 5000);