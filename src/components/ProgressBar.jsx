import React from 'react';

const ProgressBar = ({ 
  progress = 0, 
  total = 100, 
  showPercentage = true, 
  color = 'blue',
  size = 'md',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${animated ? 'transition-all duration-500 ease-out' : ''} h-full rounded-full relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          )}
        </div>
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;















