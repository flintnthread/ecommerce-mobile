import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ManualTokenTest() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[MANUAL TOKEN] ${message}`);
  };

  useEffect(() => {
    checkCurrentToken();
  }, []);

  const checkCurrentToken = async () => {
    addLog('Checking current token...');
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        addLog(`✅ Token found: ${token.length} characters`);
        addLog(`📝 Token preview: ${token.substring(0, 50)}...`);
        setCurrentToken(token);
      } else {
        addLog('❌ No token found');
        setCurrentToken('');
      }
    } catch (error) {
      addLog(`❌ Error checking token: ${error}`);
    }
  };

  const setToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Please enter a token');
      return;
    }

    addLog('Setting token...');
    try {
      await AsyncStorage.setItem('token', tokenInput.trim());
      addLog('✅ Token stored successfully');
      await checkCurrentToken();
      
      // Test if we can retrieve it immediately
      const retrieved = await AsyncStorage.getItem('token');
      addLog(`🔄 Retrieved token: ${retrieved?.substring(0, 50)}...`);
      
      if (retrieved === tokenInput.trim()) {
        addLog('✅ Token storage verification PASSED');
        Alert.alert('Success', 'Token stored and verified successfully!');
      } else {
        addLog('❌ Token storage verification FAILED');
        Alert.alert('Error', 'Token storage verification failed');
      }
    } catch (error) {
      addLog(`❌ Error storing token: ${error}`);
      Alert.alert('Error', `Failed to store token: ${error}`);
    }
  };

  const setTestToken = async () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1Njc4OTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTY0NzkwNzIwMCwiZXhwIjoxNjQ3OTkzNjAwfQ.test-signature-123456789';
    setTokenInput(testToken);
    addLog('📝 Test token loaded into input field');
  };

  const clearToken = async () => {
    addLog('Clearing token...');
    try {
      await AsyncStorage.removeItem('token');
      addLog('✅ Token cleared successfully');
      await checkCurrentToken();
      Alert.alert('Success', 'Token cleared successfully!');
    } catch (error) {
      addLog(`❌ Error clearing token: ${error}`);
      Alert.alert('Error', `Failed to clear token: ${error}`);
    }
  };

  const testAsyncStorage = async () => {
    addLog('Testing AsyncStorage...');
    try {
      // Test basic functionality
      await AsyncStorage.setItem('test-key', 'test-value');
      const value = await AsyncStorage.getItem('test-key');
      addLog(`📊 AsyncStorage test: ${value === 'test-value' ? 'PASSED' : 'FAILED'}`);
      
      // Test with longer content
      const longContent = 'a'.repeat(1000);
      await AsyncStorage.setItem('test-long', longContent);
      const longValue = await AsyncStorage.getItem('test-long');
      addLog(`📊 Long content test: ${longValue?.length === 1000 ? 'PASSED' : 'FAILED'}`);
      
      // Clean up
      await AsyncStorage.removeItem('test-key');
      await AsyncStorage.removeItem('test-long');
      
      addLog('✅ AsyncStorage tests completed');
    } catch (error) {
      addLog(`❌ AsyncStorage test failed: ${error}`);
    }
  };

  const simulateOtpSuccess = async () => {
    addLog('🔐 Simulating OTP verification success...');
    
    // Simulate the exact flow from otpsection.tsx
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1Njc4OTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTY0NzkwNzIwMCwiZXhwIjoxNjQ3OTkzNjAwfQ.mock-otp-success-token';
    
    try {
      addLog('📝 Storing simulated OTP token...');
      await AsyncStorage.setItem('token', mockToken);
      
      addLog('🔍 Verifying stored token...');
      const storedToken = await AsyncStorage.getItem('token');
      
      if (storedToken === mockToken) {
        addLog('✅ OTP simulation SUCCESS - token stored correctly');
        addLog(`📏 Token length: ${storedToken?.length}`);
        Alert.alert('Success', 'OTP simulation successful! Token is stored.');
        await checkCurrentToken();
      } else {
        addLog('❌ OTP simulation FAILED - token mismatch');
        Alert.alert('Error', 'OTP simulation failed - token mismatch');
      }
    } catch (error) {
      addLog(`❌ OTP simulation error: ${error}`);
      Alert.alert('Error', `OTP simulation failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Token Test</Text>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Current Token Status:</Text>
        <Text style={styles.tokenText}>
          {currentToken ? `${currentToken.substring(0, 100)}...` : 'No token stored'}
        </Text>
        
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
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
          <Text style={styles.buttonText}>Load Test Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.simulateButton]} onPress={simulateOtpSuccess}>
          <Text style={styles.buttonText}>Simulate OTP Success</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={checkCurrentToken}>
          <Text style={styles.buttonText}>Check Current Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.storageButton]} onPress={testAsyncStorage}>
          <Text style={styles.buttonText}>Test AsyncStorage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearToken}>
          <Text style={styles.buttonText}>Clear Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.logsButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    color: '#007AFF',
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 3,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  simulateButton: {
    backgroundColor: '#FF9500',
  },
  checkButton: {
    backgroundColor: '#5AC8FA',
  },
  storageButton: {
    backgroundColor: '#AF52DE',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  logsButton: {
    backgroundColor: '#8E8E93',
  },
  backButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
