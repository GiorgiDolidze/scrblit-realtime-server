// index.js (Last working CORS/API key version)
const express = require('express');
const http = require('http');
const cors = require('cors');
const { saveScribble } = require('./src/controllers/saveController');
const { initWebSocketServer } = require('./src/services/websocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

// --- CORS Configuration (The version that worked) ---
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

// Endpoint for the client to send the base64 image data
app.post('/api/v1/save-scribble', async (req, res) => {
    const { imageData } = req.body; 
    
    if (!imageData) {
        return res.status(400).json({ success: false, message: 'No image data provided.' });
    }

    const success = await saveScribble(imageData); 

    if (success) {
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

