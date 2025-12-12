// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initWebSocketServer } = require('./src/services/websocketService');
const { saveScribble } = require('./src/controllers/saveController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

// --- CORS Configuration ---
// CRITICAL FIX: Use the actual live domain for CORS_ORIGIN
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://scrblit.com', // Changed default to live domain
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Allows large JSON payloads (for the base64 image data when saving)
app.use(express.json({ limit: '5mb' })); 

// --- HTTP Routes ---

// Health check endpoint for Render
app.get('/', (req, res) => {
    res.send('Server is running and healthy.');
});

// Endpoint for the client to trigger the save process (Requirement 3)
app.post('/api/v1/save-scribble', async (req, res) => {
    const { imageData } = req.body;

    if (!imageData) {
        return res.status(400).json({ success: false, message: 'Missing imageData.' });
    }
    
    // Call the controller to securely forward the PNG data to cPanel
    const success = await saveScribble(imageData);

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
