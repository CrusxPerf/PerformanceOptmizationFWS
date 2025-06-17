const fsp = require('fs').promises; // Use promise-based Node.js File System module (for access)
const { constants } = require('fs'); // Directly import constants from the regular fs module

/**
 * Checks if a file exists at the given path and is readable.
 * Throws an error if the file path is empty, or if the file does not exist,
 * or if it's not readable.
 * @param {string} filePath - The full path to the file.
 * @param {string} fileNameForError - A friendly name for the file to use in error messages (e.g., "Baseline JTL").
 * @returns {Promise<void>} A promise that resolves if the file exists and is readable,
 * otherwise rejects with an informative error.
 */
async function checkFileExists(filePath, fileNameForError) {
    if (!filePath) {
        throw new Error(`${fileNameForError} file path is empty. Please select a file.`);
    }
    try {
        // fsp.access checks if the file exists and is accessible with the specified mode
        // We use 'constants.R_OK' which is explicitly imported from the 'fs' module
        await fsp.access(filePath, constants.R_OK);
    } catch (error) {
        // Provide a more user-friendly error message
        throw new Error(`Cannot access ${fileNameForError} at "${filePath}". Please ensure the file exists and is readable. Details: ${error.message}`);
    }
}

module.exports = {
    checkFileExists
};
