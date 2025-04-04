import create from 'zustand';

const useToastStore = create((set, get) => ({
  // State
  toasts: [],
  
  // Actions
  addToast: (message, type = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = {
      id,
      message,
      type,
      duration,
      onClose: () => get().removeToast(id)
    };

    set(state => ({
      toasts: [...state.toasts, toast]
    }));

    // Auto remove toast after duration
    if (duration) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },

  // Convenience methods for different toast types
  success: (message, duration) => {
    return get().addToast(message, 'success', duration);
  },

  error: (message, duration) => {
    return get().addToast(message, 'error', duration);
  },

  warning: (message, duration) => {
    return get().addToast(message, 'warning', duration);
  },

  info: (message, duration) => {
    return get().addToast(message, 'info', duration);
  },

  // Clear all toasts
  clearAll: () => {
    set({ toasts: [] });
  }
}));

// Custom hook for using toasts
export const useToast = () => {
  const { addToast, success, error, warning, info, clearAll } = useToastStore();
  
  return {
    show: addToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
};

export { useToastStore };