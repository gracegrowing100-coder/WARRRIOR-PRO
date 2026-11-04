import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherCard } from '../../../components/home/WeatherCard';

const liveResponse = {
  current: { temperature_2m: 34, apparent_temperature: 39, relative_humidity_2m: 72, precipitation: 0, weather_code: 1 },
  daily: { uv_index_max: [9], precipitation_probability_max: [5] },
};

describe('WeatherCard', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('shows live weather with plain-language recommendations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => liveResponse }));
    render(<WeatherCard />);
    expect(await screen.findByText('34°C')).toBeInTheDocument();
    expect(screen.getByText(/Feels like 39°/)).toBeInTheDocument();
    expect(screen.getByText(/Very hot/)).toBeInTheDocument();
    expect(screen.getByText('What to do today')).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
    expect(String((fetch as any).mock.calls[0][0])).toContain('api.open-meteo.com');
  });

  it('does not invent weather when the service fails and offers a retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<WeatherCard />);
    expect(await screen.findByText('Weather is unavailable right now')).toBeInTheDocument();
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('falls back to the last saved reading and says it is offline', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => liveResponse });
    vi.stubGlobal('fetch', fetchMock);
    const first = render(<WeatherCard />);
    await screen.findByText('34°C');
    first.unmount();

    const cache = JSON.parse(window.localStorage.getItem('warrior-weather-cache-v1') as string);
    cache.fetchedAt = Date.now() - 2 * 60 * 60 * 1000;
    window.localStorage.setItem('warrior-weather-cache-v1', JSON.stringify(cache));
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<WeatherCard />);
    expect(await screen.findByText('34°C')).toBeInTheDocument();
    expect(await screen.findByText(/You are offline/)).toBeInTheDocument();
  });

  it('only asks for location when the patient taps the button', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => liveResponse }));
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    render(<WeatherCard />);
    await screen.findByText('34°C');
    expect(getCurrentPosition).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Use my location/ }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});

