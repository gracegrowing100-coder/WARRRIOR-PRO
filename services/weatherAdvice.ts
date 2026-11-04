/**
 * Weather -> sickle cell wellbeing guidance.
 * General wellbeing tips only. This is NOT medical advice and never replaces the
 * patient's own clinic plan. Heat/dehydration, sudden cold and wet chills are
 * commonly reported pain-crisis triggers, so tips focus on fluids, warmth and rest.
 */

export interface WeatherSnapshot {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  uvIndexMax: number | null;
  rainChance: number | null;
}

export type WeatherLevel = 'calm' | 'caution' | 'alert';

export interface WeatherAdvice {
  level: WeatherLevel;
  headline: string;
  tips: string[];
  /** Short label for the condition, e.g. "Rainy". */
  condition: string;
}

export const describeWeatherCode = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Mixed weather';
};

export const isRainy = (w: WeatherSnapshot) =>
  (w.weatherCode >= 51 && w.weatherCode <= 67) || (w.weatherCode >= 80 && w.weatherCode <= 99)
  || w.precipitation > 0 || (w.rainChance ?? 0) >= 60;

export function getWeatherAdvice(w: WeatherSnapshot): WeatherAdvice {
  const tips: string[] = [];
  let level: WeatherLevel = 'calm';
  let headline = 'Comfortable weather today';
  const raise = (next: WeatherLevel) => {
    const rank = { calm: 0, caution: 1, alert: 2 } as const;
    if (rank[next] > rank[level]) level = next;
  };

  const thunder = w.weatherCode >= 95;
  const veryHot = w.feelsLike >= 36;
  const hot = w.feelsLike >= 31;
  const cold = w.temperature <= 20 || w.feelsLike <= 18;

  if (thunder) {
    raise('alert');
    headline = 'Storm expected: stay indoors';
    tips.push('Stay indoors and keep warm and dry.', 'Keep water and your medicines within reach.');
  } else if (veryHot) {
    raise('alert');
    headline = 'Very hot: protect yourself from dehydration';
    tips.push(
      'Drink water often, not only when thirsty. Carry 2 extra sachets.',
      'Stay in shade or indoors between 12 and 4 pm.',
    );
  } else if (hot) {
    raise('caution');
    headline = 'Hot day: drink extra water';
    tips.push('Carry water and sip through the day.', 'Rest in shade between 12 and 4 pm.');
  } else if (cold) {
    raise('caution');
    headline = 'Cool weather: keep warm';
    tips.push(
      'Wear warm clothes and socks. Cold can trigger pain.',
      'Avoid sudden cold, like a strong air conditioner or cold drinks.',
    );
  }

  if (!thunder && isRainy(w)) {
    raise('caution');
    if (tips.length === 0) headline = 'Rain today: stay dry and warm';
    tips.push('Avoid getting soaked. Carry an umbrella and dry off quickly.');
  }

  if (w.humidity >= 80 && w.temperature >= 29 && !thunder) {
    tips.push('Very humid: you sweat more, so drink extra water.');
    raise('caution');
    if (headline === 'Comfortable weather today') headline = 'Humid today: drink extra water';
  }

  if ((w.uvIndexMax ?? 0) >= 8 && !thunder) {
    tips.push('Strong sun: wear a hat or use an umbrella outside.');
  }

  if (tips.length === 0) {
    tips.push('Keep up your normal water routine.', 'Take your medicines on time.');
  }

  return { level, headline, tips: tips.slice(0, 3), condition: describeWeatherCode(w.weatherCode) };
}

