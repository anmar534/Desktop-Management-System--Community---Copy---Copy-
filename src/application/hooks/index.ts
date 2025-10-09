/**
 * 🎣 React Hooks مخصصة للنظام
 * Custom React Hooks for System
 */

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { safeLocalStorage } from '@/utils/storage';

// إعادة تصدير الهوكز الرئيسية
export { useExpenses } from './useExpenses';
export { useProjects } from './useProjects';
export { useClients } from './useClients';
export { useTenders } from './useTenders';
export { useFinancialData } from './useFinancialData';
export { useDevelopment } from './useDevelopment';
export { useAuditLog } from './useAuditLog';
export { useDashboardMetrics } from './useDashboardMetrics';
export { useFinancialMetrics } from './useFinancialMetrics';
export { useCurrencyRates } from './useCurrencyRates';

// Hook لإدارة LocalStorage مع React state
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return safeLocalStorage.getItem(key, initialValue);
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prevValue => {
      const newValue = value instanceof Function ? value(prevValue) : value;
      safeLocalStorage.setItem(key, newValue);
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
};

// Export all hooks
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook لإدارة التخزين الموحد
export const useStorage = () => {
  const save = useCallback(<Value>(key: string, data: Value) => {
    try {
      safeLocalStorage.setItem(key, data);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, []);

  const load = useCallback(<Value>(key: string, defaultValue: Value) => {
    try {
      return safeLocalStorage.getItem<Value>(key, defaultValue);
    } catch (error) {
      console.error('Error loading from storage:', error);
      return defaultValue;
    }
  }, []);

  const remove = useCallback((key: string) => {
    try {
      safeLocalStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }, []);

  return { save, load, remove };
};

// Hook للتحقق من حجم الشاشة
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  }));

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

// Hook للتحكم في الحالة مع undo/redo
export const useUndoRedo = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const nextState = newState instanceof Function ? newState(currentState) : newState;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(nextState);
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentState, history, currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [canUndo, currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [canRedo, currentIndex]);

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
};

// Hook للتحكم في النوافذ المنبثقة
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal };
};

// Hook للبحث مع debounce
export const useDebouncedSearch = <T>(
  data: T[],
  searchFields: (keyof T)[],
  delay = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && 
            value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        })
      );
      setFilteredData(filtered);
    }
  }, [data, debouncedSearchTerm, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isSearching: searchTerm !== debouncedSearchTerm,
  };
};

// Hook لتتبع العنصر المحدد
export const useSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const selectedItems = items.filter(item => selectedIds.has(item.id));
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isSomeSelected,
    toggleItem,
    selectAll,
    clearSelection,
    toggleAll,
  };
};

// Hook للترقيم
export const usePagination = <T>(
  data: T[],
  initialItemsPerPage = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    currentItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    changeItemsPerPage,
  };
};

// Hook لطلبات API
export const useAsync = <T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err as E);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      void execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute };
};

// Hook للتحكم في النماذج
export const useForm = <T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => void | Promise<void>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setTouched = useCallback((name: keyof T) => {
    setTouchedState(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched,
    reset,
    handleSubmit,
  };
};

// Hook لتتبع الوقت
export const useTimer = (initialTime = 0, interval = 1000) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + interval);
      }, interval);
    }
  }, [isRunning, interval]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setTime(initialTime);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [initialTime]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
  }, []);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    formatTime: formatTime(time),
  };
};

