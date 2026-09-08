import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

export function useStreak(showToast?: (msg: string) => void) {
  const [streakCount, setStreakCount] = useState(1);

  const checkAndUpdateDailyStreak = useCallback(
    async (markActivity = false): Promise<number> => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const storedStreakStr = await AsyncStorage.getItem(STORAGE_KEYS.streakCount);
        const lastStreakDate = await AsyncStorage.getItem(STORAGE_KEYS.lastStreakDate);

        let currentStreak = storedStreakStr ? parseInt(storedStreakStr, 10) : 0;
        if (isNaN(currentStreak) || currentStreak < 0) {
          currentStreak = 0;
        }

        if (!lastStreakDate) {
          const initialStreak = 1;
          await AsyncStorage.setItem(STORAGE_KEYS.streakCount, String(initialStreak));
          await AsyncStorage.setItem(STORAGE_KEYS.lastStreakDate, todayStr);
          setStreakCount(initialStreak);
          return initialStreak;
        }

        if (lastStreakDate === todayStr) {
          const effectiveStreak = Math.max(1, currentStreak);
          setStreakCount(effectiveStreak);
          return effectiveStreak;
        }

        const lastDateParts = lastStreakDate.split('-').map((p) => parseInt(p, 10));
        const lastDateObj = new Date(lastDateParts[0], lastDateParts[1] - 1, lastDateParts[2]);
        const todayDateObj = new Date(year, today.getMonth(), today.getDate());

        const diffMs = todayDateObj.getTime() - lastDateObj.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let newStreak = currentStreak;
        if (diffDays === 1) {
          newStreak = currentStreak + 1;
          await AsyncStorage.setItem(STORAGE_KEYS.streakCount, String(newStreak));
          await AsyncStorage.setItem(STORAGE_KEYS.lastStreakDate, todayStr);
          setStreakCount(newStreak);
          if (markActivity && showToast) {
            showToast(`Streak maintained: ${newStreak} Days in a row!`);
          }
        } else if (diffDays > 1) {
          newStreak = 1;
          await AsyncStorage.setItem(STORAGE_KEYS.streakCount, String(newStreak));
          await AsyncStorage.setItem(STORAGE_KEYS.lastStreakDate, todayStr);
          setStreakCount(newStreak);
        } else {
          newStreak = Math.max(1, currentStreak);
          setStreakCount(newStreak);
        }
        return newStreak;
      } catch (err) {
        console.warn('Streak update error:', err);
        return 1;
      }
    },
    [showToast]
  );

  return {
    streakCount,
    setStreakCount,
    checkAndUpdateDailyStreak,
  };
}

export default useStreak;
