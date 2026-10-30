import React from 'react';

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  color?: string;
}

export const Spark: React.FC<BrandIconProps> = ({ className = '', color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
    <path fill={color} d="M12 2L14.6 9.4 22 12 14.6 14.6 12 22 9.4 14.6 2 12 9.4 9.4Z"/>
  </svg>
);
