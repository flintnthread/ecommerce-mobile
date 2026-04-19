import { createAddress, fetchAddresses } from './addresses';

// Test function to verify JWT authentication works with address API
export const testAddressAPI = async () => {
  try {
    console.log('Testing address API with JWT authentication...');
    
    // Test fetching addresses
    const addresses = await fetchAddresses();
    console.log('Fetched addresses:', addresses);
    
    // Test creating a new address
    const newAddress = {
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      addressLine1: "123 Test Street",
      addressLine2: "Apt 4B",
      city: "Test City",
      state: "Test State",
      country: "Test Country",
      pincode: "123456",
      addressType: "home" as const,
      isDefault: false
    };
    
    const createdAddress = await createAddress(newAddress);
    console.log('Created address:', createdAddress);
    
    return { success: true, addresses, createdAddress };
  } catch (error) {
    console.error('Address API test failed:', error);
    return { success: false, error };
  }
};

export default testAddressAPI;
