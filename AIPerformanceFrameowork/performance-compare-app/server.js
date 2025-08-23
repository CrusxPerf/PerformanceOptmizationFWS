    const path = require('path');
    const { parseJTL, parseSplunkReport } = require('./src/data_parser'); // Your data parsing logic
    const { compareJTLData, compareSplunkData } = require('./src/comparison_logic'); // Your comparison logic
    const { generateAISummary } = require('./src/ai_summary'); // Your AI summary logic
    const { checkFileExists } = require('./src/utils'); // Your utility for file validation

    // This module exports a function that takes the Express 'app' instance
    // This allows main.js to pass the app to this file to define routes on it.
    module.exports = (app) => {
        // Define a POST API endpoint for generating the report
        app.post('/api/generate-report', async (req, res) => {
            // Extract file paths from the request body
            const { baselineJTLPath, latestJTLPath, baselineSplunkPath, latestSplunkPath } = req.body;

            try {
                // --- Input Validation ---
                // Use the utility function to check if all selected files exist and are readable
                await checkFileExists(baselineJTLPath, 'Baseline JTL');
                await checkFileExists(latestJTLPath, 'Latest JTL');
                await checkFileExists(baselineSplunkPath, 'Baseline Splunk');
                await checkFileExists(latestSplunkPath, 'Latest Splunk');

                // --- Parsing JTL Files ---
                const baselineJTL = await parseJTL(baselineJTLPath);
                const latestJTL = await parseJTL(latestJTLPath);

                if (!baselineJTL || baselineJTL.length === 0 || !latestJTL || latestJTL.length === 0) {
                    throw new Error("One or both JTL files could not be parsed or are empty. Check file content and format.");
                }

                // --- Parsing Splunk Reports ---
                // Determine file extensions to pass to the parser
                const baselineSplunkExt = path.extname(baselineSplunkPath).substring(1).toLowerCase();
                const latestSplunkExt = path.extname(latestSplunkPath).substring(1).toLowerCase();

                // Parse Splunk reports. parseSplunkReport returns [structuredData, rawText]
                const [baselineSplunkDF, baselineSplunkRawText] = await parseSplunkReport(baselineSplunkPath, baselineSplunkExt);
                const [latestSplunkDF, latestSplunkRawText] = await parseSplunkReport(latestSplunkPath, latestSplunkExt);

                // --- Comparison Logic ---
                const jtlComparisonResults = compareJTLData(baselineJTL, latestJTL);

                let splunkComparisonResults = {};
                if (baselineSplunkDF && latestSplunkDF) {
                    // Only compare structured Splunk data if both are successfully extracted
                    splunkComparisonResults = compareSplunkData(baselineSplunkDF, latestSplunkDF);
                } else {
                    // Provide a note if structured Splunk data wasn't available for comparison
                    splunkComparisonResults = { "Notes": "Structured Splunk data not extracted. AI will attempt to use raw text if available." };
                }

                // --- AI Summary Generation ---
                const aiSummary = await generateAISummary(
                    jtlComparisonResults,
                    splunkComparisonResults,
                    baselineSplunkRawText, // Pass raw text for AI context
                    latestSplunkRawText     // Pass raw text for AI context
                );

                // Send back the results as JSON
                res.json({ jtlComparisonResults, splunkComparisonResults, aiSummary });

            } catch (error) {
                // If any error occurs during the process, log it and send a 500 status response
                console.error("Error in /api/generate-report:", error);
                res.status(500).json({ error: error.message || "An unexpected error occurred during report generation." });
            }
        });
    };
    
