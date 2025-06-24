import React from 'react';

interface PodcastCardProps {
  title?: string;
  author?: string;
  rating?: number;
  duration?: string;
  isEmpty?: boolean;
  className?: string;
  imageUrl?: string;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ 
  title, 
  author, 
  rating, 
  duration, 
  isEmpty = false, 
  className = "",
  imageUrl = `https://picsum.photos/250/180?random=${Math.floor(Math.random() * 1000)}`
}) => {
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden ${className}`}
      style={{ 
        borderColor: '#e2e8f0',
        height: '240px',
        width: className?.includes('w-full') ? '100%' : '350px'
      }}
    >
      {!isEmpty ? (
        <>
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${imageUrl})`,
              backgroundColor: '#f7fafc'
            }}
          />
          
          {/* Dark Overlay for Text Readability at Bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-3 rounded-b-2xl"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.3) 90%, transparent 100%)'
            }}
          >
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-tight text-white">
                {title}
              </h3>
              <p className="text-xs text-gray-200">{author}</p>
              <div className="flex items-center space-x-1.5 text-xs text-gray-300">
                <div className="flex items-center space-x-0.5">
                  <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{rating}/5</span>
                </div>
                <span>•</span>
                <span>{duration}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50" style={{ borderColor: '#e2e8f0' }}>
          <div className="text-gray-400 text-xs">Empty</div>
        </div>
      )}
    </div>
  );
};

export default PodcastCard; 