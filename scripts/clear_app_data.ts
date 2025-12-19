import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAllAppData() {
    console.log('🧹 Clearing ALL app data from AsyncStorage...\n');

    try {
        // Get all keys
        const keys = await AsyncStorage.getAllKeys();
        console.log('📋 Found', keys.length, 'items in storage:');
        keys.forEach(key => console.log('  -', key));

        // Clear everything
        await AsyncStorage.clear();

        console.log('\n✅ All data cleared!');
        console.log('\n📱 Now:');
        console.log('   1. Force close the app (swipe away)');
        console.log('   2. Reopen it');
        console.log('   3. Log in fresh');
    } catch (error) {
        console.error('❌ Error clearing storage:', error);
    }
}

clearAllAppData();
