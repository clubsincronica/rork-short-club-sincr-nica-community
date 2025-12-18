import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api-config';

export default function BackendTestScreen() {
  const [status, setStatus] = useState<string>('Not tested');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing...');
    
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
      console.log('Testing URL:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        setStatus('✅ Connected Successfully!');
      } else {
        setStatus(`❌ Error: ${res.status} ${res.statusText}`);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setStatus(`❌ Connection Failed: ${error.message}`);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Backend Connection Test</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.label}>Server URL:</Text>
          <Text style={styles.value}>{API_BASE_URL}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Health Endpoint:</Text>
          <Text style={styles.value}>{API_ENDPOINTS.HEALTH}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={testConnection}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[
            styles.statusText,
            status.includes('✅') && styles.successText,
            status.includes('❌') && styles.errorText,
          ]}>
            {status}
          </Text>
        </View>

        {response && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Response:</Text>
            <Text style={styles.responseText}>
              {JSON.stringify(response, null, 2)}
            </Text>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Troubleshooting:</Text>
          <Text style={styles.instructionText}>
            1. Make sure your phone and computer are on the same WiFi network{'\n'}
            2. Check that the backend server is running (port 3000){'\n'}
            3. Verify the IP address in utils/api-config.ts matches your computer{'\n'}
            4. Windows Firewall might be blocking the connection{'\n'}
            5. Try accessing http://192.168.0.77:3000/health in your phone's browser
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#000',
  },
  successText: {
    color: '#28a745',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  responseBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  responseText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000',
  },
  instructions: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 22,
  },
});
