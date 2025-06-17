# Dockerfile for pdf-parser-service

# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install Ghostscript, a dependency for Camelot
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Using --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Command to run the Flask application
# Using gunicorn for a production-ready server, though flask run is fine for dev
# CMD ["flask", "run", "--host=0.0.0.0", "--port=5001"]
# For production, consider Gunicorn:
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
