# PDF Table Parser Service

This service provides an API to extract tables from PDF files using Camelot. It accepts a direct PDF file upload.

## Endpoints

### `/parse-pdf-tables` (POST)

Extracts tables from an uploaded PDF file.

**Request Body:**

- `pdf_file`: The PDF file to be parsed (sent as `multipart/form-data`).

**Response (Success - 200):**

```json
{
  "data": [
    // List of tables, where each table is a list of rows (dictionaries)
    // Example:
    // [
    //   {"column1": "value1", "column2": "value2"},
    //   {"column1": "value3", "column2": "value4"}
    // ],
    // ... more tables
  ],
  "message": "Extracted X tables."
}
```

**Response (Error - 400):**

```json
{
  "error": "No PDF file provided."
}
```

**Response (Error - 500):**

```json
{
  "error": "Failed to parse PDF with Camelot: <error_details>"
}
```

## Setup and Deployment

This service is a Flask application and can be run directly or containerized using Docker.

### Prerequisites

- Python 3.9+
- Docker (for containerized deployment)
- Ghostscript (must be installed on the system where the service runs, or in the Docker container)

### Local Development

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  **Install Ghostscript:**
    -   **Linux (Debian/Ubuntu):** `sudo apt-get install ghostscript`
    -   **macOS (using Homebrew):** `brew install ghostscript`
    -   **Windows:** Download and install from [Ghostscript downloads](https://www.ghostscript.com/releases/gsdnld.html). Ensure the installation's `bin` directory (containing `gswin64c.exe` or `gswin32c.exe`) is added to your system's PATH.

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Note: `camelot-py[cv]` includes OpenCV, which might have additional system dependencies on some platforms.*

4.  **Run the Flask application locally:**
    ```bash
    python app.py
    ```
    The service will be accessible at `http://localhost:5001`.

### Docker Deployment

1.  **Build the Docker image:**
    The Dockerfile already includes Ghostscript installation.
    ```bash
    docker build -t pdf-table-parser-service .
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -p 5001:5001 pdf-table-parser-service
    ```
    The service will be accessible at `http://localhost:5001` (or your Docker host's IP).

## Dependencies

-   `Flask`: For creating the API.
-   `camelot-py[cv]`: For parsing tables from PDF files. Requires Ghostscript. `[cv]` installs OpenCV dependencies needed by Camelot.
-   `pandas`: Used by Camelot for table manipulation.
-   `openpyxl`: Required by pandas for Excel export functionality (though not directly used in this basic service, Camelot or pandas might expect it).
-   `ghostscript`: External dependency required by Camelot for PDF processing.
-   `gunicorn`: WSGI HTTP Server for UNIX (used in Docker for production).

## Important Notes for Camelot

-   **Flavor:** The `app.py` currently uses `flavor='stream'`. You might need to change this to `flavor='lattice'` depending on the structure of the tables in your PDFs.
    -   `lattice`: For tables with clearly defined lines.
    -   `stream`: For tables separated by whitespace.
-   **Temporary Files:** The application saves the uploaded PDF temporarily to the `/tmp` directory (or `os.getenv('TEMP')` on Windows) for processing. Ensure this location is writable and has enough space. The temporary file is deleted after processing.
-   **Error Handling:** The service includes basic error handling for PDF parsing. Check the console logs for more detailed error messages from Camelot if issues occur.
-   **Dependencies for `camelot-py[cv]`:** Camelot with the `cv` extra (for OpenCV) can sometimes be tricky to install due to system dependencies for OpenCV (like `libgl1-mesa-glx` on Linux). The provided Dockerfile attempts to handle common cases for a Debian-based Python image. If you encounter issues locally, you might need to install additional system libraries for OpenCV. For example, on Ubuntu: `sudo apt-get install libopencv-dev python3-opencv`.
```
