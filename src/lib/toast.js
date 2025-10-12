/**
 * Toast notification system using react-hot-toast
 * Provides a simple API for showing notifications throughout the app
 */

import toast from 'react-hot-toast';

/**
 * Default toast options
 */
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
  },
};

/**
 * Show success notification
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    icon: '✅',
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
    icon: '❌',
  });
};

/**
 * Show info notification
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: 'ℹ️',
  });
};

/**
 * Show loading notification
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
  });
};

/**
 * Show warning notification
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: '⚠️',
    style: {
      borderRadius: '8px',
      background: '#f59e0b',
      color: '#fff',
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
    if (toastId) {
      toast.loading('Waiting for signature...', { id: toastId });
    } else {
      return toast.loading('Waiting for signature...');
    }
  },
  
  broadcasting: (toastId) => {
    if (toastId) {
      toast.loading('Broadcasting transaction...', { id: toastId });
    } else {
      return toast.loading('Broadcasting transaction...');
    }
  },
  
  success: (message, toastId) => {
    if (toastId) {
      toast.success(message || 'Transaction successful!', { id: toastId });
    } else {
      return toast.success(message || 'Transaction successful!');
    }
  },
  
  error: (message, toastId) => {
    if (toastId) {
      toast.error(message || 'Transaction failed', { id: toastId, duration: 6000 });
    } else {
      return toast.error(message || 'Transaction failed', { duration: 6000 });
    }
  },
};

