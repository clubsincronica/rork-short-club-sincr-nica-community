export const USER_OVERRIDES: Record<string, { latitude?: number; longitude?: number }> = {
    'matias.cazeaux@gmail.com': { latitude: -38.02, longitude: -57.53 },
    'eularra@gmail.com': { latitude: 40.4168, longitude: -3.7038 },
    'tom_weasley@hotmail.com': { latitude: 37.7749, longitude: -122.4194 },
};

export const BLOCKED_EMAILS = [
    'matiascazeaux@gmail.com'
];

export const isBlocked = (email: string) => BLOCKED_EMAILS.includes(email);

export const getDefaultLocation = (email: string) => {
    return USER_OVERRIDES[email] || { latitude: 37.7749, longitude: -122.4194 }; // Default to SF
};
