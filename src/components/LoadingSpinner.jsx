import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  text = '',
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;



















