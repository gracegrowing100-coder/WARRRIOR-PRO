import React, { useCallback, useEffect, useState } from 'react';
import { Cloud, CloudLightning, CloudRain, LocateFixed, MapPin, RefreshCw, Sun } from 'lucide-react';
import { Spark } from '../brand';
import {
  DEFAULT_LOCATION,
  fetchWeather,
  loadSavedLocation,
  saveLocation,
  type WeatherLocation,
  type WeatherResult,
} from '../../services/weatherService';
import { getWeatherAdvice, isRainy } from '../../services/weatherAdvice';

const levelStyles = {
  calm: 'bg-wa-sun-soft',
  caution: 'bg-wa-sun-soft ring-1 ring-inset ring-wa-sun/40',
  alert: 'bg-wa-rose ring-1 ring-inset ring-wa-crimson/30',
} as const;

const formatAge = (fetchedAt: number) => {
  const minutes = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
};

export const WeatherCard: React.FC = () => {
  const [location, setLocation] = useState<WeatherLocation>(() => loadSavedLocation());
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const load = useCallback(async (target: WeatherLocation, signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      setResult(await fetchWeather(target, signal));
    } catch (loadError) {
      if ((loadError as Error)?.name === 'AbortError') return;
      console.warn('Weather could not be loaded:', loadError);
      setResult(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(location, controller.signal);
    return () => controller.abort();
  }, [location, load]);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationNote('Location is not available on this device.');
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: WeatherLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Your location',
        };
        saveLocation(next);
        setLocation(next);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationNote(`Location permission was not given, so we are showing ${location.label}.`);
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const resetLocation = () => {
    saveLocation(DEFAULT_LOCATION);
    setLocation(DEFAULT_LOCATION);
    setLocationNote(null);
  };

  if (loading && !result) {
    return (
      <div data-semantic="weather-card" aria-busy="true" aria-label="Loading weather" className="rounded-[28px] bg-wa-sun-soft p-[18px] text-wa-plum">
        <div className="h-5 w-32 animate-pulse rounded-full bg-wa-plum/10" />
        <div className="mt-3 h-10 w-24 animate-pulse rounded-xl bg-wa-plum/10" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-wa-plum/10" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div data-semantic="weather-card" role="region" aria-label="Weather" className="flex flex-col gap-2.5 rounded-[28px] bg-wa-sun-soft p-[18px] text-wa-plum">
        <p className="text-[15px] font-bold">Weather is unavailable right now</p>
        <p className="text-[13px] text-wa-sun-ink">
          We could not load today&apos;s weather, so we are not showing any weather tips. Wherever you are, drink water regularly and keep warm if it feels cold.
        </p>
        <button
          type="button"
          data-ui-control
          onClick={() => void load(location)}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-wa-plum px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const { data } = result;
  const advice = getWeatherAdvice(data);
  const Icon = data.weatherCode >= 95 ? CloudLightning : isRainy(data) ? CloudRain : data.weatherCode >= 3 ? Cloud : Sun;
  const isDefault = location.label === DEFAULT_LOCATION.label;

  return (
    <div
      data-semantic="weather-card"
      role="region"
      aria-label="Weather and what to do today"
      className={`flex flex-col gap-3 rounded-[28px] p-[18px] text-wa-plum shadow-none ${levelStyles[advice.level]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13px] font-bold text-wa-sun-ink">
            <MapPin size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{location.label} · now</span>
          </div>
          <div className="font-display text-4xl font-extrabold tracking-tight text-wa-plum">
            {data.temperature}°C
          </div>
          <div className="text-[14px] font-semibold text-wa-sun-ink">
            Feels like {data.feelsLike}° · {advice.condition} · {data.humidity}% humidity
          </div>
        </div>
        <Icon size={44} strokeWidth={1.8} className="shrink-0 text-wa-sun" aria-hidden="true" />
      </div>

      <div>
        <p className="font-display text-[16px] font-bold leading-snug">{advice.headline}</p>
        <p className="mt-0.5 text-[12px] font-bold uppercase tracking-wider text-wa-sun-ink">What to do today</p>
        <ul className="mt-1.5 flex flex-col gap-1.5 text-[15px] leading-snug">
          {advice.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <Spark className="mt-1 h-3 w-3 shrink-0 text-wa-sun" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {result.stale ? (
        <p role="status" className="text-[12px] font-semibold text-wa-sun-ink">
          You are offline. Showing the reading from {formatAge(result.fetchedAt)}.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {isDefault ? (
          <button
            type="button"
            data-ui-control
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-wa-sun-ink/30 bg-white/50 px-3.5 text-[13px] font-bold text-wa-plum disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
          >
            <LocateFixed size={15} aria-hidden="true" />
            {locating ? 'Finding you…' : 'Use my location'}
          </button>
        ) : (
          <button
            type="button"
            data-ui-control
            onClick={resetLocation}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-wa-sun-ink/30 bg-white/50 px-3.5 text-[13px] font-bold text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
          >
            Use Lagos instead
          </button>
        )}
      </div>
      {locationNote ? <p role="status" className="text-[12px] text-wa-sun-ink">{locationNote}</p> : null}

      <p className="text-xs text-wa-sun-ink">
        General wellbeing tips, not medical advice. Always follow your doctor&apos;s plan. If pain starts and does not ease, use Emergency.
      </p>
    </div>
  );
};
