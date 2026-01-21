/**
 * DailyTrackingContext - Global state for daily nutrition tracking
 * Now with backend sync and local caching
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logService } from '@/src/services/logService';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface LoggedMeal {
  id: string;
  name: string;
  mealType: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: string;
  synced?: boolean; // Whether this meal has been synced to backend
  backendId?: string; // The ID from the backend
}

export interface DailyMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyTracking {
  consumed: DailyMacros;
  targets: DailyTargets;
  unit: 'g' | '%';
  loggedMeals: LoggedMeal[];
  isSyncing: boolean;
  lastSyncError: string | null;
}

interface DailyTrackingContextType {
  tracking: DailyTracking;
  updateConsumed: (macros: Partial<DailyMacros>) => void;
  updateTargets: (targets: Partial<DailyTargets>) => void;
  toggleUnit: () => void;
  reset: () => void;
  addMeal: (meal: Omit<LoggedMeal, 'id' | 'timestamp' | 'synced' | 'backendId'>) => void;
  updateMeal: (id: string, updates: Partial<LoggedMeal>) => void;
  removeMeal: (id: string) => void;
  refreshFromBackend: () => Promise<void>;
}

const defaultTargets: DailyTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 65,
};

const defaultTracking: DailyTracking = {
  consumed: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  },
  targets: defaultTargets,
  unit: 'g',
  loggedMeals: [],
  isSyncing: false,
  lastSyncError: null,
};

const STORAGE_KEY = '@FeedMe:dailyTracking';
const getTodayKey = () => `${STORAGE_KEY}:${new Date().toISOString().split('T')[0]}`;

const DailyTrackingContext = createContext<DailyTrackingContextType | undefined>(undefined);

export function DailyTrackingProvider({ children }: { children: ReactNode }) {
  const [tracking, setTracking] = useState<DailyTracking>(defaultTracking);

  const recalculateConsumed = useCallback((meals: LoggedMeal[]): DailyMacros => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories * meal.quantity,
        protein: acc.protein + meal.protein * meal.quantity,
        carbs: acc.carbs + meal.carbs * meal.quantity,
        fats: acc.fats + meal.fats * meal.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, []);

  // Save to local storage whenever meals change
  const saveToStorage = useCallback(async (meals: LoggedMeal[]) => {
    try {
      await AsyncStorage.setItem(getTodayKey(), JSON.stringify(meals));
    } catch (error) {
      console.warn('[DailyTracking] Failed to save to storage:', error);
    }
  }, []);

  // Load from local storage on mount
  const loadFromStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(getTodayKey());
      if (stored) {
        const meals = JSON.parse(stored) as LoggedMeal[];
        setTracking((prev) => ({
          ...prev,
          loggedMeals: meals,
          consumed: recalculateConsumed(meals),
        }));
      }
    } catch (error) {
      console.warn('[DailyTracking] Failed to load from storage:', error);
    }
  }, [recalculateConsumed]);

  // Sync meal to backend
  const syncMealToBackend = useCallback(async (meal: LoggedMeal) => {
    try {
      const result = await logService.logMeal(
        [{
          name: meal.name,
          servings: meal.quantity,
          calories: meal.calories,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fats,
        }],
        meal.mealType,
        'manual'
      );

      if (result?.log_id) {
        // Mark as synced
        setTracking((prev) => ({
          ...prev,
          loggedMeals: prev.loggedMeals.map((m) =>
            m.id === meal.id ? { ...m, synced: true, backendId: String(result.log_id) } : m
          ),
          lastSyncError: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[DailyTracking] Failed to sync meal:', error);
      setTracking((prev) => ({
        ...prev,
        lastSyncError: 'Failed to sync with server',
      }));
      return false;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const addMeal = useCallback((meal: Omit<LoggedMeal, 'id' | 'timestamp' | 'synced' | 'backendId'>) => {
    const newMeal: LoggedMeal = {
      ...meal,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    setTracking((prev) => {
      const newLoggedMeals = [...prev.loggedMeals, newMeal];
      // Save to local storage
      saveToStorage(newLoggedMeals);
      return {
        ...prev,
        loggedMeals: newLoggedMeals,
        consumed: recalculateConsumed(newLoggedMeals),
      };
    });

    // Sync to backend in background
    syncMealToBackend(newMeal);
  }, [recalculateConsumed, saveToStorage, syncMealToBackend]);

  const updateMeal = useCallback((id: string, updates: Partial<LoggedMeal>) => {
    setTracking((prev) => {
      const newLoggedMeals = prev.loggedMeals.map((meal) =>
        meal.id === id ? { ...meal, ...updates, synced: false } : meal
      );
      saveToStorage(newLoggedMeals);
      return {
        ...prev,
        loggedMeals: newLoggedMeals,
        consumed: recalculateConsumed(newLoggedMeals),
      };
    });
  }, [recalculateConsumed, saveToStorage]);

  const removeMeal = useCallback(async (id: string) => {
    // Find the meal to get backend ID
    const mealToRemove = tracking.loggedMeals.find((m) => m.id === id);

    setTracking((prev) => {
      const newLoggedMeals = prev.loggedMeals.filter((meal) => meal.id !== id);
      saveToStorage(newLoggedMeals);
      return {
        ...prev,
        loggedMeals: newLoggedMeals,
        consumed: recalculateConsumed(newLoggedMeals),
      };
    });

    // Delete from backend if it was synced
    if (mealToRemove?.backendId) {
      await logService.deleteLog(mealToRemove.backendId);
    }
  }, [tracking.loggedMeals, recalculateConsumed, saveToStorage]);

  // Refresh from backend
  const refreshFromBackend = useCallback(async () => {
    setTracking((prev) => ({ ...prev, isSyncing: true }));

    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await logService.getLogsForDate(today);

      if (logs.length > 0) {
        // Convert backend FoodLogEntry[] to LoggedMeal format
        // Each entry is a flat object with food_name, servings, etc.
        const meals: LoggedMeal[] = logs.map((entry) => ({
          id: String(entry.id),
          name: entry.food_name,
          mealType: entry.meal_type,
          quantity: entry.servings,
          calories: entry.calories,
          protein: entry.protein_g,
          carbs: entry.carbs_g,
          fats: entry.fat_g,
          timestamp: String(entry.logged_at),
          synced: true,
          backendId: String(entry.id),
        }));

        setTracking((prev) => ({
          ...prev,
          loggedMeals: meals,
          consumed: recalculateConsumed(meals),
          isSyncing: false,
          lastSyncError: null,
        }));

        await saveToStorage(meals);
      } else {
        setTracking((prev) => ({ ...prev, isSyncing: false }));
      }
    } catch (error) {
      console.warn('[DailyTracking] Failed to refresh from backend:', error);
      setTracking((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncError: 'Failed to sync with server',
      }));
    }
  }, [recalculateConsumed, saveToStorage]);

  const updateConsumed = useCallback((macros: Partial<DailyMacros>) => {
    setTracking((prev) => ({
      ...prev,
      consumed: {
        ...prev.consumed,
        ...macros,
      },
    }));
  }, []);

  const updateTargets = useCallback((targets: Partial<DailyTargets>) => {
    setTracking((prev) => ({
      ...prev,
      targets: {
        ...prev.targets,
        ...targets,
      },
    }));
  }, []);

  const toggleUnit = useCallback(() => {
    setTracking((prev) => ({
      ...prev,
      unit: prev.unit === 'g' ? '%' : 'g',
    }));
  }, []);

  const reset = useCallback(() => {
    setTracking(defaultTracking);
  }, []);

  return (
    <DailyTrackingContext.Provider
      value={{
        tracking,
        updateConsumed,
        updateTargets,
        toggleUnit,
        reset,
        addMeal,
        updateMeal,
        removeMeal,
        refreshFromBackend,
      }}>
      {children}
    </DailyTrackingContext.Provider>
  );
}

export function useDailyTracking() {
  const context = useContext(DailyTrackingContext);
  if (!context) {
    throw new Error('useDailyTracking must be used within DailyTrackingProvider');
  }
  return context;
}

