import React from 'react';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message = 'Loading..',
  transparent = false,
}) => {
  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        transparent ? 'bg-transparent' : 'bg-white/40 backdrop-blur-sm'
      }`}
    >
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-14 w-14 text-blue-600 mb-3 drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <p className="text-blue-700 font-semibold text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
