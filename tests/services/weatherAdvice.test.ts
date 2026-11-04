import { describe, expect, it } from 'vitest';
import { getWeatherAdvice, type WeatherSnapshot } from '../../services/weatherAdvice';

const base: WeatherSnapshot = {
  temperature: 26, feelsLike: 27, humidity: 55, precipitation: 0, weatherCode: 1, uvIndexMax: 5, rainChance: 10,
};

describe('getWeatherAdvice', () => {
  it('stays calm with a routine tip on mild days', () => {
    const advice = getWeatherAdvice(base);
    expect(advice.level).toBe('calm');
    expect(advice.tips.length).toBeGreaterThan(0);
  });

  it('raises an alert and prioritises hydration when it feels very hot', () => {
    const advice = getWeatherAdvice({ ...base, temperature: 34, feelsLike: 40, humidity: 70 });
    expect(advice.level).toBe('alert');
    expect(advice.tips.join(' ')).toMatch(/water/i);
  });

  it('advises warmth when it is cool', () => {
    const advice = getWeatherAdvice({ ...base, temperature: 17, feelsLike: 15 });
    expect(advice.level).toBe('caution');
    expect(advice.tips.join(' ')).toMatch(/warm/i);
  });

  it('advises staying dry in rain', () => {
    const advice = getWeatherAdvice({ ...base, weatherCode: 63, precipitation: 2 });
    expect(advice.tips.join(' ')).toMatch(/soaked|dry/i);
  });

  it('tells the patient to stay indoors in a thunderstorm and never exceeds three tips', () => {
    const advice = getWeatherAdvice({ ...base, weatherCode: 95, feelsLike: 38, humidity: 90, uvIndexMax: 9 });
    expect(advice.level).toBe('alert');
    expect(advice.tips.length).toBeLessThanOrEqual(3);
    expect(advice.headline).toMatch(/indoors/i);
  });
});

