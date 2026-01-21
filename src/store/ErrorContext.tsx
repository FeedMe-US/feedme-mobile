/**
 * ErrorContext - Global error state management
 * Provides error display and handling across the app
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NetworkError, ApiError, isNetworkError, isApiError } from '@/src/types/errors';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  title?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  dismissible?: boolean;
  autoDismiss?: number; // ms
}

interface ErrorContextType {
  errors: AppError[];
  isOffline: boolean;
  addError: (error: AppError | Error | string, options?: Partial<AppError>) => string;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
  setOffline: (offline: boolean) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const addError = useCallback((
    error: AppError | Error | string,
    options?: Partial<AppError>
  ): string => {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = {
        id: generateId(),
        message: error,
        severity: 'error',
        dismissible: true,
        autoDismiss: 5000,
        ...options,
      };
    } else if (error instanceof Error) {
      // Handle specific error types
      let title = 'Error';
      let message = error.message;
      let severity: ErrorSeverity = 'error';
      let autoDismiss = 5000;

      if (error instanceof NetworkError) {
        title = 'Connection Error';
        severity = 'warning';
        autoDismiss = 0; // Don't auto-dismiss network errors
      } else if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          title = 'Session Expired';
          message = 'Please sign in again.';
        } else if (error.statusCode === 429) {
          title = 'Rate Limit';
          severity = 'warning';
        } else if (error.statusCode >= 500) {
          title = 'Server Error';
          message = 'Something went wrong. Please try again.';
        }
      }

      appError = {
        id: generateId(),
        title,
        message,
        severity,
        dismissible: true,
        autoDismiss,
        ...options,
      };
    } else {
      appError = {
        id: generateId(),
        dismissible: true,
        autoDismiss: 5000,
        ...error,
        ...options,
      };
    }

    setErrors(prev => {
      // Avoid duplicate messages
      if (prev.some(e => e.message === appError.message)) {
        return prev;
      }
      return [...prev, appError];
    });

    // Auto-dismiss if set
    if (appError.autoDismiss && appError.autoDismiss > 0) {
      setTimeout(() => {
        removeError(appError.id);
      }, appError.autoDismiss);
    }

    return appError.id;
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const setOffline = useCallback((offline: boolean) => {
    setIsOffline(offline);
    if (offline) {
      addError({
        id: 'offline-banner',
        title: 'Offline Mode',
        message: 'You are currently offline. Some features may be limited.',
        severity: 'warning',
        dismissible: false,
        autoDismiss: 0,
      });
    } else {
      removeError('offline-banner');
    }
  }, [addError, removeError]);

  return (
    <ErrorContext.Provider
      value={{
        errors,
        isOffline,
        addError,
        removeError,
        clearAllErrors,
        setOffline,
      }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

/**
 * Hook for handling API calls with automatic error handling
 */
export function useApiError() {
  const { addError } = useError();

  const handleError = useCallback((error: unknown, fallbackMessage = 'Something went wrong') => {
    if (error instanceof Error) {
      addError(error);
    } else {
      addError(fallbackMessage);
    }
  }, [addError]);

  return { handleError };
}
