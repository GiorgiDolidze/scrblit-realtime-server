// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
// Ensure this import path and function name are correct
const { saveFinalizedScribble } = require('./src/controllers/saveController'); 
const { initWebSocketServer } = require('./src/services/websocketService');

const app = express();
const PORT = process.env.PORT || 10000; 
const server = http.createServer(app);

// --- CRITICAL CORS FIX: Fallback to the environment variable set earlier ---
// This uses the CORS_ORIGIN variable you set to https://scrblit.com
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://scrblit.com', 
    optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' })); 

// --- HTTP Routes ---

app.get('/', (req, res) => {
    res.send('Server is running and healthy.');
});

app.post('/api/v1/save-scribble', async (req, res) => {
    console.log('Received save signal from client. Attempting to finalize server-side save...');
    
    // Call the controller which handles retrieving the retained data and forwarding it to cPanel
    const success = await saveFinalizedScribble(); 

    if (success) {
        res.status(200).json({ success: true, message: 'Image successfully archived.' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to archive image (Check Render logs).' });
    }
});


// Initialize WebSocket Server
initWebSocketServer(server);

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
});
