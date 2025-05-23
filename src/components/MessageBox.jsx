import React from 'react';

export default function MessageBox({
  type = 'warning',
  message,
  className = '',
  show = true,
  theme = 'dark',
}) {
  if (!show || !message) {
    return null;
  }

  const getTypeStyles = () => {
    if (theme === 'dark') {
      switch (type) {
        case 'warning':
          return {
            container: 'bg-amber-900/20 border-amber-500/30',
            icon: 'text-amber-400',
            text: 'text-amber-200',
          };
        case 'error':
          return {
            container: 'bg-red-900/20 border-red-500/30',
            icon: 'text-red-400',
            text: 'text-red-200',
          };
        case 'info':
          return {
            container: 'bg-blue-900/20 border-blue-500/30',
            icon: 'text-blue-400',
            text: 'text-blue-200',
          };
        case 'success':
          return {
            container: 'bg-green-900/20 border-green-500/30',
            icon: 'text-green-400',
            text: 'text-green-200',
          };
        default:
          return {
            container: 'bg-gray-800/30 border-gray-600/30',
            icon: 'text-gray-400',
            text: 'text-gray-200',
          };
      }
    } else {
      switch (type) {
        case 'warning':
          return {
            container: 'bg-amber-50 border-amber-200',
            icon: 'text-amber-400',
            text: 'text-amber-800',
          };
        case 'error':
          return {
            container: 'bg-red-50 border-red-200',
            icon: 'text-red-400',
            text: 'text-red-800',
          };
        case 'info':
          return {
            container: 'bg-blue-50 border-blue-200',
            icon: 'text-blue-400',
            text: 'text-blue-800',
          };
        case 'success':
          return {
            container: 'bg-green-50 border-green-200',
            icon: 'text-green-400',
            text: 'text-green-800',
          };
        default:
          return {
            container: 'bg-gray-50 border-gray-200',
            icon: 'text-gray-400',
            text: 'text-gray-800',
          };
      }
    }
  };

  const styles = getTypeStyles();

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg
            className={`w-5 h-5 ${styles.icon}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={`w-5 h-5 ${styles.icon}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            className={`w-5 h-5 ${styles.icon}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'success':
        return (
          <svg
            className={`w-5 h-5 ${styles.icon}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
