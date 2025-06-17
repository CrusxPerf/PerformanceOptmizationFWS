from flask import Flask, request, jsonify
import camelot
import pandas as pd
import os # For file operations
import tempfile # Added for temporary file handling
from werkzeug.utils import secure_filename # Added for secure filenames

app = Flask(__name__)

@app.route('/parse-pdf-tables', methods=['POST'])
def parse_pdf_tables():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No PDF file provided."}), 400

    pdf_file = request.files['pdf_file']

    if pdf_file.filename == '':
        return jsonify({"error": "No selected file."}), 400

    filename = secure_filename(pdf_file.filename)

    # Create a temporary file to save the uploaded PDF
    # NamedTemporaryFile handles unique naming and cleanup
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
            pdf_file.save(tmp_file.name)
            filepath = tmp_file.name

        # Use Camelot to extract tables
        tables = camelot.read_pdf(filepath, pages='all', flavor='stream')

        extracted_data = []
        for table in tables:
            df = table.df
            extracted_data.append(df.where(pd.notnull(df), None).to_dict(orient='records'))

        return jsonify({"data": extracted_data, "message": f"Extracted {len(tables)} tables."}), 200
    except Exception as e:
        print(f"Error processing PDF with Camelot: {e}") # Changed error message slightly for clarity
        return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 500 # Changed error message slightly
    finally:
        # Ensure the temporary PDF file is deleted
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(port=5001, debug=True)
