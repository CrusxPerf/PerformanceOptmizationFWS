const { contextBridge, ipcRenderer } = require('electron');

// NEW: Function to parse additional arguments to get the express port
const getExpressPort = () => {
    // process.argv contains command line arguments passed to the current process.
    // For a preload script, additionalArguments are appended here.
    const portArg = process.argv.find(arg => arg.startsWith('--express-port='));
    return portArg ? portArg.split('=')[1] : null;
};

const expressPort = getExpressPort();
// Construct the base URL dynamically. Fallback to a default if for some reason it's not found.
const expressApiBaseUrl = expressPort ? `http://localhost:${expressPort}` : 'http://localhost:9980'; // Fallback to 9980

contextBridge.exposeInMainWorld('api', {
    // Exposes a function to the renderer to select files via a native dialog
    selectFile: (options) => ipcRenderer.invoke('select-file', options),

    // Exposes a function to the renderer to show an error dialog
    showErrorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),

    // Exposes a function to the renderer to show a simple informational alert
    showAlert: (title, message) => ipcRenderer.invoke('show-alert', title, message),

    // Exposes a function to the renderer to trigger PDF export
    exportToPdf: (defaultFilename) => ipcRenderer.invoke('export-to-pdf', defaultFilename),

    // Exposes a function for logging messages from renderer to main process (optional, but good for debugging)
    log: (message) => ipcRenderer.send('log', message)
});

// NEW: Expose a config object to the renderer process
// This allows index.html to safely access the dynamic API base URL.
contextBridge.exposeInMainWorld('config', {
    expressApiBaseUrl: expressApiBaseUrl
});
