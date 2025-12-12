/*
 * index.js
 * Server entry point for the Scrblit Real-time and API handler.
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const saveController = require('./src/controllers/saveController');
const websocketService = require('./src/services/websocketService');

const app = express();
const server = http.createServer(app);

// Use the PORT from .env or default to 8080 (Render usually sets this)
const PORT = process.env.PORT || 8080; 
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// --- 1. EXPRESS MIDDLEWARE ---

// Parse JSON request bodies (needed for the image save endpoint)
app.use(express.json({ limit: '5mb' })); // Increase limit for large image data

// CORS Configuration
app.use((req, res, next) => {
    // Only allow requests from the defined cPanel URL
    const allowedOrigins = [CORS_ORIGIN, 'http://localhost:3000']; // Add localhost for development
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// --- 2. HTTP ROUTES (API) ---

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Scrblit server is running.');
});

// Image Save Endpoint (POST request from client-app.js)
// This calls the saveController to handle image processing and transfer.
app.post('/api/v1/save-scribble', saveController.handleSaveRequest);


// --- 3. WEB SOCKET SERVER ---

// Initialize WebSocket Server, binding it to the existing HTTP server
const wss = new WebSocket.Server({ server });

// Pass the WebSocket Server instance to the service handler
websocketService.initialize(wss);


// --- 4. START SERVER ---

server.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
    console.log(`WebSocket Server initialized on port ${PORT}`);
});