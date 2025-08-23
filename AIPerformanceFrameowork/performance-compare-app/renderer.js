const electronAPI = window.electronAPI; 

async function handleSelectFile(event) {
    const button = event.target;
    const inputId = button.dataset.fileInputId;
    const fileType = button.dataset.fileType;
    const fileExt = button.dataset.fileExt;

    const options = {
        properties: ['openFile'], // Ensures it's a file open dialog
        filters: [{ name: fileType, extensions: fileExt.split(',') }]
    };

    console.log('[Renderer] Calling electronAPI.selectFile with options:', options);
    const filePath = await electronAPI.selectFile(options);
    if (filePath) {
        document.getElementById(inputId).value = filePath;
        console.log('[Renderer] File path received:', filePath);
    } else {
        console.log('[Renderer] File selection cancelled or no file chosen.');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('[Renderer] DOMContentLoaded: Attaching event listeners.');

    // Attach event listeners to all browse buttons using their data attribute
    document.querySelectorAll('button[data-file-input-id]').forEach(button => {
        button.addEventListener('click', handleSelectFile);
    });

    const reportForm = document.getElementById('reportForm');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const loadingSpinner = document.getElementById('loading');
    const reportOutput = document.getElementById('reportOutput');
    const jtlResultsDiv = document.getElementById('jtlResults');
    const splunkResultsDiv = document.getElementById('splunkResults');
    const aiSummaryContentDiv = document.getElementById('aiSummaryContent');

    reportForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        console.log('[Renderer] Form submitted. Generating report...');

        // Reset previous results
        jtlResultsDiv.innerHTML = '';
        splunkResultsDiv.innerHTML = '';
        aiSummaryContentDiv.innerHTML = '';
        reportOutput.classList.add('hidden');

        // Show loading spinner and disable button
        loadingSpinner.classList.remove('hidden');
        generateReportBtn.disabled = true;

        const baselineJTLPath = document.getElementById('baselineJTL').value;
        const latestJTLPath = document.getElementById('latestJTL').value;
        const baselineSplunkPath = document.getElementById('baselineSplunk').value;
        const latestSplunkPath = document.getElementById('latestSplunk').value;

        try {
            const result = await electronAPI.generateReport({
                baselineJTLPath,
                latestJTLPath,
                baselineSplunkPath,
                latestSplunkPath
            });

            if (result.error) {
                console.error("Report generation failed:", result.error);
                // The main process will typically show a dialog via showErrorDialog
                // electronAPI.showErrorDialog('Report Error', result.error); // uncomment if main process doesn't show it
                return;
            }

            // Display JTL Results
            jtlResultsDiv.innerHTML = '<h3>JMeter Comparison</h3>';
            for (const metric in result.jtlComparisonResults) {
                const data = result.jtlComparisonResults[metric];
                jtlResultsDiv.innerHTML += `
                    <p><strong>${metric}:</strong></p>
                    <ul>
                        <li>Baseline: ${data.Baseline}</li>
                        <li>Latest: ${data.Latest}</li>
                        <li>Difference: ${data.Difference}</li>
                        <li>Change: ${data.Change}</li>
                        <li>Status: ${data.Status}</li>
                        <li>Description: ${data.Description}</li>
                    </ul>
                `;
            }

            // Display Splunk Results
            splunkResultsDiv.innerHTML = '<h3>Splunk Comparison</h3>';
            for (const key in result.splunkComparisonResults) {
                const value = result.splunkComparisonResults[key];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Check if it's a formatted metric result
                    if (value.Baseline || value.Latest || value.Difference || value.Change || value.Status || value.Description) {
                        splunkResultsDiv.innerHTML += `
                            <p><strong>${key}:</strong></p>
                            <ul>
                                <li>Baseline: ${value.Baseline}</li>
                                <li>Latest: ${value.Latest}</li>
                                <li>Difference: ${value.Difference}</li>
                                <li>Change: ${value.Change}</li>
                                <li>Status: ${value.Status}</li>
                                <li>Description: ${value.Description}</li>
                            </ul>
                        `;
                    } else {
                        // Likely a sample or note that is an object
                        // CORRECTED LINE: No extra HTML tags here
                        splunkResultsDiv.innerHTML += `
                            <p><strong>${key}:</strong><pre>${JSON.stringify(value, null, 2)}</pre></p>
                        `;
                    }
                } else {
                    // Simple key-value pairs (like "Note" or "Raw Text Samples Only")
                    splunkResultsDiv.innerHTML += `
                        <p><strong>${key}:</strong> ${value}</p>
                    `;
                }
            }

            // Display AI Summary
            aiSummaryContentDiv.innerHTML = result.aiSummary; // Assuming AI summary is already markdown/HTML

            reportOutput.classList.remove('hidden');

        } catch (error) {
            console.error('Error generating report:', error);
            electronAPI.showErrorDialog('Report Error', 'An unexpected error occurred during report generation. Check console.');
        } finally {
            loadingSpinner.classList.add('hidden');
            generateReportBtn.disabled = false;
        }
    });
});
