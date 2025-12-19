
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/events';

async function createTestEvent() {
    console.log('🧪 Creating test event...');

    const eventData = {
        title: "Verificación de Sistema",
        description: "Este es un evento de prueba para confirmar que la base de datos PostgreSQL está conectada y funcionando correctamente.",
        category: "technology",
        startTime: "12:00",
        endTime: "14:00",
        date: new Date().toISOString().split('T')[0], // Today
        location: "Sede Central (Virtual)",
        isOnline: true,
        maxParticipants: 100,
        price: 0,
        providerId: 1, // tom_weasley
        status: "upcoming"
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Event created:', data);
            console.log('🆔 Event ID:', data.id);
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to create event:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

createTestEvent();
