// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  weather_condition: string;
  visibility: number;
  precipitation_probability: number;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      console.error(`OpenWeather API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      weather_condition: data.weather[0].main.toLowerCase(),
      visibility: data.visibility / 1000, // Convert to km
      precipitation_probability: data.rain ? 80 : (data.clouds.all > 50 ? 30 : 10) // Estimate based on conditions
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return null;
  }
}

async function getStadiumCoordinates(stadiumName: string, city: string): Promise<{lat: number, lon: number} | null> {
  try {
    // Use OpenWeather's geocoding API
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: data[0].lat,
      lon: data[0].lon
    };
  } catch (error) {
    console.error("Error geocoding stadium:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body = await req.json();
    const { stadiumName, city, matchId } = body;

    if (!stadiumName || !city) {
      return new Response(
        JSON.stringify({ error: "stadiumName and city are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    if (!OPENWEATHER_API_KEY) {
      console.warn("OPENWEATHER_API_KEY not set, returning mock weather data");
      // Return mock weather data for development
      const mockWeather: WeatherData = {
        temperature: 22,
        humidity: 65,
        wind_speed: 12,
        weather_condition: "clear",
        visibility: 10,
        precipitation_probability: 10
      };

      return new Response(
        JSON.stringify({
          status: "success",
          weather: mockWeather,
          isMock: true,
          matchId: matchId
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    console.log(`🌤️ Fetching weather for ${stadiumName}, ${city}`);

    // Get coordinates for the stadium
    const coordinates = await getStadiumCoordinates(stadiumName, city);
    if (!coordinates) {
      throw new Error(`Could not find coordinates for ${stadiumName}, ${city}`);
    }

    // Fetch weather data
    const weather = await fetchWeather(coordinates.lat, coordinates.lon);
    if (!weather) {
      throw new Error("Failed to fetch weather data");
    }

    // Store weather data in database if matchId provided
    if (matchId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      const { error } = await supabase
        .from('matches')
        .update({
          weather: weather,
          weather_updated_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) {
        console.error("Error storing weather data:", error);
      }
    }

    console.log(`✅ Weather fetched: ${weather.temperature}°C, ${weather.weather_condition}`);

    return new Response(
      JSON.stringify({
        status: "success",
        weather: weather,
        coordinates: coordinates,
        matchId: matchId,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      }
    );
  } catch (error) {
    console.error("Error in fetch-weather:", error);

    // Return mock data as fallback
    const mockWeather: WeatherData = {
      temperature: 20,
      humidity: 60,
      wind_speed: 10,
      weather_condition: "clear",
      visibility: 10,
      precipitation_probability: 15
    };

    return new Response(
      JSON.stringify({
        status: "success",
        weather: mockWeather,
        isMock: true,
        error: error.message
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      }
    );
  }
});
