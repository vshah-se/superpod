import { useState } from 'react';
import { Button } from '../components/ui/button';
import { ChatInterface } from '../components/chat/ChatInterface';
import { PodcastGrid } from '../components/podcasts/PodcastGrid';
import { AudioPlayer } from '../components/player/AudioPlayer';
import { mockApiService } from '../services/mockApi';
import type { MediaFile, Recommendation } from '../types/api';
import { LogOut, User, MessageCircle } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [isChatVisible, setIsChatVisible] = useState(true);

  const handleLogout = async () => {
    await mockApiService.logout();
    onLogout();
  };

  const handleRecommendationSelect = (recommendation: Recommendation) => {
    // Handle recommendation selection if needed
    console.log('Recommendation selected:', recommendation);
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SuperPod</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered podcast discovery
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={isChatVisible ? "default" : "ghost"} 
              size="sm"
              onClick={toggleChat}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Podcast Grid */}
        <div className="flex-shrink-0 p-6 border-b">
          <PodcastGrid 
            onPodcastSelect={(podcast) => console.log('Podcast selected:', podcast)}
            onPodcastPlay={(podcast) => console.log('Podcast play:', podcast)}
          />
        </div>

        {/* Chat Interface */}
        {isChatVisible && (
          <div className="flex-1 min-h-0 border-b">
            <div className="h-full p-6">
              <ChatInterface
                onRecommendationSelect={handleRecommendationSelect}
              />
            </div>
          </div>
        )}

        {/* Audio Player */}
        <div className="flex-shrink-0 bg-card p-4">
          <AudioPlayer 
            onToggleChat={toggleChat}
            onStop={() => console.log('Stop playback')}
          />
        </div>
      </div>
    </div>
  );
}