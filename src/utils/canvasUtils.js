/*
 * src/utils/canvasUtils.js
 * Helper functions for managing the conceptual server-side canvas state and coverage.
 */

// --- CONFIGURATION ---
// These dimensions should conceptually match the client-side canvas area (e.g., 900x500 virtual pixels)
const VIRTUAL_CANVAS_WIDTH = 900; 
const VIRTUAL_CANVAS_HEIGHT = 500; 

// The server needs to track covered area to decide when to snap.
let coveredAreaScore = 0; 
const MAX_SCORE = VIRTUAL_CANVAS_WIDTH * VIRTUAL_CANVAS_HEIGHT * 0.1; // Estimate max possible drawing activity before snap

// The coverage threshold defined in the client CONFIG (0.9 or 90%)
const COVERAGE_THRESHOLD = 0.9; 

/**
 * Resets the canvas coverage score to zero after a successful save operation.
 */
function resetCanvasState() {
    coveredAreaScore = 0;
    console.log('Canvas state reset. Score:', coveredAreaScore);
}

/**
 * Simulates recording drawing data to estimate coverage.
 * NOTE: For a production-grade app, this would use a library (like 'canvas' on Node) 
 * or a more complex spatial data structure to track actual covered pixels.
 * Here, we use a simple scoring system based on the line segment length.
 * * @param {number} x1 - Start X.
 * @param {number} y1 - Start Y.
 * @param {number} x2 - End X.
 * @param {number} y2 - End Y.
 */
function recordDrawData(x1, y1, x2, y2) {
    // Calculate the length of the line segment (Euclidean distance)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Increase score based on distance (representing coverage)
    // Scale the distance to account for the brush width (CONFIG.BRUSH_WIDTH is 8)
    coveredAreaScore += distance * 0.5; // Arbitrary factor for scoring

    // Ensure the score doesn't become ridiculously large
    if (coveredAreaScore > MAX_SCORE) {
        coveredAreaScore = MAX_SCORE;
    }
    
    // console.log(`Current Score: ${coveredAreaScore.toFixed(2)} / ${MAX_SCORE.toFixed(2)}`);
}

/**
 * Checks if the current drawing coverage meets the snap threshold.
 * @returns {boolean} True if the canvas should be snapped and saved.
 */
function checkThreshold() {
    // Calculate the current percentage of coverage
    const coveragePercentage = coveredAreaScore / MAX_SCORE;
    
    // Check if the score has crossed the threshold (90%)
    if (coveragePercentage >= COVERAGE_THRESHOLD) {
        // Crucial: Reset immediately to prevent multiple simultaneous save triggers
        resetCanvasState(); 
        return true;
    }

    return false;
}

module.exports = {
    recordDrawData,
    checkThreshold,
    resetCanvasState
};
