// src/services/websocketService.js
// Manages WebSocket connections, drawing broadcast, coverage check, and the save loop.

const WebSocket = require('ws');
const canvasState = require('../utils/canvasUtils'); 
const { saveScribble } = require('../controllers/saveController');

// Configuration constants
const COVERAGE_THRESHOLD = 0.75; // REDUCED FROM 0.90 to 0.75

let wss;

function initWebSocketServer(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected. Total clients:', wss.clients.size);
        
        // --- REQUIREMENT 1: PERSISTENCE (Initial State Broadcast) ---
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

                    // 3. --- CHECK COVERAGE AND TRIGGER SAVE LOOP ---
                    const coverage = canvasState.checkCoverage();
                    // Log to console only when coverage is high or changes significantly
                    if (coverage > 0.60 || coverage % 0.05 < 0.01) {
                         console.log(`Current Coverage: ${(coverage * 100).toFixed(2)}%`);
                    }
                    
                    if (coverage >= COVERAGE_THRESHOLD) {
                        console.log(`${(COVERAGE_THRESHOLD * 100)}% COVERAGE REACHED. TRIGGERING SNAPSHOT AND RESET.`);
                        
                        // Tell all clients that a save is happening
                        broadcast(JSON.stringify({ type: 'TRIGGER_SAVE' }));

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
