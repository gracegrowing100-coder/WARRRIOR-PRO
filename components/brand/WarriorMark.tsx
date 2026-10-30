import React from 'react';

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  color?: string;
}

export const WarriorMark: React.FC<BrandIconProps> = ({ className = '', color = 'currentColor', ...props }) => (
  <svg viewBox="14 2 72 96" className={className} aria-hidden="true" {...props}>
    <path fill={color} fillRule="evenodd" d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"/>
  </svg>
);
