const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const express = require('express'); // Import express
const fs = require('fs').promises; // NEW: Import the promise-based fs module for file operations
require('dotenv').config(); // Load environment variables from .env

let mainWindow;
let expressServerInstance; // To hold the express server instance for proper closing

// Function to create and start the Express server
async function createExpressServer() {
    const app = express();
    // Serve static files (like index.html) from the root of this Electron app folder
    app.use(express.static(path.join(__dirname)));
    // Enable parsing of JSON request bodies
    app.use(express.json());

    // Import and set up your API routes from server.js
    // We pass the 'app' instance to server.js so it can define routes on it
    require('./server')(app);

    // Start Express on a random available port (port 0 means OS assigns a free port)
    return new Promise((resolve, reject) => {
        const server = app.listen(0, () => {
            const port = server.address().port;
            console.log(`Express server listening on http://localhost:${port}`);
            resolve(port); // Resolve the promise with the port number
        }).on('error', (err) => {
            console.error("Failed to start Express server:", err);
            reject(err); // Reject the promise if there's an error
        });
        expressServerInstance = server; // Store the server instance
    });
}

async function createWindow() {
    try {
        const expressPort = await createExpressServer(); // Start Express and get the port

        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false, // Keep false for security
                contextIsolation: true, // Keep true for security
                webviewTag: false, // Disable webview for security unless specifically needed
                // NEW: Pass the expressPort as an additional argument to the preload script
                additionalArguments: [`--express-port=${expressPort}`]
            }
        });

        // Load the index.html from your Express server
        mainWindow.loadURL(`http://localhost:${expressPort}/index.html`);

        // Open the DevTools.
        mainWindow.webContents.openDevTools();

        // Set up a custom logger from renderer to main process
        ipcMain.on('log', (event, message) => {
            console.log('Renderer Log:', message);
        });

    } catch (error) {
        console.error("Failed to create window or start server:", error);
        dialog.showErrorBox("Application Startup Error", `Failed to start the application: ${error.message}`);
        app.quit();
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    // Also close the Express server when the Electron app quits
    if (expressServerInstance) {
        expressServerInstance.close(() => {
            console.log('Express server closed.');
        });
    }
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handler for native file dialogs (exposed via preload.js)
ipcMain.handle('select-file', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
    if (!canceled && filePaths.length > 0) {
        return filePaths[0]; // Return the selected file path
    }
    return null; // Return null if no file was selected or dialog was canceled
});

// IPC handler for showing sophisticated error dialogs (exposed via preload.js)
ipcMain.handle('show-error-dialog', async (event, title, message) => {
    // Electron's built-in error box
    await dialog.showErrorBox(title, message);
});

// IPC handler for showing simple informational alerts (exposed via preload.js)
ipcMain.handle('show-alert', async (event, title, message) => {
    // Electron's built-in message box for alerts
    await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: title || 'Information', // Use provided title or default
        message: message
    });
});

// IPC handler for exporting the current page to PDF
ipcMain.handle('export-to-pdf', async (event, defaultFilename) => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Report as PDF',
            defaultPath: defaultFilename, // Suggest a default filename
            filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
        });

        if (canceled) {
            console.log('PDF export canceled by user.');
            return { success: false, message: 'PDF export canceled.' };
        }

        const pdfBuffer = await mainWindow.webContents.printToPDF({
            // PDF options (customize as needed)
            printBackground: true, // Include background colors/images
            pageSize: 'A4',
            landscape: false, // Portrait orientation
            // margin: {
            //     top: '0.5in',
            //     bottom: '0.5in',
            //     left: '0.5in',
            //     right: '0.5in'
            // }
        });

        await fs.writeFile(filePath, pdfBuffer); // Save the PDF buffer to the chosen file path
        console.log('PDF saved to:', filePath);
        return { success: true, filePath: filePath };

    } catch (error) {
        console.error('Error printing to PDF:', error);
        // Show error dialog to the user
        dialog.showErrorBox('PDF Export Error', `Failed to export report to PDF: ${error.message}`);
        return { success: false, message: error.message };
    }
});
