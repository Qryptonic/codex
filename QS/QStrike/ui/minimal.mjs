import http from 'http';
import { networkInterfaces } from 'os';

const server = http.createServer((req, res) => {
    console.log('Request received for:', req.url);
    
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Minimal Server Test</title>
                <style>
                    body { font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #f0f0f0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>QStrike Minimal Test</h1>
                    <p>This is being served from the most basic Node.js HTTP server.</p>
                    <p>If you can see this, basic HTTP serving is working.</p>
                    <p>Current time: ${new Date().toLocaleTimeString()}</p>
                </div>
            </body>
            </html>
        `);
        return;
    }
    
    res.writeHead(404);
    res.end('Not found');
});

server.listen(4321, '0.0.0.0', () => {
    console.log('Server is running on:');
    console.log('- http://localhost:4321');
    console.log('- http://127.0.0.1:4321');
    
    // Try to get the local IP addresses
    try {
        const nets = networkInterfaces();
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip internal and non-IPv4 addresses
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`- http://${net.address}:4321 (${name})`);
                }
            }
        }
    } catch (e) {
        console.log('Could not determine local IP addresses:', e);
    }
});