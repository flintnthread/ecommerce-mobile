import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function TestStorage() {
  const router = useRouter();
  const [storageStatus, setStorageStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      // Test basic AsyncStorage functionality
      await AsyncStorage.setItem('test-key', 'test-value');
      const testValue = await AsyncStorage.getItem('test-key');
      
      // Check current token
      const currentToken = await AsyncStorage.getItem('token');
      
      setStorageStatus(`
Test Storage: ${testValue === 'test-value' ? 'WORKING' : 'FAILED'}
Current Token: ${currentToken ? 'EXISTS' : 'MISSING'}
Token Length: ${currentToken?.length || 0}
      `);
    } catch (error) {
      setStorageStatus(`ERROR: ${error}`);
    }
  };

  const setTestToken = async () => {
    try {
      const testToken = 'Bearer-Test-Token-123456789';
      await AsyncStorage.setItem('token', testToken);
      Alert.alert('Success', 'Test token stored');
      checkStorage();
    } catch (error) {
      Alert.alert('Error', `Failed to store token: ${error}`);
    }
  };

  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('token');
      Alert.alert('Success', 'Token cleared');
      checkStorage();
    } catch (error) {
      Alert.alert('Error', `Failed to clear token: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storage Test</Text>
      <Text style={styles.status}>{storageStatus}</Text>
      
      <TouchableOpacity style={styles.button} onPress={setTestToken}>
        <Text style={styles.buttonText}>Set Test Token</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={clearToken}>
        <Text style={styles.buttonText}>Clear Token</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={checkStorage}>
        <Text style={styles.buttonText}>Check Storage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
