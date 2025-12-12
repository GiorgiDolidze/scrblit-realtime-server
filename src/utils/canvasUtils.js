// src/utils/canvasUtils.js
// Handles server-side state (list of lines) and canvas coverage calculation.

const { createCanvas } = require('canvas'); 

class CanvasState {
    constructor(width = 900, height = 500) {
        this.CANVAS_WIDTH = width;
        this.CANVAS_HEIGHT = height;
        this.lines = []; // Array of {x1, y1, x2, y2, color}
        this.coverageCtx = null; 
    }

    /**
     * Initializes the server-side canvas context for accurate coverage tracking.
     */
    initCoverageContext() {
        if (!this.coverageCtx) {
            try {
                const canvas = createCanvas(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
                this.coverageCtx = canvas.getContext('2d');
                
                // Initialize to a guaranteed WHITE background
                this.coverageCtx.fillStyle = '#FFFFFF';
                this.coverageCtx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
                
                this.coverageCtx.lineCap = 'round';
            } catch (error) {
                console.error("Failed to initialize server-side canvas context. Ensure 'canvas' package is installed.", error);
            }
        }
    }

    /**
     * Adds a line to the state and redraws it on the coverage canvas.
     * @param {object} line - {x1, y1, x2, y2, color}
     */
    addLine(line) {
        this.lines.push(line);
        if (this.coverageCtx) {
            this.drawCoverageLine(line);
        }
    }

    /**
     * Draws a line onto the server's coverage canvas for calculation purposes.
     * CRITICAL FIX: Use a very thick, high-contrast line to ensure full coverage.
     * @param {object} line - {x1, y1, x2, y2, color}
     */
    drawCoverageLine(line) {
        if (!this.coverageCtx) return;
        
        // Use a high-contrast color (Black) and fixed, thick width (50px)
        // to reliably fill space and minimize gaps between drawn strokes.
        this.coverageCtx.strokeStyle = '#000000'; 
        this.coverageCtx.lineWidth = 50; 
        
        this.coverageCtx.beginPath();
        this.coverageCtx.moveTo(line.x1, line.y1);
        this.coverageCtx.lineTo(line.x2, line.y2);
        this.coverageCtx.stroke();
        this.coverageCtx.closePath();
    }

    /**
     * Calculates the percentage of the canvas covered by drawing.
     * @returns {number} - Coverage percentage (0.0 to 1.0)
     */
    checkCoverage() {
        if (!this.coverageCtx) return 0;

        const imageData = this.coverageCtx.getImageData(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT).data;
        let coveredPixels = 0;
        let totalPixels = this.CANVAS_WIDTH * this.CANVAS_HEIGHT;

        // Iterate through all pixels (R, G, B, A components)
        // Check the Red component. If it's less than 255 (not pure white), it's covered.
        // This logic is correct, but relies on drawCoverageLine using a thick stroke.
        for (let i = 0; i < imageData.length; i += 4) {
            // Check if the pixel is NOT white (R=255, G=255, B=255)
            // Since we draw with pure black, checking R < 255 is sufficient.
            if (imageData[i] < 255) {
                coveredPixels++;
            }
        }
        
        return coveredPixels / totalPixels;
    }
    
    /**
     * Resets the canvas state and the server-side coverage context.
     */
    reset() {
        this.lines = [];
        if (this.coverageCtx) {
            this.coverageCtx.fillStyle = '#FFFFFF';
            this.coverageCtx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        }
        console.log("Canvas state reset. Ready for new scribbles.");
    }

    /**
     * Get the current line segments array (for INITIAL_STATE broadcast).
     */
    getLines() {
        return this.lines;
    }
}

// Export a singleton instance of the state
const canvasState = new CanvasState();
canvasState.initCoverageContext(); 
module.exports = canvasState;
