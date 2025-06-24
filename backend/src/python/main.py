from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from pathlib import Path

from LlamaNodeConnector import LlamaNodeConnector
from youtube_service import YouTubeService
from audio_downloader import AudioDownloader
from ingestion_pipeline import IngestionPipeline

app = FastAPI(title="SuperPod API", description="AI-powered podcast discovery platform")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio serving
audio_dir = Path(__file__).parent / "audio_files"
if audio_dir.exists():
    app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Pydantic models for request/response validation
class ChatMessage(BaseModel):
    message: str
    file_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    segments: Optional[List[dict]] = None

class Podcast(BaseModel):
    id: str
    title: str
    file_path: str
    summary: Optional[str] = None
    duration: Optional[str] = None

class YouTubePodcast(BaseModel):
    video_id: str
    title: str
    description: str
    channel_title: str
    published_at: str
    thumbnail_url: str
    youtube_url: str

class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5

class DownloadRequest(BaseModel):
    video_id: str
    start_time: Optional[int] = 0
    duration: Optional[int] = 300  # 5 minutes default

class DownloadedSegment(BaseModel):
    video_id: str
    start_time: int
    duration: int
    file_path: str
    file_size: int
    filename: str

class ProcessingRequest(BaseModel):
    video_id: str
    start_time: Optional[int] = 0
    duration: Optional[int] = 300
    use_whisper_api: Optional[bool] = True

class PipelineStatus(BaseModel):
    pipeline_id: str
    transcript_exists: bool
    summary_exists: bool
    recommendations_exists: bool
    segments_count: Optional[int] = None
    language: Optional[str] = None

# Initialize services
llama_connector = LlamaNodeConnector()
youtube_service = YouTubeService(api_key="AIzaSyDErNgVgBG0I7AtP8NoMWTeRYqBtUZbEuA")
audio_downloader = AudioDownloader()
ingestion_pipeline = IngestionPipeline()

# Store for background task status
processing_tasks = {}

@app.get("/")
async def root():
    return {"message": "SuperPod API is running"}

@app.get("/podcasts", response_model=List[Podcast])
async def get_podcasts():
    """Get all available podcasts with metadata"""
    podcasts = []
    audio_files_dir = Path(__file__).parent / "audio_files"
    summaries_dir = Path(__file__).parent / "summaries"
    
    if not audio_files_dir.exists():
        return podcasts
    
    for audio_file in audio_files_dir.glob("*.mp3"):
        podcast_id = audio_file.stem
        title = f"Podcast {podcast_id.replace('audio_', '')}"
        
        # Try to get summary if available
        summary = None
        summary_file = summaries_dir / f"{podcast_id}_transcript_summary.json"
        if summary_file.exists():
            try:
                with open(summary_file, 'r') as f:
                    summary_data = json.load(f)
                    summary = summary_data.get('summary', '')
            except:
                pass
        
        podcasts.append(Podcast(
            id=podcast_id,
            title=title,
            file_path=f"/audio/{audio_file.name}",
            summary=summary,
            duration="Unknown"
        ))
    
    return podcasts

@app.get("/categories")
async def get_categories():
    """Get available podcast categories"""
    return {
        "categories": youtube_service.get_available_categories()
    }

@app.get("/categories/{category}/podcasts", response_model=List[YouTubePodcast])
async def get_category_podcasts(category: str):
    """Get curated podcasts for a specific category"""
    try:
        videos = youtube_service.get_category_podcasts(category)
        return [YouTubePodcast(**video) for video in videos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching category podcasts: {str(e)}")

@app.post("/search/podcasts", response_model=List[YouTubePodcast])
async def search_podcasts(search_request: SearchRequest):
    """Search for podcasts on YouTube"""
    try:
        videos = youtube_service.search_podcasts(
            query=search_request.query,
            max_results=search_request.max_results
        )
        return [YouTubePodcast(**video) for video in videos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching podcasts: {str(e)}")

@app.get("/youtube/{video_id}/details")
async def get_youtube_video_details(video_id: str):
    """Get detailed information about a YouTube video"""
    try:
        details = youtube_service.get_video_details(video_id)
        if not details:
            raise HTTPException(status_code=404, detail="Video not found")
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching video details: {str(e)}")

@app.post("/download/audio")
async def download_audio_segment(download_request: DownloadRequest):
    """Download a 5-minute audio segment from YouTube video"""
    try:
        result = audio_downloader.download_audio_segment(
            video_id=download_request.video_id,
            start_time=download_request.start_time,
            duration=download_request.duration
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to download audio segment")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading audio: {str(e)}")

@app.get("/downloads", response_model=List[DownloadedSegment])
async def get_downloaded_segments():
    """Get list of all downloaded audio segments"""
    try:
        segments = audio_downloader.list_downloaded_segments()
        return [DownloadedSegment(**segment) for segment in segments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing downloads: {str(e)}")

@app.get("/downloads/{video_id}/{start_time}/{duration}")
async def serve_downloaded_audio(video_id: str, start_time: int, duration: int):
    """Serve a downloaded audio segment"""
    try:
        filename = f"{video_id}_{start_time}_{duration}.mp3"
        file_path = audio_downloader.download_dir / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Audio segment not found")
        
        return FileResponse(
            path=str(file_path),
            media_type="audio/mpeg",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio: {str(e)}")

@app.delete("/downloads/cleanup")
async def cleanup_downloads():
    """Clean up old downloads to save space"""
    try:
        audio_downloader.cleanup_old_downloads()
        return {"message": "Cleanup completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")

# New Ingestion Pipeline Endpoints

async def run_processing_pipeline(pipeline_id: str, processing_request: ProcessingRequest):
    """Background task for processing pipeline"""
    try:
        processing_tasks[pipeline_id] = {"status": "processing", "progress": "Starting..."}
        
        result = await ingestion_pipeline.process_youtube_video(
            video_id=processing_request.video_id,
            start_time=processing_request.start_time,
            duration=processing_request.duration,
            use_whisper_api=processing_request.use_whisper_api
        )
        
        processing_tasks[pipeline_id] = {"status": "completed", "result": result}
        
    except Exception as e:
        processing_tasks[pipeline_id] = {"status": "failed", "error": str(e)}

@app.post("/process/youtube")
async def process_youtube_video(processing_request: ProcessingRequest, background_tasks: BackgroundTasks):
    """Process a YouTube video through the complete AI pipeline"""
    pipeline_id = f"{processing_request.video_id}_{processing_request.start_time}_{processing_request.duration}"
    
    # Check if already processing
    if pipeline_id in processing_tasks and processing_tasks[pipeline_id]["status"] == "processing":
        return {"message": "Already processing", "pipeline_id": pipeline_id}
    
    # Start background processing
    background_tasks.add_task(run_processing_pipeline, pipeline_id, processing_request)
    processing_tasks[pipeline_id] = {"status": "processing", "progress": "Queued..."}
    
    return {
        "message": "Processing started",
        "pipeline_id": pipeline_id,
        "status_url": f"/process/status/{pipeline_id}"
    }

@app.get("/process/status/{pipeline_id}")
async def get_processing_status(pipeline_id: str):
    """Get status of a processing pipeline"""
    if pipeline_id not in processing_tasks:
        # Check if pipeline exists in file system
        status = ingestion_pipeline.get_pipeline_status(pipeline_id)
        if status:
            return {"status": "completed", "pipeline_status": status}
        else:
            raise HTTPException(status_code=404, detail="Pipeline not found")
    
    return processing_tasks[pipeline_id]

@app.get("/process/list", response_model=List[PipelineStatus])
async def list_processed_content():
    """List all processed content"""
    try:
        content = ingestion_pipeline.list_processed_content()
        return [PipelineStatus(**item) for item in content]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing processed content: {str(e)}")

@app.get("/process/{pipeline_id}/transcript")
async def get_pipeline_transcript(pipeline_id: str):
    """Get transcript for a processed pipeline"""
    try:
        transcript_file = ingestion_pipeline.transcriptions_dir / f"{pipeline_id}_transcript.json"
        if not transcript_file.exists():
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        with open(transcript_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transcript: {str(e)}")

@app.get("/process/{pipeline_id}/summary")
async def get_pipeline_summary(pipeline_id: str):
    """Get summary for a processed pipeline"""
    try:
        summary_file = ingestion_pipeline.summaries_dir / f"{pipeline_id}_summary.json"
        if not summary_file.exists():
            raise HTTPException(status_code=404, detail="Summary not found")
        
        with open(summary_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading summary: {str(e)}")

@app.get("/process/{pipeline_id}/recommendations")
async def get_pipeline_recommendations(pipeline_id: str):
    """Get recommendations for a processed pipeline"""
    try:
        recommendations_file = ingestion_pipeline.recommendations_dir / f"{pipeline_id}_recommendations.json"
        if not recommendations_file.exists():
            raise HTTPException(status_code=404, detail="Recommendations not found")
        
        with open(recommendations_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading recommendations: {str(e)}")

@app.get("/process/{pipeline_id}/reasoning-recommendations")
async def get_pipeline_reasoning_recommendations(pipeline_id: str):
    """Get reasoning-based recommendations for a processed pipeline"""
    try:
        reasoning_file = ingestion_pipeline.recommendations_dir / f"{pipeline_id}_reasoning_recommendations.json"
        if not reasoning_file.exists():
            raise HTTPException(status_code=404, detail="Reasoning recommendations not found")
        
        with open(reasoning_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading reasoning recommendations: {str(e)}")

@app.get("/process/{pipeline_id}/analysis")
async def get_pipeline_deep_analysis(pipeline_id: str):
    """Get deep content analysis for a processed pipeline"""
    try:
        reasoning_file = ingestion_pipeline.recommendations_dir / f"{pipeline_id}_reasoning_recommendations.json"
        if not reasoning_file.exists():
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        with open(reasoning_file, 'r') as f:
            data = json.load(f)
            return data.get('deep_analysis', {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading analysis: {str(e)}")

@app.delete("/process/{pipeline_id}")
async def delete_pipeline_data(pipeline_id: str):
    """Delete all data for a specific pipeline"""
    try:
        removed_count = ingestion_pipeline.cleanup_pipeline_data(pipeline_id)
        
        # Also remove reasoning recommendations
        reasoning_file = ingestion_pipeline.recommendations_dir / f"{pipeline_id}_reasoning_recommendations.json"
        if reasoning_file.exists():
            reasoning_file.unlink()
            removed_count += 1
        
        # Also remove from processing tasks
        if pipeline_id in processing_tasks:
            del processing_tasks[pipeline_id]
        
        return {"message": f"Removed {removed_count} files for pipeline {pipeline_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting pipeline data: {str(e)}")

@app.post("/chat/message", response_model=ChatResponse)
async def chat_message(message: ChatMessage):
    """Process chat messages through Q&A agent"""
    try:
        # Format the request to include file context if provided
        if message.file_id:
            # Include file context in the message for the workflow orchestrator
            formatted_message = f"Context: audio_{message.file_id}. {message.message}"
        else:
            formatted_message = message.message
            
        response = llama_connector.process_client_request(formatted_message)
        
        # Handle response formatting
        if isinstance(response, str):
            try:
                response_data = json.loads(response)
                return ChatResponse(
                    response=response_data.get('response', response),
                    segments=response_data.get('segments', [])
                )
            except json.JSONDecodeError:
                return ChatResponse(response=response)
        else:
            # Handle dict response from workflow orchestrator
            if isinstance(response, dict):
                if response.get('source') == 'workflow_orchestrator':
                    result = response.get('result', {})
                    if isinstance(result, dict):
                        answer = result.get('answer', str(result))
                        return ChatResponse(
                            response=answer,
                            segments=result.get('segments', [])
                        )
                    else:
                        return ChatResponse(response=str(result))
                else:
                    return ChatResponse(
                        response=str(response),
                        segments=response.get('segments', [])
                    )
            else:
                return ChatResponse(
                    response=str(response),
                    segments=getattr(response, 'segments', [])
                )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")

@app.get("/audio/{file_id}")
async def get_audio(file_id: str):
    """Serve audio files"""
    audio_file = Path(__file__).parent / "audio_files" / f"{file_id}.mp3"
    
    if not audio_file.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=str(audio_file),
        media_type="audio/mpeg",
        filename=f"{file_id}.mp3"
    )

@app.get("/transcript/{file_id}")
async def get_transcript(file_id: str):
    """Get transcription data for audio file"""
    transcript_file = Path(__file__).parent / "transcriptions" / f"{file_id}_transcript.json"
    
    if not transcript_file.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    try:
        with open(transcript_file, 'r') as f:
            transcript_data = json.load(f)
        return transcript_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transcript: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 