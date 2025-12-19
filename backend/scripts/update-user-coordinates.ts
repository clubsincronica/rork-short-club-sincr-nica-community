// Script to update all users in the Postgres DB to have default coordinates if missing
// Usage: Run with `npx ts-node backend/scripts/update-user-coordinates.ts` or similar

import { query } from '../src/db/postgres-client';

async function updateUserCoordinates() {
  // Example: Set Matias and Eulallia to different locations
  const updates = [
    { email: 'matias.cazeaux@gmail.com', latitude: -38.02, longitude: -57.53 },
    { email: 'eularra@gmail.com', latitude: 40.4168, longitude: -3.7038 }, // Madrid
    { email: 'tom_weasley@hotmail.com', latitude: 37.7749, longitude: -122.4194 }, // SF
  ];

  for (const user of updates) {
    await query(
      'UPDATE users SET latitude = $1, longitude = $2 WHERE email = $3',
      [user.latitude, user.longitude, user.email]
    );
    console.log(`Updated ${user.email} to (${user.latitude}, ${user.longitude})`);
  }

  // Optionally, set a default for any user missing coordinates
  await query(
    'UPDATE users SET latitude = 37.7749, longitude = -122.4194 WHERE latitude IS NULL OR longitude IS NULL',
    []
  );
  console.log('Set default coordinates for users missing them.');
}

updateUserCoordinates()
  .then(() => {
    console.log('User coordinates update complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error updating user coordinates:', err);
    process.exit(1);
  });
