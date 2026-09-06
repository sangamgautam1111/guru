import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesOfferings,
} from 'react-native-purchases';

/**
 * Guru Dakshina RevenueCat Subsystem
 *
 * This service encapsulates all subscription and sponsorship logic for Guru.
 * Instead of locking poor high school students in rural Nepal behind paywalls,
 * Guru implements a patron sponsorship model powered by RevenueCat.
 *
 * Community supporters, diaspora members, and alumni can sponsor offline learning kits
 * for students. Each dollar sponsored funds offline digital curriculum distributions
 * and study aids for students who have zero internet access.
 */

// RevenueCat Google Play API Key
// Required for release builds (app-release.apk) to comply with RevenueCat security standards
const REVENUECAT_API_KEY = 'goog_RmztSEyguCfzJskBlCWHaEUgQAL';

export interface SupporterAttributes {
  supporterTier: string;
  lifetimeSponsoredCount: number;
  lastSponsorTimestamp: string;
  schoolTag?: string;
}

class RevenueCatService {
  private isInitialized = false;

  /**
   * Initializes the RevenueCat SDK with the platform configuration.
   * Debug logging is enabled for runtime monitoring.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.isInitialized = true;
    } catch (error) {
      // In offline environments, SDK initialization gracefully recovers
      console.log('RevenueCat initialization notice (offline mode):', error);
    }
  }

  /**
   * Rapid connectivity probe before initiating purchase transactions.
   * Ensures the core app remains 100% offline resilient while preventing
   * payment attempts when internet is disconnected.
   */
  public async checkInternetConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch('https://api.revenuecat.com', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response && (response.status < 500 || response.type === 'opaque');
    } catch {
      return false;
    }
  }

  /**
   * Retrieves active customer info and entitlements.
   */
  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.log('RevenueCat getCustomerInfo notice:', error);
      return null;
    }
  }

  /**
   * Fetches the current offering and package catalog from RevenueCat.
   */
  public async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      return await Purchases.getOfferings();
    } catch (error) {
      console.log('RevenueCat getOfferings notice:', error);
      return null;
    }
  }

  /**
   * Purchases a package through RevenueCat Test Store.
   */
  public async purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo | null; userCancelled: boolean }> {
    try {
      const purchaseResult = await Purchases.purchasePackage(pkg);
      return { customerInfo: purchaseResult.customerInfo, userCancelled: false };
    } catch (error: any) {
      if (error?.userCancelled) {
        return { customerInfo: null, userCancelled: true };
      }
      throw error;
    }
  }

  /**
   * Restores past purchases and reactivates patron entitlements.
   */
  public async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.restorePurchases();
    } catch (error) {
      console.log('RevenueCat restorePurchases notice:', error);
      return null;
    }
  }

  /**
   * Syncs supporter tier and impact metrics to RevenueCat Customer Attributes.
   * Allows tracking how many students each patron has empowered.
   */
  public async syncSupporterAttributes(attributes: SupporterAttributes): Promise<void> {
    try {
      await Purchases.setAttributes({
        supporter_tier: attributes.supporterTier,
        lifetime_sponsored_count: attributes.lifetimeSponsoredCount.toString(),
        last_sponsor_date: attributes.lastSponsorTimestamp,
        school_tag: attributes.schoolTag || 'Adarsha Secondary School, Sanothimi',
      });
    } catch (error) {
      console.log('RevenueCat attribute sync notice:', error);
    }
  }

  /**
   * Subscribes to real-time customer info changes.
   */
  public addCustomerInfoUpdateListener(callback: (info: CustomerInfo) => void): () => void {
    const listener = Purchases.addCustomerInfoUpdateListener(callback);
    return () => {
      try {
        if (typeof (listener as any)?.remove === 'function') {
          (listener as any).remove();
        }
      } catch (_) {}
    };
  }
}

export const revenueCatService = new RevenueCatService();
export default revenueCatService;
