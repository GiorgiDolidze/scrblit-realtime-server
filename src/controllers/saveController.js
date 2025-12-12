/*
 * src/controllers/saveController.js
 * Handles the image save request from the client and transfers the file to cPanel.
 */

require('dotenv').config();
const axios = require('axios');
const canvasUtils = require('../utils/canvasUtils');

// Environment variables from .env
const C_PANEL_API_KEY = process.env.C_PANEL_API_KEY;
const C_PANEL_UPLOAD_URL = process.env.C_PANEL_UPLOAD_URL;

/**
 * Handles the POST request from the client to save the current canvas as a PNG.
 * * @param {object} req - Express request object (contains imageData in body).
 * @param {object} res - Express response object.
 */
async function handleSaveRequest(req, res) {
    const { imageData } = req.body;

    if (!imageData || !imageData.startsWith('data:image/png;base64,')) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid or missing image data.' 
        });
    }

    // 1. Generate a unique filename (using a timestamp is reliable)
    const timestamp = Date.now();
    const fileName = `scribble_${timestamp}.png`;
    
    // 2. Extract the base64 part of the image data
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

    // 3. Prepare data for transfer to cPanel server
    const payload = {
        fileName: fileName,
        imageBase64: base64Data,
        // The cPanel side will use this key to authenticate the request
        apiKey: C_PANEL_API_KEY 
    };

    console.log(`Attempting to transfer file: ${fileName} to cPanel...`);

    try {
        // Use axios to send the image data to the dedicated cPanel upload endpoint
        const response = await axios.post(C_PANEL_UPLOAD_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 4. Check the response from the cPanel server
        if (response.status === 200 && response.data.success) {
            console.log(`Successfully saved ${fileName} on cPanel.`);
            
            // Optional: Reset coverage score immediately on successful save (done in canvasUtils.js)
            // canvasUtils.resetCanvasState(); 

            return res.status(200).json({ 
                success: true, 
                message: 'Image successfully archived.', 
                fileName: fileName 
            });
        } else {
            // Log specific error from the cPanel server if available
            console.error('cPanel server error:', response.data.message || 'Unknown response');
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to save image on cPanel server.' 
            });
        }

    } catch (error) {
        console.error('Error during file transfer to cPanel:', error.message);
        // Respond with a 500 status for internal server errors (e.g., network issues)
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during external transfer.' 
        });
    }
}

module.exports = {
    handleSaveRequest
};
