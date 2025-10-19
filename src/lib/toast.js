/**
 * Toast notification system using react-hot-toast
 * Provides a simple API for showing notifications throughout the app
 * Aligned with Carge brand identity
 */

import toast from 'react-hot-toast';

/**
 * Custom icons as pure JavaScript (no JSX)
 * Using emojis styled to match brand identity
 */
const icons = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
  loading: '⟳',
};

/**
 * Default toast options - aligned with Carge design system
 */
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '12px',
    background: '#ffffff',
    color: '#1f2937',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    padding: '16px',
    maxWidth: '420px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

/**
 * Show success notification
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    icon: icons.success,
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #10b981',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  });
};

/**
 * Show error notification
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
    duration: 5000,
    icon: icons.error,
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #ef4444',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  });
};

/**
 * Show info notification
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: icons.info,
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #003399',
    },
  });
};

/**
 * Show loading notification
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
    icon: icons.loading,
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #003399',
    },
  });
};

/**
 * Show warning notification
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: icons.warning,
    style: {
      ...defaultOptions.style,
      borderLeft: '4px solid #f59e0b',
    },
  });
};

/**
 * Dismiss a specific toast or all toasts
 */
export const dismiss = (toastId) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

/**
 * Show promise-based toast (auto updates based on promise state)
 */
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Error occurred',
    },
    {
      ...defaultOptions,
      ...options,
    }
  );
};

/**
 * Transaction-specific toast helpers
 */
export const toastTx = {
  signing: (toastId) => {
    const options = {
      ...defaultOptions,
      icon: icons.loading,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #003399',
      },
    };
    
    if (toastId) {
      toast.loading('Waiting for signature...', { id: toastId, ...options });
    } else {
      return toast.loading('Waiting for signature...', options);
    }
  },
  
  broadcasting: (toastId) => {
    const options = {
      ...defaultOptions,
      icon: icons.loading,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #003399',
      },
    };
    
    if (toastId) {
      toast.loading('Broadcasting transaction...', { id: toastId, ...options });
    } else {
      return toast.loading('Broadcasting transaction...', options);
    }
  },
  
  success: (message, toastId) => {
    const options = {
      ...defaultOptions,
      icon: icons.success,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #10b981',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    };
    
    if (toastId) {
      toast.success(message || 'Transaction successful!', { id: toastId, ...options });
    } else {
      return toast.success(message || 'Transaction successful!', options);
    }
  },
  
  error: (message, toastId) => {
    const options = {
      ...defaultOptions,
      duration: 6000,
      icon: icons.error,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #ef4444',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    };
    
    if (toastId) {
      toast.error(message || 'Transaction failed', { id: toastId, ...options });
    } else {
      return toast.error(message || 'Transaction failed', options);
    }
  },
};

