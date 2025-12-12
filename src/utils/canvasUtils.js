// src/utils/canvasUtils.js
// Handles server-side state (list of lines) and canvas coverage calculation.

// NOTE: You must have the 'canvas' package installed on your Node.js server.
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
                
                // Initialize to white
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
     * @param {object} line - {x1, y1, x2, y2, color}
     */
    drawCoverageLine(line) {
        if (!this.coverageCtx) return;
        
        // Use a high-contrast color and fixed width for reliable coverage calculation
        this.coverageCtx.strokeStyle = '#000000'; 
        this.coverageCtx.lineWidth = 10; 
        
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
        for (let i = 0; i < imageData.length; i += 4) {
            if (imageData[i] < 255) {
                coveredPixels++;
            }
        }
        
        return coveredPixels / totalPixels;
    }
    
    /**
     * Resets the canvas state and the server-side coverage context.
     * This is called after a successful save snap.
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
     * @returns {Array} - The array of line objects.
     */
    getLines() {
        return this.lines;
    }
}

// Export a singleton instance of the state
const canvasState = new CanvasState();
canvasState.initCoverageContext(); 
module.exports = canvasState;
