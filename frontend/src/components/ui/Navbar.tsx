import React from 'react';
import UserProfile from './UserProfile';

const Navbar: React.FC = () => {
  return (
    <>
      {/* Desktop Navbar */}
      <nav 
        className="fixed top-4 left-1/2 transform -translate-x-1/2 border hidden md:block"
        style={{ zIndex: 1, borderRadius: '12px', width: '1160px', backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
      >
        <div className="px-6 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)',
                  animation: 'glow-pulse 2s infinite'
                }}
              />
              <h1 className="text-2xl font-bold text-gray-800">
                Superpod
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav 
        className="fixed top-4 left-4 right-4 border block md:hidden"
        style={{ zIndex: 1, borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.96)' }}
      >
        <div className="px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ 
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6), 0 0 16px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)',
                  animation: 'glow-pulse 2s infinite'
                }}
              /> 
              <h1 className="text-lg font-bold text-gray-800">
                Superpod
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar; 