// This is a test file to demonstrate the referral system
// You can run this in a browser console or Node.js to test the logic

// Mock AsyncStorage for testing
const mockStorage = {};

const AsyncStorage = {
  getItem: async (key) => mockStorage[key] || null,
  setItem: async (key, value) => { mockStorage[key] = value; },
  removeItem: async (key) => { delete mockStorage[key]; }
};

// Mock getCurrentUserIdFromToken
const getCurrentUserIdFromToken = async () => {
  // Simulate different users
  return Math.floor(Math.random() * 1000);
};

// Import the referral service functions (simplified for testing)
async function generateReferralCode() {
  try {
    const userId = await getCurrentUserIdFromToken();
    
    if (userId) {
      const code = "REF" + userId.toString().padStart(4, '0');
      await AsyncStorage.setItem("user_referral_code", code);
      console.log("Generated referral code for user:", userId, "Code:", code);
      return code;
    } else {
      const timestamp = Date.now().toString().slice(-6);
      const guestCode = "GUEST" + timestamp;
      await AsyncStorage.setItem("user_referral_code", guestCode);
      return guestCode;
    }
  } catch (error) {
    console.log("Error generating referral code:", error);
    const fallbackCode = "FALLBACK" + Math.floor(Math.random() * 10000);
    await AsyncStorage.setItem("user_referral_code", fallbackCode);
    return fallbackCode;
  }
}

async function getStoredReferralCode() {
  try {
    const storedCode = await AsyncStorage.getItem("user_referral_code");
    if (storedCode) {
      console.log("Found stored referral code:", storedCode);
      return storedCode;
    }
    
    const newCode = await generateReferralCode();
    return newCode;
  } catch (error) {
    console.log("Error getting stored referral code:", error);
    return generateReferralCode();
  }
}

async function getUsedReferralCodes() {
  try {
    const stored = await AsyncStorage.getItem("used_referral_codes");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log("Error getting used referral codes:", error);
    return [];
  }
}

async function processReferralCode(referralCode, newUserEmail) {
  try {
    console.log("Processing referral code:", referralCode, "for user:", newUserEmail);
    
    const usedCodes = await getUsedReferralCodes();
    const alreadyUsed = usedCodes.find(used => 
      used.usedBy === newUserEmail && used.code === referralCode
    );
    
    if (alreadyUsed) {
      console.log("User already used this referral code");
      return false;
    }
    
    const currentUserId = await getCurrentUserIdFromToken();
    const currentReferralCode = await getStoredReferralCode();
    
    if (referralCode === currentReferralCode) {
      console.log("Cannot use own referral code");
      return false;
    }
    
    const newUsage = {
      code: referralCode,
      usedBy: newUserEmail,
      usedAt: new Date().toISOString(),
      referrerId: referralCode.match(/(\d+)/)?.[1] || "unknown",
    };
    
    usedCodes.push(newUsage);
    await AsyncStorage.setItem("used_referral_codes", JSON.stringify(usedCodes));
    
    console.log("Successfully processed referral code");
    return true;
  } catch (error) {
    console.log("Error processing referral code:", error);
    return false;
  }
}

async function getReferralUsageCount(referralCode) {
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

// Test the referral system
async function testReferralSystem() {
  console.log("=== TESTING REFERRAL SYSTEM ===\n");
  
  // Simulate User 1 (mail1) logging in and getting a referral code
  console.log("1. User 1 (mail1) logs in:");
  const user1Code = await generateReferralCode();
  console.log("   User 1 gets referral code:", user1Code);
  console.log("   User 1 shares this code with friends\n");
  
  // Simulate User 2 (mail2) using User 1's referral code
  console.log("2. User 2 (mail2) uses User 1's referral code:");
  const success1 = await processReferralCode(user1Code, "mail2@example.com");
  console.log("   Referral processed:", success1);
  const count1 = await getReferralUsageCount(user1Code);
  console.log("   User 1's referral count:", count1, "/5\n");
  
  // Simulate User 3 (mail3) using User 1's referral code
  console.log("3. User 3 (mail3) uses User 1's referral code:");
  const success2 = await processReferralCode(user1Code, "mail3@example.com");
  console.log("   Referral processed:", success2);
  const count2 = await getReferralUsageCount(user1Code);
  console.log("   User 1's referral count:", count2, "/5\n");
  
  // Simulate User 4 (mail4) using User 1's referral code
  console.log("4. User 4 (mail4) uses User 1's referral code:");
  const success3 = await processReferralCode(user1Code, "mail4@example.com");
  console.log("   Referral processed:", success3);
  const count3 = await getReferralUsageCount(user1Code);
  console.log("   User 1's referral count:", count3, "/5\n");
  
  // Test self-referral prevention
  console.log("5. User 1 tries to use their own referral code:");
  const selfReferral = await processReferralCode(user1Code, "mail1@example.com");
  console.log("   Self-referral processed:", selfReferral);
  console.log("   (Should be false - self-referral prevented)\n");
  
  // Test duplicate usage prevention
  console.log("6. User 2 tries to use the same referral code again:");
  const duplicate = await processReferralCode(user1Code, "mail2@example.com");
  console.log("   Duplicate referral processed:", duplicate);
  console.log("   (Should be false - duplicate usage prevented)\n");
  
  console.log("=== FINAL RESULTS ===");
  const finalCount = await getReferralUsageCount(user1Code);
  console.log("User 1's final referral count:", finalCount, "/5");
  console.log("User 1's referral code:", user1Code);
  console.log("Reward unlocked:", finalCount >= 5 ? "YES" : "NO");
}

// Run the test
testReferralSystem();
