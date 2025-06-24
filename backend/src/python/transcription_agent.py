"""
Transcription Agent for SuperPod AI Agent System
Handles audio file transcription using OpenAI Whisper API
"""
from openai import OpenAI
from pathlib import Path
from typing import Dict, Any, Optional
import json
from datetime import datetime
import os

class TranscriptionAgent:
    """Agent responsible for transcribing audio files to text"""
    
    def __init__(self):
        self.client = None
        self.model = os.getenv("OPENAI_MODEL", "whisper-1")
        # Set up default directories
        self.base_dir = Path(__file__).parent.parent.parent.parent  # Go up to project root
        self.audio_files_dir = self.base_dir / "audio_files"
        self.transcriptions_dir = self.base_dir / "transcriptions"
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize OpenAI client"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print("Error: OPENAI_API_KEY not found in environment")
                raise ValueError("OPENAI_API_KEY not set")
            self.client = OpenAI(api_key=api_key)
        except ValueError as e:
            print(f"Error initializing OpenAI client: {e}")
            raise e
    
    def get_audio_files(self):
        """Get list of available audio files"""
        audio_files = []
        if self.audio_files_dir.exists():
            for file in self.audio_files_dir.iterdir():
                if file.is_file() and file.suffix.lower() in ['.mp3', '.wav', '.m4a', '.flac', '.ogg']:
                    audio_files.append({
                        'name': file.name,
                        'path': str(file),
                        'size': file.stat().st_size
                    })
        return audio_files
    
    def process(self, audio_file_path: str, output_dir: str = None) -> bool:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: Path to the audio file
            output_dir: Directory to save the transcript (defaults to transcriptions folder)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if output_dir is None:
            output_dir = str(self.transcriptions_dir)
        
        if not self._validate_prerequisites():
            return False
        
        audio_path = Path(audio_file_path)
        if not audio_path.exists():
            print(f"Error: File not found: {audio_file_path}")
            return False
        
        # Get file info
        file_size = audio_path.stat().st_size
        file_size_mb = file_size / (1024 * 1024)
        
        # Check file size
        max_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
        if file_size_mb > max_size_mb:
            print(f"Error: File too large: {file_size_mb:.1f}MB (max: {max_size_mb}MB)")
            return False
        
        print(f"Starting transcription of {audio_path.name} ({file_size_mb:.1f}MB)")
        
        try:
            # Transcribe audio
            with open(audio_path, "rb") as audio_file:
                response = self.client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language=os.getenv("LANGUAGE", "en"),
                    response_format=os.getenv("RESPONSE_FORMAT", "verbose_json"),
                    timestamp_granularities=[os.getenv("TIMESTAMP_GRANULARITY", "segment")],
                    temperature=float(os.getenv("TEMPERATURE", "0.0"))
                )
            
            # Process and save results
            transcript_data = self._process_response(response, audio_path)
            output_file = Path(output_dir) / f"{audio_path.stem}_transcript.json"
            
            if self._save_result(transcript_data, str(output_file)):
                print(f"Success: Transcribed {len(transcript_data.get('segments', []))} segments, duration: {transcript_data['metadata'].get('duration', 0)}s, saved to {output_file}")
                return True
            
            return False
            
        except Exception as e:
            error_type = type(e).__name__
            if "AuthenticationError" in error_type or "authentication" in str(e).lower():
                print("Error: Authentication Error: Invalid OpenAI API key")
            elif "RateLimitError" in error_type or "rate limit" in str(e).lower():
                print("Error: Rate Limit Error: Too many requests. Please wait and try again.")
            elif "APIError" in error_type:
                print(f"Error: OpenAI API Error: {e}")
            else:
                print(f"Error: Transcription Error: {e}")
            return False
    
    def _process_response(self, response, audio_path: Path) -> Dict[str, Any]:
        """Process the OpenAI response into our standard format"""
        
        # Create base transcript data
        transcript_data = {
            "metadata": {
                "audio_file": str(audio_path),
                "language": getattr(response, 'language', os.getenv("LANGUAGE", "en")),
                "duration": getattr(response, 'duration', None),
                "model": self.model,
                "timestamp_granularities": [os.getenv("TIMESTAMP_GRANULARITY", "segment")],
                "processed_at": datetime.now().isoformat()
            },
            "full_text": response.text,
            "segments": []
        }
        
        # Process segments if available
        if hasattr(response, 'segments') and response.segments:
            for i, segment in enumerate(response.segments):
                segment_data = {
                    "id": f"{audio_path.stem}_segment_{i}",
                    "start_ms": int(segment.start * 1000),
                    "end_ms": int(segment.end * 1000),
                    "start_s": segment.start,
                    "end_s": segment.end,
                    "duration_ms": int((segment.end - segment.start) * 1000),
                    "text": segment.text.strip(),
                    "segment_index": i
                }
                transcript_data["segments"].append(segment_data)
        
        return transcript_data
    
    def _save_result(self, data: Dict[str, Any], output_file: str) -> bool:
        """Save processing result to JSON file"""
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Add metadata
            data["metadata"] = data.get("metadata", {})
            data["metadata"].update({
                "agent": "TranscriptionAgent",
                "agent_type": "transcription",
                "model": self.model,
                "provider": "OpenAI",
                "processed_at": datetime.now().isoformat(),
                "version": "1.0.0"
            })
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving result: {e}")
            return False
    
    def _validate_prerequisites(self) -> bool:
        """Validate that the agent can run (API keys, etc.)"""
        required_vars = ["OPENAI_API_KEY"]
        missing_vars = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"Error: Missing required environment variables: {missing_vars}")
            return False
        
        return True
    
    def batch_process(self, audio_files: list, output_dir: str = "transcripts") -> Dict[str, bool]:
        """
        Process multiple audio files
        
        Args:
            audio_files: List of audio file paths
            output_dir: Directory to save transcripts
            
        Returns:
            Dict mapping file paths to success status
        """
        results = {}
        
        for audio_file in audio_files:
            print(f"\nProcessing: {audio_file}")
            results[audio_file] = self.process(audio_file, output_dir)
        
        # Print summary
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        print(f"\nBatch processing complete: {successful}/{total} files processed successfully")
        
        return results
    
    