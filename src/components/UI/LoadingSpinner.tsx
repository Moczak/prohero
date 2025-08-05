import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full border-t-green-500 border-r-green-500 border-b-green-200 border-l-green-200 animate-spin`}></div>
  );
};

export default LoadingSpinner;
