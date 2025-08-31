import React from 'react';

interface MediaErrorScreenProps {
  errorMessage: string | null;
  onRetry: () => void;
}

const ErrorIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const MediaErrorScreen: React.FC<MediaErrorScreenProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex items-center justify-center z-20" role="alertdialog" aria-labelledby="error-title">
      <div className="w-full max-w-lg bg-gray-800 rounded-lg p-8 shadow-xl text-center animate-fade-in-down">
        <ErrorIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 id="error-title" className="text-2xl font-bold text-white mb-3">Media Access Error</h2>
        <p className="text-gray-300 mb-6">
          {errorMessage || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={onRetry}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-transform transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default MediaErrorScreen;
