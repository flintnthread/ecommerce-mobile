import { addAddress, getUserAddresses, AddressRequest } from './api';

// Example usage of address API functions
export const AddressServiceExample = {
  // Add a new address
  async saveUserAddress(addressData: AddressRequest) {
    try {
      const response = await addAddress(addressData);
      
      if (response.success) {
        console.log('Address saved successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  },

  // Get all user addresses
  async fetchUserAddresses() {
    try {
      const response = await getUserAddresses();
      
      if (response.success) {
        console.log('User addresses:', response.data);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },

  // Example address data
  createSampleAddress(): AddressRequest {
    return {
      name: "sankarp",
      email: "sankarp036@gmail.com",
      phone: "6305015198",
      addressLine1: "Street 1",
      addressLine2: "Near temple",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500001",
      addressType: "home",
      isDefault: true
    };
  }
};

export default AddressServiceExample;
