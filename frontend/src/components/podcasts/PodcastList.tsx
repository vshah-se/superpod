import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { mockApiService } from '../../services/mockApi';
import type { MediaFile, Recommendation } from '../../types/api';
import { Play, Clock, Search, Tag } from 'lucide-react';

interface PodcastListProps {
  onPodcastSelect: (podcast: MediaFile) => void;
  selectedPodcast?: MediaFile | null;
}

export function PodcastList({ onPodcastSelect, selectedPodcast }: PodcastListProps) {
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

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const currentList = activeTab === 'recommended' 
    ? recommendations.map(r => r.file)
    : podcasts;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Podcast Library</CardTitle>
        
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading podcasts...</div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">No podcasts found</div>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {activeTab === 'recommended' && recommendations.map((recommendation) => {
                const podcast = recommendation.file;
                return (
                  <Card
                    key={podcast.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedPodcast?.id === podcast.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => onPodcastSelect(podcast)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">
                            {podcast.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {podcast.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(podcast.duration)}
                            </span>
                            <span>{formatFileSize(podcast.fileSize)}</span>
                            <span>{podcast.genre}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary">
                              {Math.round(recommendation.relevanceScore * 100)}% match
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {recommendation.reasoningText}
                            </span>
                          </div>

                          {podcast.topics && podcast.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {podcast.topics.slice(0, 3).map((topic, topicIndex) => (
                                <span
                                  key={topicIndex}
                                  className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                                >
                                  <Tag className="w-3 h-3" />
                                  {topic}
                                </span>
                              ))}
                              {podcast.topics.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{podcast.topics.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {activeTab === 'all' && podcasts.map((podcast) => (
                <Card
                  key={podcast.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedPodcast?.id === podcast.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onPodcastSelect(podcast)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">
                          {podcast.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {podcast.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(podcast.duration)}
                          </span>
                          <span>{formatFileSize(podcast.fileSize)}</span>
                          <span>{podcast.genre}</span>
                        </div>

                        {podcast.topics && podcast.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {podcast.topics.slice(0, 3).map((topic, topicIndex) => (
                              <span
                                key={topicIndex}
                                className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                              >
                                <Tag className="w-3 h-3" />
                                {topic}
                              </span>
                            ))}
                            {podcast.topics.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{podcast.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}