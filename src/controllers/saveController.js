// src/controllers/saveController.js
const axios = require('axios');
const canvasState = require('../utils/canvasUtils');

// Your cPanel endpoint to save the image (from config.js file)
// We assume the cPanel is scrblit.com
const CPANEL_SAVE_URL = 'https://scrblit.com/api/upload_image.php';

/**
 * Handles the HTTP POST request from a client containing the base64 image data 
 * and forwards it securely to the cPanel PHP script.
 * * @param {string} imageData - The base64 data URL of the canvas image.
 * @returns {Promise<boolean>} - True if the save was successful, false otherwise.
 */
async function saveScribble(imageData) {
    // Extract the raw base64 string from the data URL
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

    // Generate a unique filename
    const fileName = `scribble_${Date.now()}.png`;

    try {
        // --- SECURE FORWARD TO CPANEL ---
        const response = await axios.post(CPANEL_SAVE_URL, {
            // Your API Key is pulled from the Render environment variables
            apiKey: process.env.CPANEL_API_KEY, 
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
        console.error('Error forwarding save request to cPanel:', error.message);
        // Important: If the save fails, we still want to reset the state 
        // to prevent the canvas from getting stuck, but for now, we return false.
        return false;
    }
}

module.exports = {
    saveScribble
};
