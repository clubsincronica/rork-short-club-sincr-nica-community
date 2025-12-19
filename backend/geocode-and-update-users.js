// Script to geocode user locations and update coordinates in the DB
// Uses OpenStreetMap Nominatim API (free, no key required, but rate-limited)

const fetch = require('node-fetch');
const { userQueries, initializeDatabase } = require('./dist/models/database-sqljs');

async function geocodeLocation(location) {
  if (!location) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ClubSincronica/1.0' } });
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  return null;
}

async function main() {
  await initializeDatabase();
  const users = await userQueries.getAllUsers();
  for (const user of users) {
    if ((!user.latitude || !user.longitude) && user.location) {
      console.log(`Geocoding: ${user.name} (${user.location})`);
      const coords = await geocodeLocation(user.location);
      if (coords) {
        await userQueries.updateUser(user.id, user.name, user.avatar, user.bio, user.location, coords.lat, coords.lon, user.phone, user.website, JSON.stringify(user.interests), JSON.stringify(user.services), user.is_host);
        console.log(`Updated ${user.name}: ${coords.lat}, ${coords.lon}`);
      } else {
        console.log(`Could not geocode: ${user.location}`);
      }
    }
  }
  console.log('Done.');
}

main().catch(console.error);
