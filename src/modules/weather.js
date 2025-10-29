// src/modules/weather.js
import { getGeolocation } from './util.js';

const WEATHER_API_KEY = 'YOUR_API_KEY'; 

export async function fetchWeather() {
    try {
        const { lat, lon } = await getGeolocation();
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            city: data.name,
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon
        };
    } catch (error) {
        console.error("Could not fetch weather:", error);
        return null; 
    }
}