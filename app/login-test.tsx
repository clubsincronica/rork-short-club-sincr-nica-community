import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { Colors } from '@/constants/colors';

/**
 * DIAGNOSTIC TEST SCREEN
 * This screen tests login functionality step by step
 * Access via: /login-test
 */
export default function LoginTestScreen() {
  const router = useRouter();
  const { login, currentUser, isLoginLoading } = useUser();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTest1 = async () => {
    addResult('=== TEST 1: Basic Login Call ===');
    setIsRunning(true);
    try {
      addResult('Calling login with test email...');
      const result = await login({ 
        email: 'diagnostic@test.com', 
        password: 'test123' 
      });
      addResult(`✅ Login returned: ${JSON.stringify(result)}`);
      addResult(`✅ Current user: ${currentUser?.email || 'none'}`);
    } catch (error) {
      addResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      addResult(`❌ Stack: ${error instanceof Error ? error.stack : 'No stack'}`);
    }
    setIsRunning(false);
  };

  const runTest2 = async () => {
    addResult('=== TEST 2: Signup (Create User Object) ===');
    setIsRunning(true);
    try {
      addResult('Creating user object...');
      const newUser = {
        id: Date.now().toString(),
        name: 'Test User',
        email: 'newuser@test.com',
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=random',
        phone: '',
        specialties: [],
        isServiceProvider: false,
        rating: 0,
        reviewCount: 0,
        joinedDate: new Date().toISOString(),
        verified: false,
      };
      addResult('Calling login with user object...');
      const result = await login(newUser);
      addResult(`✅ Signup returned: ${JSON.stringify(result)}`);
      addResult(`✅ Current user: ${currentUser?.email || 'none'}`);
    } catch (error) {
      addResult(`❌ Signup failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      addResult(`❌ Stack: ${error instanceof Error ? error.stack : 'No stack'}`);
    }
    setIsRunning(false);
  };

  const runTest3 = async () => {
    addResult('=== TEST 3: Login with Mock User ===');
    setIsRunning(true);
    try {
      addResult('Logging in with river@clubsincronica.com...');
      const result = await login({ 
        email: 'river@clubsincronica.com', 
        password: 'test123' 
      });
      addResult(`✅ Login returned: ${JSON.stringify(result)}`);
      addResult(`✅ Current user: ${currentUser?.email || 'none'}`);
    } catch (error) {
      addResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    setIsRunning(false);
  };

  const runTest4 = () => {
    addResult('=== TEST 4: Navigation ===');
    try {
      addResult('Attempting navigation to /(tabs)/discover...');
      router.replace('/(tabs)/discover');
      addResult('✅ Navigation initiated (check if screen changes)');
    } catch (error) {
      addResult(`❌ Navigation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login Diagnostic Tests</Text>
      <Text style={styles.subtitle}>
        Current User: {currentUser?.email || 'Not logged in'}
      </Text>
      <Text style={styles.subtitle}>
        Loading: {isLoginLoading ? 'YES' : 'NO'}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runTest1}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test 1: Basic Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runTest2}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test 2: Signup</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runTest3}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test 3: Mock User</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={runTest4}
        >
          <Text style={styles.buttonText}>Test 4: Navigation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    marginVertical: 20,
    gap: 10,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: '#ff9800',
  },
  backButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
});
