import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { MediaFile, TranscriptionSegment, PlaybackAction } from '../types/api';

interface PlaybackContextType {
  // Current playback state
  currentFile: MediaFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSegment: TranscriptionSegment | null;
  
  // Actions
  playSegment: (fileId: string, segment: TranscriptionSegment) => Promise<void>;
  playFile: (file: MediaFile, startTime?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seekTo: (time: number) => void;
  
  // Audio element ref for direct control
  audioRef: React.RefObject<HTMLAudioElement>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}

interface PlaybackProviderProps {
  children: React.ReactNode;
}

export function PlaybackProvider({ children }: PlaybackProviderProps) {
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSegment, setCurrentSegment] = useState<TranscriptionSegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mock media files for demo
  const mockMediaFiles: { [key: string]: MediaFile } = {
    'file-1': {
      id: 'file-1',
      filename: 'startup-funding-podcast.mp3',
      title: 'Startup Funding Strategies',
      description: 'Discussion about venture capital and startup funding',
      duration: 3600,
      fileSize: 45000000,
      mimeType: 'audio/mpeg',
      transcriptionStatus: 'completed',
      topics: ['startups', 'funding', 'venture capital'],
      uploadedAt: '2024-01-15T10:00:00Z',
      streamUrl: '/api/media/files/file-1/stream',
    },
    'file-2': {
      id: 'file-2',
      filename: 'ai-future-podcast.mp3',
      title: 'The Future of AI',
      description: 'Expert panel on artificial intelligence trends',
      duration: 2700,
      fileSize: 32000000,
      mimeType: 'audio/mpeg',
      transcriptionStatus: 'completed',
      topics: ['AI', 'technology', 'future'],
      uploadedAt: '2024-01-16T14:30:00Z',
      streamUrl: '/api/media/files/file-2/stream',
    },
  };

  const playSegment = useCallback(async (fileId: string, segment: TranscriptionSegment) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get file info (in real app, this would be an API call)
      const file = mockMediaFiles[fileId];
      if (!file) {
        throw new Error('File not found');
      }

      setCurrentFile(file);
      setCurrentSegment(segment);

      // Set audio source if changed
      if (audioRef.current && audioRef.current.src !== file.streamUrl) {
        audioRef.current.src = file.streamUrl;
      }

      // Wait for audio to load if needed
      if (audioRef.current) {
        await new Promise<void>((resolve) => {
          if (audioRef.current!.readyState >= 2) {
            resolve();
          } else {
            const handleLoad = () => {
              audioRef.current!.removeEventListener('loadeddata', handleLoad);
              resolve();
            };
            audioRef.current!.addEventListener('loadeddata', handleLoad);
          }
        });

        // Seek to segment start time and play
        audioRef.current.currentTime = segment.startTime;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play segment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playFile = useCallback(async (file: MediaFile, startTime = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentFile(file);
      setCurrentSegment(null);

      if (audioRef.current) {
        audioRef.current.src = file.streamUrl;
        await new Promise<void>((resolve) => {
          if (audioRef.current!.readyState >= 2) {
            resolve();
          } else {
            const handleLoad = () => {
              audioRef.current!.removeEventListener('loadeddata', handleLoad);
              resolve();
            };
            audioRef.current!.addEventListener('loadeddata', handleLoad);
          }
        });

        audioRef.current.currentTime = startTime;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const value: PlaybackContextType = {
    currentFile,
    isPlaying,
    currentTime,
    duration,
    currentSegment,
    playSegment,
    playFile,
    pause,
    resume,
    seekTo,
    audioRef,
    isLoading,
    error,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />
    </PlaybackContext.Provider>
  );
}