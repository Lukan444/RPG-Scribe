import React from 'react';
import { TablerIconsProps } from '@tabler/icons-react';

export function IconPotion(props: TablerIconsProps) {
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
      <path d="M10 2v2.5a.5 .5 0 0 1 -.5 .5h-3a.5 .5 0 0 1 -.5 -.5v-2.5h4z" />
      <path d="M14 2v2.5a.5 .5 0 0 0 .5 .5h3a.5 .5 0 0 0 .5 -.5v-2.5h-4z" />
      <path d="M8.5 2h7" />
      <path d="M7 8v.01" />
      <path d="M7 16v.01" />
      <path d="M12 12v.01" />
      <path d="M12 9.5v.01" />
      <path d="M17 16v.01" />
      <path d="M17 8v.01" />
      <path d="M12 14.5v.01" />
      <path d="M3.1 14.933l2.994 -5.533a2 2 0 0 1 1.443 -1.133l6.866 -.262a2 2 0 0 1 1.502 .511l3.355 3.272a2 2 0 0 1 0 2.966l-3.355 3.272a2 2 0 0 1 -1.502 .511l-6.866 -.262a2 2 0 0 1 -1.443 -1.133l-2.994 -5.533a1.999 1.999 0 0 1 0 -1.676z" />
    </svg>
  );
}

export default IconPotion;