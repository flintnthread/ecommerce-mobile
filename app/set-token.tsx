import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SetToken() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');

  const setToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Please enter a token');
      return;
    }

    try {
      await AsyncStorage.setItem('token', tokenInput.trim());
      Alert.alert('Success', 'Token stored successfully!');
      
      // Verify it was stored
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Manual token set:', storedToken ? 'SUCCESS' : 'FAILED');
      console.log('Token length:', storedToken?.length || 0);
      
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    } catch (error) {
      Alert.alert('Error', `Failed to store token: ${error}`);
    }
  };

  const setTestToken = async () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1Njc4OTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTY0NzkwNzIwMCwiZXhwIjoxNjQ3OTkzNjAwfQ.test-signature';
    
    try {
      await AsyncStorage.setItem('token', testToken);
      Alert.alert('Success', 'Test JWT token stored!');
      
      const storedToken = await AsyncStorage.getItem('token');
      console.log('Test JWT token set:', storedToken ? 'SUCCESS' : 'FAILED');
      console.log('Token length:', storedToken?.length || 0);
      
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    } catch (error) {
      Alert.alert('Error', `Failed to store test token: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Authentication Token</Text>
      <Text style={styles.subtitle}>
        Enter a JWT token or use the test token to login manually
      </Text>
      
      <TextInput
        style={styles.input}
        value={tokenInput}
        onChangeText={setTokenInput}
        placeholder="Enter JWT token here..."
        multiline
        numberOfLines={3}
      />
      
      <TouchableOpacity style={styles.button} onPress={setToken}>
        <Text style={styles.buttonText}>Set Custom Token</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.testButton]} onPress={setTestToken}>
        <Text style={styles.buttonText}>Use Test JWT Token</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
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
