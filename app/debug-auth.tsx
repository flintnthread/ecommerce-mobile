import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { sendOtp, verifyOtp } from '../services/api';

export default function DebugAuth() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Ready');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG AUTH] ${message}`);
  };

  const testAsyncStorage = async () => {
    addLog('Testing AsyncStorage...');
    try {
      await AsyncStorage.setItem('test-key', 'test-value');
      const value = await AsyncStorage.getItem('test-key');
      addLog(`AsyncStorage test: ${value === 'test-value' ? 'SUCCESS' : 'FAILED'}`);
      await AsyncStorage.removeItem('test-key');
    } catch (error) {
      addLog(`AsyncStorage error: ${error}`);
    }
  };

  const checkCurrentToken = async () => {
    addLog('Checking current token...');
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        addLog(`Token exists: YES (${token.length} chars)`);
        addLog(`Token preview: ${token.substring(0, 50)}...`);
      } else {
        addLog('Token exists: NO');
      }
    } catch (error) {
      addLog(`Token check error: ${error}`);
    }
  };

  const setTestToken = async () => {
    addLog('Setting test token...');
    try {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1Njc4OTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTY0NzkwNzIwMCwiZXhwIjoxNjQ3OTkzNjAwfQ.test-signature';
      await AsyncStorage.setItem('token', testToken);
      addLog('Test token stored successfully');
      await checkCurrentToken();
    } catch (error) {
      addLog(`Set token error: ${error}`);
    }
  };

  const clearToken = async () => {
    addLog('Clearing token...');
    try {
      await AsyncStorage.removeItem('token');
      addLog('Token cleared successfully');
      await checkCurrentToken();
    } catch (error) {
      addLog(`Clear token error: ${error}`);
    }
  };

  const testOtpFlow = async () => {
    addLog('Testing OTP flow...');
    try {
      // First send OTP
      addLog('Sending OTP to test@example.com...');
      const sendResult = await sendOtp({ email: 'test@example.com' });
      addLog(`OTP send result: ${JSON.stringify(sendResult)}`);

      // Then verify with a test OTP (this will likely fail but we can see the response)
      addLog('Verifying OTP with 123456...');
      const verifyResult = await verifyOtp({ email: 'test@example.com', otp: '123456' });
      addLog(`OTP verify result: ${JSON.stringify(verifyResult)}`);
      
      if (verifyResult.success && verifyResult.token) {
        addLog('OTP verification successful - storing token...');
        await AsyncStorage.setItem('token', verifyResult.token);
        addLog('Token stored from OTP verification');
        await checkCurrentToken();
      }
    } catch (error: any) {
      addLog(`OTP flow error: ${error.message}`);
      addLog(`Error details: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('Debug Auth component loaded');
    checkCurrentToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Debug</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testAsyncStorage}>
          <Text style={styles.buttonText}>Test AsyncStorage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkCurrentToken}>
          <Text style={styles.buttonText}>Check Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={setTestToken}>
          <Text style={styles.buttonText}>Set Test Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearToken}>
          <Text style={styles.buttonText}>Clear Token</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.otpButton]} onPress={testOtpFlow}>
          <Text style={styles.buttonText}>Test OTP Flow</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
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
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  otpButton: {
    backgroundColor: '#FF9500',
  },
  logsButton: {
    backgroundColor: '#8E8E93',
  },
  backButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
