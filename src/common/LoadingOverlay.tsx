import React from 'react';
import { Spin } from 'antd';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message = 'Loading...',
  transparent = false,
}) => {
  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300
        ${transparent ? 'bg-transparent' : 'bg-white/40 backdrop-blur-sm'}
      `}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <Spin size="large" tip={message} />
      </div>
    </div>
  );
};

export default LoadingOverlay;
