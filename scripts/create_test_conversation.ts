async function createTestConversation() {
    console.log('💬 Creating test conversation between User 1 and User 3...');

    try {
        const response = await fetch('http://localhost:3000/api/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user1Id: 1,  // tom_weasley
                user2Id: 3   // matias.cazeaux
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Conversation created:', data);
            console.log('🆔 Conversation ID:', data.id);
            console.log('\n📱 Now try opening the Messages tab on both phones!');
        } else {
            const errorText = await response.text();
            console.error('❌ Failed:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

createTestConversation();
