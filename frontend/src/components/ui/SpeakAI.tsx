import React from 'react';

interface SpeakAIProps {
  query?: string;
  className?: string;
  onQueryChange?: (query: string) => void;
}

const SpeakAI: React.FC<SpeakAIProps> = ({ 
  query = "Show me podcasts about AI", 
  className = "",
  onQueryChange 
}) => {
  return (
    <div className={className}>
      <div 
        className="rounded-2xl border-2 p-6 flex items-center space-x-4"
        style={{ 
          backgroundColor: '#f7fafc', 
          borderColor: '#e2e8f0'
        }}
      >
        <div style={{ color: '#718096' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </div>
        <span className="text-lg font-medium" style={{ color: '#2d3748' }}>
          {query}
        </span>
      </div>
    </div>
  );
};

export default SpeakAI; 