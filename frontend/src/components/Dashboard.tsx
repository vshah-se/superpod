import React, { useState } from 'react';
import PodcastCard from './ui/PodcastCard';
import Navbar from './ui/Navbar';
import MediaPlayer from './ui/MediaPlayer';
import AIButton from './ui/AIButton';
import PodcastPage from './PodcastPage';
import podcastData from '../assets/data_storage.json';

interface PodcastData {
  id: number;
  title?: string;
  author?: string;
  rating?: number;
  duration?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  isEmpty?: boolean;
}

const Dashboard: React.FC = () => {
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastData | null>(null);

  // Use data from JSON file
  const podcastCards: PodcastData[] = podcastData;

  const handleCardClick = (podcast: PodcastData) => {
    if (!podcast.isEmpty) {
      setSelectedPodcast(podcast);
    }
  };

  const handleBackToDashboard = () => {
    setSelectedPodcast(null);
  };

  // If a podcast is selected, show the podcast page
  if (selectedPodcast) {
    return (
      <PodcastPage
        title={selectedPodcast.title}
        author={selectedPodcast.author}
        rating={selectedPodcast.rating}
        duration={selectedPodcast.duration}
        description={selectedPodcast.description}
        imageUrl={selectedPodcast.imageUrl}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Main Content */}
      <div className="p-4" style={{ paddingBottom: '200px' }}>
        <div className="max-w-6xl mx-auto" style={{ paddingTop: '100px' }}>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4 justify-items-center">
            {podcastCards.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card)}>
                <PodcastCard
                  title={card.title}
                  author={card.author}
                  rating={card.rating}
                  duration={card.duration}
                  isEmpty={card.isEmpty}
                  imageUrl={card.imageUrl}
                  className="cursor-pointer hover:scale-102 transition-transform duration-200"
                />
              </div>
            ))}
          </div>

          {/* Mobile Grid */}
          <div className="block md:hidden grid grid-cols-1 gap-4 px-4">
            {podcastCards.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card)}>
                <PodcastCard
                  title={card.title}
                  author={card.author}
                  rating={card.rating}
                  duration={card.duration}
                  isEmpty={card.isEmpty}
                  imageUrl={card.imageUrl}
                  className="cursor-pointer hover:scale-102 transition-transform duration-200 w-full"
                />
              </div>
            ))}
          </div>
          
          {/* Footer Credits */}
          <div className="text-center mt-12 mb-8">
            <p className="text-gray-600 text-sm" style={{ opacity: 0.7 }}>
              Built by Superpod team - Nand, Vishals2nd, Saptak, Jyrgal at Llama 4 Hackaton Seattle
            </p>
          </div>
        </div>
      </div>

      <AIButton />
      <MediaPlayer />
    </div>
  );
};

export default Dashboard; 