// src/services/websocketService.js
// Manages WebSocket connections, drawing broadcast, coverage check, and the save loop.

const WebSocket = require('ws');
const canvasState = require('../utils/canvasUtils'); 
const { saveScribble } = require('../controllers/saveController');

// Configuration constants
const COVERAGE_THRESHOLD = 0.90; // 90% (from client config)

let wss;

function initWebSocketServer(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected. Total clients:', wss.clients.size);
        
        // --- REQUIREMENT 1: PERSISTENCE (Initial State Broadcast) ---
        // Immediately send the current state of the canvas to the new client.
        const initialState = JSON.stringify({
            type: 'INITIAL_STATE',
            lines: canvasState.getLines()
        });
        ws.send(initialState);
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'DRAW') {
                    // 1. Add line to state
                    canvasState.addLine(data);

                    // 2. Broadcast the line to all other connected clients
                    broadcast(JSON.stringify(data), ws);

                    // 3. --- REQUIREMENT 2, 3, 4: CHECK COVERAGE AND TRIGGER SAVE LOOP ---
                    const coverage = canvasState.checkCoverage();
                    console.log(`Current Coverage: ${(coverage * 100).toFixed(2)}%`);
                    
                    if (coverage >= COVERAGE_THRESHOLD) {
                        console.log('90% COVERAGE REACHED. TRIGGERING SNAPSHOT AND RESET.');
                        
                        // Tell all clients that a save is happening
                        broadcast(JSON.stringify({ type: 'TRIGGER_SAVE' }));

                        // Perform the save operation asynchronously
                        // The client sending the request (via HTTP POST) will handle the save itself,
                        // but we can add server-side redundancy here if needed.
                        // For the clean loop, the important step is the reset.
                        
                        // 4. Reset server state for the infinite loop
                        canvasState.reset(); 
                    }
                }

            } catch (e) {
                console.error('Error processing message or broadcasting:', e.message);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected. Total clients:', wss.clients.size);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
    });

    console.log('WebSocket Server initialized.');
}

/**
 * Broadcasts a message to all connected clients, optionally excluding one sender.
 * @param {string} data - The JSON string to send.
 * @param {WebSocket} [excludeClient] - The client to exclude from the broadcast (usually the sender).
 */
function broadcast(data, excludeClient = null) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
            client.send(data);
        }
    });
}

module.exports = {
    initWebSocketServer,
    broadcast 
};
