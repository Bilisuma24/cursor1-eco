import React, { useState, useRef, useEffect } from 'react';

const FloatingLabelInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    onChange?.(e);
  };

  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 pt-6 pb-2 text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 ease-in-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${isFloating ? 'pt-6 pb-2' : 'pt-6 pb-2'}
        `}
        placeholder={isFloating ? placeholder : ''}
        {...props}
      />
      
      <label
        htmlFor={id}
        className={`
          absolute left-4 transition-all duration-200 ease-in-out pointer-events-none
          ${isFloating 
            ? 'top-2 text-xs text-blue-600 dark:text-blue-400 font-medium' 
            : 'top-4 text-gray-500 dark:text-gray-400'
          }
          ${error ? 'text-red-500 dark:text-red-400' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default FloatingLabelInput;







