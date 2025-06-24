# SuperPod Frontend Service API Specification

## Overview

This document defines the API interface between the SuperPod frontend and the Python FastAPI backend service. All endpoints return JSON responses and use TypeScript interfaces for type safety.

## Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
```

## Authentication Endpoints

### POST /auth/login

User login with email/password

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

### POST /auth/register

User registration

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

### POST /auth/refresh

Refresh expired access token

```typescript
interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}
```

## User Profile Endpoints

### GET /user/profile

Get authenticated user's profile

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}
```

### GET /user/interests

Get user interests based on listening history

```typescript
interface UserInterests {
  topTopics: string[];
  favoriteGenres: string[];
  listeningHistory: MediaFile[];
  preferences: {
    averageListeningTime: number;
    preferredContentLength: 'short' | 'medium' | 'long';
    topicPreferences: string[];
  };
}
```

## Media File Endpoints

### GET /media/files

Get paginated list of media files

```typescript
interface MediaFilesParams {
  limit?: number;
  offset?: number;
  search?: string;
  topic?: string;
  genre?: string;
}

interface MediaFilesResponse {
  files: MediaFile[];
  total: number;
  limit: number;
  offset: number;
}
```

### GET /media/files/:fileId

Get specific media file details

```typescript
interface MediaFile {
  id: string;
  filename: string;
  title: string;
  description?: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transcription?: Transcription;
  topics: string[];
  genre?: string;
  uploadedAt: string;
  processedAt?: string;
  streamUrl: string;
}
```

### GET /media/files/:fileId/transcription

Get transcription for a specific media file

```typescript
interface Transcription {
  id: string;
  fileId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  language: string;
  confidence: number;
  createdAt: string;
}

interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker?: string;
}
```

### POST /media/files/:fileId/synopsis

Generate AI synopsis for media file

```typescript
interface SynopsisRequest {
  // No body required - uses authenticated user context
}

interface SynopsisResponse {
  synopsis: string;
  keyTopics: string[];
  relevanceScore: number;
  personalizedHighlights: string[];
  estimatedReadTime: number;
  transcriptHighlights: TranscriptionSegment[];
}
```

## Search Endpoints

### GET /search/semantic

Semantic search through transcriptions

```typescript
interface SemanticSearchParams {
  query: string;
  limit?: number;
  offset?: number;
  threshold?: number;
}

interface SemanticSearchResponse {
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

interface SearchResult {
  file: MediaFile;
  relevanceScore: number;
  matchedSegments: TranscriptionSegment[];
  context: string;
}
```

### GET /search/recommendations

Get personalized recommendations

```typescript
interface RecommendationsParams {
  limit?: number;
  basedOn?: string; // fileId to base recommendations on
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  reasoning: string;
}

interface Recommendation {
  file: MediaFile;
  reasoningText: string;
  relevanceScore: number;
  matchedInterests: string[];
}
```

## Chat Endpoints

### POST /chat/message

Send message to AI with context

```typescript
interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentFile?: string;
    currentTime?: number;
  };
}

interface ChatMessageResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  recommendations?: Recommendation[];
  relatedSegments?: TranscriptionSegment[];
  playbackAction?: PlaybackAction;
}

interface PlaybackAction {
  type: 'play_segment' | 'play_from_start';
  fileId: string;
  segment: TranscriptionSegment;
  intent: string;
}
```

### GET /chat/conversation/:conversationId

Get chat conversation history

```typescript
interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    recommendations?: Recommendation[];
    relatedSegments?: TranscriptionSegment[];
  };
}
```

## Playback Endpoints

### POST /playback/start

Start playback session

```typescript
interface PlaybackStartRequest {
  fileId: string;
  startTime?: number;
}

interface PlaybackStartResponse {
  sessionId: string;
  file: MediaFile;
  streamUrl: string;
  transcription?: Transcription;
}
```

### PUT /playback/sessions/:sessionId/progress

Update playback progress

```typescript
interface PlaybackProgressRequest {
  currentTime: number;
  duration: number;
}

interface PlaybackProgressResponse {
  success: boolean;
  currentSegment?: TranscriptionSegment;
}
```

### GET /playback/sessions/:sessionId/state

Get current playback state

```typescript
interface PlaybackState {
  sessionId: string;
  file: MediaFile;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentSegment?: TranscriptionSegment;
  lastUpdated: string;
}
```

## Admin/Processing Endpoints

### GET /admin/processing/status

Get processing queue status (admin only)

```typescript
interface ProcessingStatus {
  queueLength: number;
  processing: ProcessingJob[];
  completed: number;
  failed: number;
}

interface ProcessingJob {
  id: string;
  fileId: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}
```

### POST /admin/files/:fileId/reprocess

Reprocess a media file (admin only)

```typescript
interface ReprocessResponse {
  success: boolean;
  jobId: string;
}
```

## WebSocket Events

### /ws/processing

Real-time updates for file processing

```typescript
interface ProcessingUpdate {
  type: 'processing_started' | 'processing_progress' | 'processing_completed' | 'processing_failed';
  fileId: string;
  filename: string;
  progress?: number;
  error?: string;
  transcription?: Transcription;
}
```

## Error Handling

All endpoints return consistent error responses:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

Common error codes:

- `AUTH_REQUIRED`: Authentication required
- `TOKEN_EXPIRED`: Access token expired
- `VALIDATION_ERROR`: Request validation failed
- `FILE_NOT_FOUND`: Media file not found
- `TRANSCRIPTION_ERROR`: Transcription processing failed
- `STORAGE_ERROR`: File storage error
- `AI_SERVICE_ERROR`: Llama API error
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

## Rate Limiting

- Authentication endpoints: 10 requests per minute
- Chat endpoints: 30 requests per minute
- Media endpoints: 100 requests per minute
- Search endpoints: 50 requests per minute
- Playback endpoints: 200 requests per minute

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```