FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all code and artifacts
COPY . .

# Ensure NLTK data is downloaded (though main.py does this on startup, 
# it's better to bake it in for faster startup if possible, 
# but main.py handles it dynamically).

EXPOSE 7860
# HF Spaces use port 7860 by default for some SDKs, but for Docker we can use any
# but HF prefers 7860.

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
