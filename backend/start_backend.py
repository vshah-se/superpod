#!/usr/bin/env python3
"""
Startup script for SuperPod FastAPI backend
"""
import uvicorn
import sys
from pathlib import Path

# Add the src/python directory to the Python path
src_path = Path(__file__).parent / "src" / "python"
sys.path.insert(0, str(src_path))

if __name__ == "__main__":
    print("Starting SuperPod FastAPI Backend...")
    print("API will be available at: http://localhost:8000")
    print("Interactive docs at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 