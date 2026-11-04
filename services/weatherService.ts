import type { WeatherSnapshot } from './weatherAdvice';

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export const DEFAULT_LOCATION: WeatherLocation = { latitude: 6.6018, longitude: 3.3515, label: 'Ikeja, Lagos' };

const LOCATION_KEY = 'warrior-weather-location-v1';
const CACHE_KEY = 'warrior-weather-cache-v1';
const FRESH_MS = 30 * 60 * 1000;

interface CacheEntry {
  key: string;
  fetchedAt: number;
  data: WeatherSnapshot;
}

export interface WeatherResult {
  data: WeatherSnapshot;
  fetchedAt: number;
  /** True when live data could not be fetched and a previously saved reading is shown. */
  stale: boolean;
}

const locationKey = (l: WeatherLocation) => `${l.latitude.toFixed(2)},${l.longitude.toFixed(2)}`;

const safeStorage = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

export function loadSavedLocation(): WeatherLocation {
  try {
    const raw = safeStorage.get(LOCATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeatherLocation;
      if (Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude) && parsed.label) return parsed;
    }
  } catch { /* fall through to default */ }
  return DEFAULT_LOCATION;
}

export function saveLocation(location: WeatherLocation) {
  safeStorage.set(LOCATION_KEY, JSON.stringify(location));
}

const readCache = (location: WeatherLocation): CacheEntry | null => {
  try {
    const raw = safeStorage.get(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return entry.key === locationKey(location) ? entry : null;
  } catch {
    return null;
  }
};

/** Live weather from Open-Meteo (free, no API key). Falls back to the last saved reading when offline. */
export async function fetchWeather(location: WeatherLocation, signal?: AbortSignal): Promise<WeatherResult> {
  const cached = readCache(location);
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) {
    return { data: cached.data, fetchedAt: cached.fetchedAt, stale: false };
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code',
    daily: 'uv_index_max,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Weather service responded ${response.status}`);
    const json = await response.json();
    const current = json?.current;
    if (!current || typeof current.temperature_2m !== 'number') throw new Error('Weather response was incomplete');

    const data: WeatherSnapshot = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weather_code ?? 0,
      uvIndexMax: json?.daily?.uv_index_max?.[0] ?? null,
      rainChance: json?.daily?.precipitation_probability_max?.[0] ?? null,
    };
    const entry: CacheEntry = { key: locationKey(location), fetchedAt: Date.now(), data };
    safeStorage.set(CACHE_KEY, JSON.stringify(entry));
    return { data, fetchedAt: entry.fetchedAt, stale: false };
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    if (cached) return { data: cached.data, fetchedAt: cached.fetchedAt, stale: true };
    throw error;
  }
}

