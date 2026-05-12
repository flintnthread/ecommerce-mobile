import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { sendOtp, verifyOtp } from '../services/api';

export default function OtpFlowTest() {
  const router = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [otp, setOtp] = useState('123456');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[OTP FLOW TEST] ${message}`);
  };

  const testSendOtp = async () => {
    setIsLoading(true);
    addLog(`📤 Sending OTP to: ${email}`);
    
    try {
      const result = await sendOtp({ email });
      addLog(`✅ OTP sent successfully: ${JSON.stringify(result)}`);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error: any) {
      addLog(`❌ Send OTP failed: ${error.message}`);
      Alert.alert('Error', `Send OTP failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testVerifyOtp = async () => {
    setIsLoading(true);
    addLog(`🔐 Verifying OTP for: ${email} with code: ${otp}`);
    
    try {
      // Log the exact payload being sent
      const payload = { email, otp };
      addLog(`📝 Payload: ${JSON.stringify(payload)}`);
      
      const result = await verifyOtp(payload);
      addLog(`📥 Verify OTP response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addLog(`✅ OTP verification SUCCESS`);
        
        if (result.token) {
          addLog(`🎫 Token received: ${result.token.length} characters`);
          addLog(`📝 Token preview: ${result.token.substring(0, 50)}...`);
          
          // Store token exactly like otpsection.tsx does
          addLog(`💾 Storing token to AsyncStorage...`);
          await AsyncStorage.setItem('token', result.token);
          
          // Verify it was stored
          const storedToken = await AsyncStorage.getItem('token');
          addLog(`🔍 Token stored successfully: ${!!storedToken}`);
          addLog(`📏 Stored token length: ${storedToken?.length || 0}`);
          addLog(`📝 Stored token preview: ${storedToken?.substring(0, 50)}...`);
          
          if (storedToken === result.token) {
            addLog(`✅ Token storage VERIFICATION PASSED`);
            Alert.alert('Success', 'OTP verification and token storage successful!');
          } else {
            addLog(`❌ Token storage VERIFICATION FAILED`);
            Alert.alert('Error', 'Token was stored but verification failed');
          }
        } else {
          addLog(`❌ No token in response!`);
          Alert.alert('Error', 'OTP verification succeeded but no token received');
        }
      } else {
        addLog(`❌ OTP verification FAILED: ${result.message}`);
        Alert.alert('Error', `OTP verification failed: ${result.message}`);
      }
    } catch (error: any) {
      addLog(`❌ Verify OTP failed: ${error.message}`);
      addLog(`📊 Error details: ${JSON.stringify(error, null, 2)}`);
      Alert.alert('Error', `Verify OTP failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentToken = async () => {
    addLog(`🔍 Checking current token...`);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        addLog(`✅ Token found: ${token.length} characters`);
        addLog(`📝 Token preview: ${token.substring(0, 50)}...`);
      } else {
        addLog(`❌ No token found`);
      }
    } catch (error) {
      addLog(`❌ Error checking token: ${error}`);
    }
  };

  const clearToken = async () => {
    addLog(`🗑️ Clearing token...`);
    try {
      await AsyncStorage.removeItem('token');
      addLog(`✅ Token cleared`);
      await checkCurrentToken();
    } catch (error) {
      addLog(`❌ Error clearing token: ${error}`);
    }
  };

  const simulateFullFlow = async () => {
    addLog(`🚀 Starting full OTP flow simulation...`);
    
    // Step 1: Check current state
    await checkCurrentToken();
    
    // Step 2: Clear any existing token
    await clearToken();
    
    // Step 3: Send OTP
    await testSendOtp();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Verify OTP (this might fail with wrong OTP, but we'll see the response)
    await testVerifyOtp();
    
    // Step 5: Final token check
    await checkCurrentToken();
    
    addLog(`🏁 Full flow simulation completed`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Flow Test</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="OTP code"
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Test Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={testSendOtp} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.verifyButton]} onPress={testVerifyOtp} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.fullFlowButton]} onPress={simulateFullFlow} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Testing...' : 'Full Flow Test'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={checkCurrentToken}>
          <Text style={styles.buttonText}>Check Token</Text>
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
  inputContainer: {
    marginBottom: 20,
    gap: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
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
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  verifyButton: {
    backgroundColor: '#34C759',
  },
  fullFlowButton: {
    backgroundColor: '#FF9500',
  },
  checkButton: {
    backgroundColor: '#5AC8FA',
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
