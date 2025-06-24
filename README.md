# SuperPod - AI-Powered Podcast Discovery Platform

SuperPod is an AI-driven podcast discovery and consumption platform that uses local media files with AI-powered transcription and semantic search for personalized content exploration.

## Features

- **Local Media Storage**: Automatically processes media files dropped into storage
- **AI Transcription**: Uses Llama 4.0 for audio-to-text conversion with timestamped segments
- **Vector Search**: Semantic search through transcribed content using ChromaDB
- **Intelligent Chat-to-Play**: Say "play the startup funding part" for instant segment playback
- **Intent Recognition**: AI automatically detects playback requests and triggers audio
- **Contextual Responses**: Chat includes both conversation and playable segment recommendations
- **Real-time Processing**: File watcher automatically processes new media files
- **Personalized Recommendations**: AI-powered content suggestions based on listening history

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- shadcn/ui + Tailwind CSS for UI components
- React Router for navigation

### Backend
- Python 3.11 + FastAPI
- PostgreSQL with SQLAlchemy (async)
- ChromaDB for vector embeddings
- Llama 4.0 API for transcription and chat
- FFmpeg for audio processing
- Watchdog for file monitoring

## Quick Start

### Prerequisites
- Python 3.11+ and pip
- Node.js 18+ and npm
- PostgreSQL database
- FFmpeg installed on system
- Llama 4.0 API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superpod
   ```

2. **Set up Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Copy and configure environment
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the server
   python -m app.main
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

### Environment Configuration

#### Backend (.env)
```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost/superpod

# AI Services
LLAMA_API_KEY=your-llama-api-key-here
LLAMA_MODEL=llama-3.2-90b-text-preview

# File Storage
MEDIA_STORAGE_PATH=./data/media
CHROMADB_PATH=./data/chromadb
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Database Setup

1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE superpod;
   ```

2. Database tables will be created automatically on first run.

## Usage

### Adding Media Files

1. **Automatic Processing**: Drop media files (audio/video) into the `MEDIA_STORAGE_PATH` directory
2. **File Watcher**: The system automatically detects new files and:
   - Creates database records
   - Extracts audio (if video file)
   - Transcribes using Llama 4.0
   - Generates vector embeddings
   - Makes content searchable

### Supported File Types

- **Audio**: MP3, WAV, FLAC, OGG, M4A
- **Video**: MP4, AVI, MOV, WMV, MKV

### API Endpoints

The backend provides RESTful APIs for:
- **Authentication**: User registration and login
- **Media**: File listing, details, and transcriptions
- **Search**: Semantic search through transcribed content
- **Chat**: AI-powered conversations about content
- **Playback**: Session management and progress tracking

See [API_SPECIFICATION.md](./API_SPECIFICATION.md) for detailed documentation.

## Development

### Available Scripts

#### Backend
- `python -m app.main` - Start development server
- `python -m pytest` - Run tests
- `black app/` - Format code
- `isort app/` - Sort imports
- `mypy app/` - Type checking

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Project Structure

```
superpod/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   ├── types/           # TypeScript interfaces
│   │   └── ...
│   └── ...
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Core configuration
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   └── ...
│   └── requirements.txt
├── data/                    # Data storage
│   ├── media/              # Media files
│   └── chromadb/           # Vector database
├── docs/                   # Documentation
└── README.md
```

## Key Features

### Automatic Transcription Pipeline

1. **File Detection**: Watchdog monitors media directory
2. **Audio Extraction**: FFmpeg extracts audio from video files
3. **Transcription**: Llama 4.0 converts audio to timestamped text
4. **Vector Embeddings**: Generate semantic embeddings for search
5. **Database Storage**: Save transcriptions and metadata

### Semantic Search

- Vector similarity search using ChromaDB
- Natural language queries
- Content-based recommendations
- Contextual segment matching

### AI Chat Interface

- Ask questions about podcast content
- Get personalized recommendations
- Context-aware responses based on listening history
- Real-time conversation with transcribed content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg on your system
2. **Database connection errors**: Ensure PostgreSQL is running and connection string is correct
3. **Transcription failures**: Check Llama API key and quota
4. **File permission errors**: Ensure media directory is writable

### Logs

Check application logs for detailed error information:
- Backend logs: Console output with structured logging
- Frontend logs: Browser console