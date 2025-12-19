import AsyncStorage from '@react-native-async-storage/async-storage';

async function checkAuthState() {
    console.log('🔍 Checking authentication state...\n');

    const currentUser = await AsyncStorage.getItem('currentUser');
    const authToken = await AsyncStorage.getItem('authToken');

    if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('👤 Current User:');
        console.log('   Email:', user.email);
        console.log('   ID:', user.id);
        console.log('   ID Type:', typeof user.id);
        console.log('   ID Length:', user.id.toString().length);
        console.log('   Is Valid Integer?', Number.isInteger(Number(user.id)) && Number(user.id) <= 2147483647);
    } else {
        console.log('❌ No user logged in');
    }

    if (authToken) {
        console.log('\n🔑 Auth Token:');
        console.log('   Present: YES');
        console.log('   Preview:', authToken.substring(0, 30) + '...');
    } else {
        console.log('\n❌ No auth token found');
    }

    console.log('\n📊 Summary:');
    console.log('   User Logged In:', !!currentUser);
    console.log('   Token Present:', !!authToken);
    console.log('   Ready for Socket:', !!(currentUser && authToken));
}

checkAuthState();
