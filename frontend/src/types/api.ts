// API Types from API_SPECIFICATION.md

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface MediaFile {
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
  albumArt?: string;
}

export interface Transcription {
  id: string;
  fileId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  language: string;
  confidence: number;
  createdAt: string;
}

export interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentFile?: string;
    currentTime?: number;
  };
}

export interface ChatMessageResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  recommendations?: Recommendation[];
  relatedSegments?: TranscriptionSegment[];
  playbackAction?: PlaybackAction;
}

export interface PlaybackAction {
  type: 'play_segment' | 'play_from_start';
  fileId: string;
  segment: TranscriptionSegment;
  intent: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    recommendations?: Recommendation[];
    relatedSegments?: TranscriptionSegment[];
  };
}

export interface Recommendation {
  file: MediaFile;
  reasoningText: string;
  relevanceScore: number;
  matchedInterests: string[];
}

export interface SearchResult {
  file: MediaFile;
  relevanceScore: number;
  matchedSegments: TranscriptionSegment[];
  context: string;
}

export interface PlaybackState {
  sessionId: string;
  file: MediaFile;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentSegment?: TranscriptionSegment;
  lastUpdated: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}