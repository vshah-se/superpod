import React from 'react';
import Navbar from './ui/Navbar';
import MediaPlayer from './ui/MediaPlayer';
import AIButton from './ui/AIButton';

interface PodcastPageProps {
  title?: string;
  author?: string;
  rating?: number;
  duration?: string;
  description?: string;
  imageUrl?: string;
  onBack?: () => void;
}

const PodcastPage: React.FC<PodcastPageProps> = ({
  title = "Podcast Title",
  author = "Author Name",
  rating = 4.5,
  duration = "25 min",
  description = "An insightful exploration of artificial intelligence and its impact on our daily lives. Join us as we dive deep into the latest developments in AI technology and discuss what the future holds for humanity in an AI-driven world.",
  imageUrl = "https://picsum.photos/400/300",
  onBack
}) => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Main Content */}
      <div className="p-4" style={{ paddingBottom: '200px' }}>
        <div className="max-w-4xl mx-auto" style={{ paddingTop: '100px' }}>
          
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          {/* Desktop Podcast Layout - Image Left, Info Right */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8 hidden md:block">
            <div className="flex h-96">
              {/* Left Side - Podcast Image */}
              <div className="w-80 flex-shrink-0 bg-gray-100">
                <img 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover rounded-l-2xl"
                />
              </div>
              
              {/* Right Side - Podcast Info */}
              <div className="flex-1 p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
                <p className="text-lg text-gray-600 mb-4">by {author}</p>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{rating}/5</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{duration}</span>
                </div>

                <div className="mb-6">
                  <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span className="font-medium text-sm">Play Episode</span>
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Podcast Layout - Image Top, Info Bottom */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8 block md:hidden mx-4">
            {/* Top - Podcast Image */}
            <div className="h-48 bg-gray-100">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            </div>
            
            {/* Bottom - Podcast Info */}
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-800 mb-2">{title}</h1>
              <p className="text-base text-gray-600 mb-4">by {author}</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-gray-700 font-medium">{rating}/5</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{duration}</span>
              </div>

              <div className="mb-6">
                <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 w-full justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span className="font-medium text-sm">Play Episode</span>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AIButton />
      <MediaPlayer />
    </div>
  );
};

export default PodcastPage; 