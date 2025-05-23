import React from 'react';
import { TablerIconsProps } from '@tabler/icons-react';

export function IconRelationship(props: TablerIconsProps) {
  const {
    size = 24,
    color = 'currentColor',
    stroke = 2,
    ...restProps
  } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...restProps}
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8 8l8 8" />
      <path d="M7.5 12a5 5 0 0 0 0 5" />
      <path d="M16.5 12a5 5 0 0 0 0-5" />
    </svg>
  );
}

export default IconRelationship;