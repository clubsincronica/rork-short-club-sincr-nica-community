async function createTestUsers() {
    console.log('👤 Creating test users in database...\n');

    const users = [
        {
            email: 'tom_weasley@hotmail.com',
            name: 'Tomas De La Llosa',
            password: 'password123'  // Must be 8+ characters
        },
        {
            email: 'matias.cazeaux@gmail.com',
            name: 'Matias Cazeaux',
            password: 'password123'
        }
    ];

    for (const user of users) {
        try {
            console.log(`Creating user: ${user.email}...`);

            const response = await fetch('http://localhost:3000/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Created: ${user.email} (ID: ${data.user.id})`);
                console.log(`   Token: ${data.token.substring(0, 30)}...`);
            } else {
                const error = await response.text();
                console.log(`⚠️  ${user.email}: ${error}`);
            }
        } catch (error) {
            console.error(`❌ Error creating ${user.email}:`, error);
        }
    }

    console.log('\n✅ Done! Now try logging in with:');
    console.log('   Email: tom_weasley@hotmail.com');
    console.log('   (No password needed - just tap login)');
}

createTestUsers();
