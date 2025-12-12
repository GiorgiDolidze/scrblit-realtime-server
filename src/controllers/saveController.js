// src/controllers/saveController.js
const axios = require('axios');
// Import the canvas state retention utility
const { getRetainedImageData } = require('../utils/canvasUtils'); 

const CPANEL_SAVE_URL = 'https://scrblit.com/api/upload_image.php';

/**
 * Handles forwarding the server-retained image data to the cPanel PHP script.
 * This is called after the TRIGGER_SAVE event, using data saved internally by the server.
 * @returns {Promise<boolean>} - True if the save was successful, false otherwise.
 */
async function saveFinalizedScribble() {
    const apiKey = process.env.CPANEL_API_KEY;
    const retainedData = getRetainedImageData(); // Retrieve the data saved by the server 

    if (!apiKey) {
        console.error("FATAL ERROR: CPANEL_API_KEY is not set in Render environment variables.");
        return false;
    }
    
    if (!retainedData) {
        console.warn("Save requested, but no image data was retained by the server state.");
        return false;
    }

    // Server-retained data is expected to be the full base64 data URL
    const base64Data = retainedData.replace(/^data:image\/png;base64,/, "");
    const fileName = `scribble_${Date.now()}.png`;

    try {
        console.log(`Forwarding retained image data to cPanel with API Key (partial): ${apiKey.substring(0, 4)}...`);

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
    saveFinalizedScribble
};
