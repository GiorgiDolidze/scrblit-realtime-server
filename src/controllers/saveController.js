// src/controllers/saveController.js (Last working API key version)
const axios = require('axios');
const canvasState = require('../utils/canvasUtils');

const CPANEL_SAVE_URL = 'https://scrblit.com/api/upload_image.php';

/**
 * Handles the HTTP POST request from a client containing the base64 image data 
 * and forwards it securely to the cPanel PHP script.
 */
async function saveScribble(imageData) {
    const apiKey = process.env.CPANEL_API_KEY;
    
    if (!apiKey) {
        console.error("FATAL ERROR: CPANEL_API_KEY is not set in Render environment variables.");
        return false;
    }

    // Extract the raw base64 string from the data URL
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

    // Generate a unique filename
    const fileName = `scribble_${Date.now()}.png`;

    try {
        console.log(`Forwarding save to cPanel with API Key (partial): ${apiKey.substring(0, 4)}...`);

        const response = await axios.post(CPANEL_SAVE_URL, {
            apiKey: apiKey,
            fileName: fileName,
            imageBase64: base64Data
        });

        if (response.status === 200 && response.data.success) {
            console.log(`Successfully saved ${fileName} to cPanel.`);
            return true;
        } else {
            console.error('cPanel save script returned failure:', response.data.message);
            return false;
        }
    } catch (error) {
        if (error.response) {
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
