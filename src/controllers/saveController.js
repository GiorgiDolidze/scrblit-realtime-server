// src/controllers/saveController.js
const axios = require('axios');
const canvasState = require('../utils/canvasUtils');

// Your cPanel endpoint to save the image 
const CPANEL_SAVE_URL = 'https://scrblit.com/api/upload_image.php';

/**
 * Handles the HTTP POST request from a client containing the base64 image data 
 * and forwards it securely to the cPanel PHP script.
 * @param {string} imageData - The base64 data URL of the canvas image.
 * @returns {Promise<boolean>} - True if the save was successful, false otherwise.
 */
async function saveScribble(imageData) {
    const apiKey = process.env.CPANEL_API_KEY;
    
    if (!apiKey) {
        console.error("FATAL ERROR: CPANEL_API_KEY is not set in Render environment variables. This caused a 401 error.");
        return false;
    }

    // Extract the raw base64 string from the data URL
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

    // Generate a unique filename
    const fileName = `scribble_${Date.now()}.png`;

    try {
        // --- SECURE FORWARD TO CPANEL ---
        // Log the key (first 4 chars) to confirm it's being read from the environment
        console.log(`Forwarding save to cPanel with API Key (partial): ${apiKey.substring(0, 4)}...`);

        const response = await axios.post(CPANEL_SAVE_URL, {
            apiKey: apiKey, // The full key is sent here
            fileName: fileName,
            imageBase64: base64Data
        });

        if (response.status === 200 && response.data.success) {
            console.log(`Successfully saved ${fileName} to cPanel.`);
            return true;
        } else {
            // Log full response for debugging if PHP returns success: false
            console.error('cPanel save script returned failure:', response.data.message);
            return false;
        }
    } catch (error) {
        // Detailed error handling for Axios errors (like 401, 503, network issues)
        if (error.response && error.response.status === 401) {
             console.error('Error forwarding save request to cPanel: 401 Unauthorized. The API Key is likely incorrect or the PHP script is misconfigured.');
        } else if (error.response) {
             console.error(`Error forwarding save request to cPanel: HTTP Status ${error.response.status}.`, error.response.data);
        } else {
             console.error('Error forwarding save request to cPanel (Network/Timeout):', error.message);
        }
        return false;
    }
}

module.exports = {
    saveScribble
};
