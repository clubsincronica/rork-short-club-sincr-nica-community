import fetch from 'node-fetch';

async function testEvent() {
    try {
        console.log('Logging in...');
        const authRes = await fetch('https://clubsincronica-backend.onrender.com/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testuser_event_44@example.com' })
        });
        
        if (!authRes.ok) throw new Error('Auth failed: ' + await authRes.text());
        const { token, user } = (await authRes.json()) as any;
        console.log('Logged in as', user.id);

        console.log('Creating event...');
        const eventRes = await fetch('https://clubsincronica-backend.onrender.com/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Test Render Event',
                description: 'Testing if Render crashes',
                category: 'yoga',
                date: '2026-04-14',
                startTime: '10:00',
                endTime: '11:00',
                location: 'Test Location',
                isOnline: false,
                maxParticipants: 10,
                price: 0,
                tags: ['test']
            })
        });

        if (!eventRes.ok) {
            console.error('Create event failed:', eventRes.status, await eventRes.text());
        } else {
            console.log('Success:', await eventRes.json());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
testEvent();
