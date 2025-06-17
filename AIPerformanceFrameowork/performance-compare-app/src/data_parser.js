const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');

async function parseJTL(filepath) {
    try {
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filepath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });
        console.log(`Successfully parsed JTL: ${filepath}`);
        return results;
    } catch (error) {
        console.error(`Error parsing JTL file ${filepath}: ${error.message}`);
        throw new Error(`Failed to parse JTL file: ${error.message}`);
    }
}

async function parseSplunkReport(filepath, fileFormat) {
    let parsedData = null;
    let rawText = '';

    try {
        if (fileFormat === 'csv') {
            parsedData = await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filepath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (error) => reject(error));
            });
            console.log(`Successfully parsed Splunk CSV: ${filepath}`);
        } else if (fileFormat === 'json') {
            const data = await fsp.readFile(filepath, 'utf8');
            parsedData = JSON.parse(data);
            console.log(`Successfully parsed Splunk JSON: ${filepath}`);
        } else if (fileFormat === 'html') {
            const htmlContent = await fsp.readFile(filepath, 'utf8');
            const $ = cheerio.load(htmlContent);
            const tables = $('table');
            let combinedData = [];
            tables.each((i, table) => {
                const headers = [];
                $(table).find('thead th').each((j, th) => {
                    headers.push($(th).text().trim());
                });
                if (headers.length === 0) {
                    $(table).find('tr').first().find('td, th').each((j, cell) => {
                        headers.push($(cell).text().trim());
                    });
                }
                $(table).find('tbody tr').each((j, tr) => {
                    if (j === 0 && headers.length > 0 && $(tr).find('td').length === 0 && $(tr).find('th').length > 0) {
                        return;
                    }
                    const rowData = {};
                    $(tr).find('td').each((k, td) => {
                        if (headers[k]) {
                            rowData[headers[k]] = $(td).text().trim();
                        } else {
                            rowData[`Column${k}`] = $(td).text().trim();
                        }
                    });
                    if (Object.keys(rowData).length > 0) {
                        combinedData.push(rowData);
                    }
                });
            });
            if (combinedData.length > 0) {
                parsedData = combinedData;
                console.log(`Successfully parsed Splunk HTML (tables): ${filepath}`);
            } else {
                console.log(`No tables found or extracted from Splunk HTML: ${filepath}. Extracting raw text.`);
                rawText = $('body').text();
            }
        } else if (fileFormat === 'pdf') {
            const dataBuffer = await fsp.readFile(filepath);
            const pdfTextData = await pdfParse(dataBuffer);
            rawText = pdfTextData.text;
            console.log(`Successfully extracted raw text from Splunk PDF: ${filepath}`);

            try {
                const formData = new FormData();
                formData.append('pdf_file', new Blob([dataBuffer], { type: 'application/pdf' }), path.basename(filepath));

                const response = await fetch('http://localhost:5001/parse-pdf-tables', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Python service error: ${errorData.error}`);
                }

                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    parsedData = result.data.flat();
                    console.log(`Successfully extracted structured data from Splunk PDF via Python service: ${filepath}`);
                } else {
                    console.log(`Python service found no structured data in Splunk PDF: ${filepath}. Raw text still available.`);
                }
            } catch (pythonError) {
                console.warn(`Could not use Python PDF parsing service for ${filepath}: ${pythonError.message}. Falling back to raw text only.`);
            }
        } else {
            console.warn(`Unsupported Splunk report format: ${fileFormat}`);
        }
    } catch (error) {
        console.error(`Error parsing Splunk file ${filepath} (format: ${fileFormat}): ${error.message}`);
        throw new Error(`Failed to parse Splunk file (${fileFormat}): ${error.message}`);
    }
    return [parsedData, rawText];
}

module.exports = {
    parseJTL,
    parseSplunkReport
};
