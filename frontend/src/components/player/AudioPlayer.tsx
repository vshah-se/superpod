import { useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { usePlayback } from '../../contexts/PlaybackContext';
import type { TranscriptionSegment } from '../../types/api';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize2,
  MessageCircle,
  Square,
  Loader2
} from 'lucide-react';
import { useState } from 'react';

interface AudioPlayerProps {
  onToggleChat?: () => void;
  onStop?: () => void;
}

export function AudioPlayer({ onToggleChat, onStop }: AudioPlayerProps) {
  const {
    currentFile,
    isPlaying,
    currentTime,
    duration,
    currentSegment,
    pause,
    resume,
    seekTo,
    audioRef,
    isLoading,
    error
  } = usePlayback();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock transcription segments for demo
  const mockSegments: TranscriptionSegment[] = currentFile ? [
    {
      id: '1',
      startTime: 0,
      endTime: 30,
      text: 'Welcome to today\'s episode where we dive deep into the world of entrepreneurship and startup funding strategies.',
      confidence: 0.95,
    },
    {
      id: '2', 
      startTime: 30,
      endTime: 75,
      text: 'Starting a business is one of the most challenging yet rewarding endeavors you can undertake in today\'s economy.',
      confidence: 0.92,
    },
    {
      id: '3',
      startTime: 75,
      endTime: 120,
      text: 'Today we\'ll explore the key strategies that successful entrepreneurs use to scale their businesses and attract investment.',
      confidence: 0.89,
    },
    {
      id: '4',
      startTime: 120,
      endTime: 180,
      text: 'When it comes to venture capital, timing and preparation are absolutely crucial for success.',
      confidence: 0.94,
    },
    {
      id: '5',
      startTime: 180,
      endTime: 240,
      text: 'Many founders make the mistake of seeking funding too early, before they have a solid product-market fit.',
      confidence: 0.91,
    },
  ] : [];

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onStop?.();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    if (!currentFile) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    seekTo(newTime);
  };

  const skip = (seconds: number) => {
    if (!currentFile) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const jumpToSegment = (segment: TranscriptionSegment) => {
    seekTo(segment.startTime);
  };

  // Find current segment based on playback time
  const getCurrentSegment = () => {
    return mockSegments.find(
      s => currentTime >= s.startTime && currentTime <= s.endTime
    ) || null;
  };

  const activeSegment = getCurrentSegment();

  if (!currentFile) {
    return (
      <Card className="h-32">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Select a podcast to start listening</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className={isExpanded ? 'h-96' : 'h-auto'}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Podcast Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1 line-clamp-2">
                  {currentFile.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {currentFile.description}
                </p>
                {currentSegment && (
                  <div className="mt-2 p-2 bg-accent rounded-md">
                    <p className="text-xs font-medium text-accent-foreground">
                      🎯 Playing segment from chat
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleChat}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div
                className="h-2 bg-secondary rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => skip(-15)}
                  disabled={isLoading}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={togglePlay}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopPlayback}
                  disabled={isLoading}
                >
                  <Square className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => skip(15)}
                  disabled={isLoading}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Current Segment */}
            {activeSegment && (
              <Card className="bg-accent">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-1">Current Segment</p>
                  <p className="text-sm">{activeSegment.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(activeSegment.startTime)} - {formatTime(activeSegment.endTime)}
                    {activeSegment.confidence && (
                      <span className="ml-2">• {Math.round(activeSegment.confidence * 100)}% confident</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Expanded Transcript */}
            {isExpanded && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Transcript</h4>
                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-3 space-y-2">
                    {mockSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          activeSegment?.id === segment.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => jumpToSegment(segment)}
                      >
                        <p className="text-sm">{segment.text}</p>
                        <p className={`text-xs mt-1 ${
                          activeSegment?.id === segment.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                          {segment.confidence && (
                            <span className="ml-2">• {Math.round(segment.confidence * 100)}% confident</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}