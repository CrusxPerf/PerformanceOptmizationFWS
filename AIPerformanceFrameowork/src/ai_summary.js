const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Ensure dotenv is loaded to access GOOGLE_API_KEY

// Retrieve the API key from environment variables
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("GOOGLE_API_KEY is not set in .env file. Please ensure it's configured correctly.");
    throw new Error("Google API Key is not configured. Please check your .env file.");
}

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using gemini-2.0-flash

/**
 * Generates an AI summary of the performance comparison results.
 * @param {Object} jtlComparisonResults - Results from JTL data comparison.
 * @param {Object} splunkComparisonResults - Results from Splunk data comparison (now simplified).
 * @param {string} baselineSplunkRawText - Raw text from the baseline Splunk report.
 * @param {string} latestSplunkRawText - Raw text from the latest Splunk report.
 * @returns {Promise<string>} A promise that resolves with the AI-generated summary text.
 * @throws {Error} If there's an issue communicating with the Gemini API.
 */
async function generateAISummary(jtlComparisonResults, splunkComparisonResults, baselineSplunkRawText, latestSplunkRawText) {
    // Increased snippet length for better Splunk raw text analysis.
    // Adjust based on your typical report size and token budget.
    const SPLUNK_SNIPPET_LENGTH = 4000; // You can try 3000-5000 chars

    let prompt = `
    You are an experienced Performance Test Engineer and a highly skilled Analyst. Your goal is to provide a comprehensive, actionable, and executive-level performance comparison report between a Baseline test and a Latest test.

    Analyze the provided data thoroughly and present your findings in a structured format.

    --- JMeter (JTL) Performance Data ---
    This section contains structured, key performance indicators (KPIs) from JMeter.
    Focus on changes in:
    - Average Response Time
    - Throughput (requests per second)
    - Error Rate
    - Percentiles (e.g., 90th, 95th, 99th)
    Quantify changes (e.g., "increased by X%").

    JMeter Comparison Results:
    ${JSON.stringify(jtlComparisonResults, null, 2)}

    --- Splunk System Health and Resource Data ---
    This section provides raw text content from Splunk performance reports.
    Your task for Splunk is to read and comprehend these raw text reports directly.
    Identify and compare critical system health and resource utilization metrics such as:
    - Overall throughput (e.g., processor message throughput, messages/events per second)
    - Latency or processing times for components/servers
    - Error counts, warnings, or abnormal log patterns
    - Resource utilization (CPU, Memory, Disk I/O)
    - Any new components, servers, or significant outliers.

    **Crucially, correlate Splunk observations with JMeter findings where possible (e.g., if JMeter response times increased, did Splunk show higher CPU or latency for specific components?).**

    Baseline Splunk Report Raw Text (Snippet, max ${SPLUNK_SNIPPET_LENGTH} chars):
    ${baselineSplunkRawText ? baselineSplunkRawText.substring(0, SPLUNK_SNIPPET_LENGTH) + (baselineSplunkRawText.length > SPLUNK_SNIPPET_LENGTH ? "\n... (truncated for brevity)" : "") : "N/A (No raw text provided)"}

    Latest Splunk Report Raw Text (Snippet, max ${SPLUNK_SNIPPET_LENGTH} chars):
    ${latestSplunkRawText ? latestSplunkRawText.substring(0, SPLUNK_SNIPPET_LENGTH) + (latestSplunkRawText.length > SPLUNK_SNIPPET_LENGTH ? "\n... (truncated for brevity)" : "") : "N/A (No raw text provided)"}

    --- Report Structure and Content ---
    Please provide your analysis in the following structured markdown format:

    **1. Executive Summary:**
    * A concise overview of the overall performance trend (e.g., stable, regression, improvement).
    * Highlight the most critical finding (positive or negative).

    **2. JMeter (JTL) Performance Analysis:**
    * Summarize key changes in response times, throughput, and error rates.
    * State the magnitude and direction of changes (e.g., "Average Response Time increased by X%").
    * Mention percentile changes if significant.

    **3. Splunk System Health and Resource Analysis:**
    * Summarize the changes in cumulative throughput and messages per second observed from Splunk.
    * Detail the findings regarding processing times, especially for individual servers (e.g., identifying servers with increased latency, new servers, or significant outliers).
    * **Elaborate on the impact or potential implications of identified server variations/outliers.**
    * Mention any other critical resource utilization changes or error patterns observed from the raw text.

    **4. Identified Issues & Regressions:**
    * List specific issues or performance regressions clearly.
    * Prioritize them by severity or potential impact.
    * Connect JMeter and Splunk findings where they corroborate an issue.

    **5. Recommendations:**
    * Provide clear, actionable recommendations for further investigation or remediation based on the identified issues.
    * Suggest next steps for each critical finding.

    Ensure your language is professional, data-driven, and directly addresses the comparison.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text(); // Get the generated text
        return text;
    } catch (error) {
        console.error("Error generating AI summary:", error.response?.candidates?.[0]?.safetyRatings || error);
        throw new Error(`Failed to get AI summary: ${error.message}. Check console for details.`);
    }
}

module.exports = {
    generateAISummary
};
