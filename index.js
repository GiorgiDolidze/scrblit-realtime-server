// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
// Import the modified saveController which no longer requires client image data
const { saveFinalizedScribble } = require('./src/controllers/saveController'); 
const { initWebSocketServer } = require('./src/services/websocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

// --- CORS Configuration ---
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://scrblit.com', 
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Allows large JSON payloads (no longer strictly needed, but kept for robustness)
app.use(express.json({ limit: '5mb' })); 

// --- HTTP Routes ---

app.get('/', (req, res) => {
    res.send('Server is running and healthy.');
});

// Endpoint for the client to trigger the save process (Now just a signal to finalize)
app.post('/api/v1/save-scribble', async (req, res) => {
    // The client no longer sends image data. We just signal the controller to finalize the save 
    // using the state already retained on the server side.
    console.log('Received save signal from client. Attempting to finalize server-side save...');
    
    // CRITICAL FIX: The saveController must handle the save internally without relying on req.body.imageData
    const success = await saveFinalizedScribble(); 

    if (success) {
        // The server-side reset happens via WebSocket broadcast.
        res.status(200).json({ success: true, message: 'Image successfully archived.' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to archive image.' });
    }
});


// Initialize WebSocket Server
initWebSocketServer(server);

// Start the HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
});
