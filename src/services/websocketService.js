/*
 * src/services/websocketService.js
 * Handles the WebSocket connections, real-time drawing state, and broadcasting.
 */

const WebSocket = require('ws');
const canvasUtils = require('../utils/canvasUtils'); // Needed for checking/managing canvas state

let wss; // WebSocket Server instance
const clients = new Set(); // To track all connected clients

/**
 * Initializes the WebSocket service with the server instance.
 * @param {WebSocket.Server} server - The initialized WebSocket server instance.
 */
function initialize(server) {
    wss = server;
    console.log('WebSocketService initialized.');
    
    // Set up connection handling
    wss.on('connection', handleConnection);
}

/**
 * Handles a new WebSocket connection from a client.
 * @param {WebSocket} ws - The new client WebSocket instance.
 * @param {http.IncomingMessage} req - The incoming HTTP request.
 */
function handleConnection(ws, req) {
    clients.add(ws);
    console.log(`Client connected. Total clients: ${clients.size}`);

    // Set up message listener for this client
    ws.on('message', (message) => handleMessage(ws, message));
    
    // Set up close listener
    ws.on('close', () => handleClose(ws));
    
    // NOTE: On connection, you would typically send the current canvas state 
    // to the new client so they can see the current scribble before they start drawing.
    // (This requires implementing state persistence, which is complex and outside the initial scope,
    // so we skip sending the initial state for now.)
}

/**
 * Handles incoming messages from a client.
 * @param {WebSocket} sender - The WebSocket instance of the sender.
 * @param {string} message - The raw message string.
 */
function handleMessage(sender, message) {
    try {
        const data = JSON.parse(message);

        if (data.type === 'DRAW') {
            // Process the incoming drawing command
            const { x1, y1, x2, y2, color } = data;

            // 1. Update the server-side representation of the canvas (for coverage check)
            // The canvasUtils module will handle updating its internal state.
            canvasUtils.recordDrawData(x1, y1, x2, y2, color); 

            // 2. Broadcast the drawing data to all other connected clients
            broadcast(message, sender);
            
            // 3. Check for coverage threshold (This check must be handled by the server 
            // to ensure simultaneous drawing doesn't trigger multiple save events)
            if (canvasUtils.checkThreshold()) {
                console.log('Server detected 90%+ coverage. Signaling save.');
                
                // Signal to all clients that the canvas should be saved and reset
                broadcast(JSON.stringify({ type: 'TRIGGER_SAVE' }));
            }

        } else if (data.type === 'HEARTBEAT') {
            // Simple response to keep the connection alive if needed
            // sender.send(JSON.stringify({ type: 'PONG' }));
        }

    } catch (error) {
        console.error('Error processing WebSocket message:', error);
    }
}

/**
 * Handles a client closing its connection.
 * @param {WebSocket} ws - The closing client WebSocket instance.
 */
function handleClose(ws) {
    clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
}

/**
 * Sends a message to all connected clients, optionally excluding the sender.
 * @param {string} message - The message to send.
 * @param {WebSocket} [sender] - The client to exclude from the broadcast (the original sender).
 */
function broadcast(message, sender = null) {
    clients.forEach(client => {
        // Ensure the client is open and, if a sender is provided, ensure it's not the sender
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(message);
        }
    });
}

module.exports = {
    initialize
};
