/**
 * Toast notification system using react-hot-toast
 * Provides a simple API for showing notifications throughout the app
 * Aligned with Carge brand identity
 */

import { createElement as h } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom SVG icons created with React.createElement (no JSX required)
 * Professional look with proper sizing
 */
const icons = {
  success: h(
    'svg',
    { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    })
  ),
  error: h(
    'svg',
    { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    })
  ),
  info: h(
    'svg',
    { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    })
  ),
  warning: h(
    'svg',
    { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    })
  ),
  loading: h(
    'svg',
    { className: 'w-5 h-5 animate-spin', fill: 'none', viewBox: '0 0 24 24' },
    h('circle', { className: 'opacity-25', cx: '12', cy: '12', r: '10', stroke: 'currentColor', strokeWidth: '4' }),
    h('path', {
      className: 'opacity-75',
      fill: 'currentColor',
      d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    })
  ),
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
 * Update an existing toast (useful for progress updates)
 * @param {string} toastId - ID of the toast to update
 * @param {Object} options - Toast options (render, type, isLoading, autoClose)
 */
export const update = (toastId, options = {}) => {
  const { render, type = 'info', isLoading = false, autoClose = 4000 } = options;
  
  if (!toastId) return;
  
  // Determine which toast function to use based on type and loading state
  if (isLoading) {
    toast.loading(render, {
      id: toastId,
      ...defaultOptions,
      duration: Infinity,
      icon: icons.loading,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #003399',
      },
    });
  } else if (type === 'success') {
    toast.success(render, {
      id: toastId,
      ...defaultOptions,
      duration: autoClose,
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
  } else if (type === 'error') {
    toast.error(render, {
      id: toastId,
      ...defaultOptions,
      duration: autoClose,
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
  } else {
    // type === 'info' or default
    toast(render, {
      id: toastId,
      ...defaultOptions,
      duration: isLoading ? Infinity : autoClose,
      icon: isLoading ? icons.loading : icons.info,
      style: {
        ...defaultOptions.style,
        borderLeft: '4px solid #003399',
      },
    });
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

