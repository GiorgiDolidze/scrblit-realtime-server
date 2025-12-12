// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
// Import the modified saveController function
const { saveFinalizedScribble } = require('./src/controllers/saveController'); 
const { initWebSocketServer } = require('./src/services/websocketService');

const app = express();
// CRITICAL FIX: Use Render's specified port, default to 10000
const PORT = process.env.PORT || 10000; 
const server = http.createServer(app);

// --- CRITICAL CORS FIX ---
// This explicitly allows access from your domain (https://scrblit.com)
const corsOptions = {
    origin: 'https://scrblit.com', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204 // Use 204 for successful preflight requests
};

app.use(cors(corsOptions));
// Allows large JSON payloads 
app.use(express.json({ limit: '5mb' })); 

// --- HTTP Routes ---

app.get('/', (req, res) => {
    res.send('Server is running and healthy.');
});

// Endpoint for the client to trigger the save process (Signal to finalize the server-side image)
app.post('/api/v1/save-scribble', async (req, res) => {
    console.log('Received save signal from client. Attempting to finalize server-side save...');
    
    // Call the controller which handles retrieving the retained data and forwarding it to cPanel
    const success = await saveFinalizedScribble(); 

    if (success) {
        res.status(200).json({ success: true, message: 'Image successfully archived.' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to archive image (Check Render logs for API Key or Save Data errors).' });
    }
});


// Initialize WebSocket Server
initWebSocketServer(server);

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
});
