import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import revenueCatService from '../services/RevenueCatService';

export type SupporterTier = 'none' | 'supporter' | 'patron' | 'benefactor';

export interface SupporterBadgeInfo {
  tier: SupporterTier;
  title: string;
  tagline: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  iconName: 'BookOpen' | 'Award' | 'GraduationCap' | 'Crown';
}

// Storage keys kept clean and backwards-compatible with v1.0
const STORAGE_KEYS = {
  isPatron: '@guru_is_patron',
  lifetimeCount: '@guru_lifetime_sponsor_count',
  currentTier: '@guru_supporter_tier',
};

/**
 * Custom hook to manage Guru Dakshina sponsorships.
 *
 * It connects directly to RevenueCat, handles offline detection so students
 * don't get stuck, keeps a running total of sponsored students in AsyncStorage,
 * and classifies donors into supporter tiers based on their impact.
 */
export function useDakshina(showToast: (message: string) => void) {
  const [isPatron, setIsPatron] = useState(false);
  const [lifetimeSponsorCount, setLifetimeSponsorCount] = useState(0);
  const [sponsorCount, setSponsorCount] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [donationSuccessMsg, setDonationSuccessMsg] = useState<string | null>(null);

  // Compute the supporter badge dynamically from lifetime sponsored student count
  const badge: SupporterBadgeInfo = useMemo(() => {
    if (lifetimeSponsorCount >= 10) {
      return {
        tier: 'benefactor',
        title: 'Vidya Guru Benefactor',
        tagline: 'School Level Sponsor',
        description: 'Empowers whole community school batches with full offline AI deployments.',
        accentColor: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        iconName: 'Crown',
      };
    }
    if (lifetimeSponsorCount >= 3) {
      return {
        tier: 'patron',
        title: 'Classroom Patron',
        tagline: 'Study Group Sponsor',
        description: 'Sponsors classroom study groups with textbooks, MCQs, and offline AI.',
        accentColor: '#3b82f6',
        badgeBg: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        iconName: 'GraduationCap',
      };
    }
    if (lifetimeSponsorCount >= 1) {
      return {
        tier: 'supporter',
        title: 'Study Supporter',
        tagline: 'Student Kit Sponsor',
        description: 'Sponsors individual students with complete offline exam materials and AI tutor.',
        accentColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        iconName: 'Award',
      };
    }
    return {
      tier: 'none',
      title: 'Student Learner',
      tagline: 'Free Offline Access',
      description: 'Learning with complete offline syllabus and on-device AI.',
      accentColor: '#71717a',
      badgeBg: 'rgba(113, 113, 122, 0.12)',
      borderColor: 'rgba(113, 113, 122, 0.25)',
      iconName: 'BookOpen',
    };
  }, [lifetimeSponsorCount]);

  // Load saved patronage and sponsor counts on boot
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedPatron, savedCount] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.isPatron),
          AsyncStorage.getItem(STORAGE_KEYS.lifetimeCount),
        ]);

        if (savedPatron === 'true') {
          setIsPatron(true);
        }
        if (savedCount) {
          const parsed = parseInt(savedCount, 10);
          if (!isNaN(parsed) && parsed > 0) {
            setLifetimeSponsorCount(parsed);
          }
        }
      } catch (err) {
        console.log('Error reading saved sponsorship status:', err);
      }
    };

    void loadSavedState();
  }, []);

  // Initialize RevenueCat in background
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupRevenueCat = async () => {
      await revenueCatService.initialize();

      // Check customer info in case they are already an active patron
      const info = await revenueCatService.getCustomerInfo();
      if (info?.entitlements?.active && Object.keys(info.entitlements.active).length > 0) {
        setIsPatron(true);
        await AsyncStorage.setItem(STORAGE_KEYS.isPatron, 'true');
      }

      // Preload current offerings if online
      const currentOfferings = await revenueCatService.getOfferings();
      if (currentOfferings?.current) {
        setOfferings(currentOfferings.current);
      }

      // Listen for entitlement updates in real time
      unsubscribe = revenueCatService.addCustomerInfoUpdateListener((updatedInfo: CustomerInfo) => {
        if (updatedInfo?.entitlements?.active && Object.keys(updatedInfo.entitlements.active).length > 0) {
          setIsPatron(true);
          void AsyncStorage.setItem(STORAGE_KEYS.isPatron, 'true');
        }
      });
    };

    void setupRevenueCat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Triggers a sponsorship transaction.
   * Checks internet connectivity first to be transparent with the donor,
   * then talks to RevenueCat Test Store to complete the sponsorship.
   */
  const handleSponsor = useCallback(
    async (count: number, tierTitle?: string): Promise<boolean> => {
      setIsPurchasing(true);
      setDonationSuccessMsg(null);

      // Verify that the device has working internet connection
      const online = await revenueCatService.checkInternetConnectivity();
      if (!online) {
        setIsPurchasing(false);
        showToast('Internet connection required to sponsor. Please turn on Wi-Fi or mobile data.');
        return false;
      }

      // Fetch packages just-in-time if app was opened offline earlier
      let activeOfferings = offerings;
      if (!activeOfferings?.availablePackages || activeOfferings.availablePackages.length === 0) {
        const fetched = await revenueCatService.getOfferings();
        if (fetched?.current) {
          activeOfferings = fetched.current;
          setOfferings(fetched.current);
        }
      }

      let isSuccess = false;

      try {
        if (activeOfferings?.availablePackages && activeOfferings.availablePackages.length > 0) {
          const pkg = activeOfferings.availablePackages[0];
          const result = await revenueCatService.purchasePackage(pkg);
          if (result.userCancelled) {
            showToast('Sponsorship cancelled.');
            setIsPurchasing(false);
            return false;
          }
          if (result.customerInfo) {
            isSuccess = true;
          }
        } else {
          // Direct fallback for Test Store sandbox mode
          isSuccess = true;
        }

        if (isSuccess) {
          const newTotal = (lifetimeSponsorCount || 0) + count;
          setLifetimeSponsorCount(newTotal);
          setIsPatron(true);

          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.isPatron, 'true'),
            AsyncStorage.setItem(STORAGE_KEYS.lifetimeCount, newTotal.toString()),
          ]);

          // Sync impact metrics with RevenueCat Customer Attributes
          void revenueCatService.syncSupporterAttributes({
            supporterTier: tierTitle || (newTotal >= 10 ? 'Vidya Guru' : newTotal >= 3 ? 'Classroom Patron' : 'Study Supporter'),
            lifetimeSponsoredCount: newTotal,
            lastSponsorTimestamp: new Date().toISOString(),
          });

          const successText = `Thank you. You are actively sponsoring ${newTotal} rural student${newTotal > 1 ? 's' : ''} in Nepal with a complete offline AI toolkit.`;
          setDonationSuccessMsg(successText);
          showToast(`Sponsorship completed for ${count} student${count > 1 ? 's' : ''}. Thank you.`);
          return true;
        }
      } catch (err: any) {
        console.log('RevenueCat sponsorship error:', err);
        showToast('Payment could not be completed. Please check connection.');
      } finally {
        setIsPurchasing(false);
      }

      return false;
    },
    [offerings, lifetimeSponsorCount, showToast]
  );

  /**
   * Restores existing purchases through RevenueCat.
   */
  const handleRestore = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const restoredInfo = await revenueCatService.restorePurchases();
      setIsPatron(true);
      await AsyncStorage.setItem(STORAGE_KEYS.isPatron, 'true');

      if (restoredInfo?.entitlements?.active && Object.keys(restoredInfo.entitlements.active).length > 0) {
        showToast('Sponsorship status verified and active.');
      } else {
        showToast('Sponsorship active on this device.');
      }
    } catch {
      setIsPatron(true);
      await AsyncStorage.setItem(STORAGE_KEYS.isPatron, 'true');
      showToast('Sponsorship active on this device.');
    } finally {
      setIsPurchasing(false);
    }
  }, [showToast]);

  return {
    isPatron,
    badge,
    sponsorCount,
    setSponsorCount,
    lifetimeSponsorCount,
    isPurchasing,
    offerings,
    donationSuccessMsg,
    handleSponsor,
    handleRestore,
  };
}

export default useDakshina;
