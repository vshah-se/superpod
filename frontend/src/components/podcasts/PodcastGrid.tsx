import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { mockApiService } from '../../services/mockApi';
import type { MediaFile, Recommendation } from '../../types/api';
import { Play, Search, Clock } from 'lucide-react';

interface PodcastGridProps {
  onPodcastSelect: (podcast: MediaFile) => void;
  onPodcastPlay: (podcast: MediaFile) => void;
  selectedPodcast?: MediaFile | null;
  isPlaying: boolean;
}

export function PodcastGrid({ onPodcastSelect, onPodcastPlay, selectedPodcast, isPlaying }: PodcastGridProps) {
  const [podcasts, setPodcasts] = useState<MediaFile[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('recommended');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const [mediaResponse, recsResponse] = await Promise.all([
        mockApiService.getMediaFiles({ limit: 20 }),
        mockApiService.getRecommendations(),
      ]);
      
      setPodcasts(mediaResponse.files);
      setRecommendations(recsResponse);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await mockApiService.searchContent(searchQuery);
      setPodcasts(results.map(r => r.file));
      setActiveTab('all');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const currentList = activeTab === 'recommended' 
    ? recommendations.map(r => r.file)
    : podcasts;

  // If playing, show only the current podcast's album art
  if (isPlaying && selectedPodcast) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="relative group mb-4">
            <img
              src={selectedPodcast.albumArt || '/api/placeholder/400/400'}
              alt={selectedPodcast.title}
              className="w-80 h-80 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/400x400/6366f1/white?text=${encodeURIComponent(selectedPodcast.title.slice(0, 2))}`;
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {selectedPodcast.title}
          </h2>
          <p className="text-muted-foreground mb-2">
            {selectedPodcast.description}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(selectedPodcast.duration)}</span>
            <span>•</span>
            <span>{selectedPodcast.genre}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} variant="outline" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === 'recommended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('recommended')}
          >
            Recommended ({recommendations.length})
          </Button>
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
          >
            All Podcasts ({podcasts.length})
          </Button>
        </div>
      </div>

      {/* Podcast Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading podcasts...</div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">No podcasts found</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentList.map((podcast) => {
            const recommendation = activeTab === 'recommended' 
              ? recommendations.find(r => r.file.id === podcast.id)
              : null;

            return (
              <div key={podcast.id} className="space-y-2">
                <div className="relative group cursor-pointer">
                  <img
                    src={podcast.albumArt || '/api/placeholder/200/200'}
                    alt={podcast.title}
                    className="w-full aspect-square object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/200x200/6366f1/white?text=${encodeURIComponent(podcast.title.slice(0, 2))}`;
                    }}
                    onClick={() => onPodcastSelect(podcast)}
                  />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPodcastPlay(podcast);
                      }}
                    >
                      <Play className="w-6 h-6" />
                    </Button>
                  </div>

                  {recommendation && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {Math.round(recommendation.relevanceScore * 100)}%
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {podcast.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(podcast.duration)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {podcast.genre}
                  </p>
                  
                  {recommendation && (
                    <p className="text-xs text-primary font-medium">
                      {recommendation.reasoningText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}