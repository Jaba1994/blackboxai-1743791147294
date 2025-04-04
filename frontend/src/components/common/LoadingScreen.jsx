import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        
        {/* Loading text */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900">Loading</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we prepare your content...</p>
        </div>

        {/* Progress bar (optional) */}
        <div className="mt-6 w-64 mx-auto">
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full w-1/2 animate-pulse"></div>
          </div>
        </div>

        {/* Loading messages (optional) */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 animate-pulse">
            Initializing application...
          </p>
        </div>
      </div>

      {/* Background pattern (optional) */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${getComputedStyle(document.documentElement).getPropertyValue('--color-primary')} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;