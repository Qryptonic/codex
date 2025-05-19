const http = require('http');
const net = require('net');

// Function to check if a port is open
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    // Set a timeout (3 seconds)
    const timeout = setTimeout(() => {
      socket.destroy();
      console.log(`Port ${port} check timed out`);
      resolve(false);
    }, 3000);
    
    // Attempt to connect
    socket.connect(port, 'localhost', () => {
      clearTimeout(timeout);
      socket.destroy();
      console.log(`Port ${port} is OPEN`);
      resolve(true);
    });
    
    // Handle errors
    socket.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`Port ${port} is CLOSED (${err.message})`);
      resolve(false);
    });
  });
}

// HTTP HEAD request to check server
function checkServer(port) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 3000,
    };
    
    const req = http.request(options, (res) => {
      console.log(`Server on port ${port} responded with status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (e) => {
      console.log(`Server on port ${port} is not responding: ${e.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`Server on port ${port} request timed out`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Check common ports
async function checkPorts() {
  console.log('Checking common ports for services...');
  
  // Check a range of ports
  const portsToCheck = [3000, 3001, 3002, 3003, 3004, 3005, 8080, 8081, 8082];
  
  for (const port of portsToCheck) {
    const isOpen = await checkPort(port);
    
    if (isOpen) {
      // If port is open, try making an HTTP request
      await checkServer(port);
    }
  }
  
  console.log('Port scan complete');
}

// Run the port checker
checkPorts();