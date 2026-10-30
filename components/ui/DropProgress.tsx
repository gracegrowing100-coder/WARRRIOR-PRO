import React, { useId } from 'react';
import { cn } from './utils';

export interface DropProgressProps extends React.SVGProps<SVGSVGElement> {
  value: number;
  goal: number;
  label?: string;
  size?: number | { width: number; height: number };
}

export const DropProgress: React.FC<DropProgressProps> = ({
  value,
  goal,
  label = 'litres a day',
  size = 150,
  className,
  ...props
}) => {
  const clipId = useId();
  const width = typeof size === 'number' ? size : size.width;
  const height = typeof size === 'number' ? (size * 160) / 150 : size.height;

  // Safe percentage bounded between 0 and 1
  const percentage = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) : 0;

  // Drop bounding: top tip at y=12, bottom at y=190, span=178
  const rectY = 190 - percentage * 178;

  // Label color switches to dark when fill < 40%
  const isDarkText = percentage < 0.4;
  const textColor = isDarkText ? '#11535E' : '#FFFFFF';

  return (
    <svg
      role="img"
      aria-label={`${value} of ${goal} ${label}`}
      width={width}
      height={height}
      viewBox="30 6 140 190"
      className={cn('drop-shadow-sm select-none', className)}
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M100 12C100 12 164 84 164 126A64 64 0 0 1 36 126C36 84 100 12 100 12Z" />
        </clipPath>
      </defs>

      {/* Background shape */}
      <path
        d="M100 12C100 12 164 84 164 126A64 64 0 0 1 36 126C36 84 100 12 100 12Z"
        fill="#E1F2F4"
      />

      {/* Filled portion */}
      <rect
        x="30"
        y={rectY}
        width="140"
        height="200"
        fill="#1C7C8C"
        clipPath={`url(#${clipId})`}
        className="transition-all duration-300 ease-out"
      />

      {/* Main value */}
      <text
        x="100"
        y="136"
        textAnchor="middle"
        fontFamily="Sora, sans-serif"
        fontWeight="800"
        fontSize="34"
        fill={textColor}
        className="transition-colors duration-200"
      >
        {value}
      </text>

      {/* Subtitle / Unit */}
      {label && (
        <text
          x="100"
          y="158"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          fontSize="13"
          fill={textColor}
          className="transition-colors duration-200"
        >
          {label}
        </text>
      )}
    </svg>
  );
};

DropProgress.displayName = 'DropProgress';
