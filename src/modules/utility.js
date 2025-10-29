// src/modules/util.js

export function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            return reject(new Error('Geolocation not available.'));
        }
        // Browser prompt for user permission
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ lat: latitude, lon: longitude });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            }
        );
    });
}