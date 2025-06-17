/**
 * Calculates the average of a specific field from an array of objects.
 * @param {Array<Object>} data - Array of objects (e.g., JTL rows).
 * @param {string} field - The name of the field to average (e.g., 'elapsed').
 * @returns {number} The calculated average.
 */
const calculateAverage = (data, field) => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, row) => acc + parseFloat(row[field] || 0), 0);
    return sum / data.length;
};

/**
 * Calculates the throughput (requests per second) from JTL data.
 * Assumes 'timeStamp' is in milliseconds.
 * @param {Array<Object>} data - Array of JTL objects.
 * @returns {number} The calculated throughput.
 */
const calculateThroughput = (data) => {
    if (!data || data.length < 2 || !data[0].timeStamp || !data[data.length - 1].timeStamp) {
        return 0; // Not enough data for throughput or missing timestamp
    }
    const startTime = parseFloat(data[0].timeStamp);
    const endTime = parseFloat(data[data.length - 1].timeStamp);
    const durationSeconds = (endTime - startTime) / 1000; // Convert milliseconds to seconds
    return durationSeconds > 0 ? data.length / durationSeconds : 0;
};

/**
 * Calculates the error rate from JTL data.
 * @param {Array<Object>} data - Array of JTL objects.
 * @returns {number} The calculated error rate as a percentage.
 */
const calculateErrorRate = (data) => {
    if (!data || data.length === 0) return 0;
    const totalSamples = data.length;
    const errorSamples = data.filter(row => row.success === 'false').length;
    return (errorSamples / totalSamples) * 100;
};

/**
 * Calculates a specific percentile (e.g., 90th, 95th, 99th) for 'elapsed' time from JTL data.
 * @param {Array<Object>} data - Array of JTL objects.
 * @param {number} percentile - The percentile to calculate (e.g., 90 for 90th percentile).
 * @returns {number} The calculated percentile value.
 */
const calculatePercentile = (data, percentile) => {
    if (!data || data.length === 0) return 0;
    const sortedElapsed = data.map(row => parseFloat(row.elapsed)).sort((a, b) => a - b);
    const index = Math.ceil(sortedElapsed.length * (percentile / 100)) - 1;
    return sortedElapsed[index] || 0;
};

/**
 * Formats a percentage change value.
 * @param {number} baseline - The baseline value.
 * @param {number} latest - The latest value.
 * @returns {string} Formatted percentage change string.
 */
const formatPercentageChange = (baseline, latest) => {
    if (baseline === 0) return latest === 0 ? "0.00%" : "N/A (Baseline is zero)";
    const change = ((latest - baseline) / baseline) * 100;
    return `${change.toFixed(2)}%`;
};

/**
 * Compares two sets of JTL (JMeter) results.
 * @param {Array<Object>} baselineJTL - Baseline JTL data.
 * @param {Array<Object>} latestJTL - Latest JTL data.
 * @returns {Object} An object containing comparison results for various JTL metrics.
 */
function compareJTLData(baselineJTL, latestJTL) {
    const results = {};

    if (!baselineJTL || baselineJTL.length === 0 || !latestJTL || latestJTL.length === 0) {
        return { "Warning": "JTL data is missing or incomplete for comparison." };
    }

    // Overall Samples
    results["Total Samples"] = {
        "Baseline": baselineJTL.length,
        "Latest": latestJTL.length,
        "Change": formatPercentageChange(baselineJTL.length, latestJTL.length)
    };

    // Average Response Time
    const baselineAvgRT = calculateAverage(baselineJTL, 'elapsed');
    const latestAvgRT = calculateAverage(latestJTL, 'elapsed');
    results["Average Response Time (ms)"] = {
        "Baseline": baselineAvgRT.toFixed(2),
        "Latest": latestAvgRT.toFixed(2),
        "Change": formatPercentageChange(baselineAvgRT, latestAvgRT)
    };

    // Throughput
    const baselineThroughput = calculateThroughput(baselineJTL);
    const latestThroughput = calculateThroughput(latestJTL);
    results["Throughput (req/sec)"] = {
        "Baseline": baselineThroughput.toFixed(2),
        "Latest": latestThroughput.toFixed(2),
        "Change": formatPercentageChange(baselineThroughput, latestThroughput)
    };

    // Error Rate
    const baselineErrorRate = calculateErrorRate(baselineJTL);
    const latestErrorRate = calculateErrorRate(latestJTL);
    results["Error Rate (%)"] = {
        "Baseline": baselineErrorRate.toFixed(2),
        "Latest": latestErrorRate.toFixed(2),
        "Change": formatPercentageChange(baselineErrorRate, latestErrorRate)
    };

    // Percentiles (e.g., 90th, 95th, 99th)
    const percentiles = [90, 95, 99];
    percentiles.forEach(p => {
        const baselineP = calculatePercentile(baselineJTL, p);
        const latestP = calculatePercentile(latestJTL, p);
        results[`${p}th Percentile (ms)`] = {
            "Baseline": baselineP.toFixed(2),
            "Latest": latestP.toFixed(2),
            "Change": formatPercentageChange(baselineP, latestP)
        };
    });

    return results;
}

/**
 * Prepares Splunk data comparison results.
 * This function is simplified to delegate detailed analysis to the AI using raw text.
 * @param {Array<Object>} baselineSplunkDF - Structured data from baseline Splunk (via Camelot).
 * @param {Array<Object>} latestSplunkDF - Structured data from latest Splunk (via Camelot).
 * @returns {Object} A simplified object indicating AI delegation and basic record counts.
 */
function compareSplunkData(baselineSplunkDF, latestSplunkDF) {
    const results = {};

    results["Structured Data Found (Baseline)"] = baselineSplunkDF && baselineSplunkDF.length > 0 ? "Yes" : "No";
    results["Structured Data Found (Latest)"] = latestSplunkDF && latestSplunkDF.length > 0 ? "Yes" : "No";
    results["Baseline Splunk Records Count"] = baselineSplunkDF ? baselineSplunkDF.length : 0;
    results["Latest Splunk Records Count"] = latestSplunkDF ? latestSplunkDF.length : 0;

    // Inform the AI that the detailed comparison for Splunk is its task using raw text.
    results["AI Delegation Note"] = "Detailed Splunk comparison and insight generation is handled by the AI using raw text content."; // <-- **FIXED: Closed string and added semicolon**

    return results;
}

module.exports = {
    calculateAverage,
    calculateThroughput,
    calculateErrorRate,
    calculatePercentile,
    formatPercentageChange,
    compareJTLData,
    compareSplunkData
};
