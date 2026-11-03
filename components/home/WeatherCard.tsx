import React from 'react';
import { Sun } from 'lucide-react';
import { Spark } from '../brand';

export interface WeatherCardProps {
  city?: string;
  temp?: number;
  feelsLike?: number;
  condition?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  city = 'Ikeja, Lagos',
  temp = 33,
  feelsLike = 38,
  condition = 'humid',
}) => {
  return (
    <div
      data-semantic="weather-card"
      className="flex flex-col gap-2.5 rounded-[28px] bg-wa-sun-soft p-[18px] text-wa-plum shadow-none"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-bold text-wa-sun-ink">
            {city} · now
          </div>
          <div className="font-display text-4xl font-extrabold tracking-tight text-wa-plum">
            {temp}°
            <span className="font-body text-[15px] font-semibold text-wa-sun-ink">
              {' '}feels {feelsLike}° · {condition}
            </span>
          </div>
        </div>
        <Sun size={44} strokeWidth={1.8} className="text-wa-sun" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 text-[15px] leading-snug">
        <div className="flex items-start gap-2">
          <Spark className="mt-1 h-3 w-3 shrink-0 text-wa-sun" />
          <span>Hot day. Carry 1–2 extra sachets.</span>
        </div>
        <div className="flex items-start gap-2">
          <Spark className="mt-1 h-3 w-3 shrink-0 text-wa-sun" />
          <span>Rest in shade between 12 and 4 pm.</span>
        </div>
      </div>

      <div className="text-xs text-wa-sun-ink">
        General wellbeing tips, not medical advice.
      </div>
    </div>
  );
};

