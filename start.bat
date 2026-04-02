cd Backend
start "Backend" uvicorn main:app --port 8000
cd ../Frontend
start "Frontend" npm run dev