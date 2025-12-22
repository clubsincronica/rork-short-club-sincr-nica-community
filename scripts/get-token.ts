/**
 * Helper script to extract JWT token from AsyncStorage
 * Run this in the app's console or use React Native Debugger
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function getToken() {
    try {
        const token = await AsyncStorage.getItem('authToken');
        console.log('='.repeat(80));
        console.log('JWT TOKEN:');
        console.log('='.repeat(80));
        console.log(token);
        console.log('='.repeat(80));
        console.log('\nCopy the token above and run:');
        console.log(`npx ts-node scripts/test-admin-api.ts ${token}`);
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
    }
}

getToken();
