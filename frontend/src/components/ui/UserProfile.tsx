import React from 'react';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = "" }) => {
  return (
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center ${className}`}
      style={{ borderColor: '#e2e8f0' }}
    >
      <svg className="w-6 h-6" fill="#4a5568" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default UserProfile; 