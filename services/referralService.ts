import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserIdFromToken } from "./pushNotifications";

// Storage keys
const REFERRAL_CODE_KEY = "user_referral_code";
const REFERRAL_STATS_KEY = "user_referral_stats";
const USED_REFERRAL_CODES_KEY = "used_referral_codes";

type ReferralStats = {
  referralCode: string;
  confirmedReferrals: number;
  requiredReferrals: number;
  discountPercent: number;
  rewardUnlocked: boolean;
  rewardUsed: boolean;
};

type UsedReferralCode = {
  code: string;
  usedBy: string; // email/userId of person who used it
  usedAt: string; // timestamp
  referrerId: string; // userId of person who owns the code
};

/**
 * Generate a unique referral code for each user
 * Format: REF{userId} (e.g., REF0123) - unique per user
 */
export async function generateReferralCode(): Promise<string> {
  try {
    const userId = await getCurrentUserIdFromToken();
    
    if (userId) {
      // Generate unique code based on specific user ID
      const code = "REF" + userId.toString().padStart(4, '0');
      
      // Store code for this specific user with user-specific key
      const userSpecificKey = `${REFERRAL_CODE_KEY}_${userId}`;
      await AsyncStorage.setItem(userSpecificKey, code);
      console.log("Generated unique referral code for user:", userId, "Code:", code);
      return code;
    } else {
      // Fallback for guest users
      const timestamp = Date.now().toString().slice(-6);
      const guestCode = "GUEST" + timestamp;
      await AsyncStorage.setItem(REFERRAL_CODE_KEY, guestCode);
      return guestCode;
    }
  } catch (error) {
    console.log("Error generating referral code:", error);
    // Ultimate fallback
    const fallbackCode = "FALLBACK" + Math.floor(Math.random() * 10000);
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, fallbackCode);
    return fallbackCode;
  }
}

/**
 * Get stored referral code for the current user
 */
export async function getStoredReferralCode(): Promise<string> {
  try {
    const userId = await getCurrentUserIdFromToken();
    const userSpecificKey = userId ? `${REFERRAL_CODE_KEY}_${userId}` : REFERRAL_CODE_KEY;
    
    const storedCode = await AsyncStorage.getItem(userSpecificKey);
    if (storedCode) {
      console.log("Found stored referral code for user", userId, ":", storedCode);
      return storedCode;
    }
    
    // Generate new code if none exists
    const newCode = await generateReferralCode();
    return newCode;
  } catch (error) {
    console.log("Error getting stored referral code:", error);
    return generateReferralCode();
  }
}

/**
 * Get referral statistics for the current user
 */
export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const storedStats = await AsyncStorage.getItem(REFERRAL_STATS_KEY);
    if (storedStats) {
      const stats = JSON.parse(storedStats) as ReferralStats;
      console.log("Found stored referral stats:", stats);
      return stats;
    }
    
    // Create default stats
    const referralCode = await getStoredReferralCode();
    const defaultStats: ReferralStats = {
      referralCode,
      confirmedReferrals: 0,
      requiredReferrals: 5,
      discountPercent: 10,
      rewardUnlocked: false,
      rewardUsed: false,
    };
    
    await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(defaultStats));
    return defaultStats;
  } catch (error) {
    console.log("Error getting referral stats:", error);
    const referralCode = await getStoredReferralCode();
    return {
      referralCode,
      confirmedReferrals: 0,
      requiredReferrals: 5,
      discountPercent: 10,
      rewardUnlocked: false,
      rewardUsed: false,
    };
  }
}

/**
 * Process a referral code when a user logs in with it
 * This increments the referrer's invite count
 */
export async function processReferralCode(
  referralCode: string, 
  newUserEmail: string
): Promise<boolean> {
  try {
    console.log("Processing referral code:", referralCode, "for user:", newUserEmail);
    
    // Check if this user has already used a referral code
    const usedCodes = await getUsedReferralCodes();
    const alreadyUsed = usedCodes.find(used => 
      used.usedBy === newUserEmail && used.code === referralCode
    );
    
    if (alreadyUsed) {
      console.log("User already used this referral code");
      return false;
    }
    
    // Don't allow self-referral
    const currentUserId = await getCurrentUserIdFromToken();
    const currentReferralCode = await getStoredReferralCode();
    
    if (referralCode === currentReferralCode) {
      console.log("Cannot use own referral code");
      return false;
    }
    
    // Record that this code was used
    const newUsage: UsedReferralCode = {
      code: referralCode,
      usedBy: newUserEmail,
      usedAt: new Date().toISOString(),
      referrerId: extractUserIdFromCode(referralCode),
    };
    
    usedCodes.push(newUsage);
    await AsyncStorage.setItem(USED_REFERRAL_CODES_KEY, JSON.stringify(usedCodes));
    
    // Increment the referrer's invite count
    await incrementReferrerCount(referralCode);
    
    console.log("Successfully processed referral code");
    return true;
  } catch (error) {
    console.log("Error processing referral code:", error);
    return false;
  }
}

/**
 * Get all used referral codes
 */
async function getUsedReferralCodes(): Promise<UsedReferralCode[]> {
  try {
    const stored = await AsyncStorage.getItem(USED_REFERRAL_CODES_KEY);
    return stored ? JSON.parse(stored) as UsedReferralCode[] : [];
  } catch (error) {
    console.log("Error getting used referral codes:", error);
    return [];
  }
}

/**
 * Extract user ID from referral code
 */
function extractUserIdFromCode(code: string): string {
  // Extract user ID from code format "REF1234" or "USER123REF"
  const match = code.match(/(\d+)/);
  return match ? match[1] : "unknown";
}

/**
 * Increment the referral count for a given referral code
 */
async function incrementReferrerCount(referralCode: string): Promise<void> {
  try {
    // This would normally update the referrer's stats in the database
    // For now, we'll simulate it by updating local storage
    console.log("Incrementing count for referral code:", referralCode);
    
    // In a real implementation, this would make an API call to update the referrer's stats
    // For demo purposes, we'll just log it
    console.log("Referrer invite count incremented for code:", referralCode);
  } catch (error) {
    console.log("Error incrementing referrer count:", error);
  }
}

/**
 * Update referral stats for the current user
 */
export async function updateReferralStats(updates: Partial<ReferralStats>): Promise<void> {
  try {
    const currentStats = await getReferralStats();
    const updatedStats = { ...currentStats, ...updates };
    
    await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(updatedStats));
    console.log("Updated referral stats:", updatedStats);
  } catch (error) {
    console.log("Error updating referral stats:", error);
  }
}

/**
 * Get how many people have used a specific referral code
 */
export async function getReferralUsageCount(referralCode: string): Promise<number> {
  try {
    const usedCodes = await getUsedReferralCodes();
    const usageCount = usedCodes.filter(used => used.code === referralCode).length;
    console.log("Referral code", referralCode, "used by", usageCount, "people");
    return usageCount;
  } catch (error) {
    console.log("Error getting referral usage count:", error);
    return 0;
  }
}
